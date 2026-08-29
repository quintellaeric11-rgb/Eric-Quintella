import fs from 'node:fs';import pg from 'pg';import{loadLocalEnv}from'./env.mjs';
loadLocalEnv();
if(!process.env.SUPABASE_DB_URL)throw new Error('SUPABASE_DB_URL ausente');
const client=new pg.Client({connectionString:process.env.SUPABASE_DB_URL,ssl:{rejectUnauthorized:false}});
await client.connect();
try{
  await client.query('create table if not exists public.konki_migrations (name text primary key, applied_at timestamptz not null default now())');
  const migrations=fs.readdirSync('supabase/migrations').filter(x=>x.endsWith('.sql')).sort();
  for(const name of migrations){const done=await client.query('select 1 from public.konki_migrations where name=$1',[name]);if(done.rowCount)continue;const sql=fs.readFileSync(`supabase/migrations/${name}`,'utf8');await client.query('begin');try{await client.query(sql);await client.query('insert into public.konki_migrations(name) values($1)',[name]);await client.query('commit')}catch(error){await client.query('rollback');throw error}}
  await client.query(fs.readFileSync('supabase/seed.sql','utf8'));
  const result=await client.query('select count(*)::int as count from public.missions');
  console.log(`Migrations aplicadas. Missões ativas: ${result.rows[0].count}`);
}finally{await client.end()}
