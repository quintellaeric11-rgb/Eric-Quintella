-- Wave 1: authorization and integrity boundaries for family membership,
-- wishlist, XP, contracts/acceptances and conquests.

-- The browser may read family membership, but only trusted server flows may
-- create, change or remove associations and roles.
drop policy if exists members_parent_write on public.family_members;
revoke insert, update, delete on public.family_members from authenticated;

-- A user may edit ordinary profile fields, never their authorization role.
revoke update on public.profiles from authenticated;
grant update (first_name,last_name,username,last_seen_at) on public.profiles to authenticated;

-- XP and streaks are domain-owned. Keep the existing self/parent row checks
-- only for the explicitly granted, non-sensitive profile columns.
drop policy if exists youth_profiles_self_write on public.youth_profiles;
drop policy if exists youth_profiles_parent_update on public.youth_profiles;
create policy youth_profiles_self_update on public.youth_profiles for update
  using(profile_id=auth.uid()) with check(profile_id=auth.uid());
create policy youth_profiles_parent_update_safe on public.youth_profiles for update
  using(exists(select 1 from public.family_members fm where fm.profile_id=youth_profiles.profile_id and public.is_family_parent(fm.family_id)))
  with check(exists(select 1 from public.family_members fm where fm.profile_id=youth_profiles.profile_id and public.is_family_parent(fm.family_id)));
revoke insert, update, delete on public.youth_profiles from authenticated;
grant update (age,birth_date,interests,strengths,dislikes,onboarding_completed_at) on public.youth_profiles to authenticated;

-- Contracts and acceptance records are mutated only by SECURITY DEFINER RPCs.
drop policy if exists contracts_family_write on public.conquest_contracts;
drop policy if exists contract_acceptances_self_insert on public.contract_acceptances;
revoke insert, update, delete on public.conquest_contracts from authenticated;
revoke insert, update, delete on public.contract_acceptances from authenticated;

-- Conquest state, progress and protected agreement values are domain-owned.
drop policy if exists conquests_youth_insert on public.conquests;
drop policy if exists conquests_family_update on public.conquests;
revoke insert, update, delete on public.conquests from authenticated;

-- Wishlist mutations are also intent-based RPCs so the caller cannot choose
-- a family or youth identity.
drop policy if exists wishlist_youth_write on public.conquest_wishlist;
revoke insert, update, delete on public.conquest_wishlist from authenticated;

-- New rows must keep family and youth/participant references consistent.
-- NOT VALID keeps the migration safe if historical test rows are inconsistent,
-- while PostgreSQL still enforces each constraint for all new writes.
alter table public.conquest_wishlist
  add constraint conquest_wishlist_family_youth_fk
  foreign key (family_id,youth_id) references public.family_members(family_id,profile_id)
  not valid;

alter table public.conquests
  add constraint conquests_family_youth_fk
  foreign key (family_id,youth_id) references public.family_members(family_id,profile_id)
  not valid;

alter table public.conquest_contracts
  add constraint conquest_contracts_family_parent_fk
  foreign key (family_id,parent_id) references public.family_members(family_id,profile_id)
  not valid,
  add constraint conquest_contracts_family_youth_fk
  foreign key (family_id,youth_id) references public.family_members(family_id,profile_id)
  not valid;

alter table public.conquests
  add constraint conquests_confirmed_goal_value_nonnegative
  check (confirmed_goal_value is null or confirmed_goal_value >= 0)
  not valid;

create or replace function public.create_conquest(
  conquest_title text,
  conquest_category text default 'OTHER',
  conquest_reason text default null
) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare caller uuid:=auth.uid(); caller_family uuid; new_conquest uuid; safe_title text;
begin
  if caller is null then raise exception 'authentication_required'; end if;
  select fm.family_id into caller_family
  from public.family_members fm
  where fm.profile_id=caller and fm.role='YOUTH'
  order by fm.joined_at limit 1;
  if caller_family is null then raise exception 'not_allowed'; end if;
  safe_title:=nullif(btrim(conquest_title),'');
  if safe_title is null or char_length(safe_title)>160 then raise exception 'invalid_title'; end if;
  if exists(select 1 from public.conquests where youth_id=caller and status in ('PENDING','CHANGES_REQUESTED','APPROVED','ACTIVE')) then
    raise exception 'active_conquest_exists';
  end if;
  insert into public.conquests(family_id,youth_id,title,category,reason,status)
  values(caller_family,caller,safe_title,coalesce(nullif(btrim(conquest_category),''),'OTHER'),nullif(btrim(conquest_reason),''),'PENDING')
  returning id into new_conquest;
  return new_conquest;
end $$;

