create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.push_deliveries (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  event_key text not null,
  delivered_at timestamptz not null default now(),
  unique(profile_id,event_key)
);

create index if not exists push_subscriptions_profile_idx on public.push_subscriptions(profile_id);
alter table public.push_subscriptions enable row level security;
alter table public.push_deliveries enable row level security;

drop policy if exists push_subscriptions_own_read on public.push_subscriptions;
create policy push_subscriptions_own_read on public.push_subscriptions for select to authenticated using(profile_id=auth.uid());
drop policy if exists push_subscriptions_own_delete on public.push_subscriptions;
create policy push_subscriptions_own_delete on public.push_subscriptions for delete to authenticated using(profile_id=auth.uid());

revoke all on public.push_subscriptions,public.push_deliveries from public,anon,authenticated;
grant select,delete on public.push_subscriptions to authenticated;
grant all on public.push_subscriptions,public.push_deliveries to service_role;
