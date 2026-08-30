alter table public.journey_missions alter column goal_progress_reward type numeric(8,4);

create or replace function public.recalculate_journey_progress(target_journey uuid) returns void language plpgsql security definer set search_path=public as $$
declare total numeric; allocated numeric;
begin
  select coalesce(sum(effort_weight),0) into total from public.journey_missions where journey_id=target_journey;
  if total<=0 then return; end if;
  update public.journey_missions
    set progress_percentage=round((effort_weight::numeric/total)*100,4),
        goal_progress_reward=round((effort_weight::numeric/total)*100,4)
    where journey_id=target_journey;
  select coalesce(sum(progress_percentage),0) into allocated from public.journey_missions where journey_id=target_journey;
  update public.journey_missions
    set progress_percentage=progress_percentage+(100-allocated),
        goal_progress_reward=goal_progress_reward+(100-allocated)
    where id=(select id from public.journey_missions where journey_id=target_journey order by mission_order desc,id desc limit 1);
end $$;

create or replace function public.start_mission(target_assignment uuid) returns void language plpgsql security definer set search_path=public as $$
begin
  update public.mission_assignments a set status='STARTED',started_at=coalesce(a.started_at,now())
  where a.id=target_assignment and a.youth_id=auth.uid() and a.status in ('AVAILABLE','NEEDS_CHANGES')
    and exists(select 1 from public.conquest_contracts c where c.conquest_id=a.conquest_id and c.status='ACTIVE');
  if not found then raise exception 'not_allowed_or_commitment_pending'; end if;
end $$;

grant execute on function public.recalculate_journey_progress(uuid),public.start_mission(uuid) to authenticated,service_role;
