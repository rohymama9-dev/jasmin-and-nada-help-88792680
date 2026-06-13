import { useLang } from '@/contexts/LanguageContext';
import { Sparkles } from 'lucide-react';

// Unified Make.com webhook for ALL service / AI notifications.
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

const ServicesBanner = () => {
  const { lang } = useLang();
  const list = lang === 'ar' ? SERVICES_AR : SERVICES_EN;

  const handleClick = (service: string) => {
    try {
      const today = new Date().toDateString();
      localStorage.setItem('combo-service-today', today);
      window.dispatchEvent(new CustomEvent('combo-service-used'));
    } catch {
      /* ignore */
    }

    // Fire-and-forget admin notification only — main page is non-clickable to Khamsat.
    // The Khamsat discount link lives strictly inside the AI Image Tool (500-pt unlock).
    try {
      fetch(NOTIFY_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'service_click',
          service,
          lang,
          timestamp: new Date().toISOString(),
        }),
        keepalive: true,
      }).catch(() => {});
    } catch { /* ignore */ }
  };

  return (
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
      <p className="text-[10px] leading-relaxed text-white/90">
        {lang === 'ar'
          ? 'لطلب الخدمة افتحي أداة "أدوات الذكاء الاصطناعي" داخل قسم الخدمات (تتطلب ٥٠٠ نقطة).'
          : 'To order, open the "Text → Image" tool inside Services (requires 500 points).'}
      </p>
    </div>
  );
};

export default ServicesBanner;
