const CACHE='konki-v5';
const CORE=['/manifest.webmanifest?v=4','/favicon.svg?v=4','/icon-v3-192.png?v=5','/apple-touch-icon-v3.png','/icon-v3-512.png','/icon-v3-maskable-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin||event.request.mode==='navigate'||url.pathname.startsWith('/api/')||url.pathname.startsWith('/_next/'))return;
  if(!CORE.some(asset=>url.pathname===asset.split('?')[0]))return;
  event.respondWith(caches.match(event.request,{ignoreSearch:true}).then(cached=>cached||fetch(event.request).then(response=>{if(response.ok)caches.open(CACHE).then(cache=>cache.put(event.request,response.clone()));return response})));
});
