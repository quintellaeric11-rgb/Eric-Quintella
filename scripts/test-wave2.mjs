import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {loadLocalEnv} from './env.mjs';

loadLocalEnv();
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,service=process.env.SUPABASE_SERVICE_ROLE_KEY;
assert(url&&anon&&service,'Variáveis Supabase ausentes');
const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}}),password=`Konki-${crypto.randomUUID()}-9a!`,stamp=Date.now().toString(36),users=[],families=[];
const ok=(r,label)=>{if(r.error)throw new Error(`${label}: ${r.error.message}`);return r.data};
async function make(role,name){const email=`wave2-${name}-${stamp}@konki.test`,user=ok(await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{role,first_name:name,username:role==='YOUTH'?`${name}.${stamp}`:undefined}}),`criar ${name}`).user;users.push(user.id);const client=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});ok(await client.auth.signInWithPassword({email,password}),`login ${name}`);return{user,client}}
async function denied(promise,label){const result=await promise;assert(result.error,`${label}: deveria falhar`);return result.error}
async function mission(family,youth,conquest,index){return ok(await admin.from('missions').insert({slug:`wave2-${stamp}-${index}`,title:`Missão ${index}`,description:'Teste transacional',category:'TEST',skills:['integrity'],interests:[],goal_categories:['TEST'],recommended_age_min:8,recommended_age_max:21,difficulty:'EASY',estimated_minutes:10,xp_reward:100,goal_progress_reward:20,evidence_types:['TEXT'],lesson_title:'Teste',lesson_content:{},status:'ACTIVE',family_id:family}).select().single(),`missão ${index}`)}

