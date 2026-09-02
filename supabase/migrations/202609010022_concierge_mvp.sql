-- KONKI Concierge MVP: bilateral entry, Parent-only final acceptance, manual
-- Admin curation and evidence-aware publication. Incremental and non-destructive.

alter table public.family_invites add column if not exists intended_role text;
alter table public.family_invites drop constraint if exists family_invites_intended_role_check;
alter table public.family_invites add constraint family_invites_intended_role_check
  check (intended_role is null or intended_role in ('PARENT','YOUTH')) not valid;

alter table public.journeys drop constraint if exists journeys_recommended_mission_count_check;
alter table public.journeys add constraint journeys_recommended_mission_count_check
  check (recommended_mission_count between 0 and 30) not valid;

alter table public.journey_missions
  add column if not exists curation_status text not null default 'PUBLISHED',
  add column if not exists due_days integer,
  add column if not exists journey_role text,
  add column if not exists evidence_required boolean not null default true;
alter table public.journey_missions drop constraint if exists journey_missions_curation_status_check;
alter table public.journey_missions add constraint journey_missions_curation_status_check
  check (curation_status in ('DRAFT','PUBLISHED')) not valid;
alter table public.journey_missions drop constraint if exists journey_missions_due_days_check;
alter table public.journey_missions add constraint journey_missions_due_days_check
  check (due_days is null or due_days between 1 and 90) not valid;
alter table public.journey_missions drop constraint if exists journey_missions_journey_role_check;
alter table public.journey_missions add constraint journey_missions_journey_role_check
  check (journey_role is null or journey_role in ('CORE','BRIDGE','DISCOVERY')) not valid;

alter table public.mission_assignments add column if not exists due_at timestamptz;

update public.mission_assignments a set status='CANCELLED'
from public.conquests c where c.id=a.conquest_id and c.status in ('ARCHIVED','CANCELLED')
  and a.status not in ('APPROVED','CANCELLED');

