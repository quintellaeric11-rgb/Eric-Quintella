import{COMPLETION_CONTRACTS}from'../../data/mission-system-v1/completion-contracts.mjs';
import{MISSION_CONTRACTS}from'../../data/mission-system-v1/mission-contracts.mjs';

export function completionSubmissionFor(id,{negative=false}={}){
  const rule=COMPLETION_CONTRACTS[id];
  const facts=Object.fromEntries(rule.requiredFacts.map(name=>[name,{value:`real_${name}`,source:'USER_INPUT_CURRENT'}]));
  if(negative&&rule.negativeResponseCanComplete)facts.third_party_response={value:'RECUSADO',source:'USER_INPUT_CURRENT'};
  const submission={actionsCompleted:[...rule.requiredActions],evidence:rule.requiredEvidence.map(type=>({type,value:'evidência real'})),facts,parentApprovalConfirmed:true,producedState:Object.fromEntries(MISSION_CONTRACTS[id].producedState.map(x=>[x.key,x.value]))};
  if(negative)submission.producedState={};
  if(id==='M21'){facts.proof_verification_mode={value:'OBJECTIVE_ARTIFACT',source:'USER_INPUT_CURRENT'};submission.executionContract={proofVerificationMode:'OBJECTIVE_ARTIFACT',lockedBeforeAttempt:true,objectiveCriterion:'critério objetivo real'}}
  if(id==='M28')facts.learner_attempted={value:true,source:'USER_INPUT_CURRENT'};
  if(id==='M34'){facts.fixed_commitments={value:['escola'],source:'USER_INPUT_CURRENT'};facts.sleep_windows={value:['22:00-07:00'],source:'USER_INPUT_CURRENT'};facts.relevant_commute_blocks={value:['07:30-08:00'],source:'USER_INPUT_CURRENT'};submission.plannedWeek={sleepWindows:['22:00-07:00']}}
  if(id==='M40'){facts.contribution_mode={value:'TAKE_RESPONSIBILITY',source:'CANONICAL_CATALOG'};facts.family_agreement={value:'combinado real',source:'FAMILY_RULES'}}
  if(id==='M42'){facts.youth_commitments={value:['ação jovem'],source:'USER_INPUT_CURRENT'};facts.parent_commitments={value:['ação responsável'],source:'FAMILY_RULES'};facts.youth_confirmation={value:true,source:'USER_INPUT_CURRENT'};facts.parent_confirmation={value:true,source:'FAMILY_RULES'}}
  if(id==='M44'){facts.risk={value:'atraso de transporte',source:'CANONICAL_CATALOG'};facts.backup_plan={value:'alternativa aprovada',source:'USER_INPUT_CURRENT'};facts.verification_mode={value:'REQUIRED',source:'CANONICAL_CATALOG'};facts.verification_completed={value:true,source:'USER_INPUT_CURRENT'};submission.riskSelections=[{catalogEntryId:'RISK_TRAVEL_DELAY'}];submission.goalType='TRAVEL';submission.youthAge=14;submission.executionContract={lockedBeforeAttempt:true,verificationMode:'REQUIRED'};submission.backupRequirements={required_budget_confirmed:true,required_permission_confirmed:true,time_feasible:true}}
  if(id==='M45'){facts.current_income_status={value:'ZERO',source:'USER_INPUT_CURRENT'};facts.adjustable_spending_status={value:'NONE',source:'USER_INPUT_CURRENT'};facts.candidate_path_categories={value:['PARENT_CONVERSATION','REVISE_TARGET_OR_HORIZON'],source:'USER_INPUT_CURRENT'};facts.parent_dependent_paths={value:['PARENT_CONVERSATION'],source:'USER_INPUT_CURRENT'}}
  return submission;
}
