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

/**
 * LocalStorage progress-safe mirror.
 * Primary persistence is IndexedDB, but some browsers (private mode, strict
 * privacy settings) silently fail or block it. The mirror keeps progress from
 * being lost on refresh in those environments.
 */
const PROGRESS_MIRROR_KEY = 'interview_prep_progress_mirror';
const ATTEMPTS_MIRROR_KEY = 'interview_prep_attempts_mirror';

function readLocalJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    if (value === null) return fallback;
    return JSON.parse(value) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeLocalJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
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
  try {
    const db = await openDB();
    const map = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PROGRESS, 'readonly');
      const store = tx.objectStore(STORE_PROGRESS);
      const req = store.getAll();
      req.onsuccess = () => {
        const list = req.result || [];
        const result = {};
        for (const item of list) {
          result[item.sectionId] = item;
        }
        resolve(result);
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
    if (map && Object.keys(map).length > 0) return map;
  } catch (err) {
    console.warn('IndexedDB unavailable, falling back to local progress mirror:', err);
  }
  const mirror = readLocalJson(PROGRESS_MIRROR_KEY, null);
  return mirror && Object.keys(mirror).length > 0 ? mirror : {};
}

export async function saveSectionProgress(progressData) {
  let mirrored = false;
  try {
    const mirror = readLocalJson(PROGRESS_MIRROR_KEY, {}) || {};
    if (typeof mirror === 'object') {
      mirror[progressData.sectionId] = {
        ...mirror[progressData.sectionId],
        ...progressData,
      };
      writeLocalJson(PROGRESS_MIRROR_KEY, mirror);
      mirrored = true;
    }
  } catch (err) {
    console.warn('Progress mirror write failed:', err);
  }

  try {
    const db = await openDB();
    const saved = await new Promise((resolve) => {
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
    return saved || mirrored;
  } catch (err) {
    console.warn('Failed to save progress to IndexedDB, mirror kept:', err);
    return mirrored;
  }
}

export async function recordQuizAttempt(attempt) {
  const mirrorAttempt = {
    id: `mirror-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    timestamp: new Date().toISOString(),
    ...attempt,
  };
  try {
    const mirror = readLocalJson(ATTEMPTS_MIRROR_KEY, []) || [];
    if (Array.isArray(mirror)) {
      mirror.push(mirrorAttempt);
      writeLocalJson(ATTEMPTS_MIRROR_KEY, mirror);
    }
  } catch (err) {
    console.warn('Attempts mirror write failed:', err);
  }

  try {
    const db = await openDB();
    return await new Promise((resolve) => {
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
      tx.onerror = () => resolve(mirrorAttempt.id);
      tx.onabort = () => resolve(mirrorAttempt.id);
    });
  } catch (err) {
    console.warn('Failed to record attempt in IndexedDB, mirror kept:', err);
    return mirrorAttempt.id;
  }
}

export async function getQuizAttempts(sectionId) {
  try {
    const db = await openDB();
    const list = await new Promise((resolve) => {
      const tx = db.transaction(STORE_ATTEMPTS, 'readonly');
      const store = tx.objectStore(STORE_ATTEMPTS);
      const index = store.index('sectionId');
      const req = index.getAll(sectionId);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
    if (list.length > 0) return list;
  } catch (err) {
    console.warn('Failed to get attempts from IndexedDB, using mirror:', err);
  }
  const mirror = readLocalJson(ATTEMPTS_MIRROR_KEY, []) || [];
  return Array.isArray(mirror) ? mirror.filter((attempt) => attempt.sectionId === sectionId) : [];
}

export async function getAllQuizAttempts() {
  try {
    const db = await openDB();
    const list = await new Promise((resolve) => {
      const tx = db.transaction(STORE_ATTEMPTS, 'readonly');
      const store = tx.objectStore(STORE_ATTEMPTS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
    if (list.length > 0) return list;
  } catch (err) {
    console.warn('Failed to get all attempts from IndexedDB, using mirror:', err);
  }
  const mirror = readLocalJson(ATTEMPTS_MIRROR_KEY, null);
  return Array.isArray(mirror) ? mirror : [];
}

export async function clearAllProgress() {
  writeLocalJson(PROGRESS_MIRROR_KEY, {});
  writeLocalJson(ATTEMPTS_MIRROR_KEY, []);
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
    console.warn('Failed to clear IndexedDB progress:', err);
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
