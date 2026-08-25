const CACHE='myfit-v2';
const ASSETS=['./index.html','./manifest.webmanifest','./storage-fix.js'];

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

async function injectStorageFix(response){
  const text=await response.text();
  const patched=text.includes('storage-fix.js')?text:text.replace('</body>','<script src="./storage-fix.js?v=2"></script></body>');
  const headers=new Headers(response.headers);
  headers.set('content-type','text/html; charset=utf-8');
  return new Response(patched,{status:response.status,statusText:response.statusText,headers});
}

self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.mode==='navigate'){
    e.respondWith((async()=>{
      try{
        const fresh=await fetch(req,{cache:'no-store'});
        if(fresh.ok){
          const copy=fresh.clone();
          caches.open(CACHE).then(c=>c.put('./index.html',copy)).catch(()=>{});
          return injectStorageFix(fresh);
        }
      }catch(err){}
      const cached=await caches.match('./index.html');
      return cached?injectStorageFix(cached):fetch(req);
    })());
    return;
  }
  if(new URL(req.url).pathname.endsWith('/storage-fix.js')){
    e.respondWith(fetch(req,{cache:'no-store'}).catch(()=>caches.match('./storage-fix.js')));
    return;
  }
  e.respondWith(caches.match(req).then(cached=>cached||fetch(req)));
});
