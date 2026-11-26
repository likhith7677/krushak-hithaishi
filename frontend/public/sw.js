const CACHE='kh-static-v1';
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(['/offline.html','/manifest.json','/icon-192.png'])));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',event=>{const req=event.request;const url=new URL(req.url);if(req.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/')||url.pathname.startsWith('/owner/')||url.pathname.startsWith('/admin/')||url.pathname.startsWith('/login'))return;
if(url.pathname.startsWith('/_next/static/')||url.pathname.startsWith('/icon-'))event.respondWith(caches.open(CACHE).then(async cache=>{const found=await cache.match(req);if(found)return found;const r=await fetch(req);if(r.ok)cache.put(req,r.clone());return r}));
else if(req.mode==='navigate')event.respondWith(fetch(req).catch(()=>caches.match('/offline.html')));
});
