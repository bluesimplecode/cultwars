// FigurKampf Service Worker — Offline-Caching für die Haupt-App.
// Cache-Version erhöhen, wenn sich figuren-spiel.html/manifest/icons ändern,
// damit Nutzer beim nächsten Start die neue Version bekommen.
const CACHE_NAME = 'figurkampf-v1';
const PRECACHE_URLS = [
  './figuren-spiel.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Cache-first für alles was wir vorgecacht haben, sonst normal ans Netz
// (die App braucht ohnehin kein Netz zum Spielen — nur der Admin-Generator
// für die KI-Story, der bewusst nicht Teil dieses Service Workers ist).
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => cached);
    })
  );
});
