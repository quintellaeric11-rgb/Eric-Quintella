import{MISSION_CONTRACTS}from'../../data/mission-system-v1/mission-contracts.mjs';
import{COMPLETION_CONTRACTS}from'../../data/mission-system-v1/completion-contracts.mjs';
import{CATALOGS}from'../../data/mission-system-v1/catalogs/catalog-index.mjs';
export const COMPLETION_RULES=Object.freeze(Object.fromEntries(Object.values(COMPLETION_CONTRACTS).map(rule=>[rule.id,rule])));
const value=x=>x&&typeof x==='object'&&Object.hasOwn(x,'value')?x.value:x;
export function validateCompletion(missionId,submission={}){
  const contract=MISSION_CONTRACTS[missionId],rule=COMPLETION_CONTRACTS[missionId];if(!contract||!rule)return{valid:false,status:'INCOMPLETE',errors:['UNKNOWN_MISSION'],mutations:[]};
  if(rule.unresolvedEditorialRules.length)return{valid:false,status:'EDITORIAL_RULE_UNRESOLVED',errors:[...rule.unresolvedEditorialRules],mutations:[]};
  const actions=new Set(submission.actionsCompleted||[]),facts=submission.facts||{},evidence=submission.evidence||[],errors=[];
  for(const action of rule.requiredActions)if(!actions.has(action))errors.push(`ACTION_MISSING:${action}`);
  for(const type of rule.requiredEvidence)if(!evidence.some(x=>x.type===type&&x.value!==undefined&&x.value!==''))errors.push(`EVIDENCE_MISSING:${type}`);
  for(const item of evidence)if(![...rule.requiredEvidence,...rule.optionalEvidence].includes(item.type)||item.value===undefined||item.value==='')errors.push(`INVALID_EVIDENCE:${item.type}`);
  for(const fact of rule.requiredFacts)if(facts[fact]===undefined||facts[fact]===null||facts[fact]==='')errors.push(`FACT_MISSING:${fact}`);
  for(const fact of rule.factsNeverInferred)if(facts[fact]?.source==='GENERATED')errors.push(`INFERRED_FACT_FORBIDDEN:${fact}`);
  if(rule.parentApprovalRequired&&submission.parentApprovalConfirmed!==true)errors.push('PARENT_APPROVAL_REQUIRED');
  if(submission.fabricatedSuccess===true)errors.push('FABRICATED_SUCCESS_FORBIDDEN');
  if(missionId==='M15'&&facts.mind_change_condition?.source==='GENERATED')errors.push('INFERRED_FACT_FORBIDDEN:mind_change_condition');
  if(missionId==='M21'){const mode=submission.executionContract?.proofVerificationMode;if(submission.executionContract?.lockedBeforeAttempt!==true)errors.push('PROOF_MODE_NOT_LOCKED_BEFORE_ATTEMPT');if(!['OBJECTIVE_ARTIFACT','OBSERVER_REQUIRED'].includes(mode))errors.push('INVALID_PROOF_VERIFICATION_MODE');if(value(facts.proof_verification_mode)!==mode)errors.push('PROOF_MODE_CHANGED_AFTER_ATTEMPT');if(mode==='OBSERVER_REQUIRED'){if(value(facts.observer_confirmed)!==true)errors.push('OBSERVER_CONFIRMATION_REQUIRED');if(value(facts.observer_feedback_recorded)!==true)errors.push('OBSERVER_FEEDBACK_REQUIRED');if(submission.executionContract?.approvedObserverConfirmed!==true)errors.push('APPROVED_REAL_OBSERVER_REQUIRED')}if(mode==='OBJECTIVE_ARTIFACT'&&!submission.executionContract?.objectiveCriterion)errors.push('OBJECTIVE_CRITERION_REQUIRED')}
  if(missionId==='M28'&&value(facts.learner_attempted)!==true)errors.push('LEARNER_ATTEMPT_REQUIRED');
  if(missionId==='M34'){const original=value(facts.sleep_windows);if(!Array.isArray(value(facts.fixed_commitments))||!Array.isArray(original)||!Array.isArray(value(facts.relevant_commute_blocks)))errors.push('REAL_WEEK_INPUTS_REQUIRED');if(submission.plannedWeek&&JSON.stringify(submission.plannedWeek.sleepWindows)!==JSON.stringify(original))errors.push('SLEEP_WINDOW_CHANGED')}
  if(missionId==='M40'&&!['SAVE','EARN','TAKE_RESPONSIBILITY'].includes(value(facts.contribution_mode)))errors.push('INVALID_CONTRIBUTION_MODE');
  if(missionId==='M42'){if(value(facts.youth_confirmation)!==true||value(facts.parent_confirmation)!==true)errors.push('MISSION_PENDING_AGREEMENT');if(facts.youth_commitments?.source==='GENERATED'||facts.parent_commitments?.source==='GENERATED')errors.push('INFERRED_COMMITMENT_FORBIDDEN')}
  if(missionId==='M44'){const selections=submission.riskSelections||[];if(selections.length!==1)errors.push('EXACTLY_ONE_APPROVED_RISK_REQUIRED');const entry=selections.length===1?CATALOGS.RISK_CATALOG.entries.find(x=>x.id===selections[0].catalogEntryId):null;if(!entry)errors.push('RISK_CATALOG_ENTRY_INVALID');else{if(submission.goalType&&entry.goalType!==submission.goalType)errors.push('RISK_GOAL_TYPE_MISMATCH');if(Number.isFinite(submission.youthAge)&&submission.youthAge<entry.minAge)errors.push('RISK_AGE_MISMATCH');if(submission.executionContract?.lockedBeforeAttempt!==true||submission.executionContract?.verificationMode!==entry.verificationMode)errors.push('VERIFICATION_MODE_NOT_LOCKED');for(const requirement of entry.requiredBackupConfirmations)if(submission.backupRequirements?.[requirement]!==true)errors.push(`BACKUP_PLAN_NOT_FEASIBLE:${requirement}`);if(entry.verificationMode==='REQUIRED'&&value(facts.verification_completed)!==true)errors.push('VERIFICATION_REQUIRED')}}
  if(missionId==='M45'){
    const factual=['financial_target','financial_purpose','desired_horizon','current_income_status','adjustable_spending_status','candidate_path_categories','parent_dependent_paths','next_safe_path'];
    for(const name of factual)if(facts[name]?.source==='GENERATED')errors.push(`INFERRED_FACT_FORBIDDEN:${name}`);
    if(!['ZERO','EXISTS','UNKNOWN'].includes(value(facts.current_income_status)))errors.push('INVALID_CURRENT_INCOME_STATUS');
    if(!['NONE','EXISTS','UNKNOWN'].includes(value(facts.adjustable_spending_status)))errors.push('INVALID_ADJUSTABLE_SPENDING_STATUS');
    if(!Array.isArray(value(facts.candidate_path_categories))||!value(facts.candidate_path_categories).length)errors.push('FINANCIAL_PATH_CATEGORIES_REQUIRED');
    if(!Array.isArray(value(facts.parent_dependent_paths)))errors.push('PARENT_DEPENDENT_PATHS_REQUIRED');
  }
  const provided=submission.producedState||{};const mutations=errors.length?[]:contract.producedState.filter(x=>Object.hasOwn(provided,x.key)&&provided[x.key]===x.value);
  const pending=errors.includes('MISSION_PENDING_AGREEMENT');return{valid:errors.length===0,status:pending?'MISSION_PENDING_AGREEMENT':errors.length?'INCOMPLETE':'COMPLETED',errors,mutations,declaredOutputs:contract.producedState,attemptIsSufficient:rule.attemptIsSufficient,externalResultRequired:rule.externalResultRequired,negativeResponseCanComplete:rule.negativeResponseCanComplete,pedagogicalOutcome:errors.length?null:'COMPLETED_CANONICAL_CONTRACT'};
}
