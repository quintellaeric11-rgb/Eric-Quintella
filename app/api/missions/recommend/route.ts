import {NextResponse} from 'next/server';
import {requireApiUser} from '@/lib/supabase/server';

function monthsUntil(date?:string|null){
  if(!date)return 3;
  const now=new Date(),target=new Date(`${date}T12:00:00`);
  return Math.max(1,Math.ceil((target.getTime()-now.getTime())/(30.44*86400000)));
}
export function recommendedCount(months:number){
  if(months<=1)return 7;if(months<=3)return 10;if(months<=6)return 15;if(months<=9)return 20;if(months<=12)return 27;return 30;
}
function cadence(count:number,months:number){
  const rate=count/months;
  if(rate<=1.2)return '1 missão por mês';
  if(rate<=2.2)return '1 a 2 missões por mês';
  if(rate<=3.2)return '2 a 3 missões por mês';
  return `${Math.max(1,Math.floor(rate))} a ${Math.ceil(rate)} missões por mês`;
}
function adaptive(title:string,category:string){
  return [
    {title:`Descubra o custo real de ${title}`,description:`Pesquise todos os custos envolvidos em ${title} e organize uma estimativa realista.`,instructions:'Liste custos principais, extras e uma margem de segurança.',category:'Dinheiro',skills:['Educação financeira','Organização'],minutes:30,xp:200,evidence:['TEXT','IMAGE']},
    {title:`Compare três caminhos para ${title}`,description:`Encontre três opções diferentes para chegar a ${title} e compare vantagens e desvantagens.`,instructions:'Monte uma comparação simples e escolha a melhor opção explicando por quê.',category:'Tomada de decisão',skills:['Tomada de decisão','Pensamento crítico'],minutes:30,xp:175,evidence:['TEXT','LINK']},
    {title:`Explique por que ${title} vale a pena`,description:'Prepare uma explicação clara sobre o que essa conquista significa para você.',instructions:'Apresente seus motivos, o esforço necessário e o que espera aprender.',category:'Comunicação',skills:['Comunicação','Responsabilidade'],minutes:20,xp:125,evidence:['TEXT','AUDIO']},
    {title:`Crie um plano para chegar a ${title}`,description:'Transforme a conquista em etapas pequenas, com datas e próximos passos.',instructions:'Defina pelo menos quatro etapas e o primeiro passo da próxima semana.',category:category||'Organização',skills:['Organização','Autonomia'],minutes:30,xp:200,evidence:['TEXT','IMAGE']},
  ];
}

