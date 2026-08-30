-- Explicit Parent rejection/reformulation state for a draft journey.
alter table public.journeys drop constraint if exists journeys_status_check;
alter table public.journeys add constraint journeys_status_check
  check(status in ('DRAFT','CHANGES_REQUESTED','APPROVED','ACTIVE','COMPLETED','ARCHIVED')) not valid;
alter table public.journeys validate constraint journeys_status_check;

alter table public.journeys
  add column if not exists rejection_reason text,
  add column if not exists rejected_at timestamptz;
alter table public.conquests
  add column if not exists rejection_reason text;

create or replace function public.reject_journey(target_journey uuid,rejection_reason text) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare journey public.journeys; safe_reason text;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  safe_reason:=nullif(btrim(rejection_reason),'');
  if safe_reason is null or char_length(safe_reason)>500 then raise exception 'invalid_reason'; end if;
  select j.* into journey from public.journeys j where j.id=target_journey for update;
  if journey.id is null or not public.is_family_parent(journey.family_id) then raise exception 'not_allowed'; end if;
  if journey.status<>'DRAFT' then raise exception 'invalid_status'; end if;
  if exists(select 1 from public.mission_assignments where journey_id=journey.id) then raise exception 'journey_already_materialized'; end if;
  update public.journeys set status='CHANGES_REQUESTED',rejection_reason=safe_reason,rejected_at=now(),updated_at=now() where id=journey.id;
  update public.conquests set status='CHANGES_REQUESTED',rejection_reason=safe_reason where id=journey.conquest_id;
  insert into public.notifications(recipient_id,family_id,type,title,message,related_entity_id,deep_link)
  values(journey.youth_id,journey.family_id,'JOURNEY_CHANGES_REQUESTED','Seu responsável pediu uma reformulação.',safe_reason,journey.conquest_id,'/?view=conquest');
  return jsonb_build_object('status','CHANGES_REQUESTED','conquest_id',journey.conquest_id);
end $$;

create or replace function public.resubmit_conquest(target_conquest uuid,conquest_title text,conquest_reason text default null) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare conquest public.conquests; safe_title text;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  safe_title:=nullif(btrim(conquest_title),'');
  if safe_title is null or char_length(safe_title)>160 then raise exception 'invalid_title'; end if;
  select c.* into conquest from public.conquests c where c.id=target_conquest for update;
  if conquest.id is null or conquest.youth_id<>auth.uid() or conquest.status<>'CHANGES_REQUESTED' then raise exception 'not_allowed'; end if;
  delete from public.journeys where conquest_id=conquest.id and status='CHANGES_REQUESTED';
  update public.conquests set title=safe_title,reason=nullif(btrim(conquest_reason),''),status='PENDING',rejection_reason=null,approved_at=null where id=conquest.id;
  return conquest.id;
end $$;

revoke all on function public.reject_journey(uuid,text) from public,anon;
revoke all on function public.resubmit_conquest(uuid,text,text) from public,anon;
grant execute on function public.reject_journey(uuid,text) to authenticated,service_role;
grant execute on function public.resubmit_conquest(uuid,text,text) to authenticated,service_role;
