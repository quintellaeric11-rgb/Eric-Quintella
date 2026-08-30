import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {loadLocalEnv} from './env.mjs';
import {buildJourney,classifyGoal,complexityFor} from '../lib/mission-engine.mjs';

loadLocalEnv();
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const service=process.env.SUPABASE_SERVICE_ROLE_KEY;
assert(url&&service,'Variáveis Supabase ausentes');
const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
const{data:archetypes,error}=await admin.from('mission_archetypes').select('*').eq('is_active',true);
if(error)throw error;
assert.equal(archetypes.length,36,'A biblioteca deve ter 36 arquétipos ativos');

const cases=[
  {name:'casaco',goal:'Quero comprar um casaco',age:12,skills:['Educação financeira']},
  {name:'PS5',goal:'Quero comprar um PS5',age:14,skills:['Educação financeira','Tomada de decisão']},
  {name:'Itália',goal:'Quero viajar para a Itália',age:16,skills:['Autonomia','Comunicação','Organização','Pensamento crítico']},
  {name:'show',goal:'Quero ir a um show',age:15,skills:['Autonomia','Organização']},
  {name:'negócio',goal:'Quero criar meu primeiro negócio',age:17,skills:['Empreendedorismo','Comunicação','Organização','Pensamento crítico']},
];
const reports=[];
for(const sample of cases){
  const classification=classifyGoal(sample.goal);
  const complexity=complexityFor(classification,sample.skills,sample.age);
  const missions=buildJourney({classification,complexity,archetypes,parentGoals:sample.skills,interests:['Tecnologia','Viagens'],age:sample.age});
  assert.equal(missions.length,complexity.count,`${sample.name}: quantidade`);
  assert(missions.length>=6&&missions.length<=24,`${sample.name}: faixa de quantidade`);
  assert.equal(Number(missions.reduce((sum,m)=>sum+m.progress_percentage,0).toFixed(4)),100,`${sample.name}: progresso`);
  assert(missions.every(m=>m.effort_weight>=1&&m.effort_weight<=5),`${sample.name}: pesos`);
  assert(missions.every(m=>m.why_this_mission.length>45),`${sample.name}: justificativa`);
  assert(missions.every(m=>m.contextualized_micro_lesson&&m.contextualized_steps.length&&m.contextualized_evidence_request),`${sample.name}: conteúdo`);
  assert(missions.every(m=>!m.title.toLowerCase().includes(sample.goal.toLowerCase())),`${sample.name}: meta bruta concatenada`);
  assert(missions.every(m=>!/(^|\s)(de o|de a|em o|em a)(\s|$)/i.test(m.title)),`${sample.name}: concatenação gramatical quebrada`);
  const distribution=missions.reduce((acc,m)=>{acc[m.archetype.category]=(acc[m.archetype.category]||0)+1;return acc},{});
  assert(Math.abs((distribution.DEVELOPMENT_CONTEXTUALIZED||0)/missions.length-.50)<=.13,`${sample.name}: proporção desenvolvimento`);
  assert(Math.abs((distribution.CONQUEST||0)/missions.length-.35)<=.15,`${sample.name}: proporção conquista`);
  assert(Math.abs((distribution.EXPANSION||0)/missions.length-.15)<=.08,`${sample.name}: proporção expansão`);
  reports.push({objetivo:sample.name,tipo:classification.goal_type,complexidade:complexity.band,pontuacao:complexity.score,missoes:missions.length,semanas:complexity.suggested_weeks,distribuicao:distribution,titulos:missions.slice(0,4).map(m=>m.title)});
}
assert(new Set(reports.map(r=>r.missoes)).size>=3,'Os cenários devem gerar quantidades diferentes');
const realProfileClassification=classifyGoal('quero comprar um tenis');
const realProfileComplexity=complexityFor(realProfileClassification,['Comunicação','Tomada de decisão','Pensamento crítico','Educação financeira'],19);
const realProfileMissions=buildJourney({classification:realProfileClassification,complexity:realProfileComplexity,archetypes,parentGoals:['Comunicação','Tomada de decisão','Pensamento crítico','Educação financeira'],interests:['Culinária','Tecnologia','Games','Vídeos','Esportes'],age:19});
assert.equal(realProfileMissions.length,realProfileComplexity.count,'Perfil real de 19 anos deve receber jornada completa');
assert.equal(Number(realProfileMissions.reduce((sum,m)=>sum+m.progress_percentage,0).toFixed(4)),100,'Perfil real de 19 anos: progresso');
const ps5Classification=classifyGoal('Quero comprar um PS5'),ps5Skills=['Educação financeira','Tomada de decisão'];
const ageVersions=[12,14,17].map(age=>{const complexity=complexityFor(ps5Classification,ps5Skills,age),missions=buildJourney({classification:ps5Classification,complexity,archetypes,parentGoals:ps5Skills,interests:['Games','Tecnologia'],age});return{age,missions}});
for(const version of ageVersions){
  assert.equal(Number(version.missions.reduce((sum,m)=>sum+m.progress_percentage,0).toFixed(4)),100,`PS5 ${version.age}: progresso`);
  assert(version.missions.every(m=>m.pedagogical_age_band===String(version.age)),`PS5 ${version.age}: faixa persistida`);
  assert(version.missions.every(m=>m.technique_explanation&&m.contextualized_example&&m.autonomy_guidance&&m.parent_support_guidance),`PS5 ${version.age}: campos pedagógicos`);
}
const firstByAge=Object.fromEntries(ageVersions.map(v=>[v.age,v.missions[0]]));
assert.equal(new Set(ageVersions.map(v=>v.missions[0].title)).size,3,'PS5: título inicial deve variar materialmente');
assert.equal(new Set(ageVersions.map(v=>v.missions[0].technique_explanation)).size,3,'PS5: técnica deve variar');
assert.equal(new Set(ageVersions.map(v=>v.missions[0].contextualized_example)).size,3,'PS5: exemplo deve variar');
assert.equal(new Set(ageVersions.map(v=>v.missions[0].contextualized_evidence_request)).size,3,'PS5: evidência deve variar');
assert(firstByAge[12].contextualized_steps.length<firstByAge[17].contextualized_steps.length,'PS5: 17 anos deve ter mais etapas que 12');
assert(/responsável por perto|Parent pode ajudar/.test(`${firstByAge[12].contextualized_intro} ${firstByAge[12].parent_support_guidance}`),'PS5 12: apoio Parent explícito');
assert(/pesquisa, análise e recomendação ficam com o jovem/.test(firstByAge[17].parent_support_guidance),'PS5 17: autonomia real');
assert(/trade-off|custo de oportunidade/.test(`${firstByAge[17].technique_explanation} ${firstByAge[17].contextualized_example}`),'PS5 17: trade-offs');
assert(!/trade-off|matriz ponderada/.test(firstByAge[12].technique_explanation),'PS5 12: sem complexidade artificial');
const ps5Comparison=ageVersions.map(v=>({idade:v.age,missoes:v.missions.length,primeiro_titulo:v.missions[0].title,tecnica:v.missions[0].technique_explanation,passos:v.missions[0].contextualized_steps.length,exemplo:v.missions[0].contextualized_example,evidencia:v.missions[0].contextualized_evidence_request,autonomia:v.missions[0].autonomy_guidance}));
console.log(JSON.stringify(reports,null,2));
console.log(JSON.stringify({ps5_12_14_17:ps5Comparison},null,2));
const pedagogicalScenarios=[
  {age:12,goal:'Quero um PS5',skills:['Educação financeira','Tomada de decisão'],interests:['Games','Tecnologia']},
  {age:14,goal:'Quero viajar para o Japão',skills:['Autonomia','Organização','Pensamento crítico'],interests:['Viagens','Cultura']},
  {age:17,goal:'Quero criar meu primeiro negócio',skills:['Empreendedorismo','Comunicação','Pensamento crítico'],interests:['Empreendedorismo','Tecnologia']},
].map(sample=>{const classification=classifyGoal(sample.goal),complexity=complexityFor(classification,sample.skills,sample.age),mission=buildJourney({classification,complexity,archetypes,parentGoals:sample.skills,interests:sample.interests,age:sample.age})[0],allText=[mission.title,mission.why_this_mission,mission.contextualized_intro,mission.contextualized_example].join(' ');assert(mission.why_this_mission&&mission.contextualized_micro_lesson&&mission.technique_explanation&&mission.contextualized_steps.length&&mission.contextualized_example&&mission.contextualized_evidence_request,`${sample.age}: missão didática completa`);assert(!/(^|\s)(de o|de a|em o|em a|a o|a a)(\s|$)|\btransforma\s+transforma|\binvestigar\s+investigar/i.test(allText),`${sample.age}: composição gramatical: ${allText}`);if(sample.age===17)assert(!/compra nova|compra usada/i.test(mission.contextualized_example),'17 negócio: exemplo contextual');return{idade:sample.age,conquista:sample.goal,titulo:mission.title,por_que:mission.why_this_mission,o_que_fazer:mission.contextualized_intro,aprenda:mission.contextualized_micro_lesson,tecnica:mission.technique_explanation,passos:mission.contextualized_steps,exemplo:mission.contextualized_example,dica:mission.parent_support_guidance,agora_e_com_voce:mission.autonomy_guidance,evidencia:mission.contextualized_evidence_request,tempo_min:mission.archetype.estimated_minutes_min,progresso_percentual:mission.progress_percentage}});
console.log(JSON.stringify({pedagogical_scenarios:pedagogicalScenarios},null,2));
console.log('PASS: 36 arquétipos, cinco jornadas coerentes, adaptação material 12/14/17 e progresso total de 100%.');
