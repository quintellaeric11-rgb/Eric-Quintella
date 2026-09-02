const CACHE='konki-v6';
const CORE=['/manifest.webmanifest?v=4','/favicon.svg?v=4','/icon-v3-192.png?v=5','/apple-touch-icon-v3.png','/icon-v3-512.png','/icon-v3-maskable-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()).then(()=>self.clients.matchAll({type:'window',includeUncontrolled:true})).then(clients=>Promise.all(clients.map(client=>client.navigate(client.url))))));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin||event.request.mode==='navigate'||url.pathname.startsWith('/api/')||url.pathname.startsWith('/_next/'))return;
  if(!CORE.some(asset=>url.pathname===asset.split('?')[0]))return;
  event.respondWith(caches.match(event.request,{ignoreSearch:true}).then(cached=>cached||fetch(event.request).then(response=>{if(response.ok)caches.open(CACHE).then(cache=>cache.put(event.request,response.clone()));return response})));
});
self.addEventListener('push',event=>{let data={};try{data=event.data?.json()||{}}catch{}event.waitUntil(self.registration.showNotification(data.title||'KONKI',{body:data.body||'Há uma novidade importante para você.',icon:'/icon-v3-192.png?v=5',badge:'/icon-v3-192.png?v=5',data:{url:data.url||'/?view=notifications'}}))});
self.addEventListener('notificationclick',event=>{event.notification.close();const target=new URL(event.notification.data?.url||'/?view=notifications',self.location.origin).href;event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(clients=>{for(const client of clients){if(new URL(client.url).origin===self.location.origin){client.navigate(target);return client.focus()}}return self.clients.openWindow(target)}))});
