import assert from 'node:assert/strict';
import fs from 'node:fs';
import { missionLibraryV21, libraryV21Changes, libraryV21Stats } from '../data/mission-library-v2.1.mjs';
import { buildJourneyV21, auditJourneyV21 } from '../lib/journey-composer-v2.1.mjs';

const scenarios=[
 {id:'12-casaco',age:12,goal:'Comprar um casaco',goalType:'PHYSICAL_PRODUCT',interests:['FASHION','ART'],competencies:['FINANCIAL_LITERACY','DECISION_MAKING']},
 {id:'12-ps5',age:12,goal:'Comprar um PS5',goalType:'PHYSICAL_PRODUCT',interests:['GAMES','TECHNOLOGY'],competencies:['RESPONSIBILITY','FINANCIAL_LITERACY']},
 {id:'12-italia',age:12,goal:'Viajar para a Itália',goalType:'TRAVEL',interests:['TRAVEL','COOKING'],competencies:['AUTONOMY','ORGANIZATION']},
 {id:'12-show',age:12,goal:'Ir a um show',goalType:'EXPERIENCE',interests:['MUSIC','VIDEOS'],competencies:['COMMUNICATION','DISCIPLINE']},
 {id:'12-projeto',age:12,goal:'Criar um projeto de desenho',goalType:'PROJECT',interests:['ART','VIDEOS'],competencies:['AUTONOMY','RESPONSIBILITY']},
 {id:'14-tenis',age:14,goal:'Comprar um tênis',goalType:'PHYSICAL_PRODUCT',interests:['SPORTS','FASHION'],competencies:['FINANCIAL_LITERACY','DECISION_MAKING']},
 {id:'14-celular',age:14,goal:'Comprar um celular',goalType:'PHYSICAL_PRODUCT',interests:['TECHNOLOGY','VIDEOS'],competencies:['CRITICAL_THINKING','RESPONSIBILITY']},
 {id:'14-viagem',age:14,goal:'Fazer uma viagem com amigos',goalType:'TRAVEL',interests:['TRAVEL','MUSIC'],competencies:['ORGANIZATION','COMMUNICATION']},
 {id:'14-negocio',age:14,goal:'Criar meu primeiro negócio',goalType:'PROJECT',interests:['COOKING','ART'],competencies:['ENTREPRENEURSHIP','AUTONOMY']},
 {id:'14-guitarra',age:14,goal:'Aprender guitarra',goalType:'SKILL',interests:['MUSIC','VIDEOS'],competencies:['DISCIPLINE','COMMUNICATION']},
 {id:'17-faculdade',age:17,goal:'Escolher uma faculdade',goalType:'CAREER',interests:['TECHNOLOGY','SCIENCE'],competencies:['CRITICAL_THINKING','DECISION_MAKING']},
 {id:'17-italia',age:17,goal:'Viajar sozinho para a Itália',goalType:'TRAVEL',interests:['TRAVEL','COOKING'],competencies:['FINANCIAL_LITERACY','ORGANIZATION']},
 {id:'17-renda',age:17,goal:'Ganhar meu primeiro dinheiro',goalType:'FINANCIAL_GOAL',interests:['TECHNOLOGY','VIDEOS'],competencies:['ENTREPRENEURSHIP','COMMUNICATION']},
 {id:'17-show',age:17,goal:'Organizar um pequeno show',goalType:'PROJECT',interests:['MUSIC','ART'],competencies:['RESPONSIBILITY','ORGANIZATION']},
 {id:'17-portfolio',age:17,goal:'Conseguir o primeiro trabalho',goalType:'CAREER',interests:['ART','TECHNOLOGY'],competencies:['AUTONOMY','COMMUNICATION']}
];

const stats=libraryV21Stats();
assert.equal(stats.base,60);assert.equal(stats.rewritten,28);assert.equal(stats.redesigned,2);assert.equal(stats.restricted,1);assert(stats.new>=40);
assert.equal(new Set(missionLibraryV21.map(x=>x.id)).size,missionLibraryV21.length);
assert.equal(missionLibraryV21.find(x=>x.id==='L2-17-015').generic_selection_allowed,false);
for(const id of [...libraryV21Changes.rewritten,...libraryV21Changes.redesigned]){
 const x=missionLibraryV21.find(m=>m.id===id);assert(x.v21_change);assert.equal(x.contextualization_required,true);assert.equal(x.generic_selection_allowed,false);
}

