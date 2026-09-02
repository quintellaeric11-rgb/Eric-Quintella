import fs from'node:fs';
import path from'node:path';
import pg from'pg';
import{loadLocalEnv}from'./env.mjs';

loadLocalEnv();
const requested=process.argv[2];
if(!requested||path.basename(requested)!==requested||!/^\d+_[a-z0-9_]+\.sql$/.test(requested))throw new Error('migration_filename_invalid');
if(!process.env.SUPABASE_DB_URL)throw new Error('SUPABASE_DB_URL_missing');
const migrationPath=path.join('supabase','migrations',requested),sql=fs.readFileSync(migrationPath,'utf8');
const client=new pg.Client({connectionString:process.env.SUPABASE_DB_URL,ssl:{rejectUnauthorized:false}});
await client.connect();
try{
 await client.query('begin');
 const existing=await client.query('select 1 from public.konki_migrations where name=$1',[requested]);
 if(existing.rowCount)throw new Error('migration_already_applied');
 await client.query(sql);
 await client.query('insert into public.konki_migrations(name) values($1)',[requested]);
 await client.query('commit');
 console.log(JSON.stringify({status:'APPLIED',migration:requested}));
}catch(error){await client.query('rollback');throw error}finally{await client.end()}
