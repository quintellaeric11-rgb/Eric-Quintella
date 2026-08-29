alter table public.conquests
  add column if not exists estimated_duration_months integer,
  add column if not exists recommended_mission_count integer,
  add column if not exists cadence_label text;

alter table public.missions add column if not exists family_id uuid references public.families(id) on delete cascade;

create table if not exists public.journeys (
  id uuid primary key default gen_random_uuid(),
  conquest_id uuid not null unique references public.conquests(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  youth_id uuid not null references public.profiles(id),
  status text not null default 'DRAFT' check (status in ('DRAFT','APPROVED','ACTIVE','COMPLETED','ARCHIVED')),
  estimated_duration_months integer not null check (estimated_duration_months > 0),
  recommended_mission_count integer not null check (recommended_mission_count between 1 and 30),
  cadence_label text not null,
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.journey_missions (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.journeys(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  source_mission_id uuid references public.missions(id),
  title text not null,
  description text not null,
  instructions text not null,
  category text not null,
  skills text[] not null default '{}',
  estimated_minutes integer not null check (estimated_minutes > 0),
  xp_reward integer not null check (xp_reward between 25 and 1000),
  goal_progress_reward integer not null default 1 check (goal_progress_reward between 0 and 100),
  evidence_types text[] not null default '{TEXT}',
  phase integer not null default 1 check (phase between 1 and 4),
  mission_order integer not null,
  recommendation_score integer not null default 0,
  recommendation_reasons text[] not null default '{}',
  is_custom boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(journey_id,mission_order)
);

create index if not exists journeys_family_status_idx on public.journeys(family_id,status);
create index if not exists journey_missions_order_idx on public.journey_missions(journey_id,mission_order);

alter table public.journeys enable row level security;
alter table public.journey_missions enable row level security;

create policy journeys_parent_read on public.journeys for select using(public.is_family_parent(family_id) or (youth_id=auth.uid() and status<>'DRAFT') or public.is_admin());
create policy journeys_parent_write on public.journeys for all using(public.is_family_parent(family_id) or public.is_admin()) with check(public.is_family_parent(family_id) or public.is_admin());
create policy journey_missions_parent_read on public.journey_missions for select using(public.is_family_parent(family_id) or public.is_admin() or exists(select 1 from public.journeys j where j.id=journey_id and j.youth_id=auth.uid() and j.status in ('APPROVED','ACTIVE','COMPLETED')));
create policy journey_missions_parent_write on public.journey_missions for all using(public.is_family_parent(family_id) or public.is_admin()) with check(public.is_family_parent(family_id) or public.is_admin());

drop policy if exists missions_authenticated_read on public.missions;
create policy missions_authenticated_read on public.missions for select to authenticated using(status='ACTIVE' and (family_id is null or public.is_family_member(family_id)) or public.is_admin());

create or replace function public.approve_journey(target_journey uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare j public.journeys; c public.conquests; jm public.journey_missions; mid uuid; parent_id uuid; total integer;
begin
  select * into j from public.journeys where id=target_journey for update;
  if j.id is null or not public.is_family_parent(j.family_id) then raise exception 'not_allowed'; end if;
  if j.status <> 'DRAFT' then raise exception 'invalid_status'; end if;
  select count(*) into total from public.journey_missions where journey_id=j.id;
  if total < 1 then raise exception 'empty_journey'; end if;
  select * into c from public.conquests where id=j.conquest_id;
  select profile_id into parent_id from public.family_members where family_id=j.family_id and role='PARENT' order by joined_at limit 1;
  for jm in select * from public.journey_missions where journey_id=j.id order by mission_order loop
    mid:=jm.source_mission_id;
    if mid is null or jm.is_custom then
      insert into public.missions(slug,title,description,category,skills,interests,goal_categories,recommended_age_min,recommended_age_max,difficulty,estimated_minutes,xp_reward,goal_progress_reward,evidence_types,lesson_title,lesson_content,status,family_id)
      values('family-'||j.family_id||'-'||jm.id,jm.title,jm.description,jm.category,jm.skills,'{}',array[c.category],8,21,'MEDIUM',jm.estimated_minutes,jm.xp_reward,jm.goal_progress_reward,jm.evidence_types,'Antes de começar',jsonb_build_object('passo',jm.instructions),'ACTIVE',j.family_id)
      returning id into mid;
    end if;
    insert into public.mission_assignments(family_id,youth_id,conquest_id,mission_id,assigned_by,recommendation_score,recommendation_reasons,status)
    values(j.family_id,j.youth_id,j.conquest_id,mid,auth.uid(),jm.recommendation_score,jm.recommendation_reasons,'AVAILABLE')
    on conflict(youth_id,conquest_id,mission_id) do nothing;
  end loop;
  update public.journeys set status='ACTIVE',approved_by=auth.uid(),approved_at=now(),updated_at=now() where id=j.id;
  update public.conquests set status='ACTIVE',approved_at=now(),estimated_duration_months=j.estimated_duration_months,recommended_mission_count=total,cadence_label=j.cadence_label where id=j.conquest_id;
  insert into public.conquest_contracts(conquest_id,family_id,parent_id,youth_id,estimated_missions,conditions,parent_accepted_at,youth_accepted_at,status)
  values(j.conquest_id,j.family_id,parent_id,j.youth_id,total,'Concluir a jornada aprovada e apresentar evidências.',now(),now(),'ACTIVE')
  on conflict(conquest_id) do update set estimated_missions=excluded.estimated_missions,conditions=excluded.conditions,parent_accepted_at=now(),youth_accepted_at=now(),status='ACTIVE';
  insert into public.notifications(recipient_id,family_id,type,title,message,related_entity_id,deep_link)
  values(j.youth_id,j.family_id,'JOURNEY_APPROVED','Sua jornada está pronta.','As primeiras missões já estão disponíveis.',j.id,'/?view=missions');
  insert into public.analytics_events(family_id,user_id,event_name,properties) values(j.family_id,auth.uid(),'journey_approved',jsonb_build_object('journey_id',j.id,'mission_count',total));
  return jsonb_build_object('status','ACTIVE','mission_count',total);
end $$;

create or replace function public.start_mission(target_assignment uuid) returns void language plpgsql security definer set search_path=public as $$
begin
  update public.mission_assignments set status='STARTED',started_at=coalesce(started_at,now())
  where id=target_assignment and youth_id=auth.uid() and status in ('AVAILABLE','NEEDS_CHANGES');
  if not found then raise exception 'not_allowed'; end if;
end $$;

create or replace function public.submit_mission(target_assignment uuid) returns void language plpgsql security definer set search_path=public as $$
begin
  update public.mission_assignments set status='SUBMITTED',submitted_at=now()
  where id=target_assignment and youth_id=auth.uid() and status in ('STARTED','NEEDS_CHANGES');
  if not found then raise exception 'not_allowed'; end if;
end $$;

revoke update on public.mission_assignments from authenticated;

grant all on public.journeys, public.journey_missions to service_role;
grant select,insert,update,delete on public.journeys, public.journey_missions to authenticated;
grant execute on function public.approve_journey(uuid) to authenticated,service_role;
grant execute on function public.start_mission(uuid) to authenticated,service_role;
grant execute on function public.submit_mission(uuid) to authenticated,service_role;
