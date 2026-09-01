import{MISSION_CONTRACTS}from'../../data/mission-system-v1/mission-contracts.mjs';
import{normalizeComposerContext}from'./normalize-context.mjs';
import{evaluateEligibility}from'./eligibility.mjs';
import{deriveState,applyExpectedMutations}from'./derive-state.mjs';
import{scoreMission}from'./scoring.mjs';
import{overlapConflicts}from'./semantic-overlap.mjs';
import{validateSequence}from'./sequence-validator.mjs';
import{CANONICAL_MISSION_CONTENT}from'../../data/mission-system-v1/canonical-content/index.mjs';
import{COMPLETION_CONTRACTS}from'../../data/mission-system-v1/completion-contracts.mjs';
import{CATALOGS}from'../../data/mission-system-v1/catalogs/catalog-index.mjs';
import{validateVersionCompatibility}from'./version-compatibility.mjs';
export function composeJourney(raw){
  const incompatible=Object.values(MISSION_CONTRACTS).map(contract=>({contract,check:validateVersionCompatibility({contract,content:CANONICAL_MISSION_CONTENT[contract.id],completionRule:COMPLETION_CONTRACTS[contract.id],catalogs:contract.allowedCatalogs.map(id=>CATALOGS[id])})})).find(x=>!x.check.compatible);if(incompatible)return{code:'VERSION_INCOMPATIBLE',missions:[],reasons:incompatible.check.errors,missionId:incompatible.contract.id};
  const context=normalizeComposerContext(raw);if(!context.goal.primaryGoalType)return{code:'CONTEXT_TOO_WEAK',missions:[],reasons:['Tipo de conquista ausente']};
  const target=Math.max(1,Math.min(10,context.journey.targetMissionCount));const states=deriveState(context);let expected=states.EXPECTED_JOURNEY_STATE;
  const selected=[],evaluations=[];
  while(selected.length<target){
    const candidates=[];
    for(const contract of Object.values(MISSION_CONTRACTS)){
      if(selected.some(x=>x.id===contract.id))continue;
      const real=evaluateEligibility(contract,context,{state:states.REAL_RUNTIME_STATE});
      let plannedStatus='READY',eligibility=real;
      if(real.status==='PREREQ_MISSING'){
        const future=evaluateEligibility(contract,context,{state:expected,planning:true});
        if(future.status==='ELIGIBLE'){eligibility=future;plannedStatus='CONDITIONAL_FUTURE'}
      }
      evaluations.push({missionId:contract.id,eligibility});
      if(eligibility.status!=='ELIGIBLE')continue;
      const overlap=overlapConflicts(contract,selected);if(overlap.length)continue;
      const trial=[...selected,contract];if(!validateSequence(trial).valid)continue;
      candidates.push({contract,plannedStatus,...scoreMission(contract,context,selected)});
    }
    candidates.sort((a,b)=>b.score-a.score||a.contract.id.localeCompare(b.contract.id));
    const winner=candidates[0];if(!winner)break;
    selected.push(winner.contract);expected=applyExpectedMutations(expected,winner.contract.producedState);
  }
  if(!selected.length){const under16Career=context.runtimeState.phase==='INITIAL'&&context.goal.primaryGoalType==='CAREER_EDUCATION'&&context.youth.age<16,approval=evaluations.some(x=>x.eligibility.status==='ELIGIBLE_IF'),editorialGap=evaluations.some(x=>x.eligibility.resultCode==='EDITORIAL_VARIANT_GAP'),catalogGap=evaluations.some(x=>x.eligibility.resultCode==='CATALOG_ENTRY_NOT_AVAILABLE');return{code:under16Career?'EDITORIAL_GAP_CAREER_EDUCATION_UNDER_16':approval?'NEEDS_PARENT_APPROVAL':editorialGap?'EDITORIAL_VARIANT_GAP':catalogGap?'CATALOG_ENTRY_NOT_AVAILABLE':'NO_ELIGIBLE_MISSION',missions:[],evaluations,reasons:[under16Career?'Nenhuma experiência canônica inicial aprovada para carreira antes dos 16 anos':'Nenhuma missão passou por todos os hard filters']};}
  return{code:'MISSION_SELECTED',missions:selected.map((contract,index)=>({missionId:contract.id,order:index+1,plannedStatus:evaluateEligibility(contract,context,{state:states.REAL_RUNTIME_STATE}).status==='ELIGIBLE'?'READY':'CONDITIONAL_FUTURE',score:scoreMission(contract,context,selected.slice(0,index)).score,actionFingerprint:[contract.mechanic,contract.experiencePattern,contract.noveltyGroup].join('|')})),sequence:validateSequence(selected),evaluations,expectedState:expected};
}
