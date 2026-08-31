import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {loadLocalEnv} from './env.mjs';

loadLocalEnv();
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service=process.env.SUPABASE_SERVICE_ROLE_KEY;
assert(url&&anon&&service,'Variáveis Supabase ausentes');

const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
const password=`Konki-${crypto.randomUUID()}-9a!`;
const stamp=Date.now().toString(36);
const users=[];
const families=[];
const results=[];
const ok=(result,label)=>{if(result.error)throw new Error(`${label}: ${result.error.message}`);return result.data};
const pass=label=>{results.push(label);console.log(`PASS ${label}`)};

async function makeUser(role,name){
  const email=`m021-${name}-${stamp}@konki.test`;
  const user=ok(await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{role,first_name:name}}),`criar ${name}`).user;
  users.push(user.id);
  const client=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
  ok(await client.auth.signInWithPassword({email,password}),`login ${name}`);
  return{user,client};
}

async function makeFamily(parent,youth,name){
  const family=ok(await admin.from('families').insert({name,invite_code:`${name[0]}${stamp}`.slice(0,12).toUpperCase(),created_by:parent.user.id}).select().single(),`família ${name}`);
  families.push(family.id);
  const members=[{family_id:family.id,profile_id:parent.user.id,role:'PARENT',relationship:'Responsável'}];
  if(youth)members.push({family_id:family.id,profile_id:youth.user.id,role:'YOUTH',relationship:'Filho(a)'});
  ok(await admin.from('family_members').insert(members),`membros ${name}`);
  ok(await admin.from('parent_profiles').insert({profile_id:parent.user.id}),`parent ${name}`);
  if(youth)ok(await admin.from('youth_profiles').insert({profile_id:youth.user.id,age:14,birth_date:'2012-03-10'}),`youth ${name}`);
  return family;
}

async function makeConquest(family,youth,status='ACTIVE'){
  return ok(await admin.from('conquests').insert({family_id:family.id,youth_id:youth.user.id,title:`Tênis ${crypto.randomUUID()}`,category:'PURCHASE',reason:'Preciso de um tênis',status}).select().single(),'conquista');
}

async function makeMission(family,source,title){
  return ok(await admin.from('missions').insert({slug:`m021-${crypto.randomUUID()}`,title,description:'Descrição de teste',category:'DEVELOPMENT_CONTEXTUALIZED',skills:['Autonomia'],goal_categories:['PURCHASE'],difficulty:'EASY',estimated_minutes:15,xp_reward:50,goal_progress_reward:20,evidence_types:['TEXT'],lesson_title:'Antes de começar',lesson_content:{source_type:source,passos:['Faça e registre.']},family_id:family.id}).select().single(),`missão ${title}`);
}

async function makeInvite(family,expiresAt){
  return ok(await admin.from('family_invites').insert({family_id:family.id,code:`I${crypto.randomUUID().replaceAll('-','')}`.slice(0,12).toUpperCase(),youth_name:'Convidado',youth_age:14,relationship:'Familiar',expires_at:expiresAt}).select().single(),'convite');
}

