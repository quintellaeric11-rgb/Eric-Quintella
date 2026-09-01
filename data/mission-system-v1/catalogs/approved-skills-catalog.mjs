import{freezeCatalog}from'./catalog-utils.mjs';
export const APPROVED_SKILLS_CATALOG=freezeCatalog('APPROVED_SKILLS_CATALOG',['id','label','minAge','safety'],['EDIT_VIDEO','DRAW','COOK_SIMPLE','ORGANIZE_FILES','CREATE_VISUAL','PLAY_INSTRUMENT','PRESENT','WRITE','PROGRAM_BASIC'].map(id=>({id,label:id.toLowerCase().replaceAll('_',' '),minAge:11,safety:'AGE_ADAPTED'})));

