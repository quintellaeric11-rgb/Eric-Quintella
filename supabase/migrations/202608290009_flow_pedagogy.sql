-- FLOW-001 and PED-001: durable journey order, sequential unlock and persisted
-- age-adapted teaching material.

alter table public.journey_missions
  add column if not exists pedagogical_age_band text,
  add column if not exists technique_explanation text,
  add column if not exists contextualized_example text,
  add column if not exists autonomy_guidance text,
  add column if not exists parent_support_guidance text,
  add column if not exists reflection_depth text,
  add column if not exists evidence_checklist jsonb not null default '[]'::jsonb;

alter table public.journey_missions
  add constraint journey_missions_pedagogical_age_band_check
  check (pedagogical_age_band is null or pedagogical_age_band in ('12','14','17')) not valid;

alter table public.mission_assignments
  add column if not exists journey_id uuid references public.journeys(id) on delete cascade,
  add column if not exists mission_order integer;

alter table public.mission_assignments drop constraint if exists mission_assignments_status_check;
alter table public.mission_assignments add constraint mission_assignments_status_check
  check(status in ('LOCKED','AVAILABLE','STARTED','SUBMITTED','APPROVED','NEEDS_CHANGES','CANCELLED'));
alter table public.mission_assignments add constraint mission_assignments_order_positive
  check(mission_order is null or mission_order>0) not valid;
create unique index if not exists assignments_journey_order_unique
  on public.mission_assignments(journey_id,mission_order) where journey_id is not null;
create index if not exists assignments_journey_sequence_idx
  on public.mission_assignments(journey_id,mission_order,status);

-- Recover durable order for journeys generated before this migration.
update public.mission_assignments a
set journey_id=jm.journey_id,mission_order=jm.mission_order
from public.missions m,public.journey_missions jm
where a.journey_id is null and a.mission_id=m.id
  and m.slug='family-'||jm.family_id||'-'||jm.id;

-- Preserve work already in progress, but collapse untouched AVAILABLE rows to
-- the first not-yet-approved position for each existing journey.
update public.mission_assignments a set status='LOCKED'
where a.journey_id is not null and a.status='AVAILABLE'
  and exists(select 1 from public.mission_assignments prior
    where prior.journey_id=a.journey_id and prior.mission_order<a.mission_order and prior.status<>'APPROVED');

create or replace function public.approve_journey(target_journey uuid) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare journey public.journeys; conquest public.conquests; planned public.journey_missions; mission_id uuid; parent_id uuid; total integer; sequence integer:=0;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select j.* into journey from public.journeys j where j.id=target_journey for update;
  if journey.id is null or not public.is_family_parent(journey.family_id) then raise exception 'not_allowed'; end if;
  if journey.status<>'DRAFT' then raise exception 'invalid_status'; end if;
  perform public.recalculate_journey_progress(journey.id);
  select count(*) into total from public.journey_missions where journey_id=journey.id;
  if total<1 then raise exception 'empty_journey'; end if;
  select c.* into conquest from public.conquests c where c.id=journey.conquest_id and c.family_id=journey.family_id and c.youth_id=journey.youth_id;
  if conquest.id is null then raise exception 'invalid_journey_scope'; end if;
  select profile_id into parent_id from public.family_members where family_id=journey.family_id and role='PARENT' order by joined_at limit 1;
  for planned in select * from public.journey_missions where journey_id=journey.id order by mission_order,id loop
    sequence:=sequence+1;
    insert into public.missions(slug,title,description,category,skills,interests,goal_categories,recommended_age_min,recommended_age_max,difficulty,estimated_minutes,xp_reward,goal_progress_reward,evidence_types,lesson_title,lesson_content,status,family_id)
    values('family-'||journey.family_id||'-'||planned.id,planned.title,coalesce(planned.contextualized_intro,planned.description),planned.category,planned.skills,'{}',array[conquest.category],8,21,'MEDIUM',planned.estimated_minutes,planned.xp_reward,planned.progress_percentage,planned.evidence_types,'Antes de começar',jsonb_build_object(
      'contexto',planned.contextualized_intro,'microaula',planned.contextualized_micro_lesson,'passos',planned.contextualized_steps,
      'prova',planned.contextualized_evidence_request,'follow_up',planned.follow_up_question,'age_band',planned.pedagogical_age_band,
      'technique',planned.technique_explanation,'example',planned.contextualized_example,'autonomy',planned.autonomy_guidance,
      'parent_support',planned.parent_support_guidance,'reflection_depth',planned.reflection_depth,'evidence_checklist',planned.evidence_checklist
    ),'ACTIVE',journey.family_id) returning id into mission_id;
    insert into public.mission_assignments(journey_id,mission_order,family_id,youth_id,conquest_id,mission_id,assigned_by,recommendation_score,recommendation_reasons,status)
    values(journey.id,planned.mission_order,journey.family_id,journey.youth_id,journey.conquest_id,mission_id,auth.uid(),planned.recommendation_score,array[planned.why_this_mission],case when sequence=1 then 'AVAILABLE' else 'LOCKED' end);
  end loop;
  update public.journeys set status='APPROVED',approved_by=auth.uid(),approved_at=now(),updated_at=now() where id=journey.id;
  update public.conquests set status='APPROVED',approved_at=now(),recommended_mission_count=total where id=journey.conquest_id;
  insert into public.conquest_contracts(conquest_id,family_id,parent_id,youth_id,estimated_missions,conditions,status)
  values(journey.conquest_id,journey.family_id,parent_id,journey.youth_id,total,'Cumprir o combinado quando a jornada for concluída nas condições acordadas.','PENDING')
  on conflict(conquest_id) do update set estimated_missions=excluded.estimated_missions,conditions=excluded.conditions,status='PENDING',parent_accepted_at=null,youth_accepted_at=null;
  insert into public.notifications(recipient_id,family_id,type,title,message,related_entity_id,deep_link)
  values(journey.youth_id,journey.family_id,'COMMITMENT_READY','Sua jornada foi aprovada.','Confirme o combinado para liberar a primeira missão.',journey.id,'/?view=contract');
  return jsonb_build_object('status','APPROVED','mission_count',total);
