import{freezeCatalog}from'./catalog-utils.mjs';
export const CONTRIBUTION_METHOD_CATALOG=freezeCatalog('CONTRIBUTION_METHOD_CATALOG',['id','mode','minAge','maxAge','goalTypes','method','safety','requiresParent','acceptedEvidence'],[
{id:'CONTRIB_SAVE_APPROVED',mode:'SAVE',minAge:11,maxAge:18,goalTypes:['PHYSICAL_PRODUCT','TRAVEL','EXPERIENCE','FINANCIAL_GOAL'],method:'economizar valor já disponível e aprovado pela família',safety:'APPROVAL_REQUIRED',requiresParent:true,acceptedEvidence:['STRUCTURED_INPUT']},
{id:'CONTRIB_EARN_CANONICAL',mode:'EARN',minAge:12,maxAge:18,goalTypes:['PHYSICAL_PRODUCT','TRAVEL','EXPERIENCE','PROJECT','FINANCIAL_GOAL'],method:'usar somente missão canônica de criação de valor e canal aprovado',safety:'APPROVAL_REQUIRED',requiresParent:true,acceptedEvidence:['TEXT','PHOTO']},
{id:'CONTRIB_RESPONSIBILITY',mode:'TAKE_RESPONSIBILITY',minAge:11,maxAge:18,goalTypes:['PHYSICAL_PRODUCT','TRAVEL','EXPERIENCE','PROJECT','FINANCIAL_GOAL'],method:'assumir responsabilidade real aprovada e proporcional',safety:'AGE_ADAPTED',requiresParent:true,acceptedEvidence:['TEXT','PHOTO']}
]);

