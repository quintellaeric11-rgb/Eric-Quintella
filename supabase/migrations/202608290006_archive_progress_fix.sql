create or replace function public.archive_journey(target_journey uuid, archive_reason text default null) returns void
language plpgsql security definer set search_path=public as $$
declare j public.journeys; approved_count integer; earned integer; safe_reason text; conquest_progress numeric(7,2);
begin
  select * into j from public.journeys where id=target_journey for update;
  if j.id is null or not (public.is_family_parent(j.family_id) or j.youth_id=auth.uid() or public.is_admin()) then raise exception 'not_allowed'; end if;
  if j.status in ('COMPLETED','ARCHIVED') then raise exception 'invalid_status'; end if;
  safe_reason := coalesce(nullif(trim(archive_reason),''),'Outro motivo');
  select progress into conquest_progress from public.conquests where id=j.conquest_id;
  select count(*) into approved_count from public.mission_assignments where conquest_id=j.conquest_id and status='APPROVED';
  select coalesce(sum(amount),0) into earned from public.xp_events where youth_id=j.youth_id and assignment_id in (select id from public.mission_assignments where conquest_id=j.conquest_id);
  insert into public.journey_archive_events(journey_id,conquest_id,family_id,youth_id,archived_by,reason,progress_at_archive,approved_missions,earned_xp)
    values(j.id,j.conquest_id,j.family_id,j.youth_id,auth.uid(),safe_reason,conquest_progress,approved_count,earned);
  update public.journeys set status='ARCHIVED',archive_reason=safe_reason,archived_at=now(),updated_at=now() where id=j.id;
  update public.conquests set status='ARCHIVED',archive_reason=safe_reason,archived_at=now() where id=j.conquest_id;
  update public.mission_assignments set status='CANCELLED' where conquest_id=j.conquest_id and status in ('AVAILABLE','STARTED','NEEDS_CHANGES');
  insert into public.analytics_events(family_id,user_id,event_name,properties)
    values(j.family_id,auth.uid(),'journey_archived',jsonb_build_object('journey_id',j.id,'reason',safe_reason,'progress',conquest_progress));
end $$;
grant execute on function public.archive_journey(uuid,text) to authenticated,service_role;
