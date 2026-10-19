import { useState, useEffect } from 'react';
import { Share, PlusSquare, X } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

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

export const InstallBanner = () => {
  const [show, setShow] = useState(false);
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const { theme } = useTheme();

  useEffect(() => {
    setLang(detectLang());
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

  const isDark = theme === 'dark';

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className={`relative rounded-3xl p-5 shadow-sm transition-all duration-300 backdrop-blur-md border ${isDark ? 'bg-slate-800/70 border-slate-700/50 text-white' : 'bg-white/70 border-slate-200/50 text-slate-800'}`}
    >
      <button
        onClick={dismiss}
        className={`absolute top-3 ${lang === 'ar' ? 'left-3' : 'right-3'} w-7 h-7 rounded-full flex items-center justify-center transition-colors ${isDark ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
        aria-label="Dismiss"
      >
        <X size={14} strokeWidth={2.5} />
      </button>

      <div className="flex flex-col items-center text-center space-y-4">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-100'}`}>
          <img src="/pwa-192x192.png" alt="App Icon" className="w-10 h-10 rounded-xl" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        </div>
        
        <div className="space-y-1.5">
          <h3 className="font-semibold text-lg tracking-tight">
            {lang === 'ar' ? 'قم بتثبيت التطبيق 📲' : 'Install App 📲'}
          </h3>
          <p className={`text-[13px] font-medium leading-relaxed max-w-[260px] mx-auto ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
            {lang === 'ar' ? (
              <>اضغط على زر المشاركة <Share size={14} className="inline mx-1 mb-1" /> ثم <PlusSquare size={14} className="inline mx-1 mb-1" /> إضافة إلى الشاشة الرئيسية</>
            ) : (
              <>Tap Share <Share size={14} className="inline mx-1 mb-1" /> then <PlusSquare size={14} className="inline mx-1 mb-1" /> Add to Home Screen</>
            )}
          </p>
        </div>

        <button
          onClick={dismiss}
          className={`w-full py-2.5 rounded-2xl font-bold text-sm transition-all active:scale-95 ${isDark ? 'bg-white text-slate-900 shadow-[0_2px_10px_rgba(255,255,255,0.1)]' : 'bg-slate-900 text-white shadow-[0_2px_10px_rgba(0,0,0,0.1)]'}`}
        >
          {lang === 'ar' ? 'حسناً، فهمت' : 'Got it'}
        </button>
      </div>
    </div>
  );
};
