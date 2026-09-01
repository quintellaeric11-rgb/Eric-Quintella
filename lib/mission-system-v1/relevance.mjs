export function determineRole(contract,context){
  if(contract.id==='M03')return'DISCOVERY';
  const roles=contract.rolesByGoalType[context.goal.primaryGoalType]||[];
  return roles[0]||contract.defaultRole||null;
}
export function evaluateRelevance(contract,context){
  const role=determineRole(contract,context);
  const direct=role==='CORE';
  const reasons=[direct?'Avança diretamente a conquista':role==='BRIDGE'?'Constrói capacidade necessária':'Amplia repertório de forma controlada'];
  if(contract.id==='M38'&&context.goal.primaryGoalType==='PHYSICAL_PRODUCT')reasons.push('Comparação específica de versões do produto');
  return{role,direct,reasons};
}
