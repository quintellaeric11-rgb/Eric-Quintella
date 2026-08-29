import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {loadLocalEnv} from './env.mjs';

loadLocalEnv();
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,service=process.env.SUPABASE_SERVICE_ROLE_KEY;
assert(url&&anon&&service,'Variáveis Supabase ausentes');
const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}}),stamp=Date.now().toString(36),password=`Konki-${crypto.randomUUID()}-9a!`,users=[],families=[];
const ok=(r,label)=>{if(r.error)throw new Error(`${label}: ${r.error.message}`);return r.data};
async function make(role,name,email,username){const u=ok(await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{role,first_name:name,username}}),`criar ${name}`).user;users.push(u.id);return u}
async function login(email){const c=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});const s=ok(await c.auth.signInWithPassword({email,password}),'login');return{c,token:s.session.access_token}}

try{
  const carlosMail=`carlos-${stamp}@konki.test`,ericMail=`eric-${stamp}@konki.test`,otherMail=`other-${stamp}@konki.test`;
  const carlos=await make('PARENT','Carlos',carlosMail),eric=await make('YOUTH','Eric',ericMail,`eric.${stamp}`),other=await make('PARENT','Outra',otherMail);
  const family=ok(await admin.from('families').insert({name:'Família Carlos',invite_code:`C${stamp}`.slice(0,12).toUpperCase(),created_by:carlos.id}).select().single(),'família Carlos');families.push(family.id);
  const familyB=ok(await admin.from('families').insert({name:'Família B',invite_code:`B${stamp}`.slice(0,12).toUpperCase(),created_by:other.id}).select().single(),'família B');families.push(familyB.id);
  ok(await admin.from('family_members').insert([{family_id:family.id,profile_id:carlos.id,role:'PARENT'},{family_id:family.id,profile_id:eric.id,role:'YOUTH'},{family_id:familyB.id,profile_id:other.id,role:'PARENT'}]),'membros');
  ok(await admin.from('parent_profiles').insert([{profile_id:carlos.id,development_goals:['Educação financeira','Responsabilidade','Comunicação','Mais confiança']},{profile_id:other.id,development_goals:[]}]),'perfil Carlos');
  ok(await admin.from('youth_profiles').insert({profile_id:eric.id,age:15,interests:['Viagens','Comida','História','Fórmula 1']}),'perfil Eric');
  const parent=await login(carlosMail),youth=await login(ericMail),outsider=await login(otherMail);
  const target=new Date();target.setMonth(target.getMonth()+8);
  const conquest=ok(await youth.c.from('conquests').insert({family_id:family.id,youth_id:eric.id,title:'Viagem para Itália',category:'VIAGEM',approximate_value:12000,desired_date:target.toISOString().slice(0,10),reason:'Conhecer história, comida e cultura.',status:'PENDING'}).select().single(),'criar conquista');
  const response=await fetch('http://localhost:3000/api/missions/recommend',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${youth.token}`},body:JSON.stringify({conquestId:conquest.id})});
  const generated=await response.json();assert(response.ok,generated.error);assert.equal(generated.missionCount,20);assert.equal(generated.durationMonths,8);
  const journey=ok(await parent.c.from('journeys').select('*').eq('conquest_id',conquest.id).single(),'pai vê proposta');
  let missions=ok(await parent.c.from('journey_missions').select('*').eq('journey_id',journey.id).order('mission_order'),'pai vê missões');assert.equal(missions.length,20);
  assert((await youth.c.from('journeys').select('id').eq('id',journey.id)).data.length===0,'jovem viu rascunho');
  assert((await outsider.c.from('journeys').select('id').eq('id',journey.id)).data.length===0,'outra família viu jornada');
  const first=missions[0];ok(await parent.c.from('journey_missions').update({title:'Monte o orçamento completo da viagem',is_custom:true}).eq('id',first.id),'editar');
  ok(await parent.c.from('journey_missions').delete().eq('id',missions[1].id),'remover');
  const catalogOptions=ok(await parent.c.from('missions').select('*').is('family_id',null).limit(50),'catálogo');const catalog=catalogOptions.find(m=>!missions.some(x=>x.source_mission_id===m.id));assert(catalog,'catálogo sem opção nova');
  ok(await parent.c.from('journey_missions').insert({journey_id:journey.id,family_id:family.id,source_mission_id:catalog.id,title:catalog.title,description:catalog.description,instructions:catalog.description,category:catalog.category,skills:catalog.skills,estimated_minutes:catalog.estimated_minutes,xp_reward:catalog.xp_reward,goal_progress_reward:5,evidence_types:catalog.evidence_types,phase:4,mission_order:21,recommendation_reasons:['Escolhida pelo responsável']}),'adicionar catálogo');
  const custom=ok(await parent.c.from('journey_missions').insert({journey_id:journey.id,family_id:family.id,title:'Planejar um almoço italiano da família',description:'Escolha o prato, estime o custo e organize o horário.',instructions:'Monte um plano completo para o almoço.',category:'Vida real',skills:['Responsabilidade','Organização'],estimated_minutes:30,xp_reward:150,goal_progress_reward:5,evidence_types:['TEXT','IMAGE'],phase:4,mission_order:22,recommendation_reasons:['Criada pelo responsável'],is_custom:true}).select().single(),'missão própria');
  ok(await parent.c.from('journey_missions').update({mission_order:1001}).eq('id',first.id),'reordenar temp');
  ok(await parent.c.from('journey_missions').update({mission_order:1}).eq('id',custom.id),'reordenar custom');
  ok(await parent.c.from('journey_missions').update({mission_order:22}).eq('id',first.id),'reordenar primeira');
  const approved=ok(await parent.c.rpc('approve_journey',{target_journey:journey.id}),'aprovar jornada');assert.equal(approved.status,'ACTIVE');assert.equal(approved.mission_count,21);
  const active=ok(await youth.c.from('mission_assignments').select('*,mission:missions(*)').eq('conquest_id',conquest.id),'jovem vê missões');assert.equal(active.length,21);assert(active.every(x=>x.status==='AVAILABLE'));
  ok(await youth.c.rpc('start_mission',{target_assignment:active[0].id}),'jovem inicia');
  await youth.c.from('journey_missions').update({xp_reward:999}).eq('id',custom.id);const protectedMission=ok(await parent.c.from('journey_missions').select('xp_reward').eq('id',custom.id).single(),'verificar proteção');assert.equal(protectedMission.xp_reward,150,'jovem editou regra da jornada');
  console.log('PASS: Carlos/Eric, 8 meses/20 sugeridas, customização completa, aprovação, 21 missões visíveis e RLS entre famílias.');
}finally{for(const f of families)await admin.from('families').delete().eq('id',f);for(const u of users)await admin.auth.admin.deleteUser(u)}
