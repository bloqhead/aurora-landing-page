const CACHE_VERSION = '__BUILD_VERSION__';
const CACHE = `aurora-${CACHE_VERSION}`;
const PRECACHE = [
  '/aurora-landing-page/',
  '/aurora-landing-page/index.html',
  '/aurora-landing-page/manifest.json',
  '/aurora-landing-page/sw.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting()) // activate immediately
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isExternal = url.hostname !== location.hostname;

  if (isExternal) {
    // External APIs — network first, fall back to cache
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
  } else {
    // Local assets — network first, update cache, fall back to cache
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
  }
});

// Tell clients when a new SW has taken over
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
