export function compareLegacyV1(legacy,v1){
  if(v1.resultCode==='V1_ERROR')return{result:'V1_ERROR',reasons:['V1 execution failed safely']};
  if(!v1.missionId)return{result:'V1_NO_RESULT',reasons:[`V1 returned ${v1.resultCode}`]};
  if(v1.manualReviewFlags.length)return{result:'REQUIRES_HUMAN_REVIEW',reasons:['At least one controlled manual-review rule was triggered']};
  if(!legacy.resultAvailable)return{result:'DIFFERENT_BUT_VALID',reasons:['V1 has a result while no comparable legacy mission id is available']};
  const fields=['mechanic','experiencePattern','goalType','journeyRole'],comparable=fields.filter(field=>legacy[field]&&v1.semantic?.[field]),same=comparable.filter(field=>legacy[field]===v1.semantic[field]);
  if(comparable.length&&same.length===comparable.length)return{result:'MATCH',reasons:same.map(field=>`same_${field}`)};
  return{result:'DIFFERENT_BUT_VALID',reasons:[...same.map(field=>`same_${field}`),...comparable.filter(field=>!same.includes(field)).map(field=>`different_${field}`),'No automatic pedagogical quality judgment']};
}
