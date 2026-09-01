import{actionFingerprint}from'./semantic-overlap.mjs';
const conversation=new Set(['TALK_INTERVIEW','COMMUNICATE_OFFER','NEGOTIATE','NEGOTIATE_EXCHANGE','NEGOTIATE_SCOPE','COMMUNICATE','INVESTIGATE_TALK','COMMUNICATE_REQUEST','TALK_INVESTIGATE']);
export function validateSequence(contracts,{maxMissions=7}={}){
  const errors=[],warnings=[];
  for(let i=1;i<contracts.length;i++)if(contracts[i-1].energy==='HEAVY'&&contracts[i].energy==='HEAVY')errors.push('CONSECUTIVE_HEAVY');
  for(let i=2;i<contracts.length;i++)if(contracts.slice(i-2,i+1).every(x=>conversation.has(x.mechanic)))errors.push('THREE_CONVERSATIONS_IN_A_ROW');
  const fingerprints=contracts.map(actionFingerprint);if(new Set(fingerprints).size!==fingerprints.length)errors.push('DUPLICATE_ACTION_FINGERPRINT');
  const ids=new Set(contracts.map(x=>x.id));if(['M32','M33','M41'].every(x=>ids.has(x)))errors.push('RESPONSIBILITY_CLUSTER_OVERLOAD');
  if(['M34','M37','M43','M44'].every(x=>ids.has(x)))errors.push('PLANNING_CHAIN_OVERLOAD');
  const skillProof=contracts.filter(x=>x.semanticOverlapGroups.includes('SKILL_PROOF')).length;if(contracts.length<=maxMissions&&skillProof>2)errors.push('SKILL_PROOF_OVERLOAD');
  const heavyMultiday=contracts.filter(x=>x.multiDay?.blocksAnotherHeavyMultiDay).length;if(heavyMultiday>1)errors.push('MULTIDAY_CAPACITY_OVERLOAD');
  if(contracts.length&&contracts.filter(x=>x.defaultRole==='DISCOVERY').length/contracts.length>.25)warnings.push('DISCOVERY_SHARE_HIGH');
  return{valid:errors.length===0,errors:[...new Set(errors)],warnings};
}
