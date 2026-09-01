import{evaluateSafety}from'./safety.mjs';
import{evaluateCanonicalAvailability}from'./canonical-availability.mjs';
import{CATALOGS}from'../../data/mission-system-v1/catalogs/catalog-index.mjs';
const get=(state,key)=>key in state.flags?state.flags[key]:state.values[key];
function prereq(rule,context,state){if(rule.kind==='STATE_FLAG')return get(state,rule.key)===rule.expected;if(rule.kind==='STATE_FLAG_TRUE')return get(state,rule.key)===true;if(rule.kind==='STATE_VALUE_EXISTS')return get(state,rule.key)!==undefined&&get(state,rule.key)!==null&&get(state,rule.key)!=='';if(rule.kind==='REQUESTED_ACTION_ANY')return rule.values.some(x=>context.requestedActions.includes(x));if(rule.kind==='AUDIENCE_TESTER_ELIGIBILITY'){const audience=state.values.audience_status,tester=state.values.tester_status;if(audience==='TARGET_AUDIENCE_CONFIRMED')return tester==='TARGET_AUDIENCE_MEMBER';if(audience==='APPROVED_AUDIENCE_PROXY')return tester==='APPROVED_PROXY';if(audience==='NO_SPECIFIC_AUDIENCE')return Boolean(tester);return false}if(rule.kind==='FAMILY_PERMISSION')return context.family.permissions.includes(rule.permission);if(rule.kind==='PARENT_APPROVAL_AVAILABLE')return context.family.parentApprovalAvailable;if(rule.kind==='MIN_REAL_OPTIONS')return Number(state.values.real_options_count||context.goal.metadata.realOptionsCount||0)>=rule.count;if(rule.kind==='CUSTOM_DETERMINISTIC')return false;return false;}
const result=(contract,status,hardFilter,reasons,extra={})=>({missionId:contract.id,status,role:null,reasons,missingPrerequisites:[],missingInputs:[],needsParentApproval:false,hardFilter,...extra});
export function evaluateEligibility(contract,context,{state=context.runtimeState,planning=false}={}){
  const reasons=[],missingPrerequisites=[],missingInputs=[];
  if(context.youth.age<contract.age.min||context.youth.age>contract.age.max)return result(contract,'BLOCKED','age',['AGE_OUTSIDE_RANGE']);
  if(!contract.naturalGoalTypes.includes(context.goal.primaryGoalType))return result(contract,'BLOCKED','goalType',['GOAL_TYPE_NOT_ALLOWED']);
  if(state.phase==='INITIAL'&&!contract.bootstrapGoalTypes.includes(context.goal.primaryGoalType))return result(contract,'BLOCKED','bootstrap',['Missão não autorizada como bootstrap para este tipo de conquista']);
  if(state.phase==='INITIAL'&&contract.id==='M43'){
    const safeEntry=CATALOGS.GOAL_PREPARATION_ACTION_CATALOG.entries.some(entry=>entry.goalType===context.goal.primaryGoalType&&context.youth.age>=entry.minAge&&context.youth.age<=entry.maxAge&&['LOW','GUARDED'].includes(entry.safety)&&entry.prerequisites.length===0);
    if(!safeEntry)return result(contract,'BLOCKED','catalog',['Nenhuma ação canônica segura disponível para bootstrap'],{resultCode:'CATALOG_ENTRY_NOT_AVAILABLE'});
  }
  const canonical=evaluateCanonicalAvailability(contract,context.youth.age);
  if(!canonical.available)return result(contract,'BLOCKED','canonicalVariant',[canonical.code,canonical.reason],{resultCode:canonical.code});
  const safety=evaluateSafety(contract,context);
  if(!safety.allowed)return result(contract,safety.code==='NEEDS_PARENT_APPROVAL'?'ELIGIBLE_IF':'BLOCKED','safety',safety.reasons,{needsParentApproval:safety.code==='NEEDS_PARENT_APPROVAL'});
  for(const rule of contract.prerequisites){if(rule.phase==='IN_MISSION_SETUP')continue;if(!prereq(rule,context,state))missingPrerequisites.push(rule.kind==='STATE_FLAG'||rule.kind==='STATE_VALUE_EXISTS'?rule.key:rule.permission||rule.kind)}
  if(missingPrerequisites.length)return{missionId:contract.id,status:'PREREQ_MISSING',role:null,reasons:['Pré-requisito de entrada ausente'],missingPrerequisites,missingInputs,needsParentApproval:false,hardFilter:'prerequisites',planning};
  for(const blocker of contract.blockers||[])if(prereq(blocker,context,state))return result(contract,'BLOCKED','blockers',['BLOCKER_ACTIVE']);
  for(const catalogId of contract.allowedCatalogs)if(context.catalogAvailability[catalogId]!==true)return result(contract,'BLOCKED','catalog',[`Catálogo obrigatório não comprovado: ${catalogId}`],{resultCode:'CATALOG_ENTRY_NOT_AVAILABLE'});
  const occurrences=context.missionHistory.filter(x=>x.missionId===contract.id).length;
  if(contract.repetition.maxPerJourney!==null&&occurrences>=contract.repetition.maxPerJourney)return result(contract,'BLOCKED','repetition',['Repetição máxima atingida']);
  if(contract.multiDay?.blocksAnotherHeavyMultiDay&&context.activeMultiDay.some(x=>x.energy==='HEAVY'))return result(contract,'BLOCKED','multiday',['Capacidade multiday HEAVY ocupada']);
  const role=(contract.rolesByGoalType[context.goal.primaryGoalType]||[])[0]||contract.defaultRole;
  reasons.push('Todos os hard filters passaram');return{missionId:contract.id,status:'ELIGIBLE',role,reasons,missingPrerequisites,missingInputs,needsParentApproval:false,hardFilter:null};
}
