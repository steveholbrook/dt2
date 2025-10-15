/* GH Pages friendly service worker */
const CACHE_NAME = 'dt-ghpages-v1';
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './offline.html',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(PRECACHE_URLS);
  })());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => k !== CACHE_NAME ? caches.delete(k) : Promise.resolve()));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith((async () => {
      try {
        const net = await fetch(request, { cache: 'reload' });
        return net;
      } catch (e) {
        const cache = await caches.open(CACHE_NAME);
        const offline = await cache.match('./offline.html');
        return offline || Response.error();
      }
    })());
    return;
  }
  if (PRECACHE_URLS.some(url => request.url.endsWith(url.replace('./','')))) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) return cached;
      const net = await fetch(request);
      if (net && net.ok) cache.put(request, net.clone());
      return net;
    })());
    return;
  }
});