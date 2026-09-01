import{createHash}from'node:crypto';
import{CATALOGS}from'../../data/mission-system-v1/catalogs/catalog-index.mjs';
import{classifyGoal as classifyGoalV1}from'./classify-goal.mjs';

const goalTypeMap=Object.freeze({physical_product:'PHYSICAL_PRODUCT',travel:'TRAVEL',experience:'EXPERIENCE',skill:'SKILL',project:'PROJECT',financial_goal:'FINANCIAL_GOAL',career_education:'CAREER_EDUCATION'});
const competencyMap=Object.freeze({'Educação financeira':'FINANCIAL_LITERACY','Autonomia':'AUTONOMY','Comunicação':'COMMUNICATION','Pensamento crítico':'CRITICAL_THINKING','Tomada de decisão':'DECISION_MAKING','Disciplina':'DISCIPLINE','Empreendedorismo':'ENTREPRENEURSHIP','Organização':'ORGANIZATION','Responsabilidade':'RESPONSIBILITY','Iniciativa':'INITIATIVE'});
const nonEmpty=x=>typeof x==='string'&&x.trim()?x.trim():null;
const ageBand=age=>!Number.isFinite(age)?null:age<=12?'11_12':age<=15?'13_15':'16_18';
const fingerprint=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function adaptProductContext(input={}){
  const conquest=input.conquest||{},youth=input.youth||{},parent=input.parent||{},legacy=input.legacyClassification||{},age=Number(input.age);
  const legacyGoalType=goalTypeMap[String(legacy.goal_type||'').toLowerCase()]||null;
  const deterministicFallback=!legacyGoalType&&String(legacy.goal_type||'').toLowerCase()==='other'?classifyGoalV1([conquest.title,conquest.reason].filter(Boolean).join(' ')):null;
  const goalType=legacyGoalType||deterministicFallback?.primaryGoalType||null;
  const missingFields=[];
  if(!Number.isFinite(age))missingFields.push('youth.age');
  if(!goalType)missingFields.push('goal.primaryGoalType');
  for(const field of['youth.autonomyLevel','family.permissions','family.approvedPeopleRelations','family.moneyRules','runtimeState'])missingFields.push(field);
  const context={
    youth:{youthId:nonEmpty(conquest.youth_id)||undefined,age:Number.isFinite(age)?age:undefined,interests:Array.isArray(youth.interests)?youth.interests:[],declaredSkills:[]},
    goal:{goalId:nonEmpty(conquest.id)||undefined,title:nonEmpty(conquest.title)||'',description:nonEmpty(conquest.reason)||'',primaryGoalType:goalType,targetValue:Number.isFinite(conquest.target_value)?conquest.target_value:undefined,status:nonEmpty(conquest.status)||undefined,metadata:{}},
    family:{parentApprovalAvailable:false,approvedChannels:[],approvedPeopleRelations:[],permissions:[],moneyRules:{creditAllowed:false,debtAllowed:false,loansAllowed:false}},
    journey:{journeyId:undefined,targetMissionCount:Array.isArray(input.legacyProposal)&&input.legacyProposal.length?input.legacyProposal.length:undefined},
    runtimeState:{phase:'INITIAL',flags:{},values:{}},catalogAvailability:Object.fromEntries(Object.keys(CATALOGS).map(id=>[id,true])),
    requestedCompetencies:(Array.isArray(parent.development_goals)?parent.development_goals:[]).map(x=>competencyMap[x]||null).filter(Boolean),requestedActions:[],missionHistory:[],activeMultiDay:[]
  };
  const sanitizedContextSummary={ageBand:ageBand(age),goalType,hasGoalTitle:Boolean(context.goal.title),hasGoalDescription:Boolean(context.goal.description),interestCount:context.youth.interests.length,requestedCompetencyCount:context.requestedCompetencies.length,parentApprovalAvailable:false,knownCatalogCount:Object.keys(CATALOGS).length,missingFields:[...missingFields].sort()};
  return{context,missingFields:[...new Set(missingFields)].sort(),contextFingerprint:fingerprint(sanitizedContextSummary),sanitizedContextSummary};
}

export function sanitizeLegacyResult(legacyResult={}){
  const first=Array.isArray(legacyResult.proposal)?legacyResult.proposal[0]:legacyResult.firstMission;
  const archetype=first?.archetype||{};
  return{resultAvailable:Boolean(first),missionId:nonEmpty(archetype.code||first?.missionId)||null,mechanic:nonEmpty(archetype.mechanic||first?.mechanic)||null,experiencePattern:nonEmpty(archetype.experience_pattern||first?.experiencePattern)||null,goalType:goalTypeMap[String(legacyResult.classification?.goal_type||'').toLowerCase()]||null,journeyRole:nonEmpty(first?.journeyRole)||null};
}
