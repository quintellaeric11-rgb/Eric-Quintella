-- Recovery for a conquest created successfully when the subsequent journey
-- generation request was interrupted before any journey existed.
create or replace function public.discard_incomplete_conquest(target_conquest uuid,discard_reason text default 'Proposta não concluída') returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare conquest public.conquests; safe_reason text;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select c.* into conquest from public.conquests c where c.id=target_conquest for update;
  if conquest.id is null or conquest.youth_id<>auth.uid() or conquest.status<>'PENDING' then raise exception 'not_allowed'; end if;
  if exists(select 1 from public.journeys where conquest_id=conquest.id) then raise exception 'journey_exists'; end if;
  safe_reason:=coalesce(nullif(btrim(discard_reason),''),'Proposta não concluída');
  update public.conquests set status='ARCHIVED',archive_reason=safe_reason,archived_at=now() where id=conquest.id;
  insert into public.analytics_events(family_id,user_id,event_name,properties)
  values(conquest.family_id,auth.uid(),'incomplete_conquest_discarded',jsonb_build_object('conquest_id',conquest.id,'reason',safe_reason));
end $$;

revoke all on function public.discard_incomplete_conquest(uuid,text) from public,anon;
grant execute on function public.discard_incomplete_conquest(uuid,text) to authenticated,service_role;