end $$;

create or replace function public.start_mission(target_assignment uuid) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare assignment public.mission_assignments;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select a.* into assignment from public.mission_assignments a where a.id=target_assignment for update;
  if assignment.id is null or assignment.youth_id<>auth.uid() or assignment.status not in ('AVAILABLE','NEEDS_CHANGES') then raise exception 'not_allowed'; end if;
  if not exists(select 1 from public.conquest_contracts c where c.conquest_id=assignment.conquest_id and c.status='ACTIVE') then raise exception 'commitment_pending'; end if;
  if assignment.journey_id is not null and exists(select 1 from public.mission_assignments prior
    where prior.journey_id=assignment.journey_id and prior.mission_order<assignment.mission_order and prior.status<>'APPROVED')
  then raise exception 'previous_mission_pending'; end if;
  update public.mission_assignments set status='STARTED',started_at=coalesce(started_at,now()) where id=assignment.id;
end $$;

-- Replace the Wave 2 function only to add the atomic unlock of the next row.
create or replace function public.approve_mission(target_assignment uuid, review_note text default null) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare caller uuid:=auth.uid(); assignment public.mission_assignments; mission public.missions; event_id uuid; current_xp integer; current_progress numeric;
begin
  if caller is null then raise exception 'authentication_required'; end if;
  select a.* into assignment from public.mission_assignments a where a.id=target_assignment for update;
  if assignment.id is null or not public.is_family_parent(assignment.family_id) then raise exception 'not_allowed'; end if;
  if not exists(select 1 from public.conquests c where c.id=assignment.conquest_id and c.family_id=assignment.family_id and c.youth_id=assignment.youth_id) then raise exception 'invalid_assignment_scope'; end if;
  select m.* into mission from public.missions m where m.id=assignment.mission_id;
  if mission.id is null then raise exception 'mission_not_found'; end if;
  if assignment.status='APPROVED' then
    select total_xp into current_xp from public.youth_profiles where profile_id=assignment.youth_id;
    select progress into current_progress from public.conquests where id=assignment.conquest_id;
    return jsonb_build_object('xp',current_xp,'progress',current_progress,'xp_reward',mission.xp_reward,'progress_reward',mission.goal_progress_reward,'idempotent',true);
  end if;
  if assignment.status<>'SUBMITTED' then raise exception 'invalid_status'; end if;
  insert into public.xp_events(family_id,youth_id,assignment_id,amount,reason)
  values(assignment.family_id,assignment.youth_id,assignment.id,mission.xp_reward,'MISSION_APPROVED')
  on conflict(assignment_id,reason) do nothing returning id into event_id;
  if event_id is null then
    update public.mission_assignments set status='APPROVED',approved_at=coalesce(approved_at,now()) where id=assignment.id;
    select total_xp into current_xp from public.youth_profiles where profile_id=assignment.youth_id;
    select progress into current_progress from public.conquests where id=assignment.conquest_id;
    return jsonb_build_object('xp',current_xp,'progress',current_progress,'xp_reward',mission.xp_reward,'progress_reward',mission.goal_progress_reward,'idempotent',true);
  end if;
  insert into public.progress_events(family_id,conquest_id,assignment_id,amount,reason)
  values(assignment.family_id,assignment.conquest_id,assignment.id,mission.goal_progress_reward,'MISSION_APPROVED');
  update public.mission_assignments set status='APPROVED',approved_at=now() where id=assignment.id;
  update public.mission_assignments next set status='AVAILABLE'
  where next.id=(select candidate.id from public.mission_assignments candidate
    where candidate.journey_id=assignment.journey_id and candidate.mission_order>assignment.mission_order and candidate.status='LOCKED'
    order by candidate.mission_order,candidate.id limit 1);
  insert into public.mission_reviews(assignment_id,family_id,reviewer_id,decision,note) values(assignment.id,assignment.family_id,caller,'APPROVED',review_note);
  update public.youth_profiles set total_xp=total_xp+mission.xp_reward where profile_id=assignment.youth_id returning total_xp into current_xp;
  update public.conquests c set progress=least(100,coalesce((select sum(pe.amount) from public.progress_events pe where pe.conquest_id=assignment.conquest_id and pe.reason='MISSION_APPROVED'),0)) where c.id=assignment.conquest_id returning c.progress into current_progress;
  insert into public.notifications(recipient_id,family_id,type,title,message,related_entity_id,deep_link) values(assignment.youth_id,assignment.family_id,'MISSION_APPROVED','Boa. Mais perto.','+'||mission.xp_reward||' XP. Sua missão foi aprovada.',assignment.id,'/app?view=home');
  insert into public.analytics_events(family_id,user_id,event_name,properties) values(assignment.family_id,caller,'mission_approved',jsonb_build_object('assignment_id',assignment.id));
  return jsonb_build_object('xp',current_xp,'progress',current_progress,'xp_reward',mission.xp_reward,'progress_reward',mission.goal_progress_reward,'idempotent',false);
end $$;

revoke all on function public.approve_journey(uuid),public.start_mission(uuid),public.approve_mission(uuid,text) from public,anon;
grant execute on function public.start_mission(uuid),public.approve_mission(uuid,text) to authenticated,service_role;
grant execute on function public.approve_journey(uuid) to service_role;
