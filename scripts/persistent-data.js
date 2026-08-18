(function () {
  'use strict';

  const DB_NAME = 'temple-maat-persistent-data';
  const STORE_NAME = 'snapshots';
  const SNAPSHOT_KEY = 'dynamic-data-v1';
  const TRACKED_KEYS = new Set([
    'temple_sigs',
    'temple_total',
    'temple_unique_count',
    'temple_unique_flag'
  ]);

  // Global visitor ledger for the static GitHub Pages Temple. The current
  // provider exposes a public, credential-free browser API and supports an
  // anonymized unique-user modifier. Local cache keys intentionally remain
  // stable so previously confirmed counts are still available offline.
  const GLOBAL_COUNTER = Object.freeze({
    baseUrl: 'https://counterapi.com/api',
    namespace: 'temple-of-sol-om-on-maat',
    action: 'view',
    totalKey: 'total-visits',
    uniqueKey: 'unique-browsers',
    totalCacheKey: 'temple_global_total_cache_v1',
    uniqueCacheKey: 'temple_global_unique_cache_v1',
    syncedAtKey: 'temple_global_counter_synced_at_v1',
    provider: 'counterapi.com'
  });

  let storage = null;
  let databasePromise = null;
  let pendingWrite = Promise.resolve();

  function number(value) {
    const parsed = Number.parseInt(value || '0', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  function signatures(value) {
    try {
      const parsed = typeof value === 'string' ? JSON.parse(value) : value;
      return Array.isArray(parsed) ? parsed.filter((entry) => entry && typeof entry === 'object') : [];
    } catch (_) {
      return [];
    }
  }

  function signatureKey(entry) {
    if (entry.id !== undefined && entry.id !== null) return `id:${entry.id}`;
    return ['date', 'name', 'wholesome', 'chamber', 'intention', 'vow', 'seal']
      .map((key) => String(entry[key] || '').trim())
      .join('\u001f');
  }

  function mergeSignatures(primary, backup) {
    const merged = [];
    const seen = new Set();
    for (const entry of [...primary, ...backup]) {
      const key = signatureKey(entry);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push(entry);
    }
    return merged.sort((left, right) => number(right.id) - number(left.id));
  }

  function localSnapshot() {
    return {
      schema: 1,
      updatedAt: new Date().toISOString(),
      total: number(storage && storage.getItem('temple_total')),
      unique: number(storage && storage.getItem('temple_unique_count')),
      uniqueFlag: Boolean(storage && storage.getItem('temple_unique_flag')),
      signatures: signatures(storage && storage.getItem('temple_sigs'))
    };
  }

  function openDatabase() {
    if (databasePromise) return databasePromise;
    databasePromise = new Promise((resolve) => {
      if (!window.indexedDB) return resolve(null);
      const request = window.indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE_NAME)) {
          request.result.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    });
    return databasePromise;
  }

  async function readBackup() {
    const database = await openDatabase();
    if (!database) return null;
    return new Promise((resolve) => {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const request = transaction.objectStore(STORE_NAME).get(SNAPSHOT_KEY);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  }

  async function writeBackup(snapshot) {
    const database = await openDatabase();
    if (!database) return;
    await new Promise((resolve) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(snapshot, SNAPSHOT_KEY);
      transaction.oncomplete = resolve;
      transaction.onerror = resolve;
      transaction.onabort = resolve;
    });
  }

  async function clearBackup() {
    const database = await openDatabase();
    if (!database) return;
    await new Promise((resolve) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).delete(SNAPSHOT_KEY);
      transaction.oncomplete = resolve;
      transaction.onerror = resolve;
      transaction.onabort = resolve;
    });
  }

  function scheduleBackup() {
    pendingWrite = pendingWrite.then(() => writeBackup(localSnapshot())).catch(() => {});
    return pendingWrite;
  }

  function attach(localStorage) {
    storage = localStorage;
    return {
      getItem(key) {
        return storage.getItem(key);
      },
      setItem(key, value) {
        storage.setItem(key, value);
        if (TRACKED_KEYS.has(String(key))) scheduleBackup();
      },
      removeItem(key) {
        storage.removeItem(key);
        if (TRACKED_KEYS.has(String(key))) scheduleBackup();
      },
      clear() {
        storage.clear();
        storage.setItem('temple_persistence_reset', '1');
        pendingWrite = pendingWrite.then(clearBackup).catch(() => {});
      },
      key(index) {
        return storage.key(index);
      },
      get length() {
        return storage.length;
      }
    };
  }

  async function hydrate() {
    if (!storage) return;
    if (storage.getItem('temple_persistence_reset')) {
      await clearBackup();
      storage.removeItem('temple_persistence_reset');
      await writeBackup(localSnapshot());
      return;
    }
    const local = localSnapshot();
    const backup = await readBackup();
    const merged = {
      schema: 1,
      updatedAt: new Date().toISOString(),
      total: Math.max(local.total, number(backup && backup.total)),
      unique: Math.max(local.unique, number(backup && backup.unique)),
      uniqueFlag: local.uniqueFlag || Boolean(backup && backup.uniqueFlag),
      signatures: mergeSignatures(local.signatures, signatures(backup && backup.signatures))
    };
    storage.setItem('temple_total', String(merged.total));
    storage.setItem('temple_unique_count', String(merged.unique));
    if (merged.uniqueFlag) storage.setItem('temple_unique_flag', '1');
    if (merged.signatures.length) storage.setItem('temple_sigs', JSON.stringify(merged.signatures));
    await writeBackup(merged);
  }

  function safeLocalStorage() {
    try {
      const store = window.localStorage;
      const probe = '__temple_global_counter_probe__';
      store.setItem(probe, '1');
      store.removeItem(probe);
      return store;
    } catch (_) {
      return null;
    }
  }

  function counterValue(payload) {
    const candidates = [
      payload && payload.value,
      payload && payload.count,
      payload && payload.data && payload.data.value,
      payload && payload.data && payload.data.count
    ];
    for (const candidate of candidates) {
      const parsed = Number(candidate);
      if (Number.isFinite(parsed) && parsed >= 0) return Math.trunc(parsed);
    }
    return null;
  }

  async function requestCounter(key, options = {}) {
    const namespace = encodeURIComponent(GLOBAL_COUNTER.namespace);
    const action = encodeURIComponent(GLOBAL_COUNTER.action);
    const name = encodeURIComponent(key);
    const url = new URL(`${GLOBAL_COUNTER.baseUrl}/${namespace}/${action}/${name}`);
    if (options.unique) url.searchParams.set('unique', 'true');
    if (options.readOnly) url.searchParams.set('readOnly', 'true');
    const response = await fetch(url.href, {
      method: 'GET',
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer'
    });
    if (!response.ok) throw new Error(`Counter request failed (${response.status})`);
    const payload = await response.json();
    const value = counterValue(payload);
    if (value === null) throw new Error('Counter response did not contain a numeric value');
    return value;
  }

  function cachedGlobalCounts(store) {
    if (!store) return { total: 0, unique: 0 };
    return {
      total: number(store.getItem(GLOBAL_COUNTER.totalCacheKey)),
      unique: number(store.getItem(GLOBAL_COUNTER.uniqueCacheKey))
    };
  }

  function cacheGlobalCounts(store, counts) {
    if (!store) return;
    if (Number.isFinite(counts.total)) store.setItem(GLOBAL_COUNTER.totalCacheKey, String(counts.total));
    if (Number.isFinite(counts.unique)) store.setItem(GLOBAL_COUNTER.uniqueCacheKey, String(counts.unique));
    store.setItem(GLOBAL_COUNTER.syncedAtKey, new Date().toISOString());
  }

  function replaceVisitorHeader(total, unique) {
    const nodes = document.querySelectorAll('.temple-header .font-mono');
    for (const node of nodes) {
      const text = (node.textContent || '').replace(/\s+/g, ' ').trim();
      if (!/\bVISITORS\b/i.test(text) || !/\bUNIQUE\b/i.test(text)) continue;
      const expected = `VISITORS ${total} / UNIQUE ${unique}`;
      if (text.replace(/^●\s*/, '') === expected) return;
      const pulse = node.querySelector('span');
      if (pulse) {
        const clone = pulse.cloneNode(true);
        node.replaceChildren(clone, document.createTextNode(` ${expected}`));
      } else {
        node.textContent = expected;
      }
      node.setAttribute('data-visitor-count', 'global');
      node.title = 'Persistent global visitor ledger';
      return;
    }
  }

  function replaceStatValue(labelText, value) {
    const labels = document.querySelectorAll('div');
    for (const label of labels) {
      if (label.children.length) continue;
      if ((label.textContent || '').trim().toUpperCase() !== labelText) continue;
      const valueNode = label.nextElementSibling;
      if (!valueNode) return;
      const nextValue = String(value);
      if ((valueNode.textContent || '').trim() !== nextValue) valueNode.textContent = nextValue;
      valueNode.setAttribute('data-visitor-count', 'global');
      valueNode.title = 'Persistent global visitor ledger';
      return;
    }
  }

  function renderGlobalCounts(counts) {
    if (!counts || !Number.isFinite(counts.total) || !Number.isFinite(counts.unique)) return;
    replaceVisitorHeader(counts.total, counts.unique);
    replaceStatValue('TOTAL VISITS', counts.total);
    replaceStatValue('UNIQUE', counts.unique);
  }

  function watchForCounterMount(counts) {
    let scheduled = false;
    const apply = () => {
      scheduled = false;
      renderGlobalCounts(counts);
    };
    apply();
    if (!window.MutationObserver) return;
    const observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(apply);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    window.setTimeout(() => observer.disconnect(), 15000);
  }

  async function syncGlobalVisitorCount() {
    const store = safeLocalStorage();
    const cached = cachedGlobalCounts(store);
    if (cached.total || cached.unique) watchForCounterMount(cached);

    let total = cached.total;
    let unique = cached.unique;
    try {
      total = await requestCounter(GLOBAL_COUNTER.totalKey);
    } catch (_) {
      // Preserve the last confirmed remote value when offline or unavailable.
    }
    try {
      unique = await requestCounter(GLOBAL_COUNTER.uniqueKey, { unique: true });
    } catch (_) {
      // Unique visitors are provider-deduplicated; cached value is the offline fallback.
    }

    if (!Number.isFinite(total) || total < 0) total = cached.total;
    if (!Number.isFinite(unique) || unique < 0) unique = cached.unique;
    cacheGlobalCounts(store, { total, unique });
    watchForCounterMount({ total, unique });
    window.dispatchEvent(new CustomEvent('temple:visitor-count', {
      detail: Object.freeze({ total, unique, persistent: true, provider: GLOBAL_COUNTER.provider })
    }));
  }

  window.TemplePersistentData = Object.freeze({ attach, hydrate, snapshot: localSnapshot });
  window.TempleVisitorCount = Object.freeze({ sync: syncGlobalVisitorCount, config: GLOBAL_COUNTER });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncGlobalVisitorCount, { once: true });
  } else {
    syncGlobalVisitorCount();
  }
})();
