export const appViews=['home','onboarding','conquest','wishlist','archive','journey-review','missions','mission','review','contract','notifications','passport','profile','admin'] as const;
export type AppView=typeof appViews[number];
export type AppRoute={view:AppView;assignmentId?:string;contractId?:string;journeyId?:string};

const valid=new Set<string>(appViews);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseAppRoute(value:string,defaultView:AppView='home'):AppRoute{
  const url=new URL(value,'http://konki.local');
  const requested=url.searchParams.get('view');
  const view=(requested&&valid.has(requested)?requested:defaultView) as AppView;
  const assignment=url.searchParams.get('assignment')||undefined;
  const contract=url.searchParams.get('contract')||undefined;
  const journey=url.searchParams.get('journey')||undefined;
  return{view,assignmentId:assignment&&uuid.test(assignment)?assignment:undefined,contractId:contract&&uuid.test(contract)?contract:undefined,journeyId:journey&&uuid.test(journey)?journey:undefined};
}

export function appRouteUrl(route:AppRoute){
  const params=new URLSearchParams();
  if(route.view!=='home')params.set('view',route.view);
  if(route.assignmentId)params.set('assignment',route.assignmentId);
  if(route.contractId)params.set('contract',route.contractId);
  if(route.journeyId)params.set('journey',route.journeyId);
  const query=params.toString();
  return `/${query?`?${query}`:''}`;
}

export function notificationRoute(notification:{type?:string|null;deep_link?:string|null;related_entity_id?:string|null}):AppRoute{
  const target=parseAppRoute(notification.deep_link||'/?view=home');
  if(['MISSION_SUBMITTED','MISSION_APPROVED','MISSION_CHANGES_REQUESTED'].includes(notification.type||'')){
    const selected=parseAppRoute(`/?view=${target.view}&assignment=${notification.related_entity_id||''}`);
    return{...target,assignmentId:selected.assignmentId};
  }
  if(notification.type==='JOURNEY_REVIEW'){
    const selected=parseAppRoute(`/?view=journey-review&journey=${notification.related_entity_id||''}`);
    return{...target,journeyId:selected.journeyId};
  }
  return target;
}
