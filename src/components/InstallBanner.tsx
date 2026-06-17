import { useState, useEffect } from 'react';

const detectLang = (): 'ar' | 'en' => {
  try {
    const stored = localStorage.getItem('app-lang');
    if (stored === 'ar' || stored === 'en') return stored;
    return navigator.language.startsWith('ar') ? 'ar' : 'en';
  } catch {
    return 'ar';
  }
};

const isIOS = () => {
  try {
    const ua = navigator.userAgent;
    return /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  } catch { return false; }
};

const isInStandaloneMode = () => {
  try {
    return 'standalone' in navigator && (navigator as any).standalone;
  } catch { return false; }
};

/**
 * IOSInstallHint — shows ONLY for iOS Safari users who haven't installed the PWA.
 * Renders as a friendly bottom card (not a sticky top banner).
 */
export const InstallBanner = () => {
  const [show, setShow] = useState(false);
  const [lang, setLang] = useState<'ar' | 'en'>('ar');

  useEffect(() => {
    setLang(detectLang());
    // Only show for iOS users NOT already in standalone mode
    if (isIOS() && !isInStandaloneMode()) {
      const dismissed = localStorage.getItem('pwa-ios-hint-dismissed');
      if (!dismissed) setShow(true);
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem('pwa-ios-hint-dismissed', '1');
  };

  if (!show) return null;

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="relative rounded-3xl overflow-hidden p-5 shadow-xl border border-pink-200 dark:border-pink-900/40"
      style={{
        background: 'linear-gradient(135deg, #fff0f6 0%, #ffe4f0 50%, #ffd6e8 100%)',
      }}
    >
      {/* Decorative blobs */}
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-pink-300/30 rounded-full blur-2xl" />
      <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-rose-300/30 rounded-full blur-2xl" />

      <button
        onClick={dismiss}
        className="absolute top-3 left-3 w-6 h-6 rounded-full bg-pink-100 text-pink-400 hover:bg-pink-200 transition-colors flex items-center justify-center text-xs font-bold"
        aria-label="Dismiss"
      >
        ✕
      </button>

      <div className="relative text-center space-y-3">
        <div className="text-4xl">🌸</div>
        <div>
          <p className="font-extrabold text-pink-800 text-base leading-snug">
            {lang === 'ar'
              ? 'لتحميل التطبيق على الآيفون 📲'
              : 'Install the app on your iPhone 📲'}
          </p>
          <p className="text-pink-700 text-sm mt-1 font-medium leading-relaxed">
            {lang === 'ar'
              ? 'اضغط على زر المشاركة ⎋ ثم اختر «إضافة إلى الشاشة الرئيسية» 🏠'
              : 'Tap the Share button ⎋ then choose "Add to Home Screen" 🏠'}
          </p>
        </div>
        <button
          onClick={dismiss}
          className="px-6 py-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold shadow active:scale-95 transition-all"
        >
          {lang === 'ar' ? 'فهمت، شكراً! 💕' : 'Got it, thanks! 💕'}
        </button>
      </div>
    </div>
  );
};
