import{freezeCatalog}from'./catalog-utils.mjs';
export const TEST_CATALOG=freezeCatalog('TEST_CATALOG',['id','goalCategory','uncertainty','test','minAge','maxAge','safety','observationCriteria','requiresParent'],[
{id:'TEST_PRODUCT_DEMO',goalCategory:'PHYSICAL_PRODUCT',uncertainty:'uso ou adequação não resolvidos por pesquisa',test:'experimentar ou observar demonstração autorizada',minAge:11,maxAge:18,safety:'GUARDED',observationCriteria:['critério definido antes'],requiresParent:true},
{id:'TEST_SKILL_TRIAL',goalCategory:'SKILL',uncertainty:'afinidade com prática',test:'fazer atividade ou aula teste aprovada',minAge:11,maxAge:18,safety:'AGE_ADAPTED',observationCriteria:['sensação e resultado definidos antes'],requiresParent:true},
{id:'TEST_TRAVEL_SIMULATION',goalCategory:'TRAVEL',uncertainty:'tempo real de rota',test:'simular rota com dados reais sem deslocamento inseguro',minAge:12,maxAge:18,safety:'LOW',observationCriteria:['tempo e dependências'],requiresParent:false}
]);