try{
  const parentA=await make('PARENT','parent-a'),youthA=await make('YOUTH','youth-a'),parentB=await make('PARENT','parent-b');
  const familyA=ok(await admin.from('families').insert({name:'Wave 2 A',invite_code:`I${stamp}`.slice(0,12).toUpperCase(),created_by:parentA.user.id}).select().single(),'família A');families.push(familyA.id);
  const familyB=ok(await admin.from('families').insert({name:'Wave 2 B',invite_code:`J${stamp}`.slice(0,12).toUpperCase(),created_by:parentB.user.id}).select().single(),'família B');families.push(familyB.id);
  ok(await admin.from('family_members').insert([{family_id:familyA.id,profile_id:parentA.user.id,role:'PARENT'},{family_id:familyA.id,profile_id:youthA.user.id,role:'YOUTH'},{family_id:familyB.id,profile_id:parentB.user.id,role:'PARENT'}]),'membros');
  ok(await admin.from('parent_profiles').insert([{profile_id:parentA.user.id},{profile_id:parentB.user.id}]),'parents');
  ok(await admin.from('youth_profiles').insert({profile_id:youthA.user.id,age:14,total_xp:0}),'youth');
  const conquest=ok(await admin.from('conquests').insert({family_id:familyA.id,youth_id:youthA.user.id,title:'Idempotência',category:'TEST',status:'ACTIVE',progress:0}).select().single(),'conquista');
  const assignments=[];
  for(let index=1;index<=3;index++){const m=await mission(familyA.id,youthA.user.id,conquest.id,index);assignments.push(ok(await admin.from('mission_assignments').insert({family_id:familyA.id,youth_id:youthA.user.id,conquest_id:conquest.id,mission_id:m.id,status:'SUBMITTED'}).select().single(),`assignment ${index}`))}

  const first=ok(await parentA.client.rpc('approve_mission',{target_assignment:assignments[0].id,review_note:'normal'}),'aprovação normal');assert.equal(first.idempotent,false);assert.equal(first.xp,100);assert.equal(Number(first.progress),20);
  const retry=ok(await parentA.client.rpc('approve_mission',{target_assignment:assignments[0].id,review_note:'retry'}),'retry de rede');assert.equal(retry.idempotent,true);assert.equal(retry.xp,100);assert.equal(Number(retry.progress),20);
  await denied(parentA.client.rpc('request_mission_changes',{target_assignment:assignments[0].id,review_note:'reabrir'}),'reabrir aprovada');

  const doubleClick=await Promise.all([parentA.client.rpc('approve_mission',{target_assignment:assignments[1].id,review_note:'duplo A'}),parentA.client.rpc('approve_mission',{target_assignment:assignments[1].id,review_note:'duplo B'})]);
  assert(doubleClick.every(r=>!r.error));assert.equal(doubleClick.filter(r=>r.data.idempotent===false).length,1);assert.equal(doubleClick.filter(r=>r.data.idempotent===true).length,1);
  const concurrent=await Promise.all([parentA.client.rpc('approve_mission',{target_assignment:assignments[2].id,review_note:'concorrente A'}),parentA.client.rpc('approve_mission',{target_assignment:assignments[2].id,review_note:'concorrente B'})]);
  assert(concurrent.every(r=>!r.error));assert.equal(concurrent.filter(r=>r.data.idempotent===false).length,1);assert.equal(concurrent.filter(r=>r.data.idempotent===true).length,1);
  const lostResponseRetry=ok(await parentA.client.rpc('approve_mission',{target_assignment:assignments[2].id,review_note:'resposta perdida'}),'retry resposta perdida');assert.equal(lostResponseRetry.idempotent,true);
  await denied(parentB.client.rpc('approve_mission',{target_assignment:assignments[0].id,review_note:'cross-family'}),'aprovação externa');
  const xpEvents=ok(await admin.from('xp_events').select('amount,assignment_id').in('assignment_id',assignments.map(a=>a.id)),'xp ledger');
  const progressEvents=ok(await admin.from('progress_events').select('amount,assignment_id').eq('conquest_id',conquest.id),'progress ledger');
  const profile=ok(await admin.from('youth_profiles').select('total_xp').eq('profile_id',youthA.user.id).single(),'total XP');
  const current=ok(await admin.from('conquests').select('progress').eq('id',conquest.id).single(),'progresso');
  assert.equal(xpEvents.length,3);assert.equal(xpEvents.reduce((sum,e)=>sum+e.amount,0),300);assert.equal(profile.total_xp,300);
  assert.equal(progressEvents.length,3);assert.equal(progressEvents.reduce((sum,e)=>sum+e.amount,0),60);assert.equal(Number(current.progress),60);
  assert.equal(ok(await admin.from('mission_reviews').select('id').in('assignment_id',assignments.map(a=>a.id)).eq('decision','APPROVED'),'reviews').length,3);

  console.log('PASS INT-001: aprovação normal, retry, duplo clique, concorrência, reabertura bloqueada e ledgers consistentes.');

  async function signupParent(label){
    const email=`wave2-auth-${label}-${stamp}@konki.test`;
    const response=await fetch('http://localhost:3000/api/auth/register-parent',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({firstName:'Parent',lastName:label,email,password,familyName:`Família ${label}`,youthName:'Jovem',youthAge:14,relationship:'Responsável'})});
    const body=await response.json();assert(response.ok,body.error);
    const client=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}}),session=ok(await client.auth.signInWithPassword({email,password}),`login parent ${label}`);
    users.push(session.user.id);
    const member=ok(await client.from('family_members').select('family_id').eq('profile_id',session.user.id).single(),`família ${label}`);families.push(member.family_id);
    return{inviteCode:body.inviteCode,familyId:member.family_id};
  }
  async function registerYouth(code,username){const response=await fetch('http://localhost:3000/api/auth/register-youth',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({code,firstName:'Youth',username,password})});return{response,body:await response.json()}}
  async function rememberYouth(loginEmail){const client=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}}),session=ok(await client.auth.signInWithPassword({email:loginEmail,password}),'login youth');users.push(session.user.id);return session.user.id}

  const raceFamily=await signupParent('race');
  const raceNames=[`racea.${stamp}`,`raceb.${stamp}`],race=await Promise.all(raceNames.map(name=>registerYouth(raceFamily.inviteCode,name)));
  assert.deepEqual(race.map(x=>x.response.status).sort((a,b)=>a-b),[200,409]);
  const raceWinner=race.find(x=>x.response.ok);assert(raceWinner);await rememberYouth(raceWinner.body.loginEmail);
  assert.equal(ok(await admin.from('family_members').select('profile_id').eq('family_id',raceFamily.familyId).eq('role','YOUTH'),'Youth apó corrida').length,1);
  assert.equal(ok(await admin.from('profiles').select('id').in('username',raceNames),'profiles apó corrida').length,1);
  const reused=await registerYouth(raceFamily.inviteCode,`reuse.${stamp}`);assert.equal(reused.response.status,409);

  const normalFamily=await signupParent('normal');
  const normal=await registerYouth(normalFamily.inviteCode,`normal.${stamp}`);assert.equal(normal.response.status,200);await rememberYouth(normal.body.loginEmail);
  const normalReuse=await registerYouth(normalFamily.inviteCode,`normal2.${stamp}`);assert.equal(normalReuse.response.status,409);
  assert.equal(ok(await admin.from('family_members').select('profile_id').eq('family_id',normalFamily.familyId).eq('role','YOUTH'),'Youth normal').length,1);

  const failureFamily=await signupParent('failure'),failureUsername=`failure.${stamp}`,failureEmail=`${failureUsername}-${failureFamily.inviteCode.toLowerCase()}@youth.konki.local`;
  const conflict=ok(await admin.auth.admin.createUser({email:failureEmail,password,email_confirm:true,user_metadata:{role:'PARENT',first_name:'Conflict'}}),'fixture de falha').user;users.push(conflict.id);
  const failed=await registerYouth(failureFamily.inviteCode,failureUsername);assert.equal(failed.response.status,409);
  assert.equal(ok(await admin.from('family_members').select('profile_id').eq('family_id',failureFamily.familyId).eq('role','YOUTH'),'sem membro parcial').length,0);
  assert.equal(ok(await admin.from('youth_profiles').select('profile_id').eq('profile_id',conflict.id),'sem youth profile parcial').length,0);
  const released=ok(await admin.from('family_invites').select('claimed_at,reservation_token').eq('code',failureFamily.inviteCode).single(),'reserva liberada');assert.equal(released.claimed_at,null);assert.equal(released.reservation_token,null);
  ok(await admin.auth.admin.deleteUser(conflict.id),'remover conflito');users.splice(users.indexOf(conflict.id),1);
  const recovered=await registerYouth(failureFamily.inviteCode,failureUsername);assert.equal(recovered.response.status,200);await rememberYouth(recovered.body.loginEmail);
  assert.equal(ok(await admin.from('family_members').select('profile_id').eq('family_id',failureFamily.familyId).eq('role','YOUTH'),'um Youth apó recuperação').length,1);

  console.log('PASS AUTH-001: uso normal, reuso bloqueado, corrida com um sucesso, falha intermediária limpa e exatamente um Youth.');
}finally{for(const family of families)await admin.from('families').delete().eq('id',family);for(const user of users)await admin.auth.admin.deleteUser(user)}
