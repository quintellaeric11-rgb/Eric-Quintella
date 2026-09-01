export function actionFingerprint(contract,resolvedAction={}){const operationalTarget=resolvedAction.operationalTarget||resolvedAction.approvedAction||'';return[contract.mechanic,contract.experiencePattern,contract.noveltyGroup,[...contract.semanticOverlapGroups].sort().join('+'),String(operationalTarget).trim().toLowerCase()].join('|')}
export function sameOperationalAction(a,aVariables,b,bVariables){const left=String(aVariables?.operationalTarget||aVariables?.approvedAction||'').trim().toLowerCase();const right=String(bVariables?.operationalTarget||bVariables?.approvedAction||'').trim().toLowerCase();return Boolean(left&&right&&left===right&&a.semanticOverlapGroups.some(x=>b.semanticOverlapGroups.includes(x)))}
export function overlapConflicts(candidate,selected=[]){
  const fp=actionFingerprint(candidate);
  if(selected.some(x=>actionFingerprint(x)===fp))return['DUPLICATE_ACTION_FINGERPRINT'];
  const groups=new Set(candidate.semanticOverlapGroups);
  const conflicts=[];
  for(const prior of selected)for(const group of prior.semanticOverlapGroups)if(groups.has(group))conflicts.push(`OVERLAP_${group}`);
  return[...new Set(conflicts)];
}
