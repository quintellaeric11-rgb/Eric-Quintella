-- Wave 2: mission approval idempotency and atomic invite consumption.

create or replace function public.approve_mission(target_assignment uuid, review_note text default null) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare
  caller uuid:=auth.uid();
  assignment public.mission_assignments;
  mission public.missions;
  event_id uuid;
  current_xp integer;
  current_progress numeric;
begin
  if caller is null then raise exception 'authentication_required'; end if;
  select a.* into assignment from public.mission_assignments a where a.id=target_assignment for update;
  if assignment.id is null or not public.is_family_parent(assignment.family_id) then raise exception 'not_allowed'; end if;
  if not exists(select 1 from public.conquests c where c.id=assignment.conquest_id and c.family_id=assignment.family_id and c.youth_id=assignment.youth_id)
  then raise exception 'invalid_assignment_scope'; end if;
  select m.* into mission from public.missions m where m.id=assignment.mission_id;
  if mission.id is null then raise exception 'mission_not_found'; end if;

  -- A repeated response/retry is a successful no-op with the canonical totals.
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
    -- Heal a legacy re-opened assignment without issuing a second reward.
    update public.mission_assignments set status='APPROVED',approved_at=coalesce(approved_at,now()) where id=assignment.id;
    select total_xp into current_xp from public.youth_profiles where profile_id=assignment.youth_id;
    select progress into current_progress from public.conquests where id=assignment.conquest_id;
    return jsonb_build_object('xp',current_xp,'progress',current_progress,'xp_reward',mission.xp_reward,'progress_reward',mission.goal_progress_reward,'idempotent',true);
  end if;

  -- These statements share the function transaction. Any failure rolls back the
  -- ledger event, assignment transition and both accumulated values.
  insert into public.progress_events(family_id,conquest_id,assignment_id,amount,reason)
  values(assignment.family_id,assignment.conquest_id,assignment.id,mission.goal_progress_reward,'MISSION_APPROVED');
  update public.mission_assignments set status='APPROVED',approved_at=now() where id=assignment.id;
  insert into public.mission_reviews(assignment_id,family_id,reviewer_id,decision,note)
  values(assignment.id,assignment.family_id,caller,'APPROVED',review_note);
  update public.youth_profiles set total_xp=total_xp+mission.xp_reward
  where profile_id=assignment.youth_id returning total_xp into current_xp;
  update public.conquests c set progress=least(100,coalesce((
    select sum(pe.amount) from public.progress_events pe where pe.conquest_id=assignment.conquest_id and pe.reason='MISSION_APPROVED'
  ),0)) where c.id=assignment.conquest_id returning c.progress into current_progress;
  insert into public.notifications(recipient_id,family_id,type,title,message,related_entity_id,deep_link)
  values(assignment.youth_id,assignment.family_id,'MISSION_APPROVED','Boa. Mais perto.','+'||mission.xp_reward||' XP. Sua missão foi aprovada.',assignment.id,'/app?view=home');
  insert into public.analytics_events(family_id,user_id,event_name,properties)
  values(assignment.family_id,caller,'mission_approved',jsonb_build_object('assignment_id',assignment.id));
  return jsonb_build_object('xp',current_xp,'progress',current_progress,'xp_reward',mission.xp_reward,'progress_reward',mission.goal_progress_reward,'idempotent',false);
end $$;

create or replace function public.request_mission_changes(target_assignment uuid, review_note text) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare caller uuid:=auth.uid(); assignment public.mission_assignments;
begin
  if caller is null then raise exception 'authentication_required'; end if;
  select a.* into assignment from public.mission_assignments a where a.id=target_assignment for update;
  if assignment.id is null or not public.is_family_parent(assignment.family_id) then raise exception 'not_allowed'; end if;
  if assignment.status<>'SUBMITTED' then raise exception 'invalid_status'; end if;
  update public.mission_assignments set status='NEEDS_CHANGES' where id=assignment.id;
  insert into public.mission_reviews(assignment_id,family_id,reviewer_id,decision,note)
  values(assignment.id,assignment.family_id,caller,'NEEDS_CHANGES',review_note);
  insert into public.notifications(recipient_id,family_id,type,title,message,related_entity_id,deep_link)
  values(assignment.youth_id,assignment.family_id,'MISSION_NEEDS_CHANGES','Falta um ajuste.','Veja o pedido do seu responsável e complete a evidência.',assignment.id,'/app?view=mission');
