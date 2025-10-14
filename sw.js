/* GH Pages friendly, conservative no‑cache service worker */
const OFFLINE_URL = './offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open('dt-offline-v1');
    await cache.add(new Request(OFFLINE_URL, {cache: 'reload'}));
  })());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Bypass non-GET & chrome-extension requests
  if (request.method !== 'GET' || request.url.startsWith('chrome-extension://')) return;

  event.respondWith((async () => {
    try {
      // Force a fresh network fetch to avoid stale caching on GH Pages
      const fresh = await fetch(request, { cache: 'reload' });
      return fresh;
    } catch (err) {
      // On failure, provide offline fallback for navigations (HTML pages).
      if (request.mode === 'navigate' || (request.destination === 'document')) {
        const cache = await caches.open('dt-offline-v1');
        const cached = await cache.match(OFFLINE_URL);
        if (cached) return cached;
      }
      // Otherwise, just fail-through.
      throw err;
    }
  })());
});