create or replace function public.save_wishlist_item(
  item_title text,
  item_context text default null,
  item_category text default null
) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare caller uuid:=auth.uid(); caller_family uuid; new_item uuid; safe_title text;
begin
  if caller is null then raise exception 'authentication_required'; end if;
  select fm.family_id into caller_family
  from public.family_members fm
  where fm.profile_id=caller and fm.role='YOUTH'
  order by fm.joined_at limit 1;
  if caller_family is null then raise exception 'not_allowed'; end if;
  safe_title:=nullif(btrim(item_title),'');
  if safe_title is null or char_length(safe_title)>160 then raise exception 'invalid_title'; end if;
  insert into public.conquest_wishlist(family_id,youth_id,title,context,category,status)
  values(caller_family,caller,safe_title,nullif(btrim(item_context),''),nullif(btrim(item_category),''),'SAVED')
  returning id into new_item;
  return new_item;
end $$;

create or replace function public.remove_wishlist_item(target_item uuid) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare caller uuid:=auth.uid(); item public.conquest_wishlist;
begin
  if caller is null then raise exception 'authentication_required'; end if;
  select w.* into item from public.conquest_wishlist w where w.id=target_item for update;
  if item.id is null or item.youth_id<>caller or item.status<>'SAVED'
     or not exists(select 1 from public.family_members fm where fm.family_id=item.family_id and fm.profile_id=caller and fm.role='YOUTH')
  then raise exception 'not_allowed'; end if;
  delete from public.conquest_wishlist where id=item.id;
end $$;

create or replace function public.activate_wishlist_item(target_item uuid) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare caller uuid:=auth.uid(); item public.conquest_wishlist; new_conquest uuid;
begin
  if caller is null then raise exception 'authentication_required'; end if;
  select w.* into item from public.conquest_wishlist w where w.id=target_item for update;
  if item.id is null or item.youth_id<>caller or item.status<>'SAVED'
     or not exists(select 1 from public.family_members fm where fm.family_id=item.family_id and fm.profile_id=caller and fm.role='YOUTH')
  then raise exception 'not_allowed'; end if;
  if exists(select 1 from public.conquests where youth_id=caller and status in ('PENDING','CHANGES_REQUESTED','APPROVED','ACTIVE')) then
    raise exception 'active_conquest_exists';
  end if;
  insert into public.conquests(family_id,youth_id,title,category,reason,status)
  values(item.family_id,caller,item.title,coalesce(item.category,'OTHER'),item.context,'PENDING')
  returning id into new_conquest;
  update public.conquest_wishlist set status='ACTIVATED',activated_at=now(),updated_at=now() where id=item.id;
  return new_conquest;
end $$;

create or replace function public.accept_commitment(target_contract uuid) returns text
language plpgsql security definer set search_path=public,pg_temp as $$
declare caller uuid:=auth.uid(); contract public.conquest_contracts; caller_role text; parent_ok boolean; youth_ok boolean;
begin
  if caller is null then raise exception 'authentication_required'; end if;
  select c.* into contract from public.conquest_contracts c where c.id=target_contract for update;
  if contract.id is null or contract.status not in ('PENDING','ACTIVE') then raise exception 'invalid_contract'; end if;
  if not exists(select 1 from public.conquests q where q.id=contract.conquest_id and q.family_id=contract.family_id and q.youth_id=contract.youth_id)
  then raise exception 'invalid_contract_scope'; end if;
  if caller=contract.parent_id and exists(select 1 from public.family_members fm where fm.family_id=contract.family_id and fm.profile_id=caller and fm.role='PARENT') then
    caller_role:='PARENT';
  elsif caller=contract.youth_id and exists(select 1 from public.family_members fm where fm.family_id=contract.family_id and fm.profile_id=caller and fm.role='YOUTH') then
    caller_role:='YOUTH';
  else raise exception 'not_allowed'; end if;
  insert into public.contract_acceptances(contract_id,user_id,role,contract_version)
  values(contract.id,caller,caller_role,'1.0') on conflict do nothing;
  if caller_role='PARENT' then
    update public.conquest_contracts set parent_accepted_at=coalesce(parent_accepted_at,now()) where id=contract.id;
  else
    update public.conquest_contracts set youth_accepted_at=coalesce(youth_accepted_at,now()) where id=contract.id;
  end if;
  select exists(select 1 from public.contract_acceptances where contract_id=contract.id and user_id=contract.parent_id and role='PARENT' and contract_version='1.0'),
         exists(select 1 from public.contract_acceptances where contract_id=contract.id and user_id=contract.youth_id and role='YOUTH' and contract_version='1.0')
    into parent_ok,youth_ok;
  if parent_ok and youth_ok then
    update public.conquest_contracts set status='ACTIVE' where id=contract.id;
    update public.journeys set status='ACTIVE',updated_at=now() where conquest_id=contract.conquest_id;
    update public.conquests set status='ACTIVE',approved_at=coalesce(approved_at,now()) where id=contract.conquest_id;
    return 'ACTIVE';
  end if;
  return 'PENDING';
end $$;

