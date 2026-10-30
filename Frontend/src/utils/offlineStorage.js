// ==============================================================================
// TaniKarbon - Modul Persistensi IndexedDB Lapangan (Offline-First Engine)
// ==============================================================================

const DB_NAME = 'tanikarbon_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'survey_queue';

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB tidak didukung pada lingkungan ini.'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Mengambil seluruh antrean survei offline dari IndexedDB
 */
export async function getOfflineSurveys() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Gagal membaca IndexedDB, fallback ke localStorage:', err);
    try {
      const raw = localStorage.getItem(STORE_NAME);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}

/**
 * Menyimpan tiket hasil audit survei ke IndexedDB
 */
export async function saveOfflineSurvey(surveyItem) {
  const item = {
    ...surveyItem,
    id: surveyItem.id || `offline-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    savedAt: new Date().toISOString()
  };

  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(item);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Gagal menulis ke IndexedDB, fallback ke localStorage:', err);
    try {
      const list = JSON.parse(localStorage.getItem(STORE_NAME) || '[]');
      const filtered = list.filter(i => i.id !== item.id);
      filtered.push(item);
      localStorage.setItem(STORE_NAME, JSON.stringify(filtered));
    } catch (e) {
      console.error('LocalStorage fallback error:', e);
    }
  }

  return item;
}

/**
 * Menghapus 1 paket survei dari antrean setelah sukses di-upload
 */
export async function deleteOfflineSurvey(id) {
  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Gagal menghapus dari IndexedDB, fallback ke localStorage:', err);
  }

  try {
    const list = JSON.parse(localStorage.getItem(STORE_NAME) || '[]');
    const updated = list.filter(i => i.id !== id);
    localStorage.setItem(STORE_NAME, JSON.stringify(updated));
  } catch {
    // silent
  }
}

/**
 * Mengosongkan seluruh antrean survei offline
 */
export async function clearOfflineSurveys() {
  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Gagal mengosongkan IndexedDB:', err);
  }

  try {
    localStorage.removeItem(STORE_NAME);
  } catch {
    // silent
  }
}
