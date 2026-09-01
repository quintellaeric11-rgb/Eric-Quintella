import{freezeCatalog}from'./catalog-utils.mjs';
export const GOAL_PREPARATION_ACTION_CATALOG=freezeCatalog('GOAL_PREPARATION_ACTION_CATALOG',['id','goalType','subcategory','minAge','maxAge','action','expectedResult','safety','evidenceFormats','prerequisites'],[
{id:'PREP_TRAVEL_ROUTE',goalType:'TRAVEL',subcategory:'ROUTE',minAge:11,maxAge:18,action:'montar uma parte da rota com dados fornecidos ou pesquisados pelo jovem',expectedResult:'rota parcial verificável',safety:'LOW',evidenceFormats:['TEXT','LINK'],prerequisites:[]},
{id:'PREP_EXPERIENCE_TRANSPORT',goalType:'EXPERIENCE',subcategory:'TRANSPORT',minAge:12,maxAge:18,action:'planejar o deslocamento aprovado',expectedResult:'plano de deslocamento',safety:'GUARDED',evidenceFormats:['TEXT'],prerequisites:[]},
{id:'PREP_SKILL_SPACE',goalType:'SKILL',subcategory:'SPACE',minAge:11,maxAge:18,action:'preparar espaço e material aprovados',expectedResult:'espaço pronto',safety:'LOW',evidenceFormats:['PHOTO'],prerequisites:[]},
{id:'PREP_PROJECT_FILES',goalType:'PROJECT',subcategory:'FILES',minAge:12,maxAge:18,action:'organizar arquivos necessários para a primeira entrega',expectedResult:'arquivos organizados',safety:'LOW',evidenceFormats:['PHOTO','STRUCTURED_INPUT'],prerequisites:[]}
]);

