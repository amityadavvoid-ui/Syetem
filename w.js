[1mdiff --git a/sw.js b/sw.js[m
[1mindex eba3696..91ed0f0 100644[m
[1m--- a/sw.js[m
[1m+++ b/sw.js[m
[36m@@ -1,55 +1,54 @@[m
[31m-const CACHE_NAME = 'solo-leveling-v1';[m
[31m-const urlsToCache = [[m
[31m-  '/',[m
[31m-  'index.html',[m
[31m-  'manifest.json',[m
[31m-  'css/style.css',[m
[31m-  'js/core.js',[m
[31m-  'js/ui.js',[m
[31m-  'js/daily.js',[m
[31m-  'js/timer.js',[m
[31m-  'js/streak.js',[m
[31m-  // Make sure you actually have these image files in your root folder![m
[31m-  // If you don't, comment them out or the service worker might fail to install.[m
[31m-  'icon-192.png',[m
[31m-  'icon-512.png'[m
[31m-];[m
[31m-[m
[31m-self.addEventListener("install", (event) => {[m
[31m-  self.skipWaiting();[m
[31m-  event.waitUntil([m
[31m-    caches.open(CACHE_NAME)[m
[31m-      .then((cache) => {[m
[31m-        console.log('Opened cache');[m
[31m-        return cache.addAll(urlsToCache);[m
[31m-      })[m
[31m-  );[m
[31m-});[m
[31m-[m
[31m-self.addEventListener("activate", (event) => {[m
[31m-  console.log("Solo Leveling System active");[m
[31m-  event.waitUntil([m
[31m-    caches.keys().then((cacheNames) => {[m
[31m-      return Promise.all([m
[31m-        cacheNames.map((cacheName) => {[m
[31m-          if (cacheName !== CACHE_NAME) {[m
[31m-            return caches.delete(cacheName);[m
[31m-          }[m
[31m-        })[m
[31m-      );[m
[31m-    })[m
[31m-  );[m
[31m-});[m
[31m-[m
[31m-// REQUIRED: Fetch handler to serve cached files when offline[m
[31m-self.addEventListener('fetch', (event) => {[m
[31m-  event.respondWith([m
[31m-    caches.match(event.request)[m
[31m-      .then((response) => {[m
[31m-        if (response) {[m
[31m-          return response;[m
[31m-        }[m
[31m-        return fetch(event.request);[m
[31m-      })[m
[31m-  );[m
[32m+[m[32mconst CACHE_NAME = 'solo-leveling-v1';[m
[32m+[m[32mconst urlsToCache = [[m
[32m+[m[32m  './',[m
[32m+[m[32m  './index.html',[m
[32m+[m[32m  './manifest.json',[m
[32m+[m[32m  './style.css',[m
[32m+[m[32m  './core.js',[m
[32m+[m[32m  './ui.js',[m
[32m+[m[32m  './daily.js',[m
[32m+[m[32m  './timer.js',[m
[32m+[m[32m  './streak.js',[m
[32m+[m[32m  './icon-192.png',[m
[32m+[m[32m  './icon-512.png',[m
[32m+[m[32m  './avatar.png'[m
[32m+[m[32m];[m
[32m+[m
[32m+[m[32mself.addEventListener("install", (event) => {[m
[32m+[m[32m  self.skipWaiting();[m
[32m+[m[32m  event.waitUntil([m
[32m+[m[32m    caches.open(CACHE_NAME)[m
[32m+[m[32m      .then((cache) => {[m
[32m+[m[32m        console.log('Opened cache');[m
[32m+[m[32m        return cache.addAll(urlsToCache);[m
[32m+[m[32m      })[m
[32m+[m[32m  );[m
[32m+[m[32m});[m
[32m+[m
[32m+[m[32mself.addEventListener("activate", (event) => {[m
[32m+[m[32m  console.log("Solo Leveling System active");[m
[32m+[m[32m  event.waitUntil([m
[32m+[m[32m    caches.keys().then((cacheNames) => {[m
[32m+[m[32m      return Promise.all([m
[32m+[m[32m        cacheNames.map((cacheName) => {[m
[32m+[m[32m          if (cacheName !== CACHE_NAME) {[m
[32m+[m[32m            return caches.delete(cacheName);[m
[32m+[m[32m          }[m
[32m+[m[32m        })[m
[32m+[m[32m      );[m
[32m+[m[32m    })[m
[32m+[m[32m  );[m
[32m+[m[32m});[m
[32m+[m
[32m+[m[32m// REQUIRED: Fetch handler to serve cached files when offline[m
[32m+[m[32mself.addEventListener('fetch', (event) => {[m
[32m+[m[32m  event.respondWith([m
[32m+[m[32m    caches.match(event.request)[m
[32m+[m[32m      .then((response) => {[m
[32m+[m[32m        if (response) {[m
[32m+[m[32m          return response;[m
[32m+[m[32m        }[m
[32m+[m[32m        return fetch(event.request);[m
[32m+[m[32m      })[m
[32m+[m[32m  );[m
 });[m
\ No newline at end of file[m
