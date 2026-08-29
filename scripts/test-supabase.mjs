import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {loadLocalEnv} from './env.mjs';

loadLocalEnv();
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service=process.env.SUPABASE_SERVICE_ROLE_KEY;
assert(url&&anon&&service,'Variáveis Supabase ausentes');
const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
const stamp=Date.now().toString(36);
const password=`Konki-${crypto.randomUUID()}-9a!`;
const ids=[];const familyIds=[];
const client=()=>createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
const ok=(result,label)=>{if(result.error)throw new Error(`${label}: ${result.error.message}`);return result.data};
async function user(role,first,email,username){const data=ok(await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{role,first_name:first,username}}),`criar ${role}`).user;ids.push(data.id);return data}
async function sign(email){const c=client();ok(await c.auth.signInWithPassword({email,password}),'login');return c}

try{
  const pa=await user('PARENT','ParentA',`qa-parent-a-${stamp}@konki.test`);
  const ya=await user('YOUTH','YouthA',`qa-youth-a-${stamp}@konki.test`,`qa.a.${stamp}`);
  const pb=await user('PARENT','ParentB',`qa-parent-b-${stamp}@konki.test`);
  const yb=await user('YOUTH','YouthB',`qa-youth-b-${stamp}@konki.test`,`qa.b.${stamp}`);
  const aa=await user('ADMIN','Admin',`qa-admin-${stamp}@konki.test`);
  const fa=ok(await admin.from('families').insert({name:'QA Família A',invite_code:`A${stamp}`.slice(0,12).toUpperCase(),created_by:pa.id}).select().single(),'família A');familyIds.push(fa.id);
  const fb=ok(await admin.from('families').insert({name:'QA Família B',invite_code:`B${stamp}`.slice(0,12).toUpperCase(),created_by:pb.id}).select().single(),'família B');familyIds.push(fb.id);
  ok(await admin.from('family_members').insert([{family_id:fa.id,profile_id:pa.id,role:'PARENT'},{family_id:fa.id,profile_id:ya.id,role:'YOUTH'},{family_id:fb.id,profile_id:pb.id,role:'PARENT'},{family_id:fb.id,profile_id:yb.id,role:'YOUTH'}]),'membros');
  ok(await admin.from('parent_profiles').insert([{profile_id:pa.id},{profile_id:pb.id}]),'parent profiles');
  ok(await admin.from('youth_profiles').insert([{profile_id:ya.id,age:15,interests:['Tecnologia']},{profile_id:yb.id,age:14,interests:['Esportes']}]),'youth profiles');
  ok(await admin.from('admin_users').insert({profile_id:aa.id}),'admin role');
  const parentA=await sign(`qa-parent-a-${stamp}@konki.test`),youthA=await sign(`qa-youth-a-${stamp}@konki.test`),parentB=await sign(`qa-parent-b-${stamp}@konki.test`),adminClient=await sign(`qa-admin-${stamp}@konki.test`);

  const visibleA=ok(await parentA.from('families').select('id'),'RLS família A');
  assert.deepEqual(visibleA.map(x=>x.id),[fa.id]);
  const visibleB=ok(await parentB.from('families').select('id'),'RLS família B');
  assert.deepEqual(visibleB.map(x=>x.id),[fb.id]);
  const adminVisible=ok(await adminClient.from('families').select('id'),'admin acesso');
  assert(adminVisible.some(x=>x.id===fa.id)&&adminVisible.some(x=>x.id===fb.id),'Admin não enxerga métricas globais');

  const conquest=ok(await admin.from('conquests').insert({family_id:fa.id,youth_id:ya.id,title:'Notebook para estudar',category:'COMPRA',status:'ACTIVE'}).select().single(),'conquista');
  const mission=ok(await admin.from('missions').select('*').eq('status','ACTIVE').limit(1).single(),'missão seed');
  const assignment=ok(await admin.from('mission_assignments').insert({family_id:fa.id,youth_id:ya.id,conquest_id:conquest.id,mission_id:mission.id,status:'STARTED'}).select().single(),'atribuição');
  const path=`${fa.id}/${ya.id}/${assignment.id}/evidence.txt`;
  ok(await youthA.storage.from('evidence').upload(path,new Blob(['evidência QA'],{type:'application/pdf'}),{contentType:'application/pdf'}),'upload privado');
  ok(await youthA.from('mission_evidence').insert({assignment_id:assignment.id,family_id:fa.id,youth_id:ya.id,evidence_type:'TEXT',text_content:'Realizei a missão.',file_path:path,reflection_difficult:'Organizar os passos',reflection_different:'Começaria antes'}),'evidência');
  ok(await youthA.rpc('submit_mission',{target_assignment:assignment.id}),'envio');
  const deniedQuery=ok(await parentB.from('mission_evidence').select('id').eq('assignment_id',assignment.id),'isolamento evidência');
  assert.equal(deniedQuery.length,0,'Família B leu evidência da família A');
  const deniedFile=await parentB.storage.from('evidence').download(path);
  assert(deniedFile.error,'Família B baixou arquivo da família A');
  const approved=ok(await parentA.rpc('approve_mission',{target_assignment:assignment.id,review_note:'Evidência confirmada'}),'aprovação');
  assert.equal(approved.xp,mission.xp_reward);
  assert.equal(approved.progress,mission.goal_progress_reward);
  const notification=ok(await youthA.from('notifications').select('*').eq('related_entity_id',assignment.id).single(),'notificação');
  ok(await youthA.rpc('mark_notification_read',{target_notification:notification.id}),'marcar lida');
  const updated=ok(await youthA.from('notifications').select('read_at').eq('id',notification.id).single(),'notificação atualizada');
  assert(updated.read_at,'Notificação não foi marcada como lida');
  console.log('PASS: Auth, RLS entre 2 famílias, Admin, Storage privado, evidência, aprovação, XP, progresso e notificações.');
} finally {
  for(const familyId of familyIds)await admin.from('families').delete().eq('id',familyId);
  for(const id of ids)await admin.auth.admin.deleteUser(id);
}
