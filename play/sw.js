// Retire only the former public game's offline cache and service worker.
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const names=await caches.keys();
  await Promise.all(names.filter(name=>name.startsWith('heycheng-play-')).map(name=>caches.delete(name)));
  await self.registration.unregister();
  for(const client of await self.clients.matchAll({type:'window',includeUncontrolled:true})){
    const url=new URL(client.url);
    if(url.origin===self.location.origin&&url.pathname.startsWith('/play/'))await client.navigate('/portal/#play');
  }
})()));
