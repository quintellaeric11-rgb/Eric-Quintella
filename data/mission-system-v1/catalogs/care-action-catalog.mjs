import{freezeCatalog}from'./catalog-utils.mjs';
export const CARE_ACTION_CATALOG=freezeCatalog('CARE_ACTION_CATALOG',['id','goalCategory','minAge','maxAge','action','durationDays','safety','requiresSupervision','successCriteria','allowedExamples','forbiddenActions'],[
{id:'CARE_ELECTRONIC_STORE',goalCategory:'ELECTRONIC',minAge:11,maxAge:16,action:'guardar equipamento autorizado em local definido',durationDays:3,safety:'LOW',requiresSupervision:false,successCriteria:['equipamento guardado no local combinado'],allowedExamples:['notebook','videogame'],forbiddenActions:['abrir equipamento','reparo elétrico']},
{id:'CARE_INSTRUMENT_STORE',goalCategory:'INSTRUMENT',minAge:11,maxAge:16,action:'guardar e limpar de forma segura um instrumento autorizado',durationDays:3,safety:'GUARDED',requiresSupervision:false,successCriteria:['instrumento guardado e cuidado conforme combinado'],allowedExamples:['guitarra','violão'],forbiddenActions:['reparo técnico']},
{id:'CARE_TRAVEL_ITEMS',goalCategory:'TRAVEL',minAge:11,maxAge:16,action:'organizar itens pessoais usando checklist aprovado',durationDays:3,safety:'LOW',requiresSupervision:false,successCriteria:['itens conferidos sem dados pessoais'],allowedExamples:['mochila'],forbiddenActions:['usar documentos reais no teste']}
]);

