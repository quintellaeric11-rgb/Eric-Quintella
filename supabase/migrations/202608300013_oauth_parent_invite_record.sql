-- Create the consumable Youth invite in the same transaction as the OAuth family.

create or replace function public.complete_oauth_parent(
  target_profile uuid,
  profile_first_name text,
  target_family_name text default null
) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare existing_family uuid; new_family uuid; generated_invite_code text;
begin
  if target_profile is null or not exists(select 1 from public.profiles where id=target_profile) then raise exception 'invalid_profile'; end if;
  select fm.family_id into existing_family from public.family_members fm where fm.profile_id=target_profile limit 1;
  if existing_family is not null then
    if not exists(select 1 from public.family_members fm where fm.family_id=existing_family and fm.profile_id=target_profile and fm.role='PARENT') then raise exception 'profile_already_linked'; end if;
    select f.invite_code into generated_invite_code from public.families f where f.id=existing_family;
    return jsonb_build_object('familyId',existing_family,'inviteCode',generated_invite_code,'idempotent',true);
  end if;
  update public.profiles p set first_name=nullif(btrim(profile_first_name),''),role='PARENT' where p.id=target_profile;
  loop
    generated_invite_code:=upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
    exit when not exists(select 1 from public.families f where f.invite_code=generated_invite_code);
  end loop;
  insert into public.families(name,invite_code,created_by)
  values(coalesce(nullif(btrim(target_family_name),''),'Família de '||coalesce(nullif(btrim(profile_first_name),''),'Responsável')),generated_invite_code,target_profile)
  returning id into new_family;
  insert into public.family_members(family_id,profile_id,role,relationship) values(new_family,target_profile,'PARENT','Responsável');
  insert into public.parent_profiles(profile_id) values(target_profile) on conflict(profile_id) do nothing;
  insert into public.family_invites(family_id,code,youth_name,youth_age,relationship)
  values(new_family,generated_invite_code,'Jovem',14,'Responsável');
  insert into public.analytics_events(family_id,user_id,event_name,properties)
  values(new_family,target_profile,'oauth_parent_completed','{}'),(new_family,target_profile,'youth_invited','{}');
  return jsonb_build_object('familyId',new_family,'inviteCode',generated_invite_code,'idempotent',false);
end $$;

revoke all on function public.complete_oauth_parent(uuid,text,text) from public,anon,authenticated;
grant execute on function public.complete_oauth_parent(uuid,text,text) to service_role;
