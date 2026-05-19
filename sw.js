const CACHE='aurora-v__BUILD_VERSION__';
const ASSETS=['./','/index.html','/aurora.css','/aurora.js','/manifest.json'];

// Allow the app to trigger SW activation
self.addEventListener('message',e=>{
  if(e.data?.type==='SKIP_WAITING')self.skipWaiting();
});

// Install — cache core assets
self.addEventListener('install',e=>{
  e.waitUntil(
    caches.open(CACHE)
      .then(c=>c.addAll(ASSETS))
      .then(()=>self.skipWaiting())
  );
});

// Activate — delete old caches
self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(
        keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))
      ))
      .then(()=>self.clients.claim())
      .then(()=>{
        // Tell all clients a new version is active
        self.clients.matchAll().then(clients=>
          clients.forEach(c=>c.postMessage({type:'SW_UPDATED'}))
        );
      })
  );
});

// Fetch — cache first for assets, network first for API calls
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  // Don't cache API calls, external resources, or non-GET
  if(e.request.method!=='GET')return;
  if(url.hostname!==self.location.hostname)return;

  e.respondWith(
    caches.match(e.request)
      .then(cached=>{
        const fresh=fetch(e.request).then(res=>{
          if(res.ok){
            const clone=res.clone();
            caches.open(CACHE).then(c=>c.put(e.request,clone));
          }
          return res;
        });
        return cached||fresh;
      })
  );
});
