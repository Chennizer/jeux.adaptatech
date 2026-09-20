const CACHE_PREFIX = 'adaptatech-video-modeling-';
const CACHE_NAME = CACHE_PREFIX + 'v5';
const ASSETS = ['./', './index.html', './css/base.css?v=5', './css/video-modeling.css?v=5', './js/db.js?v=5', './js/video-utils.js?v=5', './js/video-modeling.js?v=5', './js/grid-utils.js?v=5'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.registration.scope)) return;
  event.respondWith(caches.open(CACHE_NAME).then(cache => cache.match(event.request)).then(cached => cached || fetch(event.request)));
});

