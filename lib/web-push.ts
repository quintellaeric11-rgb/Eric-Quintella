import webpush from 'web-push';
import type {SupabaseClient} from '@supabase/supabase-js';

type Notice={title:string;body:string;url:string;eventKey:string};

function configured(){return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY&&process.env.VAPID_PRIVATE_KEY&&process.env.VAPID_SUBJECT)}

export async function sendPush(admin:SupabaseClient,profileIds:string[],notice:Notice){
  if(!configured()||!profileIds.length)return{sent:0,skipped:true};
  webpush.setVapidDetails(process.env.VAPID_SUBJECT!,process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,process.env.VAPID_PRIVATE_KEY!);
  let sent=0;
  for(const profileId of [...new Set(profileIds)]){
    const claim=await admin.from('push_deliveries').insert({profile_id:profileId,event_key:notice.eventKey});
    if(claim.error)continue;
    const subscriptions=await admin.from('push_subscriptions').select('id,endpoint,p256dh,auth').eq('profile_id',profileId);
    for(const subscription of subscriptions.data||[]){
      try{
        await webpush.sendNotification({endpoint:subscription.endpoint,keys:{p256dh:subscription.p256dh,auth:subscription.auth}},JSON.stringify({title:notice.title,body:notice.body,url:notice.url}),{TTL:86400,urgency:'normal'});
        sent++;
      }catch(error:any){
        if(error?.statusCode===404||error?.statusCode===410)await admin.from('push_subscriptions').delete().eq('id',subscription.id);
      }
    }
  }
  return{sent,skipped:false};
}
