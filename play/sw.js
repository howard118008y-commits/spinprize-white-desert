// V4 includes compact desktop play and the shared #00D9BA studio accent.
const CACHE='heycheng-play-20260927-v4';
const ASSETS=['/play/','/play/index.html','/play/play.css','/play/game.mjs','/play/app.mjs','/play/brand.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS.map(path=>new Request(path,{cache:'reload'})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(names=>Promise.all(names.filter(name=>name.startsWith('heycheng-play-')&&name!==CACHE).map(name=>caches.delete(name)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||url.search||!ASSETS.includes(url.pathname))return;
 event.respondWith(caches.open(CACHE).then(async cache=>{
  const cached=await cache.match(event.request);if(cached)return cached;
  const response=await fetch(event.request);
  if(response.ok&&response.type==='basic')await cache.put(event.request,response.clone());
  return response;
 }));
});
