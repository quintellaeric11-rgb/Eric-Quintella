-- Secure invite links reuse the atomic Wave 2 invitation lifecycle.

alter table public.family_invites add column if not exists link_token uuid;
update public.family_invites set link_token=gen_random_uuid() where link_token is null;
alter table public.family_invites alter column link_token set default gen_random_uuid();
alter table public.family_invites alter column link_token set not null;
create unique index if not exists family_invites_link_token_key on public.family_invites(link_token);

create or replace function public.resolve_family_invite_link(invite_token uuid) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare invite public.family_invites; family_name text; parent_name text;
begin
  select i.* into invite from public.family_invites i where i.link_token=invite_token;
  if invite.id is null then raise exception 'invite_invalid'; end if;
  if invite.claimed_at is not null then raise exception 'invite_used'; end if;
  if invite.expires_at<=now() then raise exception 'invite_expired'; end if;
  select f.name,p.first_name into family_name,parent_name
  from public.families f
  left join public.profiles p on p.id=f.created_by
  where f.id=invite.family_id;
  return jsonb_build_object('familyName',family_name,'parentName',parent_name,'expiresAt',invite.expires_at);
end $$;

create or replace function public.reserve_youth_invite_link(invite_token uuid) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare token uuid:=gen_random_uuid(); invite public.family_invites;
begin
  update public.family_invites
  set reservation_token=token,reserved_at=now(),reservation_expires_at=now()+interval '10 minutes'
  where link_token=invite_token and claimed_at is null and expires_at>now()
    and (reservation_token is null or reservation_expires_at<=now())
  returning * into invite;
  if invite.id is null then raise exception 'invite_unavailable'; end if;
  return jsonb_build_object('reservationToken',token,'familyId',invite.family_id,'relationship',invite.relationship,'youthAge',invite.youth_age);
end $$;

revoke all on function public.resolve_family_invite_link(uuid) from public;
grant execute on function public.resolve_family_invite_link(uuid) to anon,authenticated,service_role;
revoke all on function public.reserve_youth_invite_link(uuid) from public,anon,authenticated;
grant execute on function public.reserve_youth_invite_link(uuid) to service_role;
