import { useState, useEffect } from 'react';

export const InstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    const handleManualTrigger = async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('trigger-pwa-install', handleManualTrigger);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('trigger-pwa-install', handleManualTrigger);
    };
  }, [deferredPrompt]);

  if (!isVisible) return null;

  return (
    <div className="bg-pink-50 border-b border-pink-200 p-3 flex flex-col sm:flex-row items-center justify-between gap-3 sticky top-0 z-50 shadow-sm" dir="rtl">
      <div className="text-pink-800 text-xs sm:text-sm font-bold text-center sm:text-start flex-1 leading-relaxed">
        ✨ يمكنك تحميل موقعنا كتطبيق على الشاشة الرئيسية لتجربة أسرع وأسهل! 📱
      </div>
      <button 
        onClick={() => {
            const event = new Event('trigger-pwa-install');
            window.dispatchEvent(event);
        }}
        className="shrink-0 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95"
      >
        تنزيل الآن
      </button>
    </div>
  );
};
