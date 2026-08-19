const DB_NAME = 'rti-news-media';
const DB_VERSION = 1;
const STORE_NAME = 'media';

export const IDB_MEDIA_PREFIX = 'idb-media:';

export function isIdbMediaUri(uri) {
  return typeof uri === 'string' && uri.startsWith(IDB_MEDIA_PREFIX);
}

function openDb() {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('indexedDB not available'));
  }

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('indexedDB open failed'));
  });
}

async function idbSet(key, value) {
  const db = await openDb();
  return await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(value, key);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error || new Error('indexedDB put failed'));
    tx.oncomplete = () => db.close();
    tx.onerror = () => { try { db.close(); } catch {} };
  });
}

async function idbGet(key) {
  const db = await openDb();
  return await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error || new Error('indexedDB get failed'));
    tx.oncomplete = () => db.close();
    tx.onerror = () => { try { db.close(); } catch {} };
  });
}

function buildKey(prefix) {
  const p = String(prefix || 'media').replace(/[^a-z0-9_-]/gi, '');
  return `${p}-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

export async function storeWebUriToIdbMedia(uri, { prefix = 'video', mimeType = '' } = {}) {
  if (typeof fetch === 'undefined') return uri;
  if (typeof URL === 'undefined') return uri;

  const rawUri = typeof uri === 'string' ? uri.trim() : '';
  if (!rawUri) return uri;

  try {
    const res = await fetch(rawUri);
    const blob = await res.blob();
    const key = buildKey(prefix);
    await idbSet(key, { blob, mimeType: blob.type || mimeType || '', savedAt: Date.now() });
    return `${IDB_MEDIA_PREFIX}${key}`;
  } catch {
    return uri;
  }
}

export async function resolveIdbMediaUriToObjectUrl(idbUri) {
  if (!isIdbMediaUri(idbUri)) return null;
  if (typeof URL === 'undefined') return null;

  try {
    const key = idbUri.slice(IDB_MEDIA_PREFIX.length);
    const record = await idbGet(key);
    const blob = record?.blob;
    if (!blob) return null;
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

// Use this when an IndexedDB-backed image must be uploaded as multipart data.
export async function getIdbMediaBlob(idbUri) {
  if (!isIdbMediaUri(idbUri)) return null;
  try {
    const key = idbUri.slice(IDB_MEDIA_PREFIX.length);
    const record = await idbGet(key);
    return record?.blob || null;
  } catch {
    return null;
  }
}
