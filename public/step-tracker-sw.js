/**
 * Step Tracker Service Worker
 * Handles background step tracking even when the app is closed or minimized
 * Uses IndexedDB for persistent storage and supports Periodic Background Sync
 */

const DB_NAME = 'StepTrackerDB';
const STORE_NAME = 'stepData';

// Initialize IndexedDB
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

// Get value from IndexedDB
const getDBValue = async (key) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

// Set value in IndexedDB
const setDBValue = async (key, value) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(value, key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

// Listen for messages from the client
self.addEventListener('message', (event) => {
  const { type, stepsKey, caloriesKey } = event.data;

  if (type === 'START_STEP_TRACKING') {
    // Initialize background tracking
    console.log('[Step Tracker SW] Starting background step tracking');
    
    // Store tracking configuration for periodic sync
    self.registration.sync.register('sync-step-data').catch(err => {
      console.warn('[Step Tracker SW] Periodic sync not available:', err);
    });
  }
});

// Handle periodic background sync (if supported)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-step-data') {
    event.waitUntil(syncStepData());
  }
});

const syncStepData = async () => {
  try {
    // Get current step data from IndexedDB
    const stepsData = await getDBValue('app-steps') || 0;
    const caloriesData = await getDBValue('app-calories') || 0;
    
    // Try to sync to server (optional)
    // await fetch('/api/sync-steps', {
    //   method: 'POST',
    //   body: JSON.stringify({ steps: stepsData, calories: caloriesData })
    // });
    
    console.log('[Step Tracker SW] Synced data:', { steps: stepsData, calories: caloriesData });
  } catch (err) {
    console.error('[Step Tracker SW] Sync failed:', err);
    throw err; // Retry
  }
};

// Detect motion events even when the app is in the background
let gravityRef = { x: 0, y: 0, z: 0 };
let lastStepAtRef = 0;
let lastPeakRef = 0;
let aboveThresholdRef = false;

const handleMotionInBackground = async (e) => {
  const a = e.accelerationIncludingGravity || e.acceleration;
  if (!a || a.x == null || a.y == null || a.z == null) return;

  const alpha = 0.85;
  gravityRef.x = alpha * gravityRef.x + (1 - alpha) * (a.x || 0);
  gravityRef.y = alpha * gravityRef.y + (1 - alpha) * (a.y || 0);
  gravityRef.z = alpha * gravityRef.z + (1 - alpha) * (a.z || 0);

  const lx = (a.x || 0) - gravityRef.x;
  const ly = (a.y || 0) - gravityRef.y;
  const lz = (a.z || 0) - gravityRef.z;
  const mag = Math.sqrt(lx * lx + ly * ly + lz * lz);

  const HIGH = 1.5;
  const LOW = 0.4;
  const MIN_INTERVAL = 250;
  const MAX_INTERVAL = 1500;
  const CALORIES_PER_STEP = 0.045;
  const now = Date.now();

  if (mag > HIGH) {
    if (!aboveThresholdRef) {
      aboveThresholdRef = true;
      lastPeakRef = mag;
    } else if (mag > lastPeakRef) {
      lastPeakRef = mag;
    }
  } else if (mag < LOW && aboveThresholdRef) {
    aboveThresholdRef = false;
    const dt = now - lastStepAtRef;

    if (dt > MIN_INTERVAL && dt < MAX_INTERVAL && lastPeakRef >= HIGH) {
      lastStepAtRef = now;

      // Update step count in IndexedDB
      try {
        const currentSteps = (await getDBValue('app-steps')) || 0;
        const currentCalories = (await getDBValue('app-calories')) || 0;
        
        await setDBValue('app-steps', currentSteps + 1);
        await setDBValue('app-calories', Number((currentCalories + CALORIES_PER_STEP).toFixed(2)));
        
        // Attempt sync
        syncStepData().catch(() => {}); // Non-blocking
      } catch (err) {
        console.error('[Step Tracker SW] Failed to update step data:', err);
      }
    }
    lastPeakRef = 0;
  }
};

// Register to listen for device motion in service worker context
// Note: This is limited in most browsers, so primary tracking should remain in the client
if ('DeviceMotionEvent' in self) {
  self.addEventListener('devicemotion', handleMotionInBackground);
}

// Handle fetch events for caching strategies
self.addEventListener('fetch', (event) => {
  // Add any caching strategies if needed
  // This is a minimal service worker focused on step tracking
});

// Keep service worker alive
self.addEventListener('activate', (event) => {
  console.log('[Step Tracker SW] Service Worker activated');
  event.waitUntil(clients.claim());
});

self.addEventListener('install', (event) => {
  console.log('[Step Tracker SW] Service Worker installed');
  self.skipWaiting();
});
