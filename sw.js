const CACHE='myfit-v4';
const APP='./app-v2.html';
const PATCH='./workout-points.js';
const ASSETS=[APP,PATCH,'./manifest.webmanifest'];

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
  const patched=text.includes('workout-points.js')?text:text.replace('</body>','<script src="./workout-points.js?v=4"></script></body>');
  const headers=new Headers(response.headers);headers.set('content-type','text/html; charset=utf-8');
  return new Response(patched,{status:response.status,statusText:response.statusText,headers});
}

self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.mode==='navigate'){
    e.respondWith((async()=>{
      try{
        const fresh=await fetch(APP,{cache:'no-store'});
        if(fresh.ok){caches.open(CACHE).then(c=>c.put(APP,fresh.clone())).catch(()=>{});return patchedApp(fresh)}
      }catch(err){}
      const cached=await caches.match(APP);return cached?patchedApp(cached):fetch(APP);
    })());return;
  }
  e.respondWith(fetch(req,{cache:'no-store'}).catch(()=>caches.match(req)));
});