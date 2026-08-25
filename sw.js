const CACHE='myfit-v5';
const APP='./app-v2.html?v=5';
const APP_FALLBACK='./app-v2.html';
const PATCH='./workout-points.js?v=5';
const ASSETS=[APP_FALLBACK,'./workout-points.js','./manifest.webmanifest'];

self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});

self.addEventListener('activate',e=>{
  e.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),
    self.clients.claim()
  ]));
});

async function patchedApp(response){
  const text=await response.text();
  const patched=text.includes('workout-points.js')?text:text.replace('</body>','<script src="./workout-points.js?v=5"></script></body>');
  const headers=new Headers(response.headers);
  headers.set('content-type','text/html; charset=utf-8');
  headers.set('cache-control','no-store');
  return new Response(patched,{status:response.status,statusText:response.statusText,headers});
}

self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.mode==='navigate'){
    e.respondWith((async()=>{
      try{
        const fresh=await fetch(APP,{cache:'no-store'});
        if(fresh.ok){
          caches.open(CACHE).then(c=>c.put(APP_FALLBACK,fresh.clone())).catch(()=>{});
          return patchedApp(fresh);
        }
      }catch(err){}
      const cached=await caches.match(APP_FALLBACK);
      return cached?patchedApp(cached):fetch(APP_FALLBACK,{cache:'no-store'});
    })());
    return;
  }
  e.respondWith(fetch(req,{cache:'no-store'}).catch(()=>caches.match(req)));
});