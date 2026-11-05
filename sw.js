/* 콩이네 방 service worker: keeps the app shell offline, caches room art lazily. */
const VERSION = 'kongi-v18';
const SHELL = [
  './',
  './index.html',
  './app.css',
  './app.js',
  './i18n.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/icon.svg',
  './assets/cat_sleep.png',
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

  if (url.origin === self.location.origin) {
    // Page and code: network first so updates show up right away, cache when offline.
    if (req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
      e.respondWith(
        fetch(req).then((res) => {
          if (res && res.ok) { const clone = res.clone(); caches.open(VERSION).then((c) => c.put(req, clone)); }
          return res;
        }).catch(() => caches.match(req, { ignoreSearch: true }))
      );
      return;
    }
    // Images and icons: cache first, refresh in the background. Room art is cached the first time it is shown.
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

  // Google Fonts: network first, fall back to what was cached earlier.
  if (url.hostname.endsWith('gstatic.com') || url.hostname.endsWith('googleapis.com')) {
    e.respondWith(
      fetch(req).then((res) => {
        caches.open(VERSION).then((c) => c.put(req, res.clone()));
        return res;
      }).catch(() => caches.match(req))
    );
  }
});
