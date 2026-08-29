create table if not exists public.family_invites (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  code text not null unique,
  youth_name text not null,
  youth_age integer not null check (youth_age between 8 and 21),
  relationship text not null,
  claimed_by uuid references public.profiles(id),
  claimed_at timestamptz,
  expires_at timestamptz not null default (now()+interval '30 days'),
  created_at timestamptz not null default now()
);
alter table public.family_invites enable row level security;
create policy invites_parent_read on public.family_invites for select using(public.is_family_parent(family_id) or claimed_by=auth.uid() or public.is_admin());
create policy invites_parent_write on public.family_invites for all using(public.is_family_parent(family_id) or public.is_admin()) with check(public.is_family_parent(family_id) or public.is_admin());

create or replace function public.accept_contract(target_contract uuid) returns text language plpgsql security definer set search_path=public as $$
declare c public.conquest_contracts; next_status text;
begin
  select * into c from public.conquest_contracts where id=target_contract for update;
  if c.id is null or not public.is_family_member(c.family_id) then raise exception 'not_allowed'; end if;
  if auth.uid()=c.parent_id then update public.conquest_contracts set parent_accepted_at=coalesce(parent_accepted_at,now()) where id=c.id;
  elsif auth.uid()=c.youth_id then update public.conquest_contracts set youth_accepted_at=coalesce(youth_accepted_at,now()) where id=c.id;
  else raise exception 'not_allowed'; end if;
  select * into c from public.conquest_contracts where id=target_contract;
  if c.parent_accepted_at is not null and c.youth_accepted_at is not null then
    update public.conquest_contracts set status='ACTIVE' where id=c.id;
    update public.conquests set status='ACTIVE',approved_at=coalesce(approved_at,now()) where id=c.conquest_id;
    next_status:='ACTIVE';
    insert into public.analytics_events(family_id,user_id,event_name,properties) values(c.family_id,auth.uid(),'contract_activated',jsonb_build_object('contract_id',c.id));
  else next_status:='PENDING'; end if;
  return next_status;
end $$;

create or replace function public.mark_notification_read(target_notification uuid) returns void language sql security definer set search_path=public as $$
update public.notifications set read_at=coalesce(read_at,now()) where id=target_notification and recipient_id=auth.uid()
$$;