end $$;

alter table public.family_invites
  add column if not exists reservation_token uuid,
  add column if not exists reserved_at timestamptz,
  add column if not exists reservation_expires_at timestamptz;

alter table public.family_invites
  add constraint family_invites_claim_consistency
  check ((claimed_by is null and claimed_at is null) or (claimed_by is not null and claimed_at is not null))
  not valid;

drop policy if exists invites_parent_write on public.family_invites;
revoke insert,update,delete on public.family_invites from authenticated;

create or replace function public.reserve_youth_invite(invite_code text) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare token uuid:=gen_random_uuid(); invite public.family_invites;
begin
  update public.family_invites
     set reservation_token=token,reserved_at=now(),reservation_expires_at=now()+interval '5 minutes'
   where code=upper(btrim(invite_code)) and claimed_at is null and expires_at>now()
     and (reservation_token is null or reservation_expires_at<=now())
  returning * into invite;
  if invite.id is null then raise exception 'invite_unavailable'; end if;
  return jsonb_build_object('reservationToken',token,'familyId',invite.family_id,'relationship',invite.relationship,'youthAge',invite.youth_age);
end $$;

create or replace function public.finalize_youth_invite(
  reservation uuid,
  target_profile uuid,
  youth_birth_date date default null
) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare invite public.family_invites; calculated_age integer;
begin
  select i.* into invite from public.family_invites i where i.reservation_token=reservation for update;
  if invite.id is null or invite.claimed_at is not null or invite.reservation_expires_at<=now() then raise exception 'invalid_reservation'; end if;
  if not exists(select 1 from public.profiles p where p.id=target_profile and p.role='YOUTH') then raise exception 'invalid_youth_profile'; end if;
  if exists(select 1 from public.family_members fm where fm.profile_id=target_profile) then raise exception 'profile_already_linked'; end if;
  calculated_age:=case when youth_birth_date is null then invite.youth_age else extract(year from age(current_date,youth_birth_date))::integer end;
  if calculated_age<8 or calculated_age>21 then raise exception 'invalid_youth_age'; end if;
  insert into public.family_members(family_id,profile_id,role,relationship)
  values(invite.family_id,target_profile,'YOUTH',invite.relationship);
  insert into public.youth_profiles(profile_id,age,birth_date)
  values(target_profile,calculated_age,youth_birth_date)
  on conflict(profile_id) do update set age=excluded.age,birth_date=coalesce(excluded.birth_date,public.youth_profiles.birth_date);
  update public.family_invites set claimed_by=target_profile,claimed_at=now(),reservation_token=null,reserved_at=null,reservation_expires_at=null where id=invite.id;
  insert into public.analytics_events(family_id,user_id,event_name,properties)
  values(invite.family_id,target_profile,'youth_joined','{}'::jsonb);
  return invite.family_id;
end $$;

create or replace function public.release_youth_invite(reservation uuid) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
declare released_count integer;
begin
  update public.family_invites set reservation_token=null,reserved_at=null,reservation_expires_at=null
  where reservation_token=reservation and claimed_at is null;
  get diagnostics released_count=row_count;
  return released_count>0;
end $$;

revoke all on function public.approve_mission(uuid,text) from public,anon;
revoke all on function public.request_mission_changes(uuid,text) from public,anon;
grant execute on function public.approve_mission(uuid,text),public.request_mission_changes(uuid,text) to authenticated,service_role;

revoke all on function public.reserve_youth_invite(text) from public,anon,authenticated;
revoke all on function public.finalize_youth_invite(uuid,uuid,date) from public,anon,authenticated;
revoke all on function public.release_youth_invite(uuid) from public,anon,authenticated;
grant execute on function public.reserve_youth_invite(text),public.finalize_youth_invite(uuid,uuid,date),public.release_youth_invite(uuid) to service_role;
