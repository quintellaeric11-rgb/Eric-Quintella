import {NextResponse} from 'next/server';
import {requireApiUser} from '@/lib/supabase/server';
import {getBirthdayState} from '@/lib/product-utils';
import {buildJourney,classifyGoal,complexityFor} from '@/lib/mission-engine.mjs';
import {runMissionSystemShadow} from '@/lib/mission-system-v1/shadow-runner.mjs';

export async function POST(request:Request){
  try{
    const{admin,user}=await requireApiUser(request),body=await request.json().catch(()=>({})) as {conquestId?:string};
    const conquest=await admin.from('conquests').select('*').eq('id',String(body.conquestId||'')).single();if(conquest.error)throw conquest.error;
    const member=await admin.from('family_members').select('role').eq('family_id',conquest.data.family_id).eq('profile_id',user.id).single();if(member.error||!(user.id===conquest.data.youth_id||member.data.role==='PARENT'))throw new Error('UNAUTHORIZED');
    const existing=await admin.from('journeys').select('id').eq('conquest_id',conquest.data.id).maybeSingle();if(existing.data)return NextResponse.json({ok:true,journeyId:existing.data.id,existing:true});
    const youth=await admin.from('youth_profiles').select('*').eq('profile_id',conquest.data.youth_id).single();
    const parentMember=await admin.from('family_members').select('profile_id').eq('family_id',conquest.data.family_id).eq('role','PARENT').limit(1).single();
    const parent=await admin.from('parent_profiles').select('*').eq('profile_id',parentMember.data?.profile_id).single();
    const library=await admin.from('mission_archetypes').select('*').eq('is_active',true);if(library.error)throw library.error;
    const classification=classifyGoal(conquest.data.title),age=youth.data?.birth_date?getBirthdayState(youth.data.birth_date).age:(youth.data?.age||14);
    const complexity=complexityFor(classification,parent.data?.development_goals||[],age);
    const history=await admin.from('journey_missions').select('archetype:mission_archetypes(code),journey:journeys!inner(youth_id,status)').eq('journey.youth_id',conquest.data.youth_id).neq('journey.status','DRAFT').limit(80);
    if(history.error)throw history.error;
    const recentArchetypeCodes=(history.data||[]).map((row:any)=>row.archetype?.code).filter(Boolean);
    const proposal=buildJourney({classification,complexity,archetypes:library.data,parentGoals:parent.data?.development_goals||[],interests:youth.data?.interests||[],age,recentArchetypeCodes});
    const shadowRun=runMissionSystemShadow({productContext:{conquest:conquest.data,youth:youth.data,parent:parent.data,age,legacyClassification:classification,legacyProposal:proposal},legacyResult:{classification,proposal}}).catch(()=>null);
    const rows=proposal.map((m:any,i:number)=>({archetype_id:m.archetype.id,source_mission_id:null,title:m.title,description:m.contextualized_intro,instructions:m.contextualized_steps.join(' '),category:m.archetype.category,skills:[...(m.archetype.primary_skills||[]),...(m.archetype.secondary_skills||[])],estimated_minutes:m.archetype.estimated_minutes_min,xp_reward:m.archetype.default_xp,goal_progress_reward:m.progress_percentage,evidence_types:m.evidence_types,phase:m.phase,mission_order:i+1,recommendation_score:m.recommendation_score,recommendation_reasons:[m.why_this_mission],is_custom:false,contextualized_intro:m.contextualized_intro,contextualized_micro_lesson:m.contextualized_micro_lesson,contextualized_steps:m.contextualized_steps,contextualized_evidence_request:m.contextualized_evidence_request,follow_up_question:m.follow_up_question,why_this_mission:m.why_this_mission,effort_weight:m.effort_weight,progress_percentage:m.progress_percentage,pedagogical_age_band:m.pedagogical_age_band,technique_explanation:m.technique_explanation,contextualized_example:m.contextualized_example,autonomy_guidance:m.autonomy_guidance,parent_support_guidance:m.parent_support_guidance,reflection_depth:m.reflection_depth,evidence_checklist:m.evidence_checklist}));
    const duration=Math.ceil(complexity.suggested_weeks/4.345),cadence=`${complexity.suggested_weeks} semanas sugeridas`;
    const persisted=await admin.rpc('persist_generated_journey',{target_conquest:conquest.data.id,journey_payload:{estimated_duration_months:duration,cadence_label:cadence,complexity_score:complexity.score,complexity_band:complexity.band,suggested_duration_weeks:complexity.suggested_weeks,normalized_goal:classification.normalized_goal,natural_reference:classification.natural_reference,goal_type:classification.goal_type,goal_category:classification.goal_category,classification},mission_payload:rows});if(persisted.error)throw persisted.error;
    await shadowRun;
    return NextResponse.json({ok:true,journeyId:persisted.data.journey_id,missionCount:persisted.data.mission_count||rows.length,existing:Boolean(persisted.data.existing),complexityBand:complexity.band,suggestedWeeks:complexity.suggested_weeks});
  }catch(error:unknown){const message=error instanceof Error?error.message:typeof error==='object'&&error&&'message' in error?String(error.message):'';console.error('mission recommendation failed:',message||'unknown error');return NextResponse.json({error:message==='UNAUTHORIZED'?'Acesso não autorizado.':'Não foi possível criar a proposta agora.'},{status:message==='UNAUTHORIZED'?401:400})}
}
