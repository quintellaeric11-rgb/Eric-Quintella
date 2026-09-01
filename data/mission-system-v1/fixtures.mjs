import{STATE_KEYS}from'./state-keys.mjs';import{CATALOGS}from'./catalogs/catalog-index.mjs';
export const allCatalogs=Object.fromEntries(Object.keys(CATALOGS).map(x=>[x,true]));
const falseByDefault=new Set(['item_ownership_unconfirmed','serious_family_conflict','decision_urgent','professional_or_unsafe_problem','coercive_request','unsafe_responsibility','goal_is_short_term','parent_promise_unconfirmed']);
export const richState={flags:Object.fromEntries(STATE_KEYS.filter(x=>x.type==='boolean').map(x=>[x.key,!falseByDefault.has(x.key)])),values:Object.fromEntries(STATE_KEYS.filter(x=>x.type!=='boolean').map(x=>[x.key,x.type==='number'?3:x.type==='array'?[`known_${x.key}`]:`known_${x.key}`]))};richState.values.audience_status='TARGET_AUDIENCE_CONFIRMED';richState.values.tester_status='TARGET_AUDIENCE_MEMBER';richState.values.proof_verification_mode='OBJECTIVE_ARTIFACT';
export function fixture({age=14,type='PHYSICAL_PRODUCT',title='Conquista de teste',targetMissionCount=5,metadata={}}={}){return{youth:{youthId:`y-${age}`,age,interests:['TECNOLOGIA','CRIAR'],autonomyLevel:age<14?'GUIDED':age<17?'MEDIUM':'HIGH'},goal:{goalId:`g-${type}`,title,description:'Contexto declarado pelo jovem',primaryGoalType:type,metadata:{realOptionsCount:3,...metadata}},family:{parentApprovalAvailable:true,permissions:['EXTERNAL_VALUE_ATTEMPT'],approvedPeopleRelations:['FAMILY'],moneyRules:{creditAllowed:false,debtAllowed:false,loansAllowed:false}},journey:{journeyId:'j-test',targetMissionCount},runtimeState:structuredClone(richState),catalogAvailability:{...allCatalogs},requestedCompetencies:['AUTONOMY','DECISION_MAKING','RESPONSIBILITY'],missionHistory:[],activeMultiDay:[]};}
export const JOURNEY_FIXTURES=[
 ['A',12,'PHYSICAL_PRODUCT','Comprar um PS5'],['B',14,'PHYSICAL_PRODUCT','Comprar um tênis'],['C',17,'TRAVEL','Viajar para a Itália'],['D',12,'EXPERIENCE','Ir a um show'],['E',14,'SKILL','Aprender fotografia'],['F',17,'PROJECT','Criar primeiro negócio'],['G',12,'FINANCIAL_GOAL','Juntar dinheiro'],['H',17,'CAREER_EDUCATION','Escolher um curso'],['I',14,'TRAVEL','Fazer uma viagem'],['J',17,'SKILL','Aprender programação'],['K',13,'PROJECT','Criar um projeto'],['L',16,'EXPERIENCE','Participar de um evento']
].map(([id,age,type,title])=>({id,input:fixture({age,type,title,targetMissionCount:5,metadata:{requiresFullProblemCycle:id==='F'}})}));
export const NAMED_FIXTURES=Object.freeze({
 physical_product_age12_ps5:fixture({age:12,type:'PHYSICAL_PRODUCT',title:'Comprar um PS5'}),
 physical_product_age16_notebook:fixture({age:16,type:'PHYSICAL_PRODUCT',title:'Comprar um notebook'}),
 skill_age14_guitar:fixture({age:14,type:'SKILL',title:'Aprender guitarra'}),
 skill_age17_video_editing:fixture({age:17,type:'SKILL',title:'Aprender edição de vídeo'}),
 project_age17_small_show:fixture({age:17,type:'PROJECT',title:'Produzir um pequeno show'}),
 project_age15_small_business:fixture({age:15,type:'PROJECT',title:'Criar um pequeno negócio'}),
 travel_age14_family_trip:fixture({age:14,type:'TRAVEL',title:'Fazer uma viagem em família'}),
 experience_age13_concert:fixture({age:13,type:'EXPERIENCE',title:'Ir a um show'}),
 career_age17_engineering:fixture({age:17,type:'CAREER_EDUCATION',title:'Explorar engenharia'}),
 financial_goal_age16_save_1000:fixture({age:16,type:'FINANCIAL_GOAL',title:'Juntar 1000 reais'}),
 no_context_age14:{youth:{age:14},goal:{title:''},family:{}},
 no_parent_approval_age12:(()=>{const x=fixture({age:12,type:'PHYSICAL_PRODUCT',title:'Comprar um PS5'});x.family.parentApprovalAvailable=false;return x})()
});
