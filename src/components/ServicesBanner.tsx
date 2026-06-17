import { useState, useEffect } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Sparkles, X } from 'lucide-react';

const NOTIFY_WEBHOOK = 'https://hook.eu1.make.com/w4s92px8gl6rj548jyp7isume7lqgifc';

const SERVICES_AR = [
  'تعديل الصور بالذكاء الاصطناعي',
  'فوتوشوب احترافي',
  'تحسين دقة الفيديو والصور (Upscaling)',
  'ترجمة الملفات والفيديوهات',
  'إعادة صياغة المحتوى',
  'تصميم وأنيميشن الشعارات',
  'إزالة العلامات المائية',
  'تفريغ صوتي (Audio Transcription)',
  'تحويل Word / PDF',
  'تحرير و إدارة العلامات المائية',
  'إنشاء فيديوهات قصيرة',
  'صناعة أنيميشن',
];

const SERVICES_EN = [
  'AI image editing',
  'Professional Photoshop',
  'Video & image upscaling',
  'File / video translation',
  'Content rewriting',
  'Logo design & animation',
  'Watermark removal',
  'Audio Transcription',
  'Word / PDF Conversion',
  'Editing & Watermark Management',
  'Short Video Creation',
  'Animation',
];

const isIOS = () => {
  try {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  } catch { return false; }
};

const isInStandalone = () => {
  try { return (navigator as any).standalone === true; } catch { return false; }
};

const ServicesBanner = () => {
  const { lang } = useLang();
  const list = lang === 'ar' ? SERVICES_AR : SERVICES_EN;
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleClick = (service: string) => {
    try {
      const today = new Date().toDateString();
      localStorage.setItem('combo-service-today', today);
      window.dispatchEvent(new CustomEvent('combo-service-used'));
    } catch { /* ignore */ }
    try {
      fetch(NOTIFY_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'service_click', service, lang, timestamp: new Date().toISOString() }),
        keepalive: true,
      }).catch(() => {});
    } catch { /* ignore */ }
  };

  const handleInstallClick = async () => {
    if (isInStandalone()) return;
    if (isIOS()) {
      setShowIOSModal(true);
    } else if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else {
      // Scroll to top banner as fallback on Android
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      <div className="rounded-3xl p-5 bg-gradient-to-br from-fuchsia-500 via-pink-500 to-amber-400 text-white shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={18} />
          <h3 className="font-extrabold text-base">
            {lang === 'ar' ? 'خدمات احترافية بالذكاء الاصطناعي والتصميم' : 'Professional AI & Design Services'}
          </h3>
        </div>
        <p className="text-xs opacity-95 mb-3">
          {lang === 'ar'
            ? 'تعديل صور AI · فوتوشوب · رفع جودة الفيديو/الصور · ترجمة · إعادة صياغة · شعارات · إزالة علامة مائية.'
            : 'AI editing · Photoshop · Upscaling · Translation · Rewriting · Logos · Watermark removal.'}
        </p>
        <div
          aria-disabled="true"
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/25 backdrop-blur text-[11px] font-bold mb-3 select-none cursor-default">
          🎁 {lang === 'ar'
            ? 'خصم يصل إلى 50% 🔥 — متاح داخل أدوات الذكاء الاصطناعي'
            : 'Up to 50% 🔥 — available inside AI tools'}
        </div>
        <div className="grid grid-cols-2 gap-1.5 mb-3">
          {list.map(s => (
            <button key={s} onClick={() => handleClick(s)}
              className="text-start text-[11px] font-semibold bg-white/15 hover:bg-white/25 transition rounded-lg px-2 py-1.5 backdrop-blur">
              • {s}
            </button>
          ))}
        </div>
        <p className="text-[10px] leading-relaxed text-white/90 mb-3">
          {lang === 'ar'
            ? 'لطلب الخدمة افتحي أداة "أدوات الذكاء الاصطناعي" داخل قسم الخدمات (تتطلب ١٠٠ نقطة).'
            : 'To order, open the "AI Tools" tool inside Services (requires 100 points).'}
        </p>

        {/* Install App CTA */}
        <div className="mt-2 rounded-2xl bg-white/20 backdrop-blur p-4 text-center space-y-2 border border-white/30">
          <p className="font-extrabold text-sm">✨ {lang === 'ar' ? 'هل أعجبتك خدماتنا؟' : 'Enjoying our services?'}</p>
          <p className="text-xs opacity-90">
            {lang === 'ar'
              ? 'قم بتنزيل التطبيق الآن على الشاشة الرئيسية للاستفادة الكاملة وبسرعة فائقة!'
              : 'Install the app on your home screen for the full experience!'}
          </p>
          {isIOS() ? (
            /* iOS: show step-by-step instructions inline */
            <div className="text-xs space-y-1.5 text-white/95 text-start bg-white/10 rounded-xl p-3">
              <p className="font-bold text-center mb-2">📲 {lang === 'ar' ? 'لتنزيل التطبيق على iPhone:' : 'To install on iPhone:'}</p>
              <p>1️⃣ {lang === 'ar' ? 'اضغطي زر المشاركة ⎋ أسفل المتصفح' : 'Tap the Share button ⎋ at bottom'}</p>
              <p>2️⃣ {lang === 'ar' ? 'اختاري "إضافة إلى الشاشة الرئيسية ⊞"' : 'Select "Add to Home Screen ⊞"'}</p>
              <p>3️⃣ {lang === 'ar' ? 'اضغطي "إضافة" ✓' : 'Tap "Add" ✓'}</p>
            </div>
          ) : (
            <button
              onClick={handleInstallClick}
              className="w-full py-2.5 rounded-xl bg-white text-pink-600 font-extrabold text-sm active:scale-95 transition-all shadow-md">
              📱 {lang === 'ar' ? 'تنزيل التطبيق الآن' : 'Install App Now'}
            </button>
          )}
        </div>
      </div>

      {/* iOS Modal fallback (triggered from other buttons) */}
      {showIOSModal && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowIOSModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-pink-100 dark:border-slate-700"
            onClick={e => e.stopPropagation()}
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-800 dark:text-white">
                📱 {lang === 'ar' ? 'تثبيت التطبيق على iPhone' : 'Install on iPhone'}
              </h3>
              <button onClick={() => setShowIOSModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-2.5">
              {[
                { n: '1️⃣', ar: 'اضغطي زر المشاركة ⎋ أسفل المتصفح', en: 'Tap Share ⎋ at the bottom of your browser' },
                { n: '2️⃣', ar: 'اختاري "إضافة إلى الشاشة الرئيسية ⊞"', en: 'Choose "Add to Home Screen ⊞"' },
                { n: '3️⃣', ar: 'اضغطي "إضافة" ✓ وسيظهر التطبيق', en: 'Tap "Add" ✓ and the app appears!' },
              ].map(step => (
                <div key={step.n} className="flex items-start gap-3 bg-pink-50 dark:bg-slate-800 rounded-2xl p-3">
                  <span className="text-xl shrink-0">{step.n}</span>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{lang === 'ar' ? step.ar : step.en}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-2xl font-bold text-sm"
            >
              {lang === 'ar' ? 'فهمت! 🌸' : 'Got it! 🌸'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ServicesBanner;
