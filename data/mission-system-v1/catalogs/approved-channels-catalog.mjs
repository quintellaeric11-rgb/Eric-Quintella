import{freezeCatalog}from'./catalog-utils.mjs';
export const APPROVED_CHANNELS_CATALOG=freezeCatalog('APPROVED_EXTERNAL_CHANNELS',['id','label','requiresParent'],[{id:'KNOWN_PERSON_DIRECT',label:'pessoa conhecida',requiresParent:true},{id:'PARENT_APPROVED_REFERRAL',label:'indicação aprovada',requiresParent:true},{id:'PARENT_APPROVED_CHANNEL',label:'canal aprovado pelo responsável',requiresParent:true}]);