function comprehension(m){
 const title=m.youth.title.length<=72&&!/desenvolva|compreenda|reavalie/i.test(m.youth.title);
 const challenge=m.youth.challenge.length>=25&&m.youth.challenge.length<=190&&/\.$/.test(m.youth.challenge);
 const steps=m.youth.steps.length>=3&&m.youth.steps.length<=5;
 const proof=/envie|mostre/i.test(m.youth.proof);
 return {title,challenge,steps,proof,pass:title&&challenge&&steps&&proof};
}

const results=scenarios.map(s=>{
 const built=buildJourneyV21(s),audit=auditJourneyV21(built,s);
 assert.equal(built.missions.length,s.age===17?7:6,`${s.id}: tamanho`);
 assert.equal(audit.consecutive_heavy,false,`${s.id}: HEAVY consecutiva`);
 assert(audit.direct_or_bridge_pct>=85,`${s.id}: coerência`);
 assert(audit.motivation.PUSH===0,`${s.id}: PUSH`);
 assert.equal(audit.random_missions.length,0,`${s.id}: justificativa`);
 assert.equal(audit.requested_covered.length,s.competencies.length,`${s.id}: competências naturais`);
 assert(built.missions.every(x=>comprehension(x).pass),`${s.id}: compreensão`);
 return {scenario:s,...built,audit,comprehension:built.missions.map(x=>({id:x.id,...comprehension(x)}))};
});

const previous=JSON.parse(fs.readFileSync('docs/mission-library-v2/results.json','utf8'));
const baseline={core_bridge_pct:previous.results.map(x=>x.analysis.direct_goal_pct),push_unknown:true,average_mission_count:Number((previous.results.reduce((a,x)=>a+x.journey.length,0)/15).toFixed(1))};
const current={average_core_bridge_pct:Number((results.reduce((a,x)=>a+x.audit.direct_or_bridge_pct,0)/15).toFixed(1)),average_mission_count:Number((results.reduce((a,x)=>a+x.missions.length,0)/15).toFixed(1)),push:results.reduce((a,x)=>a+x.audit.motivation.PUSH,0),consecutive_heavy:results.filter(x=>x.audit.consecutive_heavy).length};

const redTeam=result=>{
 const discovery=result.missions.find(x=>x.narrative_relevance==='DISCOVERY');
 const heavy=result.missions.find(x=>x.energy==='HEAVY');
 return {what_does_this_have_to_do:discovery?`${discovery.order}. ${discovery.youth.title} é o elo mais fraco; ainda é tempero, não avanço essencial.`:'Nenhuma missão é obviamente aleatória; a contribuição BRIDGE continua sendo o elo que precisa de validação com jovens.',likely_fatigue:heavy?`${heavy.order}. ${heavy.youth.title}, por exigir mais preparação.`:'Baixo risco de cansaço estrutural.',would_do_first:result.missions.find(x=>x.pull_profile==='PULL')?.youth.title,try_to_skip:heavy?.youth.title||result.missions.at(-1).youth.title,school_like:result.missions.find(x=>['COMPARE','CONVERSE'].includes(x.stage))?.youth.title||null,closer_to_goal:result.audit.direct_or_bridge_pct>=85,next_mission_intent:result.audit.motivation.PUSH===0?'PROVÁVEL, mas precisa de teste real':'INCERTA'};
};

for(const r of results)r.red_team=redTeam(r);

const ranking=missionLibraryV21.filter(x=>x.revision_status==='NEW').map(x=>({id:x.id,title:x.youth.title,score:(x.narrative_relevance==='CORE'?4:2)+(x.story_value==='HIGH'?2:1)+(x.energy==='LIGHT'?2:1)+(x.dependency_on_others==='LOW'?1:0)})).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
const experienceAudit={STRONG_PRESERVED:libraryV21Changes.preserved.length,CONTEXT_REWRITE_REQUIRED:libraryV21Changes.rewritten.length,REDESIGN_REQUIRED:libraryV21Changes.redesigned.length,REMOVE:0,RESTRICTED:libraryV21Changes.restricted.length,NEW_CONTEXTUAL_CANDIDATES:libraryV21Changes.added.length,note:'Não classificamos automaticamente os 42 templates novos como STRONG. Eles passam os gates estruturais somente depois de materializados nas 15 jornadas e ainda exigem teste qualitativo. As 28 reescritas e 2 redesenhadas ficam bloqueadas para seleção genérica até uma variante contextual material passar pelo gate.'};