export async function POST(request:Request){
  try{
    const{admin,user}=await requireApiUser(request);
    const body=await request.json().catch(()=>({}));
    const conquest=await admin.from('conquests').select('*').eq('id',String(body.conquestId||'')).single();
    if(conquest.error)throw conquest.error;
    const member=await admin.from('family_members').select('role').eq('family_id',conquest.data.family_id).eq('profile_id',user.id).single();
    if(member.error||!(user.id===conquest.data.youth_id||member.data.role==='PARENT'))throw new Error('UNAUTHORIZED');
    const existing=await admin.from('journeys').select('id').eq('conquest_id',conquest.data.id).maybeSingle();
    if(existing.data)return NextResponse.json({ok:true,journeyId:existing.data.id,existing:true});
    const youth=await admin.from('youth_profiles').select('*').eq('profile_id',conquest.data.youth_id).single();
    const parentMember=await admin.from('family_members').select('profile_id').eq('family_id',conquest.data.family_id).eq('role','PARENT').limit(1).single();
    const parent=parentMember.data?await admin.from('parent_profiles').select('*').eq('profile_id',parentMember.data.profile_id).single():null;
    const catalog=await admin.from('missions').select('*').eq('status','ACTIVE').is('family_id',null);
    if(catalog.error)throw catalog.error;
    const completed=await admin.from('mission_assignments').select('mission_id').eq('youth_id',conquest.data.youth_id).eq('status','APPROVED');
    const done=new Set((completed.data||[]).map(x=>x.mission_id));
    const goals=(parent?.data?.development_goals||[]) as string[],likes=(youth.data?.interests||[]) as string[];
    const months=monthsUntil(conquest.data.desired_date),count=recommendedCount(months),pace=cadence(count,months);
    const scored=(catalog.data||[]).map(m=>{
      let score=0;const reasons:string[]=[];
      const skillHits=(m.skills||[]).filter((x:string)=>goals.some(g=>g.toLowerCase()===x.toLowerCase()||x.toLowerCase().includes(g.toLowerCase())||g.toLowerCase().includes(x.toLowerCase()))).length;
      if(skillHits){score+=skillHits*4;reasons.push('Desenvolve prioridades da família')}
      const interestHits=(m.interests||[]).filter((x:string)=>likes.some(i=>i.toLowerCase()===x.toLowerCase()||x.toLowerCase().includes(i.toLowerCase())||i.toLowerCase().includes(x.toLowerCase()))).length;
      if(interestHits){score+=interestHits*3;reasons.push('Combina com os interesses do jovem')}
      if((m.goal_categories||[]).includes(conquest.data.category)){score+=3;reasons.push('Ajuda diretamente nesta conquista')}
      if((youth.data?.age||14)>=m.recommended_age_min&&(youth.data?.age||14)<=m.recommended_age_max){score+=1;reasons.push('Adequada para a idade')}
      if(done.has(m.id))score-=20;
      return{m,score,reasons};
    }).sort((a,b)=>b.score-a.score);
    const chosen:typeof scored=[];const perCategory=new Map<string,number>();
    for(const item of scored){const n=perCategory.get(item.m.category)||0;if(n>=Math.max(2,Math.ceil(count/5)))continue;chosen.push(item);perCategory.set(item.m.category,n+1);if(chosen.length>=Math.max(0,count-4))break}
    for(const item of scored)if(chosen.length<count-4&&!chosen.includes(item))chosen.push(item);
    const journey=await admin.from('journeys').insert({conquest_id:conquest.data.id,family_id:conquest.data.family_id,youth_id:conquest.data.youth_id,estimated_duration_months:months,recommended_mission_count:count,cadence_label:pace}).select().single();
    if(journey.error)throw journey.error;
    const adapted=adaptive(conquest.data.title,conquest.data.category);
    const rows=[...adapted.map((m,i)=>({journey_id:journey.data.id,family_id:conquest.data.family_id,source_mission_id:null,title:m.title,description:m.description,instructions:m.instructions,category:m.category,skills:m.skills,estimated_minutes:m.minutes,xp_reward:m.xp,goal_progress_reward:Math.max(1,Math.floor(100/count)),evidence_types:m.evidence,phase:Math.min(4,Math.floor(i/(count/4))+1),mission_order:i+1,recommendation_score:20,recommendation_reasons:['Personalizada para esta conquista'],is_custom:true})),...chosen.slice(0,count-4).map(({m,score,reasons},i)=>({journey_id:journey.data.id,family_id:conquest.data.family_id,source_mission_id:m.id,title:m.title,description:m.description,instructions:String((m.lesson_content as Record<string,unknown>)?.passo||(m.lesson_content as Record<string,unknown>)?.acao||m.description),category:m.category,skills:m.skills,estimated_minutes:m.estimated_minutes,xp_reward:m.xp_reward,goal_progress_reward:Math.max(1,Math.floor(100/count)),evidence_types:m.evidence_types,phase:Math.min(4,Math.floor((i+4)/(count/4))+1),mission_order:i+5,recommendation_score:score,recommendation_reasons:reasons,is_custom:false}))];
    const inserted=await admin.from('journey_missions').insert(rows);
    if(inserted.error)throw inserted.error;
    await admin.from('conquests').update({estimated_duration_months:months,recommended_mission_count:rows.length,cadence_label:pace}).eq('id',conquest.data.id);
    await admin.from('notifications').insert({recipient_id:parentMember.data.profile_id,family_id:conquest.data.family_id,type:'JOURNEY_REVIEW',title:`${youth.data?.profiles?.first_name||'O jovem'} criou uma nova conquista.`,message:'A proposta de jornada está pronta para sua revisão.',related_entity_id:journey.data.id,deep_link:'/?view=journey-review'});
    return NextResponse.json({ok:true,journeyId:journey.data.id,missionCount:rows.length,durationMonths:months,cadence:pace});
  }catch(error:unknown){
    const message=error instanceof Error?error.message:'';
    return NextResponse.json({error:message==='UNAUTHORIZED'?'Acesso não autorizado.':'Não foi possível criar a proposta agora.'},{status:message==='UNAUTHORIZED'?401:400});
  }
}
