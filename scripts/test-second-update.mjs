import assert from'node:assert/strict';
import{createClient}from'@supabase/supabase-js';
import{loadLocalEnv}from'./env.mjs';
loadLocalEnv();
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,service=process.env.SUPABASE_SERVICE_ROLE_KEY;
assert(url&&anon&&service,'Variáveis Supabase ausentes');
const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}}),password=`Konki-${crypto.randomUUID()}-9a!`,stamp=Date.now().toString(36),users=[],families=[];
const ok=(result,label)=>{if(result.error)throw new Error(`${label}: ${result.error.message}`);return result.data};
async function authUser(label,role='PARENT'){const email=`update-${label}-${stamp}@konki.test`,created=ok(await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{role,first_name:label}}),`criar ${label}`).user;users.push(created.id);const client=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});const signed=ok(await client.auth.signInWithPassword({email,password}),`login ${label}`);return{user:created,client,token:signed.session.access_token}}
try{
 const parent=await authUser('oauth-parent');
 const first=ok(await admin.rpc('complete_oauth_parent',{target_profile:parent.user.id,profile_first_name:'Ana',target_family_name:'Família OAuth'}),'concluir parent OAuth');
 families.push(first.familyId);assert.equal(first.idempotent,false);
 const retry=ok(await admin.rpc('complete_oauth_parent',{target_profile:parent.user.id,profile_first_name:'Ana',target_family_name:'Família OAuth'}),'retry parent OAuth');assert.equal(retry.idempotent,true);assert.equal(retry.familyId,first.familyId);
 assert.equal(ok(await admin.from('family_members').select('profile_id').eq('profile_id',parent.user.id),'membros parent').length,1);
 assert.equal(ok(await admin.from('parent_profiles').select('profile_id').eq('profile_id',parent.user.id),'perfil parent').length,1);

 const youth=await authUser('oauth-youth','YOUTH');
 const bad=await fetch('http://localhost:3000/api/auth/complete-oauth-profile',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${youth.token}`},body:JSON.stringify({role:'YOUTH',firstName:'Bia',inviteCode:'BADBAD',birthDate:'2012-09-15'})});assert.equal(bad.status,409);
 assert.equal(ok(await admin.from('family_members').select('profile_id').eq('profile_id',youth.user.id),'sem vínculo parcial').length,0);
 const completed=await fetch('http://localhost:3000/api/auth/complete-oauth-profile',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${youth.token}`},body:JSON.stringify({role:'YOUTH',firstName:'Bia',inviteCode:first.inviteCode,birthDate:'2012-09-15'})});assert.equal(completed.status,200,await completed.text());
 const repeated=await fetch('http://localhost:3000/api/auth/complete-oauth-profile',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${youth.token}`},body:JSON.stringify({role:'YOUTH',firstName:'Bia',inviteCode:first.inviteCode,birthDate:'2012-09-15'})});assert.equal(repeated.status,200);assert.equal((await repeated.json()).idempotent,true);
 assert.equal(ok(await admin.from('family_members').select('profile_id').eq('profile_id',youth.user.id),'um vínculo youth').length,1);
 const youthProfile=ok(await admin.from('youth_profiles').select('birth_date').eq('profile_id',youth.user.id).single(),'DOB OAuth');assert.equal(youthProfile.birth_date,'2012-09-15');

 const wishId=ok(await youth.client.rpc('save_wishlist_item',{item_title:'Itália',item_context:'Viajar em família',item_category:null}),'criar desejo');
 ok(await youth.client.rpc('update_wishlist_item',{target_item:wishId,item_title:'Viagem à Itália',item_context:'Conhecer Roma'}),'editar desejo');
 const wish=ok(await youth.client.from('conquest_wishlist').select('title,context').eq('id',wishId).single(),'ler desejo');assert.deepEqual(wish,{title:'Viagem à Itália',context:'Conhecer Roma'});
 const outsider=await authUser('outsider');const denied=await outsider.client.rpc('update_wishlist_item',{target_item:wishId,item_title:'Adulterado',item_context:null});assert(denied.error,'edição externa deveria falhar');
 ok(await youth.client.rpc('remove_wishlist_item',{target_item:wishId}),'remover desejo');
 const recovery=ok(await admin.auth.admin.generateLink({type:'recovery',email:outsider.user.email}),'gerar recuperação'),resetClient=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}}),verified=ok(await resetClient.auth.verifyOtp({type:'recovery',token_hash:recovery.properties.hashed_token}),'validar link de recuperação');assert.equal(verified.user.id,outsider.user.id);const newPassword=`Nova-${crypto.randomUUID()}-8b!`;ok(await resetClient.auth.updateUser({password:newPassword}),'salvar nova senha');ok(await resetClient.auth.signOut(),'encerrar reset');ok(await resetClient.auth.signInWithPassword({email:outsider.user.email,password:newPassword}),'entrar com nova senha');
 const neutral=await createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}}).auth.resetPasswordForEmail(`ausente-${stamp}@konki.test`,{redirectTo:'http://localhost:3000/auth/reset'});assert.equal(neutral.error,null,'solicitação neutra para e-mail ausente');
 console.log('PASS segundo update: OAuth Parent idempotente, Youth retomável com DOB, reset completo e neutro, wishlist completa e isolamento.');
}finally{for(const family of families)await admin.from('families').delete().eq('id',family);for(const user of users)await admin.auth.admin.deleteUser(user)}
