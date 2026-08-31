import{NextResponse}from'next/server';
import{z}from'zod';
import{requireApiUser}from'@/lib/supabase/server';

const input=z.object({familyId:z.string().uuid()});

export async function POST(request:Request){try{const body=input.parse(await request.json()),{admin,user}=await requireApiUser(request),membership=await admin.from('family_members').select('role').eq('family_id',body.familyId).eq('profile_id',user.id).maybeSingle();if(membership.error||membership.data?.role!=='PARENT')return NextResponse.json({error:'Somente um responsável desta família pode criar convites.'},{status:403});for(let attempt=0;attempt<3;attempt++){const code=crypto.randomUUID().replaceAll('-','').slice(0,6).toUpperCase(),created=await admin.from('family_invites').insert({family_id:body.familyId,code,youth_name:'Novo membro',youth_age:14,relationship:'Familiar'}).select('link_token,code').single();if(!created.error&&created.data)return NextResponse.json({ok:true,linkToken:created.data.link_token,code:created.data.code});if(created.error.code!=='23505')throw created.error}return NextResponse.json({error:'Não foi possível gerar um código único. Tente novamente.'},{status:409})}catch{return NextResponse.json({error:'Não foi possível criar o convite agora.'},{status:400})}}
