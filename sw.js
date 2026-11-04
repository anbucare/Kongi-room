/* 콩이네 방 service worker: caches the app shell so the timer opens offline. */
const VERSION = 'kongi-v9';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/icon.svg',
  './assets/room_bg.webp',
  './assets/cat_sleep.png',
  './assets/cat_sit.png',
  './assets/cat_back.png',
  './assets/cat_stretch.png',
  './assets/cat_eat.png',
  './assets/pixel_bowl.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Own files
  if (url.origin === self.location.origin) {
    // HTML / root navigation: network-first so updates reflect immediately, fall back to cache offline
    if (req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/')) {
      e.respondWith(
        fetch(req).then((res) => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(VERSION).then((c) => c.put(req, clone));
          }
          return res;
        }).catch(() => caches.match(req))
      );
      return;
    }

    // Static assets (images, icons): cache-first, update in background
    e.respondWith(
      caches.match(req).then((hit) => {
        const fetching = fetch(req).then((res) => {
          if (res && res.ok) caches.open(VERSION).then((c) => c.put(req, res.clone()));
          return res;
        }).catch(() => hit);
        return hit || fetching;
      })
    );
    return;
  }

  // External fonts: network first, fallback to cache
  if (url.hostname.endsWith('gstatic.com') || url.hostname.endsWith('googleapis.com')) {
    e.respondWith(
      fetch(req).then((res) => {
        caches.open(VERSION).then((c) => c.put(req, res.clone()));
        return res;
      }).catch(() => caches.match(req))
    );
  }
});
