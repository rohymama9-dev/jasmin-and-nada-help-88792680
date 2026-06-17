import { useState, useEffect } from 'react';
import { useLang } from '@/contexts/LanguageContext';

const isIOS = () => {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
};

const isInStandaloneMode = () =>
  'standalone' in navigator && (navigator as any).standalone;

export const InstallBanner = () => {
  const { lang } = useLang();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Don't show if already installed as PWA
    if (isInStandaloneMode()) return;

    if (isIOS()) {
      // Show banner for iOS users (who can't use beforeinstallprompt)
      const dismissed = localStorage.getItem('pwa-ios-dismissed');
      if (!dismissed) setShowBanner(true);
    } else {
      const handleBeforeInstallPrompt = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowBanner(true);
      };
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }
  }, []);

  const handleInstallClick = async () => {
    if (isIOS()) {
      setShowIOSModal(true);
    } else if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setShowBanner(false);
      setDeferredPrompt(null);
    }
  };

  const dismissBanner = () => {
    setShowBanner(false);
    if (isIOS()) localStorage.setItem('pwa-ios-dismissed', '1');
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Install Banner */}
      <div
        className="bg-gradient-to-r from-pink-50 to-rose-50 border-b border-pink-200 p-3 flex items-center justify-between gap-3 sticky top-0 z-50 shadow-sm"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="text-pink-800 text-xs sm:text-sm font-bold flex-1 leading-relaxed">
          ✨ {lang === 'ar'
            ? 'يمكنكم تنزيل الموقع كتطبيق للاستمتاع به بدون نت وتلقي الإشعارات دائماً! 📱'
            : 'Install our app to use it offline & get notifications! 📱'}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstallClick}
            className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            {lang === 'ar' ? 'تنزيل الآن' : 'Install Now'}
          </button>
          <button
            onClick={dismissBanner}
            className="text-pink-400 hover:text-pink-600 text-lg font-bold transition-colors"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSModal && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowIOSModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-5 border border-pink-100 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          >
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="text-4xl">📱</div>
              <h3 className="text-lg font-extrabold text-slate-800 dark:text-white">
                {lang === 'ar' ? 'تثبيت التطبيق على iPhone' : 'Install on iPhone'}
              </h3>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-pink-50 dark:bg-slate-800 rounded-2xl p-3">
                <span className="text-2xl shrink-0">1️⃣</span>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">
                  {lang === 'ar'
                    ? 'اضغطي على زر المشاركة ⎋ في أسفل شاشة المتصفح'
                    : 'Tap the Share button ⎋ at the bottom of your browser'}
                </p>
              </div>
              <div className="flex items-start gap-3 bg-rose-50 dark:bg-slate-800 rounded-2xl p-3">
                <span className="text-2xl shrink-0">2️⃣</span>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">
                  {lang === 'ar'
                    ? 'اختاري "إضافة إلى الشاشة الرئيسية ⊞" من القائمة'
                    : 'Select "Add to Home Screen ⊞" from the menu'}
                </p>
              </div>
              <div className="flex items-start gap-3 bg-purple-50 dark:bg-slate-800 rounded-2xl p-3">
                <span className="text-2xl shrink-0">3️⃣</span>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">
                  {lang === 'ar'
                    ? 'اضغطي "إضافة" ✓ وسيظهر التطبيق على شاشتك الرئيسية!'
                    : 'Tap "Add" ✓ and the app will appear on your home screen!'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-2xl font-bold text-sm active:scale-95 transition-all shadow-md"
            >
              {lang === 'ar' ? 'فهمت، شكراً! 🌸' : 'Got it, thanks! 🌸'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
