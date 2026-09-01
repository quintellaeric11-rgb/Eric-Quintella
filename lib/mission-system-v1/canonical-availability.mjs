import{CANONICAL_MISSION_CONTENT}from'../../data/mission-system-v1/canonical-content/index.mjs';

export function evaluateCanonicalAvailability(contract,youthAge,content=CANONICAL_MISSION_CONTENT[contract?.id]){
  if(!content)return{available:false,code:'CANONICAL_CONTENT_NOT_LOADED',reason:'Conteúdo canônico não carregado'};
  if(!content.ageVariants.length)return{available:true,code:null,variant:null};
  if(!Number.isFinite(youthAge))return{available:false,code:'NEEDS_USER_INPUT',reason:'Idade necessária para selecionar variante canônica'};
  const variant=content.ageVariants.find(item=>youthAge>=item.minAge&&youthAge<=item.maxAge)||null;
  if(!variant)return{available:false,code:'EDITORIAL_VARIANT_GAP',reason:`Sem variante canônica autorizada para idade ${youthAge}`};
  return{available:true,code:null,variant};
}
