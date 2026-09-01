const initialGoalFacts=context=>context.runtimeState.phase==='INITIAL'?{
  goal_defined:Boolean(context.goal.title&&context.goal.primaryGoalType),
  decision_open:context.goal.status==='DRAFT',
  project_goal_exists:context.goal.primaryGoalType==='PROJECT'&&Boolean(context.goal.title)
}:{};
export function deriveState(context){const flags={...initialGoalFacts(context),...context.runtimeState.flags},state={phase:context.runtimeState.phase,flags,values:{...context.runtimeState.values}};return{REAL_RUNTIME_STATE:state,EXPECTED_JOURNEY_STATE:{phase:state.phase,flags:{...state.flags},values:{...state.values}}};}
export function applyExpectedMutations(expected,mutations=[]){const next={phase:expected.phase,flags:{...expected.flags},values:{...expected.values}};for(const m of mutations){if(m.operation==='SET'){if(typeof m.value==='boolean')next.flags[m.key]=m.value;else next.values[m.key]=m.value}else if(m.operation==='APPEND'){next.values[m.key]=[...(next.values[m.key]||[]),m.value]}else if(m.operation==='INCREMENT'){next.values[m.key]=(Number(next.values[m.key])||0)+Number(m.value)}}return next;}
