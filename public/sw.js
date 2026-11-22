/*
 * EasyJSON offline support.
 * After the first visit the landing page and the app work without a network connection.
 * Only same-origin GET requests are cached; calls to your local AI server are never touched.
 */
const CACHE = 'easyjson-v1';
const SHELL = ['/', '/app/', '/theme.js', '/favicon.svg', '/manifest.webmanifest'];

// Precache both pages plus every script/stylesheet they reference, so the first visit is enough for offline use.
async function precache() {
  const cache = await caches.open(CACHE);
  await cache.addAll(SHELL);
  const assets = new Set();
  for (const page of ['/', '/app/']) {
    const res = await cache.match(page);
    const html = res ? await res.text() : '';
    for (const m of html.matchAll(/(?:src|href)="(\/static\/[^"]+)"/g)) assets.add(m[1]);
  }
  await cache.addAll([...assets]);
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // Hashed build assets never change: serve from cache first.
  if (url.pathname.startsWith('/static/')) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
            return res;
          }),
      ),
    );
    return;
  }

  // Pages and everything else: try the network, fall back to the cached copy when offline.
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches
          .match(req)
          .then((hit) => hit || (req.mode === 'navigate' ? caches.match(url.pathname.startsWith('/app') ? '/app/' : '/') : undefined))
          .then((res) => res || Response.error()),
      ),
  );
});
