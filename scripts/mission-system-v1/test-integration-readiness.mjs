import{MISSION_CONTRACTS}from'../../data/mission-system-v1/mission-contracts.mjs';
import{CANONICAL_MISSION_CONTENT}from'../../data/mission-system-v1/canonical-content/index.mjs';
import{COMPLETION_CONTRACTS}from'../../data/mission-system-v1/completion-contracts.mjs';
import{CATALOGS}from'../../data/mission-system-v1/catalogs/catalog-index.mjs';
import{NAMED_FIXTURES,fixture,allCatalogs}from'../../data/mission-system-v1/fixtures.mjs';
import{classifyGoal}from'../../lib/mission-system-v1/classify-goal.mjs';
import{normalizeComposerContext}from'../../lib/mission-system-v1/normalize-context.mjs';
import{evaluateEligibility}from'../../lib/mission-system-v1/eligibility.mjs';
import{composeJourney}from'../../lib/mission-system-v1/journey-composer.mjs';
import{materializeMission}from'../../lib/mission-system-v1/mission-materializer.mjs';
import{validateCompletion}from'../../lib/mission-system-v1/completion-validator.mjs';
import{validateVersionCompatibility}from'../../lib/mission-system-v1/version-compatibility.mjs';
import{materializationFixture}from'./materialization-fixtures.mjs';
import{completionSubmissionFor}from'./completion-fixtures.mjs';
import{harness,assert}from'./test-helpers.mjs';

const h=harness('integration-readiness');
const scenarios=[
 ['PS5 / 12',NAMED_FIXTURES.physical_product_age12_ps5],
 ['produto físico / 14',fixture({age:14,type:'PHYSICAL_PRODUCT',title:'Comprar um tênis'})],
 ['guitarra / 14',NAMED_FIXTURES.skill_age14_guitar],
 ['skill / 17',NAMED_FIXTURES.skill_age17_video_editing],
 ['pequeno negócio / 15',NAMED_FIXTURES.project_age15_small_business],
 ['projeto de evento / 17',NAMED_FIXTURES.project_age17_small_show],
 ['viagem / 14',NAMED_FIXTURES.travel_age14_family_trip],
 ['experiência/show / 13',NAMED_FIXTURES.experience_age13_concert],
 ['carreira / 17',NAMED_FIXTURES.career_age17_engineering],
 ['financial goal / 16',NAMED_FIXTURES.financial_goal_age16_save_1000]
];

function applyRealMutations(raw,mutations){const next=structuredClone(raw);for(const mutation of mutations){if(typeof mutation.value==='boolean')next.runtimeState.flags[mutation.key]=mutation.value;else next.runtimeState.values[mutation.key]=mutation.value}return next}

for(const [name,input]of scenarios)h.test(`E2E ${name}`,()=>{
  const raw=structuredClone(input),classification=classifyGoal(raw.goal.title);assert.equal(classification.code,'MISSION_SELECTED');raw.goal.primaryGoalType=classification.primaryGoalType;
  const normalized=normalizeComposerContext(raw),before=structuredClone(normalized.runtimeState),first=composeJourney(raw);assert.equal(first.code,'MISSION_SELECTED');assert.ok(first.missions.length);
  assert.deepEqual(normalized.runtimeState,before,'expected state não pode mutar o estado real');
  const missionId=first.missions[0].missionId,fixtureData=materializationFixture(missionId),materialized=materializeMission(missionId,fixtureData.variables,{...fixtureData.executionContext,youthAge:raw.youth.age,goalType:raw.goal.primaryGoalType});assert.equal(materialized.code,'MISSION_SELECTED');
  const completed=validateCompletion(missionId,completionSubmissionFor(missionId));assert.equal(completed.valid,true);
  let evolved=applyRealMutations(raw,completed.mutations);evolved.missionHistory.push({missionId,outcome:'COMPLETED'});const second=composeJourney(evolved);assert.ok(['MISSION_SELECTED','NO_ELIGIBLE_MISSION'].includes(second.code));if(second.code==='MISSION_SELECTED')assert.notEqual(second.missions[0].missionId,missionId);
});