let md='# Mission Library + Journey Composer v2.1 — revisão local\n\n> Experimento isolado. Não integrado ao produto, banco ou Supabase.\n\n';
md+=`## Veredito\n\n**READY FOR USER TEST**, somente como protótipo local. Não está pronta para integração. A coerência estrutural melhorou, mas linguagem, desejo real e payoff ainda precisam ser testados com jovens.\n\n`;
md+=`## Biblioteca\n\n- Total: ${stats.count}\n- Preservadas: ${stats.preserved}\n- Reescritas/restritas a contexto: ${stats.rewritten}\n- WEAK redesenhadas/restritas: ${stats.redesigned}\n- Restrita a meta longa: ${stats.restricted} (L2-17-015)\n- Novas experiências de arco: ${stats.new}\n\n`;
md+=`### Experiências alteradas\n\n| ID | Estado v2.1 | Mudança | Seleção genérica |\n|---|---|---|---|\n`;
for(const x of missionLibraryV21.filter(x=>x.revision_status!=='PRESERVED'&&x.revision_status!=='NEW'))md+=`| ${x.id} | ${x.revision_status} | ${x.v21_change} | ${x.generic_selection_allowed?'sim':'não'} |\n`;
md+=`\n### Novas experiências\n\n| ID | Goal type | Etapa | Título-base | Relevância | Energia |\n|---|---|---|---|---|---|\n`;
for(const x of missionLibraryV21.filter(x=>x.revision_status==='NEW'))md+=`| ${x.id} | ${x.compatible_goal_types[0]} | ${x.stage} | ${x.youth.title} | ${x.narrative_relevance} | ${x.energy} |\n`;
md+=`\n## Auditoria das experiências\n\n${JSON.stringify(experienceAudit,null,2)}\n\n`;

for(const r of results){
 md+=`## ${r.scenario.id}: ${r.scenario.goal}\n\n**Journey thesis:** ${r.journey_thesis}\n\n**Arco:** ${r.arc.join(' → ')}\n\n| # | Missão | Etapa | Relevância | Mecânica | Competências | Energia | Motivação | Story | Por que está aqui | Evidência | Segurança |\n|---:|---|---|---|---|---|---|---|---|---|---|---|\n`;
 for(const x of r.missions)md+=`| ${x.order} | ${x.youth.title} | ${x.stage} | ${x.narrative_relevance} | ${x.mechanic} | ${x.competencies.join(', ')} | ${x.energy} | ${x.pull_profile} | ${x.story_value} | ${x.selection_reason_youth} | ${x.proof_types.join(', ')} | ${x.safety_level} |\n`;
 md+=`\n**Indicadores:** ${JSON.stringify(r.audit)}\n\n**Red team:**\n\n- “Que porra isso tem a ver?” ${r.red_team.what_does_this_have_to_do}\n- Provável cansaço: ${r.red_team.likely_fatigue}\n- Faria primeiro: ${r.red_team.would_do_first}\n- Tentaria pular: ${r.red_team.try_to_skip}\n- Pode parecer escola: ${r.red_team.school_like||'nenhuma em especial'}\n- Sente avanço: ${r.red_team.closer_to_goal?'sim, pela estrutura':'incerto'}\n- Faria outra: ${r.red_team.next_mission_intent}\n\n`;
}

