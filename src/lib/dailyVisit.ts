// Daily visit tracker + lightweight reminder notifications.
// Marks today as ✅ on the first user interaction and (best-effort) shows a
// daily local reminder via the Notifications API. Works on Android browsers,
// mobile browsers, and iOS PWAs (when installed to home screen).

const VISITS_KEY = 'app-daily-visits';
const VISIT_TIMES_KEY = 'app-daily-visit-times';
const NOTIF_ASKED_KEY = 'app-notif-asked';
const NOTIF_LAST_KEY = 'app-notif-last-shown';

const getDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const markTodayVisited = () => {
  try {
    const today = getDateKey(new Date());
    const raw = localStorage.getItem(VISITS_KEY);
    const map: Record<string, boolean> = raw ? JSON.parse(raw) : {};
    if (!map[today]) {
      map[today] = true;
      localStorage.setItem(VISITS_KEY, JSON.stringify(map));
    }
    // Track the most recent interaction timestamp for the day.
    const traw = localStorage.getItem(VISIT_TIMES_KEY);
    const tmap: Record<string, string> = traw ? JSON.parse(traw) : {};
    tmap[today] = new Date().toISOString();
    localStorage.setItem(VISIT_TIMES_KEY, JSON.stringify(tmap));
    
    // Notify components that attendance was updated
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('attendance-updated'));
    }
  } catch {
    /* ignore */
  }
};

const tryShowDailyReminder = () => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    const today = getDateKey(new Date());
    if (localStorage.getItem(NOTIF_LAST_KEY) === today) return;
    localStorage.setItem(NOTIF_LAST_KEY, today);
    const title = 'نور - Noor';
    const body = 'لا تنسي زيارة التطبيق اليوم 🌸 / Don\'t forget to check in today!';
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg && 'showNotification' in reg) {
          reg.showNotification(title, { body, tag: 'daily-reminder' });
        } else {
          new Notification(title, { body, tag: 'daily-reminder' });
        }
      }).catch(() => { try { new Notification(title, { body }); } catch {} });
    } else {
      new Notification(title, { body });
    }
  } catch { /* ignore */ }
};

const askNotificationPermissionOnce = () => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (localStorage.getItem(NOTIF_ASKED_KEY)) {
    tryShowDailyReminder();
    return;
  }
  if (Notification.permission === 'default') {
    try {
      Notification.requestPermission().then(() => {
        localStorage.setItem(NOTIF_ASKED_KEY, '1');
        tryShowDailyReminder();
      }).catch(() => { localStorage.setItem(NOTIF_ASKED_KEY, '1'); });
    } catch {
      localStorage.setItem(NOTIF_ASKED_KEY, '1');
    }
  } else {
    localStorage.setItem(NOTIF_ASKED_KEY, '1');
    tryShowDailyReminder();
  }
};

export const initDailyVisitTracker = () => {
  if (typeof window === 'undefined') return;
  // Mark immediately on load (the page is open = user opened the site).
  markTodayVisited();

  const events = ['click', 'keydown', 'touchstart', 'pointerdown'];
  const handler = () => {
    markTodayVisited();
    // Defer permission prompt to the first real user gesture (required on iOS).
    askNotificationPermissionOnce();
    events.forEach((e) => window.removeEventListener(e, handler));
  };
  events.forEach((e) => window.addEventListener(e, handler, { passive: true, once: false }));

  // Re-mark when the tab becomes visible (covers PWA resume).
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') markTodayVisited();
  });
};
