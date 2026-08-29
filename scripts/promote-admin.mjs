import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {loadLocalEnv} from './env.mjs';

loadLocalEnv();
const email=process.argv[2];
assert(email,'Uso: pnpm admin:promote email@exemplo.com');
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
let page=1,user;
while(!user){const{data,error}=await admin.auth.admin.listUsers({page,perPage:1000});if(error)throw error;user=data.users.find(x=>x.email?.toLowerCase()===email.toLowerCase());if(user||data.users.length<1000)break;page++}
assert(user,'Usuário não encontrado. Crie a conta primeiro.');
const{error}=await admin.from('admin_users').upsert({profile_id:user.id});if(error)throw error;
const{error:profileError}=await admin.from('profiles').update({role:'ADMIN'}).eq('id',user.id);if(profileError)throw profileError;
console.log('Admin habilitado com sucesso.');
