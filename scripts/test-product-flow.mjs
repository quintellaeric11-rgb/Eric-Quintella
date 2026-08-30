import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {loadLocalEnv} from './env.mjs';
loadLocalEnv();
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,service=process.env.SUPABASE_SERVICE_ROLE_KEY;
assert(url&&anon&&service);
const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}}),password=`Konki-${crypto.randomUUID()}-9a!`,stamp=Date.now().toString(36),users=[],families=[];
const ok=(r,label)=>{if(r.error)throw new Error(`${label}: ${r.error.message}`);return r.data};
async function user(role,name){const email=`${name}-${stamp}@konki.test`,u=ok(await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{role,first_name:name}}),`user ${name}`).user;users.push(u.id);const c=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});ok(await c.auth.signInWithPassword({email,password}),`login ${name}`);return{u,c}}
try{
 const parent=await user('PARENT','parent'),youth=await user('YOUTH','youth'),outsider=await user('PARENT','outsider');
 const family=ok(await admin.from('families').insert({name:'Família Produto',invite_code:`P${stamp}`.slice(0,10).toUpperCase(),created_by:parent.u.id}).select().single(),'family');families.push(family.id);
 const familyB=ok(await admin.from('families').insert({name:'Outra',invite_code:`O${stamp}`.slice(0,10).toUpperCase(),created_by:outsider.u.id}).select().single(),'family B');families.push(familyB.id);
 ok(await admin.from('family_members').insert([{family_id:family.id,profile_id:parent.u.id,role:'PARENT'},{family_id:family.id,profile_id:youth.u.id,role:'YOUTH'},{family_id:familyB.id,profile_id:outsider.u.id,role:'PARENT'}]),'members');
 ok(await admin.from('parent_profiles').insert([{profile_id:parent.u.id},{profile_id:outsider.u.id}]),'parents');
 ok(await admin.from('youth_profiles').insert({profile_id:youth.u.id,birth_date:'2012-08-29',age:13,total_xp:420}),'dob');
 const parentDob=ok(await parent.c.from('youth_profiles').select('birth_date').eq('profile_id',youth.u.id).single(),'parent reads DOB');assert.equal(parentDob.birth_date,'2012-08-29');
 assert.equal((await outsider.c.from('youth_profiles').select('birth_date').eq('profile_id',youth.u.id)).data.length,0);
 ok(await parent.c.from('youth_profiles').update({birth_date:'2012-08-28'}).eq('profile_id',youth.u.id),'parent updates DOB');
 const conquest=ok(await admin.from('conquests').insert({family_id:family.id,youth_id:youth.u.id,title:'Conquista atual',category:'OTHER',status:'ACTIVE',progress:25}).select().single(),'active conquest fixture');
 const journey=ok(await admin.from('journeys').insert({conquest_id:conquest.id,family_id:family.id,youth_id:youth.u.id,status:'ACTIVE',estimated_duration_months:2,recommended_mission_count:1,cadence_label:'Semanal'}).select().single(),'journey');
 const mission=ok(await admin.from('missions').insert({slug:`archive-proof-${stamp}`,title:'Evidência preservada',description:'Teste',category:'TEST',skills:['autonomy'],interests:[],goal_categories:['OTHER'],recommended_age_min:8,recommended_age_max:21,difficulty:'EASY',estimated_minutes:15,xp_reward:50,goal_progress_reward:10,evidence_types:['TEXT'],lesson_title:'Teste',lesson_content:{},status:'ACTIVE',family_id:family.id}).select().single(),'mission proof');
 const assignment=ok(await admin.from('mission_assignments').insert({family_id:family.id,youth_id:youth.u.id,conquest_id:conquest.id,journey_id:journey.id,mission_id:mission.id,status:'APPROVED',approved_at:new Date().toISOString()}).select().single(),'assignment proof');
 const evidence=ok(await admin.from('mission_evidence').insert({assignment_id:assignment.id,family_id:family.id,youth_id:youth.u.id,evidence_type:'TEXT',text_content:'Aprendizado preservado'}).select().single(),'evidence proof');
 const wishId=ok(await youth.c.rpc('save_wishlist_item',{item_title:'Próxima conquista',item_context:'Depois desta',item_category:null}),'wishlist');
 const wish=ok(await youth.c.from('conquest_wishlist').select('*').eq('id',wishId).single(),'ler wishlist');
 const blocked=await youth.c.rpc('activate_wishlist_item',{target_item:wish.id});assert(blocked.error?.message.includes('active_conquest_exists'));
 ok(await youth.c.rpc('archive_journey',{target_journey:journey.id,archive_reason:'Mudei de objetivo'}),'archive');
 const archived=ok(await youth.c.from('journey_archive_events').select('*').eq('journey_id',journey.id).single(),'archive history');assert.equal(Number(archived.progress_at_archive),25);assert.equal(archived.earned_xp,0);
 assert.equal((await outsider.c.from('journey_archive_events').select('id').eq('journey_id',journey.id)).data.length,0);
 assert.equal(ok(await youth.c.from('youth_profiles').select('total_xp').eq('profile_id',youth.u.id).single(),'xp preserved').total_xp,420);
 assert.equal(ok(await youth.c.from('mission_evidence').select('id').eq('id',evidence.id).single(),'evidence preserved').id,evidence.id);
 const nextId=ok(await youth.c.rpc('activate_wishlist_item',{target_item:wish.id}),'activate next');const next=ok(await youth.c.from('conquests').select('*').eq('id',nextId).single(),'next conquest');assert.equal(next.status,'PENDING');
 const second=await youth.c.from('conquests').insert({family_id:family.id,youth_id:youth.u.id,title:'Não pode',category:'OTHER',status:'PENDING'});assert(second.error,'unique active conquest was not enforced');
 console.log('PASS: DOB/RLS, uma conquista ativa, wishlist, ativação da próxima, encerramento com motivo, histórico e XP preservados, isolamento entre famílias.');
}finally{for(const f of families)await admin.from('families').delete().eq('id',f);for(const u of users)await admin.auth.admin.deleteUser(u)}
