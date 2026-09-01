import{MISSION_SYSTEM_VERSION}from'./types.mjs';

export const VERSION_COMPATIBILITY=Object.freeze({
  missionSystemVersion:MISSION_SYSTEM_VERSION,
  contractVersion:'1.0.0',
  canonicalContentVersion:'1.0.0',
  catalogVersion:'1.0.0-isolated',
  completionRuleVersion:'1.0.0'
});

export function validateVersionCompatibility({contract,content,catalogs=[],completionRule}={}){
  const errors=[];
  if(MISSION_SYSTEM_VERSION!==VERSION_COMPATIBILITY.missionSystemVersion)errors.push('MISSION_SYSTEM_VERSION_INCOMPATIBLE');
  if(contract?.contractVersion!==VERSION_COMPATIBILITY.contractVersion)errors.push('CONTRACT_VERSION_INCOMPATIBLE');
  if(content?.contentVersion!==VERSION_COMPATIBILITY.canonicalContentVersion)errors.push('CANONICAL_CONTENT_VERSION_INCOMPATIBLE');
  if(completionRule?.completionRuleVersion!==VERSION_COMPATIBILITY.completionRuleVersion)errors.push('COMPLETION_RULE_VERSION_INCOMPATIBLE');
  for(const catalog of catalogs)if(catalog?.version!==VERSION_COMPATIBILITY.catalogVersion)errors.push(`CATALOG_VERSION_INCOMPATIBLE:${catalog?.id||'UNKNOWN'}`);
  return{compatible:errors.length===0,errors,versions:{...VERSION_COMPATIBILITY}};
}