create or replace function public.approve_journey_with_agreement(
  target_journey uuid,
  goal_value numeric default null,
  reward_text text default null,
  duration_months integer default 3
) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare caller uuid:=auth.uid(); journey public.journeys;
begin
  if caller is null then raise exception 'authentication_required'; end if;
  select j.* into journey from public.journeys j where j.id=target_journey for update;
  if journey.id is null or journey.status<>'DRAFT' or not public.is_family_parent(journey.family_id) then raise exception 'not_allowed'; end if;
  if goal_value is not null and goal_value<0 then raise exception 'invalid_goal_value'; end if;
  if duration_months is null or duration_months<1 or duration_months>36 then raise exception 'invalid_duration'; end if;
  if not exists(select 1 from public.conquests c where c.id=journey.conquest_id and c.family_id=journey.family_id and c.youth_id=journey.youth_id)
  then raise exception 'invalid_journey_scope'; end if;
  update public.conquests
     set confirmed_goal_value=goal_value,
         reward_agreement=nullif(btrim(reward_text),''),
         desired_date=current_date+make_interval(months=>duration_months)
   where id=journey.conquest_id;
  update public.journeys set agreed_duration_months=duration_months,updated_at=now() where id=journey.id;
  return public.approve_journey(journey.id);
end $$;

-- Reassert the legitimate archive transition under the new table grants.
create or replace function public.archive_journey(target_journey uuid, archive_reason text default null) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare caller uuid:=auth.uid(); journey public.journeys; approved_count integer; earned integer; safe_reason text; conquest_progress numeric;
begin
  if caller is null then raise exception 'authentication_required'; end if;
  select j.* into journey from public.journeys j where j.id=target_journey for update;
  if journey.id is null or not (public.is_family_parent(journey.family_id) or journey.youth_id=caller or public.is_admin()) then raise exception 'not_allowed'; end if;
  if not exists(select 1 from public.conquests c where c.id=journey.conquest_id and c.family_id=journey.family_id and c.youth_id=journey.youth_id)
  then raise exception 'invalid_journey_scope'; end if;
  if journey.status in ('COMPLETED','ARCHIVED') then raise exception 'invalid_status'; end if;
  safe_reason:=coalesce(nullif(btrim(archive_reason),''),'Outro motivo');
  select progress into conquest_progress from public.conquests where id=journey.conquest_id;
  select count(*) into approved_count from public.mission_assignments where conquest_id=journey.conquest_id and status='APPROVED';
  select coalesce(sum(amount),0) into earned from public.xp_events where youth_id=journey.youth_id and assignment_id in (select id from public.mission_assignments where conquest_id=journey.conquest_id);
  insert into public.journey_archive_events(journey_id,conquest_id,family_id,youth_id,archived_by,reason,progress_at_archive,approved_missions,earned_xp)
  values(journey.id,journey.conquest_id,journey.family_id,journey.youth_id,caller,safe_reason,conquest_progress,approved_count,earned);
  update public.journeys set status='ARCHIVED',archive_reason=safe_reason,archived_at=now(),updated_at=now() where id=journey.id;
  update public.conquests set status='ARCHIVED',archive_reason=safe_reason,archived_at=now() where id=journey.conquest_id;
  update public.mission_assignments set status='CANCELLED' where conquest_id=journey.conquest_id and status in ('AVAILABLE','STARTED','NEEDS_CHANGES');
  insert into public.analytics_events(family_id,user_id,event_name,properties)
  values(journey.family_id,caller,'journey_archived',jsonb_build_object('journey_id',journey.id,'reason',safe_reason,'progress',conquest_progress));
end $$;

revoke all on function public.create_conquest(text,text,text) from public,anon;
revoke all on function public.save_wishlist_item(text,text,text) from public,anon;
revoke all on function public.remove_wishlist_item(uuid) from public,anon;
revoke all on function public.activate_wishlist_item(uuid) from public,anon;
revoke all on function public.accept_commitment(uuid) from public,anon;
revoke all on function public.approve_journey_with_agreement(uuid,numeric,text,integer) from public,anon;
revoke all on function public.archive_journey(uuid,text) from public,anon;
revoke all on function public.accept_contract(uuid) from public,anon,authenticated;
revoke all on function public.approve_journey(uuid) from public,anon,authenticated;

grant execute on function public.create_conquest(text,text,text) to authenticated,service_role;
grant execute on function public.save_wishlist_item(text,text,text) to authenticated,service_role;
grant execute on function public.remove_wishlist_item(uuid) to authenticated,service_role;
grant execute on function public.activate_wishlist_item(uuid) to authenticated,service_role;
grant execute on function public.accept_commitment(uuid) to authenticated,service_role;
grant execute on function public.approve_journey_with_agreement(uuid,numeric,text,integer) to authenticated,service_role;
grant execute on function public.archive_journey(uuid,text) to authenticated,service_role;
grant execute on function public.accept_contract(uuid) to service_role;
grant execute on function public.approve_journey(uuid) to service_role;
