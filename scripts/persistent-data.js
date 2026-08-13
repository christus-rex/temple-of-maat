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
        // The existing reset control reloads immediately. This tombstone makes
        // that explicit reset win over any older IndexedDB snapshot.
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

  window.TemplePersistentData = Object.freeze({ attach, hydrate, snapshot: localSnapshot });
})();
