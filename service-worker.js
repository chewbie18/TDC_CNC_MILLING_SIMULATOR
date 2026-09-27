const CACHE_NAME='tdc-cnc-installable-v2-20260927';
const STATIC_ASSETS=['./manifest.webmanifest','./icon-192.png','./icon-512.png'];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS)));
});

self.addEventListener('activate', event => {
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if(event.request.method!=='GET') return;
  const req=event.request, url=new URL(req.url);

  if(req.mode==='navigate' || url.pathname.endsWith('/index.html')){
    event.respondWith((async()=>{
      try{
        const fresh=await fetch(req,{cache:'no-store'});
        const c=await caches.open(CACHE_NAME);
        c.put('./index.html',fresh.clone());
        return fresh;
      }catch(e){
        return (await caches.match('./index.html')) || (await caches.match('./')) || Response.error();
      }
    })());
    return;
  }

  event.respondWith(caches.match(req).then(hit => hit || fetch(req).then(resp=>{
    if(resp && resp.ok && url.origin===self.location.origin){
      caches.open(CACHE_NAME).then(c=>c.put(req,resp.clone()));
    }
    return resp;
  })));
});
