import assert from'node:assert/strict';
import fs from'node:fs';
import{missionLibraryV2,libraryV2Stats}from'../data/mission-library-v2.mjs';
import{analyzeJourney,buildJourneyV2,willingnessAssessment,youthReadabilityAudit}from'../lib/mission-engine-v2.mjs';

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

const required=['FINANCIAL_LITERACY','AUTONOMY','COMMUNICATION','CRITICAL_THINKING','DECISION_MAKING','DISCIPLINE','ENTREPRENEURSHIP','ORGANIZATION','RESPONSIBILITY'];
const stats=libraryV2Stats();assert.equal(stats.count,60);assert.equal(stats.mechanics.length,11);assert.deepEqual(stats.ages,{12:20,14:20,17:20});
assert.equal(new Set(missionLibraryV2.map(x=>x.experience_pattern)).size,60,'60 mecânicas de experiência distintas');
for(const competency of required)assert(missionLibraryV2.some(x=>x.competencies.includes(competency)),`competência ${competency}`);
const audits=missionLibraryV2.map(youthReadabilityAudit);assert.equal(audits.filter(x=>x.status!=='PASS').length,0,'todas as experiências passam no readability gate');
const results=scenarios.map(s=>{const journey=buildJourneyV2({...s,history:[]}),analysis=analyzeJourney(journey,s.competencies),willingness=willingnessAssessment(journey);assert.equal(journey.length,s.age===17?10:8,`${s.id}: tamanho`);assert.equal(analysis.repeated_novelty_groups,0,`${s.id}: novelty`);assert(analysis.max_same_mechanic_run<=2,`${s.id}: mechanic run`);assert(analysis.pure_research_reflection_pct<=25,`${s.id}: reflexão`);assert.equal(analysis.high_load_consecutive,false,`${s.id}: carga alta`);assert(analysis.money_initiative_pct>0,`${s.id}: dinheiro/iniciativa`);assert(analysis.direct_goal_pct>0,`${s.id}: relação direta`);assert.equal(analysis.requested_competencies_covered.length,s.competencies.length,`${s.id}: competências prioritárias`);assert(journey.every(x=>x.readability.status==='PASS'),`${s.id}: legibilidade`);return{scenario:s,journey,analysis,willingness}});

const pt={EARN_SELL:'Ganhar e vender',NEGOTIATE:'Negociar',CREATE_BUILD:'Criar',INVESTIGATE_COMPARE:'Investigar e comparar',DECIDE:'Decidir',CONNECT_COMMUNICATE:'Conectar e conversar',TEACH_DEMONSTRATE:'Ensinar e demonstrar',PLAN_ORGANIZE:'Planejar e organizar',SOLVE_IMPROVE:'Resolver e melhorar',EXPERIMENT_PRACTICE:'Experimentar e praticar',TAKE_RESPONSIBILITY:'Assumir responsabilidade'};
let md='# Mission Library v2 local\n\n> Protótipo isolado. Não conectado ao banco ou ao Mission Engine atual.\n\n';
md+=`## Resumo\n\n- ${stats.count} experiências-base\n- ${stats.mechanics.length} mecânicas\n- 20 experiências para cada idade de referência: 12, 14 e 17\n- Readability Gate: ${audits.filter(x=>x.status==='PASS').length} PASS, ${audits.filter(x=>x.status==='REWRITE').length} REWRITE, ${audits.filter(x=>x.status==='REJECT').length} REJECT\n\n`;
md+='## As 60 experiências\n\n| ID | Idade | Título Youth | Mecânica | Resultado | Competências | Tempo | Carga | Segurança | Story |\n|---|---:|---|---|---|---|---:|---|---|---|\n';
for(const x of missionLibraryV2)md+=`| ${x.id} | ${x.age_min}–${x.age_max} | ${x.youth.title} | ${pt[x.mechanic]} | ${x.outcome_type} | ${x.competencies.join(', ')} | ${x.estimated_time} min | ${x.cognitive_load} | ${x.safety_level} | ${x.story_value} |\n`;
md+='\n## Auditoria das 15 jornadas\n';
for(const r of results){md+=`\n### ${r.scenario.id}: ${r.scenario.goal}\n\n**Perfil:** ${r.scenario.age} anos; interesses ${r.scenario.interests.join(', ')}; prioridades ${r.scenario.competencies.join(', ')}.\n\n| # | Missão | Mecânica | Por que entrou | Competências | Gate | Story | Segurança | Evidência | Relação |\n|---:|---|---|---|---|---|---|---|---|---|\n`;for(const x of r.journey)md+=`| ${x.order} | ${x.youth.title} | ${pt[x.mechanic]} | ${x.selection_reason.join('; ')} | ${x.competencies.join(', ')} | PASS (${Object.values(x.youth_interest_gate).filter(v=>v==='HIGH').length} fortes) | ${x.story_value} | ${x.safety_level} | ${x.proof_types.join(', ')} | ${x.goal_relevance} |\n`;md+=`\n**Diversidade:** \`${JSON.stringify(r.analysis)}\`\n\n**Eu toparia? ${r.willingness.verdict}.** ${r.willingness.strong} fortes, ${r.willingness.acceptable} aceitáveis, ${r.willingness.weak} fracas. ${r.willingness.explanation}\n`}
md+='\n## 15 missões completas como o Youth veria\n';
for(const age of[12,14,17]){md+=`\n### ${age} anos\n`;for(const x of missionLibraryV2.filter(x=>age>=x.age_min&&age<=x.age_max).slice(0,5)){md+=`\n#### ${x.youth.title}\n\n**O desafio**\n\n${x.youth.challenge}\n\n**Por que vale a pena**\n\n${x.youth.why}\n\n**Como fazer**\n\n${x.youth.steps.map((s,i)=>`${i+1}. ${s}`).join('\n')}\n\n**Exemplo**\n\n${x.youth.example}\n\n**Dica KONKI**\n\n${x.youth.tip}\n\n**O que você precisa mostrar**\n\n${x.youth.proof}\n\n**Tempo:** ${x.estimated_time} min\n`}}
md+='\n## Pontos fracos observáveis\n\n- A biblioteca ainda precisa de teste qualitativo com jovens reais; o gate local verifica clareza estrutural, não entusiasmo real.\n- Algumas experiências de dinheiro dependem de permissão e contexto familiar. O gerador precisa ter preferências familiares antes de ativá-las.\n- Compatibilidade com interesses ainda usa grupos amplos. Uma versão futura deve representar preferências positivas e recusas explícitas.\n- Os exemplos são escritos manualmente. Variação contextual futura deve preservar o Readability Gate.\n- XP e pesos de progresso não fazem parte deste protótipo; precisam ser calibrados somente depois de validar a biblioteca.\n';
fs.mkdirSync('docs/mission-library-v2',{recursive:true});fs.writeFileSync('docs/mission-library-v2/review.md',md);fs.writeFileSync('docs/mission-library-v2/results.json',JSON.stringify({generated_at:new Date().toISOString(),stats,audits,results},null,2));
console.log(JSON.stringify({status:'PASS',stats,journeys:results.map(r=>({id:r.scenario.id,...r.analysis,willingness:r.willingness.verdict})),report:'docs/mission-library-v2/review.md'},null,2));
