import{freezeCatalog}from'./catalog-utils.mjs';
export const APPROVED_CONSTRAINTS_CATALOG=freezeCatalog('APPROVED_CONSTRAINTS',['constraintId','label','allowedAgeRange','targetCompetencies','safetyLevel','allowedContexts'],[
{id:'LIMIT_30_MIN',constraintId:'LIMIT_30_MIN',label:'concluir em até 30 minutos',allowedAgeRange:{min:13,max:17},targetCompetencies:['PRIORITIZATION'],safetyLevel:'LOW',allowedContexts:['PROJECT','SKILL'],kind:'TIME',value:30},
{id:'LIMIT_THREE_ELEMENTS',constraintId:'LIMIT_THREE_ELEMENTS',label:'usar no máximo três elementos',allowedAgeRange:{min:13,max:17},targetCompetencies:['DECISION_MAKING','FOCUS'],safetyLevel:'LOW',allowedContexts:['PROJECT','SKILL'],kind:'COUNT',value:3},
{id:'LIMIT_NO_SPEND',constraintId:'LIMIT_NO_SPEND',label:'usar somente recursos já disponíveis',allowedAgeRange:{min:13,max:17},targetCompetencies:['CREATIVITY','RESOURCEFULNESS'],safetyLevel:'LOW',allowedContexts:['PROJECT','SKILL'],kind:'RESOURCE',value:0}
]);
