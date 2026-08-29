create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('PARENT','YOUTH','ADMIN')),
  first_name text not null,
  last_name text,
  username text unique,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.family_members (
  family_id uuid not null references public.families(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('PARENT','YOUTH')),
  relationship text,
  joined_at timestamptz not null default now(),
  primary key (family_id, profile_id)
);

create table if not exists public.parent_profiles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  development_goals text[] not null default '{}',
  current_challenges text[] not null default '{}',
  challenge_other text,
  autonomy_level text check (autonomy_level in ('GUIDED','BALANCED','INDEPENDENT')),
  weekly_time_minutes integer,
  success_definition text,
  onboarding_completed_at timestamptz
);

create table if not exists public.youth_profiles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  age integer check (age between 8 and 21),
  interests text[] not null default '{}',
  strengths text[] not null default '{}',
  dislikes text[] not null default '{}',
  total_xp integer not null default 0 check (total_xp >= 0),
  streak_weeks integer not null default 0 check (streak_weeks >= 0),
  onboarding_completed_at timestamptz
);

create table if not exists public.conquests (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  youth_id uuid not null references public.profiles(id),
  title text not null,
  category text not null,
  approximate_value numeric(12,2),
  desired_date date,
  reason text,
  image_path text,
  status text not null default 'PENDING' check (status in ('PENDING','CHANGES_REQUESTED','APPROVED','ACTIVE','COMPLETED','ARCHIVED')),
  progress integer not null default 0 check (progress between 0 and 100),
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create unique index if not exists conquests_one_active_per_youth on public.conquests(youth_id)
  where status in ('PENDING','APPROVED','ACTIVE','CHANGES_REQUESTED');

create table if not exists public.conquest_contracts (
  id uuid primary key default gen_random_uuid(),
  conquest_id uuid not null unique references public.conquests(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  parent_id uuid not null references public.profiles(id),
  youth_id uuid not null references public.profiles(id),
  estimated_missions integer not null default 12,
  conditions text,
  parent_accepted_at timestamptz,
  youth_accepted_at timestamptz,
  status text not null default 'PENDING' check (status in ('PENDING','ACTIVE','COMPLETED','CANCELLED')),
  created_at timestamptz not null default now()
);

create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  category text not null,
  skills text[] not null default '{}',
  interests text[] not null default '{}',
  goal_categories text[] not null default '{}',
  recommended_age_min integer not null default 10,
  recommended_age_max integer not null default 18,
  difficulty text not null check (difficulty in ('EASY','MEDIUM','HARD')),
  estimated_minutes integer not null,
  xp_reward integer not null,
  goal_progress_reward integer not null check (goal_progress_reward between 0 and 100),
  evidence_types text[] not null default '{TEXT}',
  lesson_title text not null,
  lesson_content jsonb not null default '{}'::jsonb,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','INACTIVE')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mission_assignments (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  youth_id uuid not null references public.profiles(id),
  conquest_id uuid not null references public.conquests(id) on delete cascade,
  mission_id uuid not null references public.missions(id),
  assigned_by uuid references public.profiles(id),
  recommendation_score integer not null default 0,
  recommendation_reasons text[] not null default '{}',
  status text not null default 'AVAILABLE' check (status in ('AVAILABLE','STARTED','SUBMITTED','APPROVED','NEEDS_CHANGES','CANCELLED')),
  started_at timestamptz,
  submitted_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (youth_id, conquest_id, mission_id)
);

create table if not exists public.mission_evidence (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.mission_assignments(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  youth_id uuid not null references public.profiles(id),
  evidence_type text not null check (evidence_type in ('TEXT','IMAGE','AUDIO','LINK')),
  text_content text,
  file_path text,
  link_url text,
  reflection_difficult text,
  reflection_different text,
  created_at timestamptz not null default now()
);

create table if not exists public.mission_reviews (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.mission_assignments(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id),
  decision text not null check (decision in ('APPROVED','NEEDS_CHANGES')),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.xp_events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  youth_id uuid not null references public.profiles(id),
  assignment_id uuid references public.mission_assignments(id),
  amount integer not null,
  reason text not null,
  created_at timestamptz not null default now(),
  unique (assignment_id, reason)
);

create table if not exists public.progress_events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  conquest_id uuid not null references public.conquests(id) on delete cascade,
  assignment_id uuid references public.mission_assignments(id),
  amount integer not null,
  reason text not null,
  created_at timestamptz not null default now(),
  unique (assignment_id, reason)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  related_entity_id uuid,
  deep_link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_preferences (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  push_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.weekly_parent_feedback (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  parent_id uuid not null references public.profiles(id),
  youth_id uuid not null references public.profiles(id),
  perceived_change text not null,
  observation text,
  independent_return text,
  week_start date not null,
  created_at timestamptz not null default now(),
  unique (family_id, week_start)
);

create table if not exists public.youth_feedback (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  youth_id uuid not null references public.profiles(id),
  assignment_id uuid references public.mission_assignments(id),
  rating text not null,
  would_repeat text,
  created_at timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists family_members_profile_idx on public.family_members(profile_id);
create index if not exists assignments_youth_status_idx on public.mission_assignments(youth_id,status);
create index if not exists notifications_recipient_idx on public.notifications(recipient_id,read_at,created_at desc);
create index if not exists analytics_event_idx on public.analytics_events(event_name,created_at desc);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,role,first_name,last_name,username)
  values(new.id,coalesce(new.raw_user_meta_data->>'role','PARENT'),coalesce(new.raw_user_meta_data->>'first_name','Pessoa'),new.raw_user_meta_data->>'last_name',nullif(lower(new.raw_user_meta_data->>'username'),''));
  insert into public.notification_preferences(profile_id) values(new.id) on conflict do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.current_profile_id() returns uuid language sql stable as $$ select auth.uid() $$;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.admin_users where profile_id=auth.uid()) $$;
create or replace function public.is_family_member(target_family uuid) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.family_members where family_id=target_family and profile_id=auth.uid()) $$;
create or replace function public.is_family_parent(target_family uuid) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.family_members where family_id=target_family and profile_id=auth.uid() and role='PARENT') $$;

