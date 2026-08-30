import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {loadLocalEnv} from './env.mjs';

loadLocalEnv();
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,service=process.env.SUPABASE_SERVICE_ROLE_KEY;
assert(url&&anon&&service,'Variáveis Supabase ausentes');
const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}}),password=`Konki-${crypto.randomUUID()}-9a!`,stamp=Date.now().toString(36),users=[],families=[];
const ok=(result,label)=>{if(result.error)throw new Error(`${label}: ${result.error.message}`);return result.data};
async function account(role,label){const email=`flow-${label}-${stamp}@konki.test`,user=ok(await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{role,first_name:label,username:role==='YOUTH'?`${label}.${stamp}`:undefined}}),`criar ${label}`).user;users.push(user.id);const client=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});ok(await client.auth.signInWithPassword({email,password}),`login ${label}`);return{email,user,client}}

async function scenario(label,count){
  const parent=await account('PARENT',`parent-${label}`),youth=await account('YOUTH',`youth-${label}`);
  const family=ok(await admin.from('families').insert({name:`Flow ${label}`,invite_code:`${label[0]}${stamp}`.slice(0,12).toUpperCase(),created_by:parent.user.id}).select().single(),`família ${label}`);families.push(family.id);
  ok(await admin.from('family_members').insert([{family_id:family.id,profile_id:parent.user.id,role:'PARENT'},{family_id:family.id,profile_id:youth.user.id,role:'YOUTH'}]),'membros');
  ok(await admin.from('parent_profiles').insert({profile_id:parent.user.id}),'parent profile');ok(await admin.from('youth_profiles').insert({profile_id:youth.user.id,age:14,total_xp:0}),'youth profile');
  const conquestId=ok(await youth.client.rpc('create_conquest',{conquest_title:`Objetivo ${label}`,conquest_category:'OTHER',conquest_reason:'Testar sequência'}),'conquista');
  const journey=ok(await admin.from('journeys').insert({conquest_id:conquestId,family_id:family.id,youth_id:youth.user.id,status:'DRAFT',estimated_duration_months:3,recommended_mission_count:count,cadence_label:'Semanal'}).select().single(),'jornada');
  const rows=Array.from({length:count},(_,index)=>({journey_id:journey.id,family_id:family.id,title:`Etapa ${index+1}`,description:`Descrição ${index+1}`,instructions:`Faça a etapa ${index+1}`,category:'DEVELOPMENT_CONTEXTUALIZED',skills:['organization'],estimated_minutes:15,xp_reward:100,goal_progress_reward:1,evidence_types:['TEXT'],phase:Math.min(4,Math.floor(index/(count/4))+1),mission_order:index+1,recommendation_score:100-index*7,recommendation_reasons:['Ordem pedagógica'],why_this_mission:`A etapa ${index+1} prepara o conhecimento necessário para a próxima decisão da jornada.`,effort_weight:1,is_custom:true,contextualized_steps:[`Faça ${index+1}`],contextualized_evidence_request:'Envie o resultado.',pedagogical_age_band:'14',technique_explanation:'Compare e justifique.',contextualized_example:'Use uma tabela.',autonomy_guidance:'Conduza a atividade.',parent_support_guidance:'O Parent revisa.',reflection_depth:'Justifique.',evidence_checklist:['Resultado']}));
  ok(await admin.from('journey_missions').insert(rows),'plano');
  const planned=ok(await parent.client.from('journey_missions').select('mission_order,progress_percentage').eq('journey_id',journey.id).order('mission_order'),'plano Parent');assert.equal(planned.length,count);assert.equal(Number(planned.reduce((sum,row)=>sum+Number(row.progress_percentage),0).toFixed(4)),100);
  ok(await parent.client.rpc('approve_journey_with_agreement',{target_journey:journey.id,goal_value:null,reward_text:'Concluir em ordem.',duration_months:3}),'aprovar plano');
  let assignments=ok(await youth.client.from('mission_assignments').select('id,status,mission_order,recommendation_score').eq('journey_id',journey.id).order('mission_order'),'ordem Youth');
  assert.deepEqual(assignments.map(x=>x.mission_order),Array.from({length:count},(_,i)=>i+1));assert.equal(assignments[0].status,'AVAILABLE');assert(assignments.slice(1).every(x=>x.status==='LOCKED'));
  assert(assignments[0].recommendation_score>assignments.at(-1).recommendation_score,'fixture deve ter scores distintos');
  const parentPlan=ok(await parent.client.from('mission_assignments').select('id,status,mission_order').eq('journey_id',journey.id).order('mission_order'),'plano completo Parent');assert.equal(parentPlan.length,count);
  const contract=ok(await parent.client.from('conquest_contracts').select('id').eq('conquest_id',conquestId).single(),'contrato');assert.equal(ok(await parent.client.rpc('accept_commitment',{target_contract:contract.id}),'aceite Parent'),'PENDING');assert.equal(ok(await youth.client.rpc('accept_commitment',{target_contract:contract.id}),'aceite Youth'),'ACTIVE');
  const future=await youth.client.rpc('start_mission',{target_assignment:assignments.at(-1).id});assert(future.error,'Youth iniciou missão futura');
  ok(await youth.client.rpc('start_mission',{target_assignment:assignments[0].id}),'iniciar primeira');
  ok(await youth.client.from('mission_evidence').insert({assignment_id:assignments[0].id,family_id:family.id,youth_id:youth.user.id,evidence_type:'TEXT',text_content:'Etapa concluída.',reflection_difficult:'Organizar',reflection_different:'Planejar antes'}),'evidência');
  ok(await youth.client.rpc('submit_mission',{target_assignment:assignments[0].id}),'enviar primeira');ok(await parent.client.rpc('approve_mission',{target_assignment:assignments[0].id,review_note:'Aprovada'}),'aprovar primeira');
  assignments=ok(await youth.client.from('mission_assignments').select('id,status,mission_order').eq('journey_id',journey.id).order('mission_order'),'desbloqueio');assert.equal(assignments[0].status,'APPROVED');assert.equal(assignments[1].status,'AVAILABLE');assert(assignments.slice(2).every(x=>x.status==='LOCKED'));
  const secondDevice=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});ok(await secondDevice.auth.signInWithPassword({email:youth.email,password}),'login segundo dispositivo');const persisted=ok(await secondDevice.from('mission_assignments').select('status,mission_order').eq('journey_id',journey.id).order('mission_order'),'ordem persistida');assert.deepEqual(persisted,assignments.map(({status,mission_order})=>({status,mission_order})));
  return{label,count,initial:'1 AVAILABLE',after_approval:'2 AVAILABLE',progress_total:100};
}

try{const results=[await scenario('curta',3),await scenario('longa',12)];console.log(JSON.stringify(results,null,2));console.log('PASS FLOW-001: jornadas curta e longa, ordem persistida, bloqueio futuro, desbloqueio unitário e visão Parent completa.')}finally{for(const family of families)await admin.from('families').delete().eq('id',family);for(const user of users)await admin.auth.admin.deleteUser(user)}
