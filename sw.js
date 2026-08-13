const VERSION = 'temple-maat-pwa-v5.1-2026-08-13-r2';
const STATIC_CACHE = `${VERSION}-static`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  './chambers.json',
  './offline.html',
  './version.json',
  './scripts/v5.1-asset-manifest.json'
];

async function cacheInBatches(cache, assets, batchSize = 12) {
  for (let index = 0; index < assets.length; index += batchSize) {
    await Promise.allSettled(assets.slice(index, index + batchSize).map((asset) => cache.add(asset)));
  }
}

async function releaseDisplayAssets() {
  try {
    const response = await fetch('./scripts/v5.1-asset-manifest.json', { cache: 'no-store' });
    if (!response.ok) return [];
    const manifest = await response.json();
    const assets = Array.isArray(manifest.assets) ? manifest.assets : [];
    return assets.flatMap((asset) => {
      if (asset.category === 'support' && asset.path) return [`./${asset.path}`];
      if ((asset.category === 'hero' || asset.category === 'seal') && asset.display?.path) return [`./${asset.display.path}`];
      return [];
    });
  } catch {
    return [];
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    // Cache independently so one missing optional asset cannot abort installation.
    await cacheInBatches(cache, CORE_ASSETS);
    await cacheInBatches(cache, await releaseDisplayAssets());
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => ![STATIC_CACHE, RUNTIME_CACHE].includes(name)).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Navigation: network-first, then the cached app shell, then offline fallback.
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put('./index.html', response.clone());
        }
        return response;
      } catch (error) {
        return (await caches.match('./index.html')) || (await caches.match('./')) || (await caches.match('./offline.html'));
      }
    })());
    return;
  }

  // Same-origin static resources: cache-first with background refresh.
  if (url.origin === self.location.origin) {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      const networkPromise = fetch(request).then(async (response) => {
        if (response && response.ok) {
          const cache = await caches.open(RUNTIME_CACHE);
          await cache.put(request, response.clone());
        }
        return response;
      }).catch(() => null);
      return cached || (await networkPromise) || new Response('', {status: 504, statusText: 'Offline'});
    })());
  }
});
