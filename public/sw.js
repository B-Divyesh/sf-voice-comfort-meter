const VERSION = 'voice-comfort-meter-__BUILD_ID__';
const SHELL = __SHELL__;
const fromCurrentCache = request => caches.open(VERSION).then(cache => cache.match(request));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(SHELL)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== VERSION).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('message', event => {
  if (event.data === 'skip-waiting') self.skipWaiting();
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(response => {
      caches.open(VERSION).then(cache => cache.put(event.request, response.clone()));
      return response;
    }).catch(() => {
      const path = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`;
      return fromCurrentCache(event.request)
        .then(hit => hit || fromCurrentCache(path))
        .then(hit => hit || fromCurrentCache('/index.html'))
        .then(hit => hit || fromCurrentCache('/offline.html'));
    }));
    return;
  }
  event.respondWith(fromCurrentCache(event.request).then(hit => hit || fetch(event.request).then(response => {
    if (response.ok) caches.open(VERSION).then(cache => cache.put(event.request, response.clone()));
    return response;
  })));
});
