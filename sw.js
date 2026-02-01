const CACHE_NAME = 'solo-leveling-v1';
const urlsToCache = [
  '/',
  'index.html',
  'manifest.json',
  'style.css',
  'core.js',
  'ui.js',
  'daily.js',
  'timer.js',
  'streak.js',
  // Make sure you actually have these image files in your root folder!
  // If you don't, comment them out or the service worker might fail to install.
  'icon-192.png',
  'icon-512.png'
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener("activate", (event) => {
  console.log("Solo Leveling System active");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// REQUIRED: Fetch handler to serve cached files when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});