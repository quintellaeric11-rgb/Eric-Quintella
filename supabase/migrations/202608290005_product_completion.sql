-- Product completion: durable agreements, wishlist activation and journey archive history.
alter table public.conquests
  add column if not exists confirmed_goal_value numeric(12,2),
  add column if not exists reward_agreement text,
  add column if not exists archived_at timestamptz,
  add column if not exists archive_reason text;

alter table public.journeys
  add column if not exists agreed_duration_months integer check (agreed_duration_months between 1 and 36),
  add column if not exists archived_at timestamptz,
  add column if not exists archive_reason text;

alter table public.conquest_wishlist
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists activated_at timestamptz;

alter table public.family_invites add column if not exists youth_birth_date date;

alter table public.youth_profiles
  add constraint youth_profiles_birth_date_reasonable
  check (birth_date is null or (birth_date >= current_date - interval '22 years' and birth_date <= current_date - interval '7 years'))
  not valid;

create index if not exists wishlist_youth_status_idx on public.conquest_wishlist(youth_id,status,created_at desc);

create table if not exists public.journey_archive_events (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.journeys(id) on delete cascade,
  conquest_id uuid not null references public.conquests(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  youth_id uuid not null references public.profiles(id),
  archived_by uuid not null references public.profiles(id),
  reason text not null,
  progress_at_archive numeric(7,2) not null,
  approved_missions integer not null default 0,
  earned_xp integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.journey_archive_events enable row level security;
create policy journey_archive_family_read on public.journey_archive_events for select
  using(public.is_family_member(family_id) or public.is_admin());
grant select on public.journey_archive_events to authenticated;
grant all on public.journey_archive_events to service_role;

create or replace function public.activate_wishlist_item(target_item uuid) returns uuid
language plpgsql security definer set search_path=public as $$
declare w public.conquest_wishlist; new_conquest uuid;
begin
  select * into w from public.conquest_wishlist where id=target_item for update;
  if w.id is null or w.youth_id <> auth.uid() then raise exception 'not_allowed'; end if;
  if w.status <> 'SAVED' then raise exception 'invalid_status'; end if;
  if exists(select 1 from public.conquests where youth_id=w.youth_id and status in ('PENDING','CHANGES_REQUESTED','APPROVED','ACTIVE')) then
    raise exception 'active_conquest_exists';
  end if;
  insert into public.conquests(family_id,youth_id,title,category,reason,status)
    values(w.family_id,w.youth_id,w.title,coalesce(w.category,'OTHER'),w.context,'PENDING') returning id into new_conquest;
  update public.conquest_wishlist set status='ACTIVATED',activated_at=now(),updated_at=now() where id=w.id;
  return new_conquest;
end $$;

create or replace function public.archive_journey(target_journey uuid, archive_reason text default null) returns void
language plpgsql security definer set search_path=public as $$
declare j public.journeys; approved_count integer; earned integer; safe_reason text;
begin
  select * into j from public.journeys where id=target_journey for update;
  if j.id is null or not (public.is_family_parent(j.family_id) or j.youth_id=auth.uid() or public.is_admin()) then raise exception 'not_allowed'; end if;
  if j.status in ('COMPLETED','ARCHIVED') then raise exception 'invalid_status'; end if;
  safe_reason := coalesce(nullif(trim(archive_reason),''),'Outro motivo');
  select count(*) into approved_count from public.mission_assignments where conquest_id=j.conquest_id and status='APPROVED';
  select coalesce(sum(amount),0) into earned from public.xp_events where youth_id=j.youth_id and assignment_id in (select id from public.mission_assignments where conquest_id=j.conquest_id);
  insert into public.journey_archive_events(journey_id,conquest_id,family_id,youth_id,archived_by,reason,progress_at_archive,approved_missions,earned_xp)
    select j.id,j.conquest_id,j.family_id,j.youth_id,auth.uid(),safe_reason,c.progress,approved_count,earned from public.conquests c where c.id=j.conquest_id;
  update public.journeys set status='ARCHIVED',archive_reason=safe_reason,archived_at=now(),updated_at=now() where id=j.id;
  update public.conquests set status='ARCHIVED',archive_reason=safe_reason,archived_at=now() where id=j.conquest_id;
  update public.mission_assignments set status='CANCELLED' where conquest_id=j.conquest_id and status in ('AVAILABLE','STARTED','NEEDS_CHANGES');
  insert into public.analytics_events(family_id,user_id,event_name,properties)
    values(j.family_id,auth.uid(),'journey_archived',jsonb_build_object('journey_id',j.id,'reason',safe_reason,'progress',j.progress));
end $$;

grant execute on function public.activate_wishlist_item(uuid),public.archive_journey(uuid,text) to authenticated,service_role;
