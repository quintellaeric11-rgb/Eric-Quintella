-- Concierge journeys are curated incrementally. Their explicit progress values
-- must not be normalized to 100% while only the first missions are published.
-- Legacy journeys keep the existing effort-weight normalization unchanged.
create or replace function public.recalculate_journey_progress(target_journey uuid) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare total numeric; allocated numeric; journey_cadence text;
begin
  select cadence_label into journey_cadence from public.journeys where id=target_journey;
  if journey_cadence='Curadoria manual' then return; end if;

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
