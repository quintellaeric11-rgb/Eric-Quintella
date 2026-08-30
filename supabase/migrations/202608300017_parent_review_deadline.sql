-- Save the Parent agreement deadline inside the same authorized transaction
-- that approves the draft and materializes its assignments.
create or replace function public.approve_journey_with_deadline(target_journey uuid,goal_value numeric default null,reward_text text default null,duration_months integer default 3,goal_deadline date default null) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare journey public.journeys; conquest public.conquests; planned public.journey_missions; parent_id uuid; mission_id uuid; total integer; sequence integer:=0; parent_authored boolean;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select j.* into journey from public.journeys j where j.id=target_journey for update;
  if journey.id is null or not public.is_family_parent(journey.family_id) then raise exception 'not_allowed'; end if;
  if journey.status<>'DRAFT' then raise exception 'invalid_status'; end if;
  if goal_deadline is not null and goal_deadline<current_date then raise exception 'invalid_deadline'; end if;
  perform public.recalculate_journey_progress(journey.id);
  select count(*) into total from public.journey_missions where journey_id=journey.id;
  if total<1 then raise exception 'empty_journey'; end if;
  select c.* into conquest from public.conquests c where c.id=journey.conquest_id and c.family_id=journey.family_id and c.youth_id=journey.youth_id;
  if conquest.id is null then raise exception 'invalid_journey_scope'; end if;
  select profile_id into parent_id from public.family_members where family_id=journey.family_id and role='PARENT' order by joined_at limit 1;
  for planned in select * from public.journey_missions where journey_id=journey.id order by mission_order,id loop
    sequence:=sequence+1;
    parent_authored:=planned.is_custom and planned.contextualized_micro_lesson is null and planned.technique_explanation is null;
    insert into public.missions(slug,title,description,category,skills,interests,goal_categories,recommended_age_min,recommended_age_max,difficulty,estimated_minutes,xp_reward,goal_progress_reward,evidence_types,lesson_title,lesson_content,status,family_id)
    values('family-'||journey.family_id||'-'||planned.id,planned.title,coalesce(planned.contextualized_intro,planned.description),planned.category,planned.skills,'{}',array[conquest.category],8,21,'MEDIUM',planned.estimated_minutes,planned.xp_reward,planned.progress_percentage,planned.evidence_types,case when parent_authored then 'Orientação do responsável' else 'Antes de começar' end,jsonb_build_object(
      'source_type',case when parent_authored then 'PARENT_CUSTOM' else 'KONKI' end,'contexto',planned.contextualized_intro,
      'microaula',planned.contextualized_micro_lesson,'passos',planned.contextualized_steps,'prova',coalesce(planned.contextualized_evidence_request,'Envie o resultado combinado com seu responsável.'),
      'follow_up',planned.follow_up_question,'age_band',planned.pedagogical_age_band,'technique',planned.technique_explanation,'example',planned.contextualized_example,
      'autonomy',planned.autonomy_guidance,'parent_support',planned.parent_support_guidance,'reflection_depth',planned.reflection_depth,'evidence_checklist',planned.evidence_checklist
    ),'ACTIVE',journey.family_id) returning id into mission_id;
    insert into public.mission_assignments(journey_id,mission_order,family_id,youth_id,conquest_id,mission_id,assigned_by,recommendation_score,recommendation_reasons,status)
    values(journey.id,planned.mission_order,journey.family_id,journey.youth_id,journey.conquest_id,mission_id,auth.uid(),planned.recommendation_score,array[coalesce(planned.why_this_mission,planned.description)],case when sequence=1 then 'AVAILABLE' else 'LOCKED' end);
  end loop;
  update public.journeys set status='APPROVED',approved_by=auth.uid(),approved_at=now(),agreed_duration_months=duration_months,updated_at=now() where id=journey.id;
  update public.conquests set status='APPROVED',approved_at=now(),desired_date=coalesce(goal_deadline,desired_date),confirmed_goal_value=goal_value,reward_agreement=reward_text,estimated_duration_months=duration_months,recommended_mission_count=total where id=journey.conquest_id;
  insert into public.conquest_contracts(conquest_id,family_id,parent_id,youth_id,estimated_missions,conditions,status)
  values(journey.conquest_id,journey.family_id,parent_id,journey.youth_id,total,coalesce(reward_text,'Cumprir o combinado da conquista.'),'PENDING')
  on conflict(conquest_id) do update set estimated_missions=excluded.estimated_missions,conditions=excluded.conditions,status='PENDING',parent_accepted_at=null,youth_accepted_at=null;
  insert into public.notifications(recipient_id,family_id,type,title,message,related_entity_id,deep_link)
  values(journey.youth_id,journey.family_id,'COMMITMENT_READY','Sua jornada foi aprovada.','Confirme o combinado para liberar a primeira missão.',journey.id,'/?view=contract');
  return jsonb_build_object('status','APPROVED','mission_count',total);
end $$;

revoke all on function public.approve_journey_with_deadline(uuid,numeric,text,integer,date) from public,anon;
grant execute on function public.approve_journey_with_deadline(uuid,numeric,text,integer,date) to authenticated,service_role;
