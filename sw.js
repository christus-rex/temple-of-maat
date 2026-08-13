const VERSION = 'temple-maat-pwa-v6.1.5-2026-08-13';
const STATIC_CACHE = `${VERSION}-static`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const CORE_ASSETS = [
  './','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./apple-touch-icon.png','./chambers.json','./offline.html','./version.json','./COPYRIGHT.md',
  './assets/css/site.css','./assets/css/pwa-home.css','./assets/js/bootstrap.js','./assets/js/app.bundle.js','./assets/js/runtime.js','./assets/js/performance.js','./assets/js/pwa-home.js','./assets/js/version-visibility.js'
];
self.addEventListener('install',event=>{event.waitUntil((async()=>{const cache=await caches.open(STATIC_CACHE);await Promise.allSettled(CORE_ASSETS.map(a=>cache.add(a)));})());});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const names=await caches.keys();await Promise.all(names.filter(n=>![STATIC_CACHE,RUNTIME_CACHE].includes(n)).map(n=>caches.delete(n)));await self.clients.claim();})());});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{
  const request=event.request;if(request.method!=='GET')return;const url=new URL(request.url);
  if(request.mode==='navigate'){
    event.respondWith((async()=>{try{const response=await fetch(request);if(response?.ok){const cache=await caches.open(RUNTIME_CACHE);cache.put('./index.html',response.clone());}return response;}catch(e){return (await caches.match('./index.html'))||(await caches.match('./'))||(await caches.match('./offline.html'));}})());return;
  }
  if(url.origin===self.location.origin){
    event.respondWith((async()=>{const cached=await caches.match(request);const network=fetch(request).then(async response=>{if(response?.ok){const cache=await caches.open(RUNTIME_CACHE);await cache.put(request,response.clone());}return response;}).catch(()=>null);return cached||(await network)||new Response('',{status:504,statusText:'Offline'});})());
  }
});