create or replace function public.approve_mission(target_assignment uuid, review_note text default null) returns jsonb language plpgsql security definer set search_path=public as $$
declare a public.mission_assignments; m public.missions; c public.conquests; new_progress integer; new_xp integer;
begin
  select * into a from public.mission_assignments where id=target_assignment for update;
  if a.id is null or not public.is_family_parent(a.family_id) then raise exception 'not_allowed'; end if;
  if a.status <> 'SUBMITTED' then raise exception 'invalid_status'; end if;
  select * into m from public.missions where id=a.mission_id;
  update public.mission_assignments set status='APPROVED',approved_at=now() where id=a.id;
  insert into public.mission_reviews(assignment_id,family_id,reviewer_id,decision,note) values(a.id,a.family_id,auth.uid(),'APPROVED',review_note);
  insert into public.xp_events(family_id,youth_id,assignment_id,amount,reason) values(a.family_id,a.youth_id,a.id,m.xp_reward,'MISSION_APPROVED') on conflict do nothing;
  insert into public.progress_events(family_id,conquest_id,assignment_id,amount,reason) values(a.family_id,a.conquest_id,a.id,m.goal_progress_reward,'MISSION_APPROVED') on conflict do nothing;
  update public.youth_profiles set total_xp=total_xp+m.xp_reward where profile_id=a.youth_id returning total_xp into new_xp;
  update public.conquests set progress=least(100,progress+m.goal_progress_reward) where id=a.conquest_id returning progress into new_progress;
  insert into public.notifications(recipient_id,family_id,type,title,message,related_entity_id,deep_link) values(a.youth_id,a.family_id,'MISSION_APPROVED','Boa. Mais perto.','+'||m.xp_reward||' XP. Sua missão foi aprovada.',a.id,'/app?view=home');
  insert into public.analytics_events(family_id,user_id,event_name,properties) values(a.family_id,auth.uid(),'mission_approved',jsonb_build_object('assignment_id',a.id));
  return jsonb_build_object('xp',new_xp,'progress',new_progress,'xp_reward',m.xp_reward,'progress_reward',m.goal_progress_reward);
