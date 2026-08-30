import pg from 'pg';
import { loadLocalEnv } from './env.mjs';

loadLocalEnv();
if (!process.env.SUPABASE_DB_URL) throw new Error('SUPABASE_DB_URL ausente');

const client = new pg.Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
try {
  await client.query('begin read only');
  const { rows } = await client.query(`
    with mission_totals as (
      select journey_id,
        count(*)::int as journey_mission_count,
        coalesce(sum(progress_percentage), 0)::numeric as journey_mission_progress_sum
      from public.journey_missions
      group by journey_id
    )
    select
      c.id as conquest_id, c.youth_id, c.family_id, c.title, c.status as conquest_status,
      c.created_at, null::timestamptz as updated_at, c.progress as conquest_progress,
      j.id as journey_id, j.status as journey_status,
      coalesce(mt.journey_mission_count, 0) as journey_mission_count,
      coalesce(mt.journey_mission_progress_sum, 0) as journey_mission_progress_sum,
      exists(select 1 from public.conquest_contracts cc where cc.conquest_id=c.id) as contract_exists,
      (select cc.status from public.conquest_contracts cc where cc.conquest_id=c.id limit 1) as contract_status,
      (select count(*)::int from public.mission_assignments ma where ma.conquest_id=c.id) as assignment_count,
      (select count(*)::int from public.progress_events pe where pe.conquest_id=c.id) as progress_event_count,
      (select coalesce(sum(xe.amount),0)::int from public.xp_events xe
        where xe.assignment_id in (select ma.id from public.mission_assignments ma where ma.conquest_id=c.id)) as related_xp,
      (select count(*)::int from public.journey_archive_events ja where ja.conquest_id=c.id) as archive_event_count
    from public.conquests c
    left join public.journeys j on j.conquest_id=c.id
    left join mission_totals mt on mt.journey_id=j.id
    where lower(c.title) in ('uma viagem pra italia','quero comprar um casaco','quero comprar um tenis','quarto')
       or (j.id is not null and coalesce(mt.journey_mission_count,0)>0 and coalesce(mt.journey_mission_progress_sum,0)=0)
    order by c.created_at, j.created_at
  `);
  const { rows: invalidConstraints } = await client.query(`
    select conrelid::regclass::text as table_name, conname, pg_get_constraintdef(oid) as definition
    from pg_constraint
    where connamespace='public'::regnamespace and not convalidated
    order by table_name, conname
  `);
  const { rows: invalidBirthDates } = await client.query(`
    select profile_id, birth_date
    from public.youth_profiles
    where birth_date is not null
      and not (birth_date >= current_date - interval '22 years' and birth_date <= current_date - interval '7 years')
    order by profile_id
  `);
  const { rows: rlsInfrastructure } = await client.query(`
    select p.oid::regprocedure::text as function_name, pg_get_functiondef(p.oid) as definition
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='rls_auto_enable'
  `);
  const { rows: rlsTriggers } = await client.query(`
    select evtname, evtevent, evtenabled, evttags, evtfoid::regprocedure::text as function_name
    from pg_event_trigger where evtname='ensure_rls'
  `);
  const { rows: recoveryEvents } = await client.query(`
    select conquest_id,event_type,previous_status,resulting_status,reason,created_at
    from public.conquest_recovery_events
    where conquest_id in (
      '792c25a3-7d94-4e5f-b83a-a0fb29b236d4',
      '8f89b6ee-fe9b-4b08-aabd-b2f5597335ce',
      '256405a1-1ecb-4d76-813b-ebb25887db58'
    ) order by created_at
  `);
  await client.query('commit');
  console.log(JSON.stringify({ captured_at: new Date().toISOString(), records: rows, not_valid_constraints: invalidConstraints, invalid_birth_dates: invalidBirthDates, rls_infrastructure: rlsInfrastructure, rls_triggers: rlsTriggers, recovery_events: recoveryEvents }, null, 2));
} catch (error) {
  await client.query('rollback');
  throw error;
} finally {
  await client.end();
}