h.test('contexto insuficiente',()=>assert.equal(composeJourney(NAMED_FIXTURES.no_context_age14).code,'CONTEXT_TOO_WEAK'));
h.test('falta de aprovação é gate, não sucesso',()=>{const c=normalizeComposerContext(NAMED_FIXTURES.no_parent_approval_age12);assert.equal(evaluateEligibility(MISSION_CONTRACTS.M01,c).status,'ELIGIBLE_IF')});
h.test('catálogo ausente elimina missão dependente',()=>{const raw=fixture({age:16,type:'FINANCIAL_GOAL',title:'Juntar dinheiro'});raw.catalogAvailability={...allCatalogs,CONTRIBUTION_METHOD_CATALOG:false};const e=evaluateEligibility(MISSION_CONTRACTS.M40,normalizeComposerContext(raw));assert.equal(e.resultCode,'CATALOG_ENTRY_NOT_AVAILABLE')});
h.test('variante canônica ausente é gap editorial pré-seleção',()=>{for(const age of[13,15,16]){const raw=fixture({age,type:'FINANCIAL_GOAL',title:'Juntar dinheiro'}),e=evaluateEligibility(MISSION_CONTRACTS.M01,normalizeComposerContext(raw));assert.equal(e.resultCode,'EDITORIAL_VARIANT_GAP')}});
h.test('resultado inesperado replaneja sem fabricar sucesso',()=>{const raw=fixture({age:15,type:'PROJECT',title:'Criar um pequeno negócio'});raw.runtimeState.flags.offer_defined=true;raw.runtimeState.flags.accepted_offer=false;raw.runtimeState.values.approved_person='FAMILY';delete raw.runtimeState.values.delivery_scope;delete raw.runtimeState.values.recipient;const negative=validateCompletion('M05',completionSubmissionFor('M05',{negative:true}));assert.equal(negative.valid,true);assert.equal(negative.mutations.length,0);assert.notEqual(raw.runtimeState.flags.accepted_offer,true);const before=composeJourney(raw);raw.missionHistory.push({missionId:'M05',outcome:'REFUSED'});raw.activeMultiDay=[{missionId:'unexpected-heavy-obligation',energy:'HEAVY'}];const after=composeJourney(raw);assert.notDeepEqual(after.missions.map(x=>x.missionId),before.missions.map(x=>x.missionId));assert.equal(after.missions.some(x=>x.missionId==='M35'),false);const dependent=evaluateEligibility(MISSION_CONTRACTS.M06,normalizeComposerContext(raw));assert.notEqual(dependent.status,'ELIGIBLE')});

h.test('Composer nunca entrega combinação que Materializer rejeita por variante',()=>{for(const contract of Object.values(MISSION_CONTRACTS))for(let age=contract.age.min;age<=contract.age.max;age++){const raw=fixture({age,type:contract.naturalGoalTypes[0],title:'Objetivo compatível'}),context=normalizeComposerContext(raw),eligibility=evaluateEligibility(contract,context);if(eligibility.status!=='ELIGIBLE')continue;const f=materializationFixture(contract.id),result=materializeMission(contract.id,f.variables,{...f.executionContext,youthAge:age,goalType:contract.naturalGoalTypes[0]});assert.notEqual(result.code,'CANONICAL_VARIANT_NOT_AVAILABLE',`${contract.id}/${age}`)}});
h.test('versões 45/45 compatíveis',()=>{for(const contract of Object.values(MISSION_CONTRACTS)){const content=CANONICAL_MISSION_CONTENT[contract.id],rule=COMPLETION_CONTRACTS[contract.id],catalogs=contract.allowedCatalogs.map(id=>CATALOGS[id]);assert.equal(validateVersionCompatibility({contract,content,completionRule:rule,catalogs}).compatible,true,contract.id)}});
h.test('combinação de versão incompatível é rejeitada',()=>{const check=validateVersionCompatibility({contract:{...MISSION_CONTRACTS.M01,contractVersion:'2.0.0'},content:CANONICAL_MISSION_CONTENT.M01,completionRule:COMPLETION_CONTRACTS.M01,catalogs:[]});assert.equal(check.compatible,false)});

h.finish();
