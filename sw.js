const VERSION = 'temple-maat-pwa-v5.2.6-shem-dossiers-2026-08-14';
const STATIC_CACHE = `${VERSION}-static`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const CORE_ASSETS = [
  './',
  './index.html',
  './shem-hamephorash-72.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  './chambers.json',
  './offline.html',
  './version.json',
  './styles/v5.3-threshold.css',
  './styles/v5.2.4-living-codex.css',
  './styles/v5.2.5-living-temple.css',
  './scripts/persistent-data.js',
  './scripts/parental-powers.js',
  './scripts/parental-powers-assets.json',
  './scripts/v5.1-asset-manifest.json',
  './scripts/v5.3-threshold.js',
  './scripts/v5.2.4-living-codex.js',
  './scripts/v5.2.4-chant-fallback.js',
  './scripts/v5.2.5-living-temple.js',
  './scripts/v5.2.6-shem-dossiers.js',
  './scripts/v5.2.5-media-vault.js',
  './assets/audio/maat-forty-two-declarations.json'
];

async function cacheInBatches(cache, assets, batchSize = 12) {
  const uniqueAssets = [...new Set(assets.filter(Boolean))];
  for (let index = 0; index < uniqueAssets.length; index += batchSize) {
    await Promise.allSettled(uniqueAssets.slice(index, index + batchSize).map((asset) => cache.add(asset)));
  }
}

async function readJsonAsset(path) {
  try {
    const cached = await caches.match(path);
    const response = cached || await fetch(path, { cache: 'no-store' });
    if (!response || !response.ok) return null;
    return await response.clone().json();
  } catch {
    return null;
  }
}

async function releaseManifest() {
  return await readJsonAsset('./scripts/v5.1-asset-manifest.json');
}

async function parentalManifest() {
  return await readJsonAsset('./scripts/parental-powers-assets.json');
}

async function supportDisplayAssets() {
  const manifest = await releaseManifest();
  const assets = Array.isArray(manifest?.assets) ? manifest.assets : [];
  return assets.flatMap((asset) => asset.category === 'support' && asset.path ? [`./${asset.path}`] : []);
}

async function chamberDisplayAssets(chamber, ahead = 2) {
  const first = Math.max(1, Math.min(72, Number(chamber) || 1));
  const last = Math.min(72, first + Math.max(0, ahead));
  const release = await releaseManifest();
  const parental = await parentalManifest();
  const assets = Array.isArray(release?.assets) ? release.assets : [];
  const records = Array.isArray(parental?.records) ? parental.records : [];
  const heroes = assets.filter((asset) => asset.category === 'hero');
  const seals = assets.filter((asset) => asset.category === 'seal');
  const selected = [];

  for (let number = first; number <= last; number += 1) {
    const hero = heroes[number - 1];
    const seal = seals[number - 1];
    const parentalRecord = records.find((record) => Number(record.number) === number);
    if (hero?.display?.path) selected.push(`./${hero.display.path}`);
    if (seal?.display?.path) selected.push(`./${seal.display.path}`);
    if (parentalRecord?.display?.path) selected.push(`./${parentalRecord.display.path}`);
  }

  return selected;
}

async function allDisplayAssets() {
  const release = await releaseManifest();
  const parental = await parentalManifest();
  const releaseAssets = Array.isArray(release?.assets) ? release.assets : [];
  const records = Array.isArray(parental?.records) ? parental.records : [];
  const visuals = releaseAssets.flatMap((asset) => {
    if (asset.category === 'support' && asset.path) return [`./${asset.path}`];
    if ((asset.category === 'hero' || asset.category === 'seal') && asset.display?.path) return [`./${asset.display.path}`];
    return [];
  });
  const parentalAssets = records.flatMap((record) => record.display?.path ? [`./${record.display.path}`] : []);
  return [...visuals, ...parentalAssets];
}

async function cacheChamberWindow(chamber) {
  const cache = await caches.open(RUNTIME_CACHE);
  await cacheInBatches(cache, await chamberDisplayAssets(chamber, 2), 9);
}

async function cacheFullTemple() {
  const cache = await caches.open(RUNTIME_CACHE);
  await cacheInBatches(cache, await allDisplayAssets());
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    // Keep installation light: app shell + support visuals. Canonical ritual audio lives in IndexedDB only after explicit visitor installation.
    await cacheInBatches(cache, CORE_ASSETS);
    await cacheInBatches(cache, await supportDisplayAssets());
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
  const data = event.data || {};
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  if (data.type === 'CACHE_CHAMBER') {
    event.waitUntil(cacheChamberWindow(data.chamber));
    return;
  }
  if (data.type === 'CACHE_FULL_TEMPLE') {
    // Explicit opt-in path exposed through window.TempleOfflineCache.downloadFull().
    event.waitUntil(cacheFullTemple());
  }
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
      } catch {
        return (await caches.match('./index.html')) || (await caches.match('./')) || (await caches.match('./offline.html'));
      }
    })());
    return;
  }

  // Same-origin resources: use cached content immediately and refresh it in the background.
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
      return cached || (await networkPromise) || new Response('', { status: 504, statusText: 'Offline' });
    })());
  }
});