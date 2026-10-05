/* Same-origin offline shell. Build output hashes isolate changed app bundles. */
const CACHE = 'ordreise-v1';
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const response = await fetch(new URL('./index.html', self.registration.scope), { cache: 'reload' });
    if (!response.ok) throw new Error('Unable to load app shell');
    const html = await response.clone().text();
    const assets = [...html.matchAll(/(?:src|href)="([^"\s]+\.(?:js|css))"/g)].map(match => new URL(match[1], self.registration.scope).href);
    await cache.addAll([...assets, './icon.svg', './manifest.webmanifest']);
    await cache.put(new URL('./index.html', self.registration.scope), response);
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => { for (const key of await caches.keys()) if (key.startsWith('ordreise-') && key !== CACHE) await caches.delete(key); await self.clients.claim(); })());
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(event.request);
      if (response.ok) await cache.put(event.request, response.clone());
      return response;
    } catch {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      if (event.request.mode === 'navigate') return (await cache.match(new URL('./index.html', self.registration.scope))) ?? Response.error();
      return Response.error();
    }
  })());
});
