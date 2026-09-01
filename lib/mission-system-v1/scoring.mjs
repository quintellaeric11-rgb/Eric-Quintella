import{evaluateRelevance}from'./relevance.mjs';
export function scoreMission(contract,context,selected=[]){
  const relevance=evaluateRelevance(contract,context);
  const requested=new Set(context.requestedCompetencies);
  const competencyMatches=contract.competencies.filter(x=>requested.has(x)).length;
  const breakdown={goalCoherence:relevance.role==='CORE'?30:relevance.role==='BRIDGE'?23:10,usefulState:contract.producedState.length?20:8,declaredInterest:contract.naturalGoalTypes.includes(context.goal.primaryGoalType)?15:0,competencyCoverage:Math.min(15,competencyMatches*7.5),novelty:selected.some(x=>x.noveltyGroup===contract.noveltyGroup)?1:10,sequenceFit:selected.at(-1)?.energy==='HEAVY'&&contract.energy==='HEAVY'?0:10};
  if(contract.id==='M38'&&context.goal.primaryGoalType==='PHYSICAL_PRODUCT')breakdown.goalCoherence=30;
  if(contract.id==='M12'&&context.goal.primaryGoalType==='PHYSICAL_PRODUCT')breakdown.goalCoherence-=5;
  if(contract.id==='M39'&&context.goal.primaryGoalType==='PHYSICAL_PRODUCT')breakdown.goalCoherence=22;
  if(contract.id==='M20'&&context.goal.metadata.requiresFullProblemCycle!==true)breakdown.goalCoherence-=12;
  if(['M16','M17'].includes(contract.id)&&context.goal.metadata.requiresFullProblemCycle!==true)breakdown.goalCoherence=Math.min(30,breakdown.goalCoherence+6);
  return{score:Object.values(breakdown).reduce((a,b)=>a+b,0),breakdown,reasons:relevance.reasons};
}
