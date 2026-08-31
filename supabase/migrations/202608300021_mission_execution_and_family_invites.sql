-- Drafted locally. Do not apply without an explicit Wave/P0 authorization.
-- Makes Parent-authored missions independent, mission start idempotent, and
-- family invite role selection atomic without trusting client parameters.

alter table public.family_invites
  add column if not exists reservation_role text;

alter table public.family_invites
  drop constraint if exists family_invites_reservation_role_check;
alter table public.family_invites
  add constraint family_invites_reservation_role_check
  check (reservation_role is null or reservation_role in ('PARENT','YOUTH')) not valid;

-- Parent-authored assignments are part of the agreed 100% progress plan, but
-- they are not prerequisites. The source marker is server-generated while the
-- Parent approves the journey, so the client cannot promote an arbitrary row.
create or replace function public.make_parent_mission_independent()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare source_type text;
begin
  select m.lesson_content->>'source_type' into source_type
  from public.missions m where m.id=new.mission_id;
  if source_type='PARENT_CUSTOM' then
    new.journey_id:=null;
    new.mission_order:=null;
    -- Only release the row when it first enters (or is detached from) the
    -- sequence. Later lifecycle transitions such as STARTED and SUBMITTED must
    -- remain untouched.
    if tg_op='INSERT' or old.journey_id is not null then
      if new.status='LOCKED' then new.status:='AVAILABLE'; end if;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists parent_mission_independent on public.mission_assignments;
create trigger parent_mission_independent
before insert or update of mission_id,journey_id,mission_order,status
on public.mission_assignments for each row
execute function public.make_parent_mission_independent();

-- Reconcile untouched legacy Parent missions that were incorrectly placed at
-- the end of a sequential journey. Work already started/submitted/approved is
-- preserved; only the dependency metadata is removed.
update public.mission_assignments a
set journey_id=null,
    mission_order=null,
    status=case when a.status='LOCKED' then 'AVAILABLE' else a.status end
from public.missions m
where m.id=a.mission_id
  and m.lesson_content->>'source_type'='PARENT_CUSTOM'
  and a.journey_id is not null;

-- Double click/retry is a successful no-op. Sequential checks apply only to
-- KONKI journey rows; independent Parent missions have no journey_id.
create or replace function public.start_mission(target_assignment uuid) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare assignment public.mission_assignments;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select a.* into assignment from public.mission_assignments a where a.id=target_assignment for update;
  if assignment.id is null or assignment.youth_id<>auth.uid() then raise exception 'not_allowed'; end if;
  if assignment.status='STARTED' then return; end if;
  if assignment.status not in ('AVAILABLE','NEEDS_CHANGES') then raise exception 'invalid_status'; end if;
  if not exists(select 1 from public.conquest_contracts c where c.conquest_id=assignment.conquest_id and c.status='ACTIVE')
    then raise exception 'commitment_pending'; end if;
  if assignment.journey_id is not null and exists(
    select 1 from public.mission_assignments prior
    where prior.journey_id=assignment.journey_id
      and prior.mission_order<assignment.mission_order
      and prior.status<>'APPROVED'
  ) then raise exception 'previous_mission_pending'; end if;
  update public.mission_assignments
  set status='STARTED',started_at=coalesce(started_at,now())
  where id=assignment.id;
end $$;

revoke all on function public.start_mission(uuid) from public,anon;
grant execute on function public.start_mission(uuid) to authenticated,service_role;

-- Reserve one valid link for one explicit role. reservation_role is persisted
-- under the row lock so changing the role in a later client request cannot
-- escalate privileges.
create or replace function public.reserve_family_invite_link(invite_token uuid,member_role text) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare token uuid:=gen_random_uuid(); invite public.family_invites; normalized_role text:=upper(member_role);
begin
  if normalized_role not in ('PARENT','YOUTH') then raise exception 'invalid_member_role'; end if;
  update public.family_invites
  set reservation_token=token,reserved_at=now(),reservation_expires_at=now()+interval '10 minutes',reservation_role=normalized_role
  where link_token=invite_token and claimed_at is null and expires_at>now()
    and (reservation_token is null or reservation_expires_at<=now())
  returning * into invite;
  if invite.id is null then raise exception 'invite_unavailable'; end if;
  return jsonb_build_object('reservationToken',token,'familyId',invite.family_id,'role',normalized_role);
end $$;

create or replace function public.finalize_family_invite(
  reservation uuid,target_profile uuid,member_role text,youth_birth_date date default null
) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare invite public.family_invites; normalized_role text:=upper(member_role); calculated_age integer;
begin
  select i.* into invite from public.family_invites i where i.reservation_token=reservation for update;
  if invite.id is null or invite.claimed_at is not null or invite.reservation_expires_at<=now() then raise exception 'invalid_reservation'; end if;
  if normalized_role not in ('PARENT','YOUTH') or invite.reservation_role<>normalized_role then raise exception 'invalid_member_role'; end if;
  if not exists(select 1 from public.profiles p where p.id=target_profile) then raise exception 'profile_not_found'; end if;
  if exists(select 1 from public.family_members fm where fm.profile_id=target_profile) then raise exception 'profile_already_linked'; end if;

  update public.profiles set role=normalized_role where id=target_profile;
  insert into public.family_members(family_id,profile_id,role,relationship)
  values(invite.family_id,target_profile,normalized_role,case when normalized_role='PARENT' then 'Responsável' else invite.relationship end);

  if normalized_role='PARENT' then
    insert into public.parent_profiles(profile_id) values(target_profile) on conflict(profile_id) do nothing;
  else
    calculated_age:=case when youth_birth_date is null then invite.youth_age else extract(year from age(current_date,youth_birth_date))::integer end;
    if calculated_age<8 or calculated_age>21 then raise exception 'invalid_youth_age'; end if;
    insert into public.youth_profiles(profile_id,age,birth_date)
    values(target_profile,calculated_age,youth_birth_date)
    on conflict(profile_id) do update set age=excluded.age,birth_date=coalesce(excluded.birth_date,public.youth_profiles.birth_date);
  end if;

  update public.family_invites
  set claimed_by=target_profile,claimed_at=now(),reservation_token=null,reserved_at=null,reservation_expires_at=null,reservation_role=null
  where id=invite.id;
  insert into public.analytics_events(family_id,user_id,event_name,properties)
  values(invite.family_id,target_profile,'family_member_joined',jsonb_build_object('role',normalized_role));
  return invite.family_id;
end $$;

create or replace function public.release_family_invite(reservation uuid) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
declare released_count integer;
begin
  update public.family_invites
  set reservation_token=null,reserved_at=null,reservation_expires_at=null,reservation_role=null
  where reservation_token=reservation and claimed_at is null;
  get diagnostics released_count=row_count;
  return released_count>0;
end $$;

revoke all on function public.reserve_family_invite_link(uuid,text),public.finalize_family_invite(uuid,uuid,text,date),public.release_family_invite(uuid) from public,anon,authenticated;
grant execute on function public.reserve_family_invite_link(uuid,text),public.finalize_family_invite(uuid,uuid,text,date),public.release_family_invite(uuid) to service_role;