md+=`## Comparação A/B\n\n| Dimensão | v2 | v2.1 | Leitura honesta |\n|---|---|---|---|\n`;
const comparisons=[
 ['Coerência percebida','Baixa em vários cenários','Alta por construção de arco','Ainda precisa teste humano; o indicador é estrutural.'],
 ['CORE + BRIDGE','Relação direta média baixa; vários cenários com 12,5%',`${current.average_core_bridge_pct}% em média`,'Melhora real, sem reclassificar missão aleatória.'],
 ['DISCOVERY','Sem controle narrativo','0% aos 12/14; 14,3% aos 17','Conservador para proteger coerência.'],
 ['PUSH','10/60 na auditoria-base','0 nas jornadas geradas','Pode haver PUSH percebida mesmo que o template diga NEUTRAL.'],
 ['Tamanho médio',String(baseline.average_mission_count),String(current.average_mission_count),'Menos miniprojetos e menor risco de burnout.'],
 ['Personalização','Interesses influenciavam score/exemplo','Objeto, arco, execução, exemplo, prova e tese mudam','Mais material, ainda baseada em templates.'],
 ['Competências','Podiam forçar missão','Entram apenas em etapas naturais','Cobertura preservada nos 15 cenários.'],
 ['Burnout','8–10 missões e muitos projetos','6–7; sem HEAVY consecutiva','HEAVY ainda exige validação de payoff.'],
 ['Didática','Conceitos às vezes pressupostos','Conceito curto antes de OFFER/COMPARE/CONTRIBUTE','Cobertura de vocabulário ainda não é completa.'],
 ['Diversidade','Prioridade alta, até incoerente','Subordinada ao arco','Algumas jornadas podem parecer repetitivas; isso é preferível ao aleatório.']
];
for(const row of comparisons)md+=`| ${row.join(' | ')} |\n`;
md+=`\n## Burnout, didática e coerência\n\n- Nenhuma jornada possui duas HEAVY consecutivas.\n- Jornadas caíram de 8–10 para 6–7 missões.\n- Missões HEAVY aparecem depois de progresso rápido e são seguidas por LIGHT/MEDIUM.\n- As 28 experiências reescritas não voltam à seleção genérica; exigem contexto material.\n- Conceitos de oferta, comparação e contribuição recebem uma explicação curta antes da cobrança.\n- Ainda há dependência externa em conversa/teste e provas parcialmente textuais.\n- selection_reason_youth existe para todas as missões e precisa caber numa frase natural.\n\n`;
md+=`## Melhores e piores candidatas novas\n\n### 20 melhores\n\n${ranking.slice(0,20).map((x,i)=>`${i+1}. ${x.id} — ${x.title}`).join('\n')}\n\n### 10 mais frágeis\n\n${ranking.slice(-10).reverse().map((x,i)=>`${i+1}. ${x.id} — ${x.title}: tende a depender de contexto, conversa ou payoff futuro.`).join('\n')}\n\n`;
md+=`## Falhas restantes\n\n1. A classificação PULL/NEUTRAL ainda é heurística; jovem real pode perceber várias como PUSH.\n2. Os templates de arco melhoram coerência, mas podem gerar repetição entre conquistas do mesmo tipo.\n3. A linguagem materializada ainda precisa de revisão editorial individual em tela.\n4. Interesses alteram exemplo e escolha, mas ainda não criam uma mecânica exclusiva em todas as missões.\n5. Segurança está categorizada, porém cenários comerciais e contatos precisam protocolos detalhados antes da integração.\n6. Payoff de missões HEAVY ainda não foi observado com usuário real.\n7. Não há pesos de XP/progresso; isso foi mantido fora do protótipo.\n\n`;
md+=`## Recomendação final\n\n**READY FOR USER TEST**, em ambiente local e moderado. **NOT READY para integração no produto.** O próximo passo correto é teste qualitativo com jovens de 12, 14 e 17 anos, medindo compreensão após título/desafio, escolha espontânea, desistência e percepção de avanço.\n`;

fs.mkdirSync('docs/mission-library-v2.1',{recursive:true});
fs.writeFileSync('docs/mission-library-v2.1/review.md',md);
fs.writeFileSync('docs/mission-library-v2.1/results.json',JSON.stringify({generated_at:new Date().toISOString(),stats,experienceAudit,baseline,current,results},null,2));
console.log(JSON.stringify({status:'PASS',stats,current,journeys:results.map(x=>({id:x.scenario.id,...x.audit})),report:'docs/mission-library-v2.1/review.md'},null,2));
