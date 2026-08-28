const VERSION = 'v1';
const SHELL = ['/', '/index.html', '/demo', '/privacy', '/terms', '/404.html', '/offline.html', '/manifest.webmanifest', '/icon.svg', '/art/blueprint-hero.webp', '/assets/app.js', '/assets/app.css'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== VERSION).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(response => {
      caches.open(VERSION).then(cache => cache.put(event.request, response.clone()));
      return response;
    }).catch(() => caches.match(event.request).then(hit => hit || caches.match('/index.html') || caches.match('/offline.html'))));
    return;
  }
  event.respondWith(caches.match(event.request).then(hit => hit || fetch(event.request).then(response => {
    if (response.ok) caches.open(VERSION).then(cache => cache.put(event.request, response.clone()));
    return response;
  })));
});
