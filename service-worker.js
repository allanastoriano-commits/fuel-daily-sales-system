const CACHE_NAME='fuel-daily-sales-v17-safe-meter-persistence';
const APP_SHELL=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./mcloi-preview.png'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)));
 self.skipWaiting();
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));
 self.clients.claim();
});
// Do not intercept Supabase REST/auth/storage queries. These must never be served
// from a stale service-worker cache or replaced with the app's HTML shell.
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin)return;
 const path=url.pathname;
 const appBase=new URL('./',self.registration.scope).pathname;
 if(!path.startsWith(appBase))return;
 const relative=path.slice(appBase.length);
 const allowed=['','index.html','manifest.json','icon-192.png','icon-512.png','mcloi-preview.png','service-worker.js'];
 if(!allowed.includes(relative))return;
 event.respondWith(fetch(request).then(response=>{
  if(response.ok){
   const clone=response.clone();
   event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.put(request,clone)));
  }
  return response;
 }).catch(async()=>{
  return await caches.match(request)||await caches.match(new URL('./index.html',self.registration.scope))||Response.error();
 }));
});