try{
  const parentA=await makeUser('PARENT','parent-a');
  const youthA=await makeUser('YOUTH','youth-a');
  const parentB=await makeUser('PARENT','parent-b');
  const youthB=await makeUser('YOUTH','youth-b');
  const pendingYouth=await makeUser('YOUTH','pending-youth');
  const familyA=await makeFamily(parentA,youthA,'Alpha');
  await makeFamily(parentB,youthB,'Beta');
  ok(await admin.from('family_members').insert({family_id:familyA.id,profile_id:pendingYouth.user.id,role:'YOUTH',relationship:'Filho(a)'}),'membro pending');
  ok(await admin.from('youth_profiles').insert({profile_id:pendingYouth.user.id,age:15,birth_date:'2011-03-10'}),'perfil pending');

  const activeConquest=await makeConquest(familyA,youthA);
  const journey=ok(await admin.from('journeys').insert({conquest_id:activeConquest.id,family_id:familyA.id,youth_id:youthA.user.id,status:'ACTIVE',estimated_duration_months:1,recommended_mission_count:3,cadence_label:'Semanal'}).select().single(),'jornada');
  ok(await admin.from('conquest_contracts').insert({conquest_id:activeConquest.id,family_id:familyA.id,parent_id:parentA.user.id,youth_id:youthA.user.id,estimated_missions:3,conditions:'Teste',status:'ACTIVE',parent_accepted_at:new Date().toISOString(),youth_accepted_at:new Date().toISOString()}),'contrato ativo');
  const first=await makeMission(familyA,'KONKI','Primeira missão');
  const second=await makeMission(familyA,'KONKI','Segunda missão');
  const manual=await makeMission(familyA,'PARENT_CUSTOM','Missão do responsável');
  const firstAssignment=ok(await admin.from('mission_assignments').insert({family_id:familyA.id,youth_id:youthA.user.id,conquest_id:activeConquest.id,mission_id:first.id,assigned_by:parentA.user.id,status:'AVAILABLE',journey_id:journey.id,mission_order:1}).select().single(),'assignment 1');
  const secondAssignment=ok(await admin.from('mission_assignments').insert({family_id:familyA.id,youth_id:youthA.user.id,conquest_id:activeConquest.id,mission_id:second.id,assigned_by:parentA.user.id,status:'LOCKED',journey_id:journey.id,mission_order:2}).select().single(),'assignment 2');
  const manualAssignment=ok(await admin.from('mission_assignments').insert({family_id:familyA.id,youth_id:youthA.user.id,conquest_id:activeConquest.id,mission_id:manual.id,assigned_by:parentA.user.id,status:'LOCKED',journey_id:journey.id,mission_order:3}).select().single(),'assignment manual');
  assert.equal(manualAssignment.status,'AVAILABLE');
  assert.equal(manualAssignment.journey_id,null);
  assert.equal(manualAssignment.mission_order,null);
  pass('missão manual criada pelo responsável, sem prerequisite e disponível imediatamente');

  const future=await youthA.client.rpc('start_mission',{target_assignment:secondAssignment.id});
  assert(future.error);
  ok(await youthA.client.rpc('start_mission',{target_assignment:manualAssignment.id}),'iniciar manual');
  const manualStarted=ok(await youthA.client.from('mission_assignments').select('status,started_at').eq('id',manualAssignment.id).single(),'ler manual');
  assert.equal(manualStarted.status,'STARTED');
  assert(manualStarted.started_at);
  assert.equal((await youthA.client.from('mission_assignments').select('status').eq('id',secondAssignment.id).single()).data.status,'LOCKED');
  pass('missão manual não interfere no desbloqueio da jornada');

  ok(await youthA.client.rpc('start_mission',{target_assignment:firstAssignment.id}),'início normal');
  const startedOnce=ok(await youthA.client.from('mission_assignments').select('status,started_at').eq('id',firstAssignment.id).single(),'started 1');
  ok(await youthA.client.rpc('start_mission',{target_assignment:firstAssignment.id}),'retry idempotente');
  const startedTwice=ok(await youthA.client.from('mission_assignments').select('status,started_at').eq('id',firstAssignment.id).single(),'started 2');
  assert.equal(startedOnce.status,'STARTED');
  assert.equal(startedTwice.started_at,startedOnce.started_at);
  pass('start_mission com contrato ACTIVE e clique duplo/retry');

  const pendingConquest=await makeConquest(familyA,pendingYouth,'APPROVED');
  ok(await admin.from('conquest_contracts').insert({conquest_id:pendingConquest.id,family_id:familyA.id,parent_id:parentA.user.id,youth_id:pendingYouth.user.id,estimated_missions:1,conditions:'Teste',status:'PENDING'}),'contrato pendente');
  const pendingMission=await makeMission(familyA,'KONKI','Missão pendente');
  const pendingAssignment=ok(await admin.from('mission_assignments').insert({family_id:familyA.id,youth_id:pendingYouth.user.id,conquest_id:pendingConquest.id,mission_id:pendingMission.id,assigned_by:parentA.user.id,status:'AVAILABLE'}).select().single(),'assignment pendente');
  const pendingStart=await pendingYouth.client.rpc('start_mission',{target_assignment:pendingAssignment.id});
  assert(pendingStart.error?.message.includes('commitment_pending'));
  pass('start_mission bloqueado com contrato PENDING');

  const legacy=ok(await admin.from('mission_assignments').select('id,journey_id,mission_order,status,mission:missions!inner(lesson_content)').not('journey_id','is',null).contains('mission.lesson_content',{source_type:'PARENT_CUSTOM'}),'reconciliação legado');
  assert.equal(legacy.length,0);
  pass('reconciliação de missões personalizadas legadas');

  const youthInvite=await makeInvite(familyA,new Date(Date.now()+86400000).toISOString());
  const invitedYouth=await makeUser('YOUTH','invited-youth');
  const youthReservation=ok(await admin.rpc('reserve_family_invite_link',{invite_token:youthInvite.link_token,member_role:'YOUTH'}),'reservar youth');
  const youthFamily=ok(await admin.rpc('finalize_family_invite',{reservation:youthReservation.reservationToken,target_profile:invitedYouth.user.id,member_role:'YOUTH',youth_birth_date:'2013-05-10'}),'finalizar youth');
  assert.equal(youthFamily,familyA.id);
  assert.equal(ok(await admin.from('family_members').select('role,family_id').eq('profile_id',invitedYouth.user.id).single(),'membro youth').role,'YOUTH');
  assert.equal((await admin.rpc('reserve_family_invite_link',{invite_token:youthInvite.link_token,member_role:'YOUTH'})).error?.message,'invite_unavailable');
  pass('convite YOUTH, mesma família e consumo único');

  const parentInvite=await makeInvite(familyA,new Date(Date.now()+86400000).toISOString());
  const invitedParent=await makeUser('YOUTH','invited-parent');
  const parentReservation=ok(await admin.rpc('reserve_family_invite_link',{invite_token:parentInvite.link_token,member_role:'PARENT'}),'reservar parent');
  const parentFamily=ok(await admin.rpc('finalize_family_invite',{reservation:parentReservation.reservationToken,target_profile:invitedParent.user.id,member_role:'PARENT',youth_birth_date:null}),'finalizar parent');
  assert.equal(parentFamily,familyA.id);
  assert.equal(ok(await admin.from('family_members').select('role').eq('profile_id',invitedParent.user.id).single(),'membro parent').role,'PARENT');
  assert(ok(await admin.from('parent_profiles').select('profile_id').eq('profile_id',invitedParent.user.id).single(),'parent profile'));
  pass('convite PARENT e associação à mesma família');

  const tamperInvite=await makeInvite(familyA,new Date(Date.now()+86400000).toISOString());
  const tamperUser=await makeUser('YOUTH','tamper');
  const tamperReservation=ok(await admin.rpc('reserve_family_invite_link',{invite_token:tamperInvite.link_token,member_role:'YOUTH'}),'reservar tamper');
  const tampered=await admin.rpc('finalize_family_invite',{reservation:tamperReservation.reservationToken,target_profile:tamperUser.user.id,member_role:'PARENT',youth_birth_date:null});
  assert(tampered.error?.message.includes('invalid_member_role'));
  assert.equal(ok(await admin.from('family_members').select('profile_id').eq('profile_id',tamperUser.user.id),'sem membro parcial').length,0);
  pass('tentativa de alterar função bloqueada sem criação parcial');

  const expiredInvite=await makeInvite(familyA,new Date(Date.now()-86400000).toISOString());
  const expired=await admin.rpc('reserve_family_invite_link',{invite_token:expiredInvite.link_token,member_role:'YOUTH'});
  assert(expired.error?.message.includes('invite_unavailable'));
  pass('convite expirado bloqueado');

  assert.equal((await youthB.client.from('mission_assignments').select('id').eq('family_id',familyA.id)).data.length,0);
  assert((await youthB.client.rpc('start_mission',{target_assignment:firstAssignment.id})).error);
  assert.equal((await parentB.client.from('family_invites').select('id').eq('family_id',familyA.id)).data.length,0);
  const unauth=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
  assert((await unauth.rpc('start_mission',{target_assignment:firstAssignment.id})).error);
  assert((await youthA.client.rpc('reserve_family_invite_link',{invite_token:crypto.randomUUID(),member_role:'YOUTH'})).error);
  pass('Family A/B isolation, RLS e Auth');

  console.log(`PASS migration 021: ${results.length} grupos validados.`);
}finally{
  for(const familyId of families)await admin.from('families').delete().eq('id',familyId);
  for(const userId of users)await admin.auth.admin.deleteUser(userId);
}
