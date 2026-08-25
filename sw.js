const CACHE='myfit-v3';
const APP='./app-v2.html';
const ASSETS=[APP,'./manifest.webmanifest'];

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

self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.mode==='navigate'){
    e.respondWith((async()=>{
      try{
        const fresh=await fetch(APP,{cache:'no-store'});
        if(fresh.ok){
          caches.open(CACHE).then(c=>c.put(APP,fresh.clone())).catch(()=>{});
          return fresh;
        }
      }catch(err){}
      return (await caches.match(APP)) || fetch(APP);
    })());
    return;
  }
  e.respondWith(fetch(req,{cache:'no-store'}).catch(()=>caches.match(req)));
});