create table if not exists public.admin_case_notes (
  id uuid primary key default gen_random_uuid(),
  conquest_id uuid not null references public.conquests(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  admin_id uuid not null references public.profiles(id),
  note text not null check (char_length(btrim(note)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists admin_case_notes_case_idx on public.admin_case_notes(conquest_id,created_at desc);
alter table public.admin_case_notes enable row level security;
drop policy if exists admin_case_notes_admin_only on public.admin_case_notes;
create policy admin_case_notes_admin_only on public.admin_case_notes for all
  using (public.is_admin()) with check (public.is_admin());
revoke all on public.admin_case_notes from public,anon,authenticated;
grant all on public.admin_case_notes to service_role;

-- A role-specific link cannot be reserved under another role. Generic legacy
-- links remain valid, preserving already-issued invitations.
create or replace function public.reserve_family_invite_link(invite_token uuid,member_role text) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare token uuid:=gen_random_uuid(); invite public.family_invites; normalized_role text:=upper(member_role);
begin
  if normalized_role not in ('PARENT','YOUTH') then raise exception 'invalid_member_role'; end if;
  update public.family_invites
  set reservation_token=token,reserved_at=now(),reservation_expires_at=now()+interval '10 minutes',reservation_role=normalized_role
  where link_token=invite_token and claimed_at is null and expires_at>now()
    and (intended_role is null or intended_role=normalized_role)
    and (reservation_token is null or reservation_expires_at<=now())
  returning * into invite;
  if invite.id is null then raise exception 'invite_unavailable'; end if;
  return jsonb_build_object('reservationToken',token,'familyId',invite.family_id,'role',normalized_role);
end $$;

create or replace function public.resolve_family_invite_link(invite_token uuid) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare invite public.family_invites; family_name text;
begin
  select i.* into invite from public.family_invites i where i.link_token=invite_token;
  if invite.id is null then raise exception 'invite_not_found'; end if;
  if invite.claimed_at is not null then raise exception 'invite_used'; end if;
  if invite.expires_at<=now() then raise exception 'invite_expired'; end if;
  select f.name into family_name from public.families f where f.id=invite.family_id;
  return jsonb_build_object('familyName',family_name,'intendedRole',invite.intended_role);
end $$;

-- Parent is the sole final approver. Youth acceptance is recorded because
-- creating/submitting the conquest is the Youth's explicit agreement.
create or replace function public.approve_conquest_for_curation(
  target_conquest uuid,
  development_competencies text[] default '{}',
  goal_value numeric default null,
  reward_text text default null,
  goal_deadline date default null,
  agreement_conditions text default null
) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.conquests; parent_id uuid:=auth.uid(); journey_id uuid; contract_id uuid; admin_id uuid;
begin
  if parent_id is null then raise exception 'authentication_required'; end if;
  select * into c from public.conquests where id=target_conquest for update;
  if c.id is null or not public.is_family_parent(c.family_id) then raise exception 'not_allowed'; end if;
  if c.status not in ('PENDING','CHANGES_REQUESTED') then raise exception 'invalid_status'; end if;
  if goal_deadline is not null and goal_deadline<current_date then raise exception 'invalid_deadline'; end if;

  update public.parent_profiles set development_goals=coalesce(development_competencies,'{}')
    where profile_id=parent_id;
  insert into public.journeys(conquest_id,family_id,youth_id,status,estimated_duration_months,recommended_mission_count,cadence_label,approved_by,approved_at)
    values(c.id,c.family_id,c.youth_id,'ACTIVE',1,0,'Curadoria manual',parent_id,now())
    on conflict(conquest_id) do update set status='ACTIVE',approved_by=excluded.approved_by,
      approved_at=coalesce(public.journeys.approved_at,excluded.approved_at),updated_at=now()
    returning id into journey_id;
  update public.conquests set status='ACTIVE',approved_at=now(),desired_date=coalesce(goal_deadline,desired_date),
    confirmed_goal_value=goal_value,reward_agreement=reward_text,recommended_mission_count=0,cadence_label='Curadoria manual'
    where id=c.id;
  insert into public.conquest_contracts(conquest_id,family_id,parent_id,youth_id,estimated_missions,conditions,parent_accepted_at,youth_accepted_at,status)
    values(c.id,c.family_id,parent_id,c.youth_id,0,coalesce(nullif(btrim(agreement_conditions),''),nullif(btrim(reward_text),''),'Cumprir as missões e evidências combinadas.'),now(),now(),'ACTIVE')
    on conflict(conquest_id) do update set parent_id=excluded.parent_id,estimated_missions=0,conditions=excluded.conditions,
      parent_accepted_at=coalesce(public.conquest_contracts.parent_accepted_at,now()),
      youth_accepted_at=coalesce(public.conquest_contracts.youth_accepted_at,now()),status='ACTIVE'
    returning id into contract_id;
  insert into public.contract_acceptances(contract_id,user_id,role)
    values(contract_id,c.youth_id,'YOUTH'),(contract_id,parent_id,'PARENT') on conflict do nothing;
  for admin_id in select profile_id from public.admin_users loop
    insert into public.notifications(recipient_id,family_id,type,title,message,related_entity_id,deep_link)
    values(admin_id,c.family_id,'CURATION_REQUIRED','Nova jornada para preparar',
      'Uma conquista aprovada está aguardando as primeiras missões.',c.id,'/?view=admin&conquest='||c.id);
  end loop;
  insert into public.analytics_events(family_id,user_id,event_name,properties)
    values(c.family_id,parent_id,'conquest_awaiting_curation',jsonb_build_object('conquest_id',c.id,'journey_id',journey_id));
  return jsonb_build_object('status','ACTIVE','journey_id',journey_id,'contract_id',contract_id,'mission_count',0);
end $$;

-- Only the server-side Admin API may publish. Drafts remain journey_missions;
-- publication materializes the existing mission/assignment model atomically.
create or replace function public.admin_publish_curated_missions(actor_id uuid,target_journey uuid,draft_ids uuid[]) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare j public.journeys; c public.conquests; d public.journey_missions; mid uuid; assignment_id uuid; first_assignment uuid; published integer:=0;
declare current_remaining integer; next_order integer; assignment_status text; youth_name text; parent_id uuid; progress_total numeric;
begin
  if auth.role()<>'service_role' or not exists(select 1 from public.admin_users where profile_id=actor_id) then raise exception 'not_allowed'; end if;
  select * into j from public.journeys where id=target_journey for update;
  if j.id is null or j.status not in ('ACTIVE','APPROVED') then raise exception 'invalid_journey'; end if;
  select * into c from public.conquests where id=j.conquest_id and status='ACTIVE';
  if c.id is null then raise exception 'inactive_conquest'; end if;
  select count(*) into current_remaining from public.mission_assignments
    where journey_id=j.id and status not in ('APPROVED','CANCELLED');
  select coalesce(max(mission_order),0) into next_order from public.mission_assignments where journey_id=j.id;
  select coalesce(sum(m.goal_progress_reward),0) into progress_total from public.mission_assignments a join public.missions m on m.id=a.mission_id where a.journey_id=j.id and a.status<>'CANCELLED';
  for d in select * from public.journey_missions where journey_id=j.id and id=any(draft_ids) and curation_status='DRAFT' order by mission_order,id for update loop
    if progress_total+d.progress_percentage>100.0001 then raise exception 'progress_total_exceeds_100'; end if;
    progress_total:=progress_total+d.progress_percentage;
    next_order:=next_order+1;
    insert into public.missions(slug,title,description,category,skills,interests,goal_categories,recommended_age_min,recommended_age_max,difficulty,estimated_minutes,xp_reward,goal_progress_reward,evidence_types,lesson_title,lesson_content,status,family_id)
    values('admin-'||j.family_id||'-'||d.id,d.title,d.description,d.category,d.skills,'{}',array[c.category],8,21,'MEDIUM',d.estimated_minutes,d.xp_reward,d.progress_percentage,d.evidence_types,'Antes de começar',jsonb_build_object(
      'source_type','ADMIN_CURATED','material',d.contextualized_micro_lesson,'microaula',d.contextualized_micro_lesson,'passos',d.contextualized_steps,
      'prova',coalesce(d.contextualized_evidence_request,d.instructions),'technique',d.technique_explanation,
      'example',d.contextualized_example,'tip',d.parent_support_guidance,'challenge',d.follow_up_question,
      'completion_criteria',d.evidence_checklist,'evidence_checklist',d.evidence_checklist,'evidence_required',d.evidence_required,'journey_role',d.journey_role
    ),'ACTIVE',j.family_id) returning id into mid;
    assignment_status:=case when current_remaining=0 and published=0 then 'AVAILABLE' else 'LOCKED' end;
    insert into public.mission_assignments(journey_id,mission_order,family_id,youth_id,conquest_id,mission_id,assigned_by,recommendation_score,recommendation_reasons,status,due_at)
      values(j.id,next_order,j.family_id,j.youth_id,j.conquest_id,mid,actor_id,d.recommendation_score,array[coalesce(d.why_this_mission,d.description)],assignment_status,
        case when d.due_days is null then null else now()+make_interval(days=>d.due_days) end)
      returning id into assignment_id;
    first_assignment:=coalesce(first_assignment,assignment_id);
    update public.journey_missions set curation_status='PUBLISHED',source_mission_id=mid,mission_order=next_order,updated_at=now() where id=d.id;
    published:=published+1;
  end loop;
  if published=0 then return jsonb_build_object('published',0,'retry',true); end if;
  update public.journeys set recommended_mission_count=recommended_mission_count+published,updated_at=now() where id=j.id;
  update public.conquests set recommended_mission_count=coalesce(recommended_mission_count,0)+published where id=j.conquest_id;
  update public.conquest_contracts set estimated_missions=estimated_missions+published where conquest_id=j.conquest_id;
  select first_name into youth_name from public.profiles where id=j.youth_id;
  insert into public.notifications(recipient_id,family_id,type,title,message,related_entity_id,deep_link)
    values(j.youth_id,j.family_id,'CURATED_MISSIONS_READY',case when current_remaining=0 then 'Sua jornada está pronta!' else 'Você tem novos desafios na KONKI.' end,
      'Novos desafios chegaram. Abra a KONKI para ver seu próximo passo.',first_assignment,'/?view=mission&assignment='||first_assignment);
  for parent_id in select profile_id from public.family_members where family_id=j.family_id and role='PARENT' loop
    insert into public.notifications(recipient_id,family_id,type,title,message,related_entity_id,deep_link)
      values(parent_id,j.family_id,'CURATED_MISSIONS_READY','A jornada de '||coalesce(youth_name,'seu jovem')||' tem novidades.',
        'Novos desafios foram publicados e já podem ser acompanhados.',j.id,'/?view=missions');
  end loop;
  return jsonb_build_object('published',published,'first_assignment_id',first_assignment);
end $$;

-- Evidence requirements are enforced at the transaction boundary, not only UI.
create or replace function public.submit_mission(target_assignment uuid) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare a public.mission_assignments; m public.missions; required boolean; allowed text[];
begin
  select * into a from public.mission_assignments where id=target_assignment for update;
  if a.id is null or a.youth_id<>auth.uid() or a.status not in ('STARTED','NEEDS_CHANGES') then raise exception 'not_allowed'; end if;
  select * into m from public.missions where id=a.mission_id;
  required:=coalesce((m.lesson_content->>'evidence_required')::boolean,true); allowed:=m.evidence_types;
  if required and not exists(select 1 from public.mission_evidence e where e.assignment_id=a.id) then raise exception 'evidence_required'; end if;
  if exists(select 1 from public.mission_evidence e where e.assignment_id=a.id and not(e.evidence_type=any(allowed))) then raise exception 'evidence_type_not_allowed'; end if;
  update public.mission_assignments set status='SUBMITTED',submitted_at=now() where id=a.id;
end $$;

-- Archived conquests never leak unfinished assignments back into the active UI.
create or replace function public.archive_journey(target_journey uuid, archive_reason text default null) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare j public.journeys; c public.conquests; approved_count integer; earned integer; safe_reason text;
begin
  select * into j from public.journeys where id=target_journey for update;
  if j.id is null or not(public.is_family_member(j.family_id) or public.is_admin()) then raise exception 'not_allowed'; end if;
  select * into c from public.conquests where id=j.conquest_id for update;
  safe_reason:=coalesce(nullif(btrim(archive_reason),''),'Jornada encerrada');
  select count(*) into approved_count from public.mission_assignments a where a.journey_id=j.id and a.status='APPROVED';
  select coalesce(sum(x.amount),0) into earned from public.xp_events x where x.youth_id=j.youth_id and x.assignment_id in(select id from public.mission_assignments where journey_id=j.id);
  update public.mission_assignments set status='CANCELLED' where journey_id=j.id and status not in ('APPROVED','CANCELLED');
  update public.conquest_contracts set status='CANCELLED' where conquest_id=c.id and status not in ('COMPLETED','CANCELLED');
  update public.journeys set status='ARCHIVED',archive_reason=safe_reason,archived_at=now(),updated_at=now() where id=j.id;
  update public.conquests set status='ARCHIVED',archive_reason=safe_reason,archived_at=now() where id=c.id;
  insert into public.journey_archive_events(journey_id,conquest_id,family_id,youth_id,archived_by,reason,progress_at_archive,approved_missions,earned_xp)
    values(j.id,c.id,j.family_id,j.youth_id,auth.uid(),safe_reason,c.progress,approved_count,earned);
end $$;

revoke all on function public.approve_conquest_for_curation(uuid,text[],numeric,text,date,text),public.admin_publish_curated_missions(uuid,uuid,uuid[]),public.submit_mission(uuid),public.archive_journey(uuid,text) from public,anon;
grant execute on function public.approve_conquest_for_curation(uuid,text[],numeric,text,date,text),public.submit_mission(uuid),public.archive_journey(uuid,text) to authenticated,service_role;
grant execute on function public.admin_publish_curated_missions(uuid,uuid,uuid[]) to service_role;
