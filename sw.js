const CACHE='treasure-finds-app-v3',ROOT=new URL('./',self.location).href;
const ASSETS=['./','./manifest.webmanifest','./icons/treasure-finds-180.png','./icons/treasure-finds-192.png','./icons/treasure-finds-512.png','./decor_left.webp','./decor_right.webp'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const key of await caches.keys()){if(key.startsWith('treasure-finds-app-')&&key!==CACHE)await caches.delete(key);}await self.clients.claim();})());});
self.addEventListener('fetch',event=>{
const request=event.request,url=new URL(request.url);if(request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(ROOT))return;
if(url.pathname.includes('/admin/')||url.pathname.endsWith('/data/catalog.json'))return;
if(request.mode==='navigate'){event.respondWith((async()=>{const cache=await caches.open(CACHE);try{const response=await fetch(request);if(response.ok){await cache.put(ROOT,response.clone());return response;}return (await cache.match(ROOT))||response;}catch(error){return (await cache.match(ROOT))||new Response('Connect to the internet to open Treasure Finds for the first time.',{status:503,headers:{'Content-Type':'text/plain'}});}})());return;}
event.respondWith((async()=>{const cached=await caches.match(request);if(cached)return cached;const response=await fetch(request);if(response.ok){const cache=await caches.open(CACHE);await cache.put(request,response.clone());}return response;})());});