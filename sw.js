const VERSION = 'temple-maat-pwa-v5.2.7-wallpaper-hotfix-2026-08-14';
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
  './styles/v5.2.8-offline-controls.css',
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
  './scripts/v5.2.8-offline-controls.js',
  './assets/audio/maat-forty-two-declarations.json'
];
const cancelledFullCacheJobs = new Set();

function uniqueAssets(assets) {
  return [...new Set((assets || []).filter(Boolean))];
}

function assetUrl(asset) {
  return new URL(asset, self.registration.scope).href;
}

function isBinaryRitualMedia(url) {
  return url.origin === self.location.origin && /\/assets\/audio\/.*\.(?:mp3|opus|ogg|m4a|wav)$/i.test(url.pathname);
}

async function cacheInBatches(cache, assets, batchSize = 12) {
  const unique = uniqueAssets(assets);
  for (let index = 0; index < unique.length; index += batchSize) {
    await Promise.allSettled(unique.slice(index, index + batchSize).map((asset) => cache.add(asset)));
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

async function optionalDisplayAssets() {
  const release = await releaseManifest();
  const parental = await parentalManifest();
  const releaseAssets = Array.isArray(release?.assets) ? release.assets : [];
  const records = Array.isArray(parental?.records) ? parental.records : [];
  const chamberVisuals = releaseAssets.flatMap((asset) => {
    if ((asset.category === 'hero' || asset.category === 'seal') && asset.display?.path) return [`./${asset.display.path}`];
    return [];
  });
  const parentalAssets = records.flatMap((record) => record.display?.path ? [`./${record.display.path}`] : []);
  return uniqueAssets([...chamberVisuals, ...parentalAssets]);
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
  return uniqueAssets([
    ...(await supportDisplayAssets()),
    ...(await optionalDisplayAssets())
  ]);
}

async function cacheChamberWindow(chamber) {
  const cache = await caches.open(RUNTIME_CACHE);
  await cacheInBatches(cache, await chamberDisplayAssets(chamber, 2), 9);
}

async function postToClient(clientId, message) {
  if (clientId) {
    const client = await self.clients.get(clientId);
    if (client) {
      client.postMessage(message);
      return;
    }
  }
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  clients.forEach((client) => client.postMessage(message));
}

async function offlineStatus() {
  const optional = await optionalDisplayAssets();
  const all = await allDisplayAssets();
  const cache = await caches.open(RUNTIME_CACHE);
  const keys = await cache.keys();
  const cachedUrls = new Set(keys.map((request) => request.url));
  return {
    optionalCached: optional.filter((asset) => cachedUrls.has(assetUrl(asset))).length,
    optionalTotal: optional.length,
    fullVisualTotal: all.length,
    staticCache: STATIC_CACHE,
    runtimeCache: RUNTIME_CACHE
  };
}

async function sendOfflineStatus(requestId, clientId) {
  try {
    await postToClient(clientId, {
      type: 'TEMPLE_OFFLINE_STATUS',
      requestId,
      ok: true,
      ...(await offlineStatus())
    });
  } catch (error) {
    await postToClient(clientId, {
      type: 'TEMPLE_OFFLINE_STATUS',
      requestId,
      ok: false,
      error: error?.message || 'Unable to inspect offline cache status.'
    });
  }
}

async function cacheFullTemple(requestId, clientId) {
  const id = requestId || `legacy-${Date.now()}`;
  cancelledFullCacheJobs.delete(id);
  try {
    const assets = await allDisplayAssets();
    const cache = await caches.open(RUNTIME_CACHE);
    const total = assets.length;
    let completed = 0;
    let failed = 0;
    await postToClient(clientId, { type: 'TEMPLE_OFFLINE_FULL_PROGRESS', requestId: id, phase: 'started', completed, failed, total });

    for (let index = 0; index < assets.length; index += 12) {
      if (cancelledFullCacheJobs.has(id)) {
        cancelledFullCacheJobs.delete(id);
        await postToClient(clientId, { type: 'TEMPLE_OFFLINE_FULL_PROGRESS', requestId: id, phase: 'cancelled', completed, failed, total });
        return;
      }
      const batch = assets.slice(index, index + 12);
      const results = await Promise.allSettled(batch.map((asset) => cache.add(asset)));
      completed += batch.length;
      failed += results.filter((result) => result.status === 'rejected').length;
      await postToClient(clientId, { type: 'TEMPLE_OFFLINE_FULL_PROGRESS', requestId: id, phase: 'progress', completed, failed, total });
    }

    cancelledFullCacheJobs.delete(id);
    await postToClient(clientId, { type: 'TEMPLE_OFFLINE_FULL_PROGRESS', requestId: id, phase: failed ? 'complete-with-errors' : 'complete', completed, failed, total });
  } catch (error) {
    cancelledFullCacheJobs.delete(id);
    await postToClient(clientId, {
      type: 'TEMPLE_OFFLINE_FULL_PROGRESS',
      requestId: id,
      phase: 'failed',
      completed: 0,
      failed: 0,
      total: 0,
      error: error?.message || 'Unable to cache the Temple visual archive.'
    });
  }
}

async function clearOptionalVisualCache(requestId, clientId) {
  try {
    const cache = await caches.open(RUNTIME_CACHE);
    const assets = await optionalDisplayAssets();
    let cleared = 0;
    for (let index = 0; index < assets.length; index += 24) {
      const batch = assets.slice(index, index + 24);
      const results = await Promise.all(batch.map(async (asset) => ({ removed: await cache.delete(asset) })));
      cleared += results.filter((result) => result.removed).length;
    }
    await postToClient(clientId, {
      type: 'TEMPLE_OFFLINE_CLEAR_RESULT',
      requestId,
      ok: true,
      cleared,
      optionalTotal: assets.length
    });
  } catch (error) {
    await postToClient(clientId, {
      type: 'TEMPLE_OFFLINE_CLEAR_RESULT',
      requestId,
      ok: false,
      error: error?.message || 'Unable to clear optional offline visuals.'
    });
  }
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
  const clientId = event.source?.id || null;
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  if (data.type === 'CACHE_CHAMBER') {
    event.waitUntil(cacheChamberWindow(data.chamber));
    return;
  }
  if (data.type === 'CACHE_FULL_TEMPLE') {
    // Explicit opt-in path exposed through window.TempleOfflineCache.downloadFull() and the visitor-facing Offline panel.
    event.waitUntil(cacheFullTemple(data.requestId, clientId));
    return;
  }
  if (data.type === 'CANCEL_FULL_TEMPLE') {
    if (data.requestId) cancelledFullCacheJobs.add(data.requestId);
    return;
  }
  if (data.type === 'GET_OFFLINE_STATUS') {
    event.waitUntil(sendOfflineStatus(data.requestId, clientId));
    return;
  }
  if (data.type === 'CLEAR_OPTIONAL_VISUAL_CACHE') {
    event.waitUntil(clearOptionalVisualCache(data.requestId, clientId));
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Binary ritual media must never enter Cache Storage. Canonical ritual media is
  // installed separately in IndexedDB only after explicit visitor selection.
  if (isBinaryRitualMedia(url)) {
    event.respondWith(fetch(request).catch(() => new Response('', { status: 504, statusText: 'Offline' })));
    return;
  }

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