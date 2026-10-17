/**
 * IndexedDB storage helper for user progress, quiz attempts, and section completions.
 */

const DB_NAME = 'InterviewPrepDB';
const DB_VERSION = 1;
const STORE_PROGRESS = 'progress';
const STORE_ATTEMPTS = 'quiz_attempts';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_PROGRESS)) {
        db.createObjectStore(STORE_PROGRESS, { keyPath: 'sectionId' });
      }
      if (!db.objectStoreNames.contains(STORE_ATTEMPTS)) {
        const attemptStore = db.createObjectStore(STORE_ATTEMPTS, {
          keyPath: 'id',
          autoIncrement: true,
        });
        attemptStore.createIndex('sectionId', 'sectionId', { unique: false });
        attemptStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getSectionProgress(sectionId) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PROGRESS, 'readonly');
      const store = tx.objectStore(STORE_PROGRESS);
      const req = store.get(sectionId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to get progress from IndexedDB:', err);
    return null;
  }
}

export async function getAllProgress() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROGRESS, 'readonly');
    const store = tx.objectStore(STORE_PROGRESS);
    const req = store.getAll();
    req.onsuccess = () => {
      const list = req.result || [];
      const map = {};
      for (const item of list) {
        map[item.sectionId] = item;
      }
      resolve(map);
    };
    req.onerror = () => {
      console.error('IndexedDB read error:', req.error);
      reject(req.error || new Error('Failed to read progress from storage'));
    };
    tx.onerror = () => {
      console.error('IndexedDB transaction error:', tx.error);
      reject(tx.error || new Error('Transaction error while reading progress'));
    };
  });
}

export async function saveSectionProgress(progressData) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_PROGRESS, 'readwrite');
      const store = tx.objectStore(STORE_PROGRESS);
      store.put({
        ...progressData,
        updatedAt: new Date().toISOString(),
      });
      // Resolve when the entire transaction has committed
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => {
        console.error('IndexedDB write transaction failed:', tx.error);
        resolve(false);
      };
      tx.onabort = () => {
        console.error('IndexedDB write transaction aborted:', tx.error);
        resolve(false);
      };
    });
  } catch (err) {
    console.error('Failed to save progress to IndexedDB:', err);
    return false;
  }
}

export async function recordQuizAttempt(attempt) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ATTEMPTS, 'readwrite');
      const store = tx.objectStore(STORE_ATTEMPTS);
      let newId = null;
      const req = store.add({
        ...attempt,
        timestamp: new Date().toISOString(),
      });
      req.onsuccess = () => {
        newId = req.result;
      };
      // Crucial: resolve only when the full transaction is confirmed committed
      tx.oncomplete = () => resolve(newId);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
    });
  } catch (err) {
    console.error('Failed to record attempt:', err);
    return null;
  }
}

export async function getQuizAttempts(sectionId) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_ATTEMPTS, 'readonly');
      const store = tx.objectStore(STORE_ATTEMPTS);
      const index = store.index('sectionId');
      const req = index.getAll(sectionId);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch (err) {
    console.error('Failed to get attempts:', err);
    return [];
  }
}

export async function clearAllProgress() {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction([STORE_PROGRESS, STORE_ATTEMPTS], 'readwrite');
      tx.objectStore(STORE_PROGRESS).clear();
      tx.objectStore(STORE_ATTEMPTS).clear();
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    console.error('Failed to clear progress:', err);
    return false;
  }
}

/**
 * LocalStorage preferences helper
 */
const PREFS_KEY = 'interview_prep_prefs';

export function getPreferences() {
  try {
    const val = localStorage.getItem(PREFS_KEY);
    return val ? JSON.parse(val) : { theme: 'dark', haptics: true, sound: true };
  } catch {
    return { theme: 'dark', haptics: true, sound: true };
  }
}

export function savePreferences(prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.error('Failed to save preferences to localStorage', e);
  }
}
