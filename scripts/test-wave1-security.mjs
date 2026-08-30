import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {loadLocalEnv} from './env.mjs';

loadLocalEnv();
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,service=process.env.SUPABASE_SERVICE_ROLE_KEY;
assert(url&&anon&&service,'Variáveis Supabase ausentes');
const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
const password=`Konki-${crypto.randomUUID()}-9a!`,stamp=Date.now().toString(36),users=[],families=[];
const ok=(r,label)=>{if(r.error)throw new Error(`${label}: ${r.error.message}`);return r.data};
async function make(role,name){const email=`wave1-${name}-${stamp}@konki.test`;const user=ok(await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{role,first_name:name,username:role==='YOUTH'?`${name}.${stamp}`:undefined}}),`criar ${name}`).user;users.push(user.id);const client=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});ok(await client.auth.signInWithPassword({email,password}),`login ${name}`);return{user,client}}
async function denied(promise,label){const result=await promise;assert(result.error,`${label}: operação deveria ser negada`);return result.error}

try{
  const parentA=await make('PARENT','parent-a'),youthA=await make('YOUTH','youth-a');
  const parentB=await make('PARENT','parent-b'),youthB=await make('YOUTH','youth-b');
  const familyA=ok(await admin.from('families').insert({name:'Wave 1 A',invite_code:`A${stamp}`.slice(0,12).toUpperCase(),created_by:parentA.user.id}).select().single(),'família A');families.push(familyA.id);
  const familyB=ok(await admin.from('families').insert({name:'Wave 1 B',invite_code:`B${stamp}`.slice(0,12).toUpperCase(),created_by:parentB.user.id}).select().single(),'família B');families.push(familyB.id);
  ok(await admin.from('family_members').insert([
    {family_id:familyA.id,profile_id:parentA.user.id,role:'PARENT'},
    {family_id:familyA.id,profile_id:youthA.user.id,role:'YOUTH'},
    {family_id:familyB.id,profile_id:parentB.user.id,role:'PARENT'},
    {family_id:familyB.id,profile_id:youthB.user.id,role:'YOUTH'},
  ]),'vínculos autorizados');
  ok(await admin.from('parent_profiles').insert([{profile_id:parentA.user.id},{profile_id:parentB.user.id}]),'parent profiles');
  ok(await admin.from('youth_profiles').insert([{profile_id:youthA.user.id,age:14,birth_date:'2012-04-10'},{profile_id:youthB.user.id,age:15,birth_date:'2011-05-11'}]),'youth profiles');

  assert.deepEqual(ok(await parentA.client.from('families').select('id'),'Parent A lê família').map(x=>x.id),[familyA.id]);
  assert.deepEqual(ok(await youthA.client.from('families').select('id'),'Youth A lê família').map(x=>x.id),[familyA.id]);
  await denied(youthA.client.from('family_members').insert({family_id:familyB.id,profile_id:youthA.user.id,role:'PARENT'}),'Youth se promove em família B');
  await denied(parentA.client.from('family_members').insert({family_id:familyB.id,profile_id:parentA.user.id,role:'PARENT'}),'Parent A entra na família B');
  await denied(youthA.client.from('profiles').update({role:'PARENT'}).eq('id',youthA.user.id),'Youth altera role do perfil');
  assert.equal(ok(await youthA.client.from('family_members').select('family_id').eq('family_id',familyB.id),'isolamento apó ataque').length,0);

  const wishlistId=ok(await youthA.client.rpc('save_wishlist_item',{item_title:'Curso de desenho',item_context:'Próxima ideia',item_category:'SKILL'}),'wishlist legítima');
  const wishlist=ok(await youthA.client.from('conquest_wishlist').select('*').eq('id',wishlistId).single(),'ler wishlist legítima');
  assert.equal(wishlist.family_id,familyA.id);assert.equal(wishlist.youth_id,youthA.user.id);
  await denied(youthA.client.from('conquest_wishlist').insert({family_id:familyB.id,youth_id:youthA.user.id,title:'Injeção'}),'wishlist externa');
  await denied(youthB.client.rpc('activate_wishlist_item',{target_item:wishlistId}),'ativação adulterada');
  assert.equal(ok(await youthB.client.from('conquests').select('id'),'nenhuma conquista externa').length,0);

  await denied(youthA.client.from('youth_profiles').update({total_xp:999999}).eq('profile_id',youthA.user.id),'Youth altera XP');
  await denied(parentA.client.from('youth_profiles').update({total_xp:999999}).eq('profile_id',youthA.user.id),'Parent altera XP');
  assert.equal(ok(await youthA.client.from('youth_profiles').select('total_xp').eq('profile_id',youthA.user.id).single(),'XP intacto').total_xp,0);

  const conquestId=ok(await youthA.client.rpc('create_conquest',{conquest_title:'Notebook para estudar',conquest_category:'OTHER',conquest_reason:'Aprender programação'}),'conquista legítima');
  const journey=ok(await admin.from('journeys').insert({conquest_id:conquestId,family_id:familyA.id,youth_id:youthA.user.id,status:'DRAFT',estimated_duration_months:3,recommended_mission_count:1,cadence_label:'Semanal'}).select().single(),'jornada');
  ok(await admin.from('journey_missions').insert({journey_id:journey.id,family_id:familyA.id,title:'Comparar opções reais',description:'Compare modelos e custos.',instructions:'Registre três opções.',category:'DEVELOPMENT_CONTEXTUALIZED',skills:['financial_literacy'],estimated_minutes:30,xp_reward:100,goal_progress_reward:100,evidence_types:['TEXT'],phase:1,mission_order:1,recommendation_reasons:['Ajuda a decidir'],why_this_mission:'Conecta pesquisa e decisão.',effort_weight:1,is_custom:true}),'missão da jornada');
  const approved=ok(await parentA.client.rpc('approve_journey_with_agreement',{target_journey:journey.id,goal_value:3500,reward_text:'Cumprir o combinado ao concluir.',duration_months:3}),'Parent define combinado');
  assert.equal(approved.status,'APPROVED');
  const contract=ok(await parentA.client.from('conquest_contracts').select('*').eq('conquest_id',conquestId).single(),'contrato');
  assert.equal(Number(ok(await parentA.client.from('conquests').select('confirmed_goal_value').eq('id',conquestId).single(),'valor protegido').confirmed_goal_value),3500);

  await denied(youthA.client.from('conquest_contracts').update({status:'ACTIVE',parent_accepted_at:new Date().toISOString(),youth_accepted_at:new Date().toISOString()}).eq('id',contract.id),'Youth adultera contrato');
  await denied(parentA.client.from('conquest_contracts').update({youth_accepted_at:new Date().toISOString()}).eq('id',contract.id),'Parent aceita pelo Youth');
  await denied(youthA.client.from('contract_acceptances').insert({contract_id:contract.id,user_id:youthA.user.id,role:'PARENT'}),'Youth insere aceite Parent');
  assert.equal(ok(await parentA.client.rpc('accept_commitment',{target_contract:contract.id}),'aceite Parent'),'PENDING');
  let afterParent=ok(await parentA.client.from('conquest_contracts').select('*').eq('id',contract.id).single(),'contrato apó Parent');
  assert(afterParent.parent_accepted_at);assert.equal(afterParent.youth_accepted_at,null);assert.equal(afterParent.status,'PENDING');
  await denied(parentB.client.rpc('accept_commitment',{target_contract:contract.id}),'Parent B aceita contrato A');
  assert.equal(ok(await youthA.client.rpc('accept_commitment',{target_contract:contract.id}),'aceite Youth'),'ACTIVE');
  const activeContract=ok(await youthA.client.from('conquest_contracts').select('*').eq('id',contract.id).single(),'contrato ativo');
  assert(activeContract.parent_accepted_at&&activeContract.youth_accepted_at);assert.equal(activeContract.status,'ACTIVE');

  await denied(youthA.client.from('conquests').update({progress:100}).eq('id',conquestId),'Youth altera progresso');
  await denied(youthA.client.from('conquests').update({status:'COMPLETED'}).eq('id',conquestId),'Youth conclui conquista');
  await denied(youthA.client.from('conquests').update({confirmed_goal_value:-500}).eq('id',conquestId),'Youth define valor negativo');
  await denied(parentA.client.from('conquests').update({progress:100}).eq('id',conquestId),'Parent altera progresso direto');
  await denied(parentB.client.rpc('archive_journey',{target_journey:journey.id,archive_reason:'ataque'}),'Parent B arquiva jornada A');

  const assignment=ok(await youthA.client.from('mission_assignments').select('*,mission:missions(*)').eq('conquest_id',conquestId).single(),'assignment');
  ok(await youthA.client.rpc('start_mission',{target_assignment:assignment.id}),'iniciar missão');
  ok(await youthA.client.from('mission_evidence').insert({assignment_id:assignment.id,family_id:familyA.id,youth_id:youthA.user.id,evidence_type:'TEXT',text_content:'Comparei três modelos.',reflection_difficult:'Critérios',reflection_different:'Usaria uma planilha'}),'evidência');
  ok(await youthA.client.rpc('submit_mission',{target_assignment:assignment.id}),'enviar missão');
  const review=ok(await parentA.client.rpc('approve_mission',{target_assignment:assignment.id,review_note:'Validado'}),'aprovação legítima');
  assert.equal(review.xp_reward,assignment.mission.xp_reward);
  const xp=ok(await youthA.client.from('youth_profiles').select('total_xp').eq('profile_id',youthA.user.id).single(),'XP autorizado');
  assert.equal(xp.total_xp,assignment.mission.xp_reward);
  const progressed=ok(await youthA.client.from('conquests').select('progress').eq('id',conquestId).single(),'progresso autorizado');
  assert.equal(Number(progressed.progress),100);

  ok(await youthA.client.rpc('archive_journey',{target_journey:journey.id,archive_reason:'Objetivo concluído no teste'}),'encerramento legítimo');
  const nextConquestId=ok(await youthA.client.rpc('activate_wishlist_item',{target_item:wishlistId}),'ativação legítima');
  const nextConquest=ok(await youthA.client.from('conquests').select('*').eq('id',nextConquestId).single(),'próxima conquista');
  assert.equal(nextConquest.family_id,familyA.id);assert.equal(nextConquest.youth_id,youthA.user.id);

  for(const [label,client] of [['Parent B',parentB.client],['Youth B',youthB.client]]){
    assert.equal(ok(await client.from('conquests').select('id').eq('family_id',familyA.id),`${label} conquests A`).length,0);
    assert.equal(ok(await client.from('conquest_contracts').select('id').eq('family_id',familyA.id),`${label} contracts A`).length,0);
    assert.equal(ok(await client.from('conquest_wishlist').select('id').eq('family_id',familyA.id),`${label} wishlist A`).length,0);
    assert.equal(ok(await client.from('youth_profiles').select('profile_id').eq('profile_id',youthA.user.id),`${label} profile A`).length,0);
  }
  console.log('PASS: SEC-001..SEC-005, isolamento entre duas famílias, aceite separado, XP/progresso autorizados, wishlist e encerramento legítimos.');
}finally{
  for(const family of families)await admin.from('families').delete().eq('id',family);
  for(const user of users)await admin.auth.admin.deleteUser(user);
}
