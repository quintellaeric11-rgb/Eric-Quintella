import{NextResponse}from'next/server';import{requireApiUser}from'@/lib/supabase/server';
// Concierge MVP authority boundary. Legacy and Mission System V1 stay in the
// repository, but neither may materialize missions in the live pilot flow.
// The preserved shadow boundary previously used
// runMissionSystemShadow(...).catch(()=>null); it is intentionally not executed
// while Concierge missions are the pilot authority.
export async function POST(request:Request){try{await requireApiUser(request);return NextResponse.json({error:'Esta jornada será preparada manualmente pela curadoria KONKI.',code:'CONCIERGE_CURATION_REQUIRED'},{status:409})}catch{return NextResponse.json({error:'Acesso não autorizado.'},{status:401})}}
