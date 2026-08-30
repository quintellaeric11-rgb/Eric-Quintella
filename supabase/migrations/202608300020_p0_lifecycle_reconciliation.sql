-- P0 lifecycle reconciliation: auditable legacy repair, atomic journey persistence,
-- recoverable incomplete conquests, historical validation, and reproducible RLS guard.

create table if not exists public.conquest_recovery_events (
  id uuid primary key default gen_random_uuid(),
  conquest_id uuid not null references public.conquests(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  youth_id uuid not null references public.profiles(id),
  event_type text not null check (event_type in ('RECOVERY_REQUIRED','RECOVERED','ARCHIVED_INCOMPLETE')),
  previous_status text not null,
  resulting_status text not null,
  reason text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.conquest_recovery_events enable row level security;
drop policy if exists conquest_recovery_family_read on public.conquest_recovery_events;
create policy conquest_recovery_family_read on public.conquest_recovery_events for select
  using (public.is_family_member(family_id) or public.is_admin());
grant select on public.conquest_recovery_events to authenticated;
grant all on public.conquest_recovery_events to service_role;

-- Preserve the existing remote guard exactly so a database rebuilt from Git behaves alike.
create or replace function public.rls_auto_enable() returns event_trigger
language plpgsql security definer set search_path=pg_catalog as $$
declare cmd record;
begin
  for cmd in
    select * from pg_event_trigger_ddl_commands()
    where command_tag in ('CREATE TABLE','CREATE TABLE AS','SELECT INTO')
      and object_type in ('table','partitioned table')
  loop
    if cmd.schema_name is not null and cmd.schema_name in ('public')
      and cmd.schema_name not in ('pg_catalog','information_schema')
      and cmd.schema_name not like 'pg_toast%' and cmd.schema_name not like 'pg_temp%'
    then
      begin
        execute format('alter table if exists %s enable row level security',cmd.object_identity);
        raise log 'rls_auto_enable: enabled RLS on %',cmd.object_identity;
      exception when others then
        raise log 'rls_auto_enable: failed to enable RLS on %',cmd.object_identity;
      end;
    else
      raise log 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)',cmd.object_identity,cmd.schema_name;
    end if;
  end loop;
end $$;
drop event trigger if exists ensure_rls;
create event trigger ensure_rls on ddl_command_end
  when tag in ('CREATE TABLE','CREATE TABLE AS','SELECT INTO')
  execute function public.rls_auto_enable();

-- Youth-controlled recovery for any incomplete current conquest without a journey.
create or replace function public.discard_incomplete_conquest(
  target_conquest uuid,
  discard_reason text default 'Proposta não concluída'
) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare conquest public.conquests; safe_reason text;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select c.* into conquest from public.conquests c where c.id=target_conquest for update;
  if conquest.id is null or conquest.youth_id<>auth.uid()
    or conquest.status not in ('PENDING','ACTIVE') then raise exception 'not_allowed'; end if;
  if exists(select 1 from public.journeys where conquest_id=conquest.id) then raise exception 'journey_exists'; end if;
  safe_reason:=coalesce(nullif(btrim(discard_reason),''),'Proposta não concluída');
  update public.conquest_contracts set status='CANCELLED'
    where conquest_id=conquest.id and status not in ('COMPLETED','CANCELLED');
  update public.conquests set status='ARCHIVED',archive_reason=safe_reason,archived_at=now()
    where id=conquest.id;
  insert into public.conquest_recovery_events(
    conquest_id,family_id,youth_id,event_type,previous_status,resulting_status,reason,metadata
  ) values(
    conquest.id,conquest.family_id,conquest.youth_id,'ARCHIVED_INCOMPLETE',conquest.status,'ARCHIVED',safe_reason,
    jsonb_build_object('journey_existed',false,'contract_existed',exists(select 1 from public.conquest_contracts where conquest_id=conquest.id))
  );
  insert into public.analytics_events(family_id,user_id,event_name,properties)
  values(conquest.family_id,auth.uid(),'incomplete_conquest_discarded',jsonb_build_object('conquest_id',conquest.id,'previous_status',conquest.status,'reason',safe_reason));
end $$;
revoke all on function public.discard_incomplete_conquest(uuid,text) from public,anon;
grant execute on function public.discard_incomplete_conquest(uuid,text) to authenticated,service_role;

-- Persist the generated journey, every mission, conquest metadata and Parent notification
-- in one transaction. Only the server-side service role may call this function.
create or replace function public.persist_generated_journey(
  target_conquest uuid,
  journey_payload jsonb,
  mission_payload jsonb
) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare
  conquest public.conquests;
  generated_journey_id uuid;
  parent_id uuid;
  youth_name text;
  mission_count integer;
  progress_sum numeric;
begin
  if auth.role()<>'service_role' then raise exception 'service_role_required'; end if;
  select c.* into conquest from public.conquests c where c.id=target_conquest for update;
  if conquest.id is null then raise exception 'conquest_not_found'; end if;

  select id into generated_journey_id from public.journeys where conquest_id=conquest.id;
  if generated_journey_id is not null then
    return jsonb_build_object('journey_id',generated_journey_id,'existing',true);
  end if;
  if conquest.status<>'PENDING' then raise exception 'invalid_conquest_status'; end if;
  if jsonb_typeof(mission_payload)<>'array' or jsonb_array_length(mission_payload)=0 then raise exception 'missions_required'; end if;
  select count(*),coalesce(sum((item->>'progress_percentage')::numeric),0)
    into mission_count,progress_sum from jsonb_array_elements(mission_payload) item;
  if abs(progress_sum-100)>0.0001 then raise exception 'invalid_progress_total'; end if;

  insert into public.journeys(
    conquest_id,family_id,youth_id,estimated_duration_months,recommended_mission_count,
    cadence_label,complexity_score,complexity_band,suggested_duration_weeks
  ) values(
    conquest.id,conquest.family_id,conquest.youth_id,
    (journey_payload->>'estimated_duration_months')::integer,mission_count,
    journey_payload->>'cadence_label',(journey_payload->>'complexity_score')::numeric,
    journey_payload->>'complexity_band',(journey_payload->>'suggested_duration_weeks')::integer
  ) returning id into generated_journey_id;

  insert into public.journey_missions(
    journey_id,family_id,archetype_id,source_mission_id,title,description,instructions,category,skills,
    estimated_minutes,xp_reward,goal_progress_reward,evidence_types,phase,mission_order,recommendation_score,
    recommendation_reasons,is_custom,contextualized_intro,contextualized_micro_lesson,contextualized_steps,
    contextualized_evidence_request,follow_up_question,why_this_mission,effort_weight,progress_percentage,
    pedagogical_age_band,technique_explanation,contextualized_example,autonomy_guidance,
    parent_support_guidance,reflection_depth,evidence_checklist
  )
  select
    generated_journey_id,conquest.family_id,nullif(item->>'archetype_id','')::uuid,nullif(item->>'source_mission_id','')::uuid,
    item->>'title',item->>'description',item->>'instructions',item->>'category',
    array(select jsonb_array_elements_text(coalesce(item->'skills','[]'::jsonb))),
    (item->>'estimated_minutes')::integer,(item->>'xp_reward')::integer,(item->>'goal_progress_reward')::numeric,
    array(select jsonb_array_elements_text(coalesce(item->'evidence_types','[]'::jsonb))),
    (item->>'phase')::integer,(item->>'mission_order')::integer,(item->>'recommendation_score')::integer,
    array(select jsonb_array_elements_text(coalesce(item->'recommendation_reasons','[]'::jsonb))),
    coalesce((item->>'is_custom')::boolean,false),item->>'contextualized_intro',item->>'contextualized_micro_lesson',
    coalesce(item->'contextualized_steps','[]'::jsonb),item->>'contextualized_evidence_request',item->>'follow_up_question',
    item->>'why_this_mission',(item->>'effort_weight')::integer,(item->>'progress_percentage')::numeric,
    item->>'pedagogical_age_band',item->>'technique_explanation',item->>'contextualized_example',
    item->>'autonomy_guidance',item->>'parent_support_guidance',item->>'reflection_depth',
    coalesce(item->'evidence_checklist','[]'::jsonb)
  from jsonb_array_elements(mission_payload) item;

  perform public.recalculate_journey_progress(generated_journey_id);
  select coalesce(sum(progress_percentage),0) into progress_sum
    from public.journey_missions where journey_id=generated_journey_id;
  if abs(progress_sum-100)>0.0001 then raise exception 'persisted_progress_invalid'; end if;

  update public.conquests set
    normalized_goal=journey_payload->>'normalized_goal',natural_reference=journey_payload->>'natural_reference',
    goal_type=journey_payload->>'goal_type',goal_category=journey_payload->>'goal_category',
    classification=coalesce(journey_payload->'classification','{}'::jsonb),
    estimated_duration_months=(journey_payload->>'estimated_duration_months')::integer,
    recommended_mission_count=mission_count,cadence_label=journey_payload->>'cadence_label'
  where id=conquest.id;

  select fm.profile_id into parent_id from public.family_members fm
    where fm.family_id=conquest.family_id and fm.role='PARENT' order by fm.joined_at limit 1;
  if parent_id is null then raise exception 'parent_not_found'; end if;
  select coalesce(p.first_name,'O jovem') into youth_name from public.profiles p where p.id=conquest.youth_id;
  insert into public.notifications(recipient_id,family_id,type,title,message,related_entity_id,deep_link)
  values(parent_id,conquest.family_id,'JOURNEY_REVIEW',youth_name||' criou uma nova conquista.',
    'Revise as missões que a KONKI preparou.',generated_journey_id,'/?view=journey-review&journey='||generated_journey_id);

  insert into public.conquest_recovery_events(
    conquest_id,family_id,youth_id,event_type,previous_status,resulting_status,reason,metadata
  ) select conquest.id,conquest.family_id,conquest.youth_id,'RECOVERED','PENDING','PENDING',
    'Jornada gerada e persistida atomicamente',jsonb_build_object('journey_id',generated_journey_id)
  where exists(select 1 from public.conquest_recovery_events e where e.conquest_id=conquest.id and e.event_type='RECOVERY_REQUIRED');

  return jsonb_build_object('journey_id',generated_journey_id,'mission_count',mission_count,'existing',false);
end $$;
revoke all on function public.persist_generated_journey(uuid,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.persist_generated_journey(uuid,jsonb,jsonb) to service_role;

-- Snapshot-backed, targeted legacy repair. No records are deleted.
insert into public.conquest_recovery_events(
  conquest_id,family_id,youth_id,event_type,previous_status,resulting_status,reason,metadata
)
select id,family_id,youth_id,'ARCHIVED_INCOMPLETE',status,'ARCHIVED',
  'Reconciliação P0: conquista ACTIVE sem jornada',jsonb_build_object('snapshot','docs/p0-snapshot-2026-08-30.json')
from public.conquests
where id='792c25a3-7d94-4e5f-b83a-a0fb29b236d4' and status='ACTIVE'
  and not exists(select 1 from public.journeys where conquest_id=conquests.id);
update public.conquest_contracts set status='CANCELLED'
  where conquest_id='792c25a3-7d94-4e5f-b83a-a0fb29b236d4' and status not in ('COMPLETED','CANCELLED');
update public.conquests set status='ARCHIVED',archived_at=now(),archive_reason='Reconciliação P0: conquista ACTIVE sem jornada'
  where id='792c25a3-7d94-4e5f-b83a-a0fb29b236d4' and status='ACTIVE'
    and not exists(select 1 from public.journeys where conquest_id=conquests.id);

insert into public.conquest_recovery_events(
  conquest_id,family_id,youth_id,event_type,previous_status,resulting_status,reason,metadata
)
select id,family_id,youth_id,'ARCHIVED_INCOMPLETE',status,'ARCHIVED',
  'Encerrada conforme solicitação do usuário: tentativa Quarto',jsonb_build_object('snapshot','docs/p0-snapshot-2026-08-30.json')
from public.conquests
where id='256405a1-1ecb-4d76-813b-ebb25887db58' and status='PENDING'
  and not exists(select 1 from public.journeys where conquest_id=conquests.id);
update public.conquests set status='ARCHIVED',archived_at=now(),archive_reason='Tentativa encerrada durante reconciliação P0'
  where id='256405a1-1ecb-4d76-813b-ebb25887db58' and status='PENDING'
    and not exists(select 1 from public.journeys where conquest_id=conquests.id);

insert into public.conquest_recovery_events(
  conquest_id,family_id,youth_id,event_type,previous_status,resulting_status,reason,metadata
)
select id,family_id,youth_id,'RECOVERY_REQUIRED',status,status,
  'Jornada não foi persistida; retry idempotente disponível',jsonb_build_object('snapshot','docs/p0-snapshot-2026-08-30.json')
from public.conquests
where id='8f89b6ee-fe9b-4b08-aabd-b2f5597335ce' and status='PENDING'
  and not exists(select 1 from public.journeys where conquest_id=conquests.id);

select public.recalculate_journey_progress('4e0fa0b0-ef56-4de4-8778-2ecf1207525c');

-- The read-only preflight found zero violations.
alter table public.youth_profiles validate constraint youth_profiles_birth_date_reasonable;
