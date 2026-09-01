import{GoalTypes}from'./types.mjs';
const list=x=>Array.isArray(x)?[...new Set(x.filter(v=>typeof v==='string').map(v=>v.trim().toUpperCase()).filter(Boolean))]:[];
export function normalizeComposerContext(raw={}){
  const youth=raw.youth||{},goal=raw.goal||{},family=raw.family||{},journey=raw.journey||{},runtimeState=raw.runtimeState||{};
  const flags=runtimeState.flags&&typeof runtimeState.flags==='object'?runtimeState.flags:{};
  const values=runtimeState.values&&typeof runtimeState.values==='object'?runtimeState.values:{};
  const missionHistory=Array.isArray(raw.missionHistory)?raw.missionHistory:[];
  const inferredPhase=Object.keys(flags).length||Object.keys(values).length||missionHistory.length?'ACTIVE':'INITIAL';
  return{
    youth:{youthId:String(youth.youthId||''),age:Number(youth.age),interests:list(youth.interests),declaredSkills:Array.isArray(youth.declaredSkills)?youth.declaredSkills:[],autonomyLevel:youth.autonomyLevel||null},
    goal:{goalId:String(goal.goalId||''),title:String(goal.title||'').trim(),description:String(goal.description||'').trim(),primaryGoalType:GoalTypes.includes(goal.primaryGoalType)?goal.primaryGoalType:null,secondaryGoalType:GoalTypes.includes(goal.secondaryGoalType)?goal.secondaryGoalType:null,targetValue:Number.isFinite(goal.targetValue)?goal.targetValue:null,selectedOption:goal.selectedOption||null,estimatedHorizonDays:Number.isFinite(goal.estimatedHorizonDays)?goal.estimatedHorizonDays:null,status:goal.status||'DRAFT',metadata:goal.metadata&&typeof goal.metadata==='object'?goal.metadata:{}},
    family:{parentApprovalAvailable:family.parentApprovalAvailable===true,approvedBudget:Number.isFinite(family.approvedBudget)?family.approvedBudget:null,approvedChannels:list(family.approvedChannels),approvedPeopleRelations:list(family.approvedPeopleRelations),externalContactPolicy:family.externalContactPolicy||'KNOWN_ONLY',moneyRules:{maxYouthControlledValue:family.moneyRules?.maxYouthControlledValue??null,creditAllowed:false,debtAllowed:false,loansAllowed:false},permissions:list(family.permissions)},
    journey:{journeyId:String(journey.journeyId||''),targetMissionCount:Number.isInteger(journey.targetMissionCount)?journey.targetMissionCount:6,selectedMissionIds:list(journey.selectedMissionIds),completedMissionIds:list(journey.completedMissionIds),activeMissionIds:list(journey.activeMissionIds),currentCompetencyCoverage:journey.currentCompetencyCoverage||{},roleCounts:journey.roleCounts||{CORE:0,BRIDGE:0,DISCOVERY:0},energyHistory:list(journey.energyHistory),experiencePatternHistory:list(journey.experiencePatternHistory),noveltyGroupHistory:list(journey.noveltyGroupHistory),actionFingerprints:Array.isArray(journey.actionFingerprints)?journey.actionFingerprints:[]},
    missionHistory,runtimeState:{phase:runtimeState.phase||inferredPhase,flags,values},catalogAvailability:raw.catalogAvailability||{},requestedCompetencies:list(raw.requestedCompetencies),requestedActions:list(raw.requestedActions),activeMultiDay:Array.isArray(raw.activeMultiDay)?raw.activeMultiDay:[]
  };
}