end $$;

create or replace function public.request_mission_changes(target_assignment uuid, review_note text) returns void language plpgsql security definer set search_path=public as $$
declare a public.mission_assignments;
begin
  select * into a from public.mission_assignments where id=target_assignment for update;
  if a.id is null or not public.is_family_parent(a.family_id) then raise exception 'not_allowed'; end if;
  update public.mission_assignments set status='NEEDS_CHANGES' where id=a.id;
  insert into public.mission_reviews(assignment_id,family_id,reviewer_id,decision,note) values(a.id,a.family_id,auth.uid(),'NEEDS_CHANGES',review_note);
  insert into public.notifications(recipient_id,family_id,type,title,message,related_entity_id,deep_link) values(a.youth_id,a.family_id,'MISSION_NEEDS_CHANGES','Falta um ajuste.','Veja o pedido do seu responsável e complete a evidência.',a.id,'/app?view=mission');
end $$;

alter table public.profiles enable row level security;
alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.parent_profiles enable row level security;
alter table public.youth_profiles enable row level security;
alter table public.conquests enable row level security;
alter table public.conquest_contracts enable row level security;
alter table public.missions enable row level security;
alter table public.mission_assignments enable row level security;
alter table public.mission_evidence enable row level security;
alter table public.mission_reviews enable row level security;
alter table public.xp_events enable row level security;
alter table public.progress_events enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.weekly_parent_feedback enable row level security;
alter table public.youth_feedback enable row level security;
alter table public.analytics_events enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists profiles_family_read on public.profiles;
create policy profiles_family_read on public.profiles for select using(id=auth.uid() or public.is_admin() or exists(select 1 from public.family_members mine join public.family_members theirs using(family_id) where mine.profile_id=auth.uid() and theirs.profile_id=profiles.id));
create policy profiles_self_update on public.profiles for update using(id=auth.uid()) with check(id=auth.uid());
create policy families_members_read on public.families for select using(public.is_family_member(id) or public.is_admin());
create policy families_parent_insert on public.families for insert with check(created_by=auth.uid());
create policy families_parent_update on public.families for update using(public.is_family_parent(id) or public.is_admin());
create policy members_family_read on public.family_members for select using(public.is_family_member(family_id) or public.is_admin());
create policy members_parent_write on public.family_members for all using(public.is_family_parent(family_id) or public.is_admin()) with check(public.is_family_parent(family_id) or profile_id=auth.uid() or public.is_admin());
create policy parent_profiles_family_read on public.parent_profiles for select using(profile_id=auth.uid() or public.is_admin() or exists(select 1 from public.family_members fm where fm.profile_id=parent_profiles.profile_id and public.is_family_member(fm.family_id)));
create policy parent_profiles_self_write on public.parent_profiles for all using(profile_id=auth.uid()) with check(profile_id=auth.uid());
create policy youth_profiles_family_read on public.youth_profiles for select using(profile_id=auth.uid() or public.is_admin() or exists(select 1 from public.family_members fm where fm.profile_id=youth_profiles.profile_id and public.is_family_member(fm.family_id)));
create policy youth_profiles_self_write on public.youth_profiles for all using(profile_id=auth.uid()) with check(profile_id=auth.uid());
create policy youth_profiles_parent_update on public.youth_profiles for update using(exists(select 1 from public.family_members fm where fm.profile_id=youth_profiles.profile_id and public.is_family_parent(fm.family_id)));
create policy conquests_family_read on public.conquests for select using(public.is_family_member(family_id) or public.is_admin());
create policy conquests_youth_insert on public.conquests for insert with check(youth_id=auth.uid() and public.is_family_member(family_id));
create policy conquests_family_update on public.conquests for update using((youth_id=auth.uid() or public.is_family_parent(family_id) or public.is_admin()));
create policy contracts_family_read on public.conquest_contracts for select using(public.is_family_member(family_id) or public.is_admin());
create policy contracts_family_write on public.conquest_contracts for all using(public.is_family_member(family_id) or public.is_admin()) with check(public.is_family_member(family_id) or public.is_admin());
create policy missions_authenticated_read on public.missions for select to authenticated using(status='ACTIVE' or public.is_admin());
create policy missions_admin_write on public.missions for all using(public.is_admin()) with check(public.is_admin());
create policy assignments_family_read on public.mission_assignments for select using(public.is_family_member(family_id) or public.is_admin());
create policy assignments_youth_update on public.mission_assignments for update using(youth_id=auth.uid() or public.is_family_parent(family_id) or public.is_admin());
create policy assignments_parent_insert on public.mission_assignments for insert with check(public.is_family_parent(family_id) or youth_id=auth.uid() or public.is_admin());
create policy evidence_family_read on public.mission_evidence for select using(public.is_family_member(family_id) or public.is_admin());
create policy evidence_youth_write on public.mission_evidence for all using(youth_id=auth.uid() or public.is_admin()) with check(youth_id=auth.uid() or public.is_admin());
create policy reviews_family_read on public.mission_reviews for select using(public.is_family_member(family_id) or public.is_admin());
create policy reviews_parent_write on public.mission_reviews for insert with check(public.is_family_parent(family_id) or public.is_admin());
create policy xp_family_read on public.xp_events for select using(public.is_family_member(family_id) or public.is_admin());
create policy progress_family_read on public.progress_events for select using(public.is_family_member(family_id) or public.is_admin());
create policy notifications_own on public.notifications for select using(recipient_id=auth.uid() or public.is_admin());
create policy notifications_own_update on public.notifications for update using(recipient_id=auth.uid());
create policy notifications_family_insert on public.notifications for insert with check(public.is_family_member(family_id) or public.is_admin());
create policy preferences_own on public.notification_preferences for all using(profile_id=auth.uid()) with check(profile_id=auth.uid());
create policy feedback_family on public.weekly_parent_feedback for select using(public.is_family_member(family_id) or public.is_admin());
create policy feedback_parent_write on public.weekly_parent_feedback for insert with check(parent_id=auth.uid() and public.is_family_parent(family_id));
create policy youth_feedback_family on public.youth_feedback for select using(public.is_family_member(family_id) or public.is_admin());
create policy youth_feedback_own_write on public.youth_feedback for insert with check(youth_id=auth.uid());
create policy analytics_own_insert on public.analytics_events for insert with check(user_id=auth.uid() or user_id is null);
create policy analytics_admin_read on public.analytics_events for select using(public.is_admin());
create policy admins_self_read on public.admin_users for select using(profile_id=auth.uid());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('evidence','evidence',false,10485760,array['image/jpeg','image/png','image/webp','audio/mpeg','audio/mp4','audio/webm','application/pdf'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists evidence_storage_read on storage.objects;
create policy evidence_storage_read on storage.objects for select to authenticated using(bucket_id='evidence' and (public.is_admin() or public.is_family_member((storage.foldername(name))[1]::uuid)));
drop policy if exists evidence_storage_insert on storage.objects;
create policy evidence_storage_insert on storage.objects for insert to authenticated with check(bucket_id='evidence' and auth.uid()::text=(storage.foldername(name))[2] and public.is_family_member((storage.foldername(name))[1]::uuid));
drop policy if exists evidence_storage_update on storage.objects;
create policy evidence_storage_update on storage.objects for update to authenticated using(bucket_id='evidence' and auth.uid()::text=(storage.foldername(name))[2]);
drop policy if exists evidence_storage_delete on storage.objects;
create policy evidence_storage_delete on storage.objects for delete to authenticated using(bucket_id='evidence' and auth.uid()::text=(storage.foldername(name))[2]);
