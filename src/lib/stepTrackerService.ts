/**
 * Service Worker Registration for Step Tracking
 * Handles background execution when the app is minimized or closed
 */

export const registerStepTrackerServiceWorker = async () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('Service Workers not supported in this browser');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(
      '/step-tracker-sw.js',
      {
        scope: '/',
      }
    );

    console.log('[Step Tracker] Service Worker registered:', registration);

    // Update service worker periodically
    setInterval(() => {
      registration.update().catch(err => {
        console.warn('[Step Tracker] Failed to update Service Worker:', err);
      });
    }, 60000); // Check for updates every minute

    return registration;
  } catch (err) {
    console.error('[Step Tracker] Failed to register Service Worker:', err);
    return null;
  }
};

/**
 * Unregister the Service Worker when step tracking is stopped
 */
export const unregisterStepTrackerServiceWorker = async () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      if (registration.scope === '/') {
        await registration.unregister();
        console.log('[Step Tracker] Service Worker unregistered');
      }
    }
  } catch (err) {
    console.error('[Step Tracker] Failed to unregister Service Worker:', err);
  }
};

/**
 * Initialize Service Worker and request Notification permission for background tracking alerts
 */
export const initializeBackgroundTracking = async () => {
  // Register service worker
  await registerStepTrackerServiceWorker();

  // Request notification permission for milestone alerts
  if ('Notification' in window && Notification.permission === 'default') {
    try {
      const permission = await Notification.requestPermission();
      console.log('[Step Tracker] Notification permission:', permission);
    } catch (err) {
      console.warn('[Step Tracker] Notification permission denied:', err);
    }
  }

  // Set up Page Visibility API listener for smart syncing
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      // App came back to foreground - sync any data from service worker
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SYNC_DATA',
        });
      }
    }
  });
};

/**
 * Send a message to the service worker to pause background tracking
 */
export const pauseBackgroundTracking = () => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'PAUSE_TRACKING',
    });
  }
};

/**
 * Send a message to the service worker to resume background tracking
 */
export const resumeBackgroundTracking = () => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'RESUME_TRACKING',
    });
  }
};

/**
 * Check if background sync is supported
 */
export const isBackgroundSyncSupported = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    return 'sync' in registration;
  } catch {
    return false;
  }
};

/**
 * Check if Periodic Background Sync is supported
 */
export const isPeriodicSyncSupported = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    return 'periodicSync' in registration;
  } catch {
    return false;
  }
};
