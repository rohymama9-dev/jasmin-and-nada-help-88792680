import { useState, useEffect, useRef } from 'react';
import ExerciseTimer from '@/components/ExerciseTimer';
import { ArrowLeft, ImageIcon, RotateCcw, Heart } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import localforage from 'localforage';

localforage.config({
  name: 'NadaHelps',
  storeName: 'exercises_protocols'
});

interface ExercisesPageProps {
  points?: number;
  addPoints?: (n: number) => void;
  onBack?: () => void;
}

interface ExerciseCategory {
  id: string;
  titleAr: string;
  titleEn: string;
}

const CATEGORIES: ExerciseCategory[] = [
  { id: 'warmup', titleAr: 'الإحماء', titleEn: 'Warm-up' },
  { id: 'core', titleAr: 'تمارين البطن', titleEn: 'Core' },
  { id: 'spine', titleAr: 'العمود الفقري', titleEn: 'Spine' },
  { id: 'sciatica', titleAr: 'عرق النسا', titleEn: 'Sciatica' },
  { id: 'posture', titleAr: 'تصحيح القوام', titleEn: 'Posture' },
  { id: 'fullbody', titleAr: 'الجسم كله', titleEn: 'Full Body' },
  { id: 'gym', titleAr: 'الجيم', titleEn: 'Gym' },
  { id: 'stretching', titleAr: 'الاستطالة', titleEn: 'Stretching' }
];

const ExercisesPage = ({ points = 0, addPoints = () => {}, onBack = () => {} }: ExercisesPageProps) => {
  const { lang } = useLang();
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | null>(null);
  const [rulesLang, setRulesLang] = useState<'ar' | 'en'>(lang === 'ar' ? 'ar' : 'en');
  const [categoryImages, setCategoryImages] = useState<{ [key: string]: string }>({});
  const [loadingImages, setLoadingImages] = useState(true);

  const [isAdminMode, setIsAdminMode] = useState(false);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadImages = async () => {
      try {
        const stored = await localforage.getItem<{ [key: string]: string }>('exercises_protocols');
        if (stored) setCategoryImages(stored);
      } catch (err) {
        console.error('Failed to load images from IndexedDB', err);
      } finally {
        setLoadingImages(false);
      }
    };
    loadImages();
  }, []);

  const persistImages = async (images: { [key: string]: string }) => {
    try {
      await localforage.setItem('exercises_protocols', images);
    } catch (err) {
      console.error('Failed to save images to IndexedDB', err);
      toast.error(lang === 'ar' ? 'فشل حفظ الصورة' : 'Failed to save image');
    }
  };

  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const rt = (ar: string, en: string) => (rulesLang === 'ar' ? ar : en);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, categoryId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const nextImages = { ...categoryImages, [categoryId]: base64 };
        setCategoryImages(nextImages);
        await persistImages(nextImages);
        toast.success(t('تم تحميل الصورة بنجاح وتثبيتها', 'Image uploaded and set successfully'));
        setIsAdminMode(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePressDown = () => {
    pressTimer.current = setTimeout(() => {
      setIsAdminMode((prev) => {
        const newState = !prev;
        toast.success(newState ? t('تم فتح إعدادات التعديل', 'Edit mode unlocked') : t('تم قفل إعدادات التعديل', 'Edit mode locked'));
        return newState;
      });
    }, 1000);
  };

  const handlePressUp = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  if (!selectedCategory) {
    return (
      <>
        <div className="space-y-8 pb-10 px-1">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">
              {lang === 'ar' ? 'برامج التمارين' : 'Exercise Programs'}
            </h2>
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={16} />
              <span>{t('رجوع', 'Back')}</span>
            </button>
          </div>

          {/* Inline Exercise Timer placed at top above categories */}
          <ExerciseTimer />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CATEGORIES.map((category) => {
              // ── FIXED: point to /images/exercises/ subfolder ──
              const defaultImgSrc = `/images/exercises/${category.id}.png`;
              const imgSrc = categoryImages[category.id] || defaultImgSrc;

              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category)}
                  className="glass-card border border-primary/20 rounded-3xl overflow-hidden hover:shadow-2xl hover:border-primary/50 transition-all active:scale-95 text-left group"
                >
                  {/* ── FIXED: proper aspect-ratio image container ── */}
                  <div className="w-full aspect-video bg-primary/5 overflow-hidden">
                    <img
                      src={imgSrc}
                      alt={lang === 'ar' ? category.titleAr : category.titleEn}
                      className="w-full h-full object-contain"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                  <div className="p-5 flex flex-col items-center gap-3">
                    <h3 className="font-black text-2xl text-foreground group-hover:text-primary transition-colors text-center">
                      {lang === 'ar' ? category.titleAr : category.titleEn}
                    </h3>
                    <div className="w-12 h-1 bg-primary/20 rounded-full group-hover:w-20 group-hover:bg-primary transition-all" />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="relative mt-12 overflow-hidden rounded-[2.5rem] border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-primary/5 p-8 md:p-12 shadow-2xl">
            <div className="absolute top-0 right-0 -mt-12 -mr-12 h-48 w-48 rounded-full bg-primary/20 blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-48 w-48 rounded-full bg-primary/20 blur-3xl animate-pulse" />

            <div className="relative z-10 space-y-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-primary/10 pb-8">
                <div className="space-y-2">
                  <h3 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
                    {rt('قواعد التطوير (DPT)', 'Progression Rules (DPT)')}
                  </h3>
                  <p className="text-primary font-bold text-lg">
                    {rt('دليل إعادة التأهيل السريري الاحترافي', 'Professional Clinical Rehab Guide')}
                  </p>
                </div>

                <div className="flex p-1.5 bg-primary/10 rounded-2xl w-fit self-end md:self-center backdrop-blur-sm border border-primary/10">
                  <button
                    onClick={() => setRulesLang('ar')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                      rulesLang === 'ar'
                        ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    AR
                  </button>
                  <button
                    onClick={() => setRulesLang('en')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                      rulesLang === 'en'
                        ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    EN
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8">
                <div className="group relative bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-primary/20 p-8 rounded-[2rem] hover:border-primary/40 transition-all hover:shadow-2xl hover:-translate-y-1">
                  <div className="flex items-start gap-6">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-2xl font-black text-white shadow-xl shadow-primary/30 group-hover:rotate-6 transition-transform">
                      <RotateCcw size={32} />
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-2xl font-black text-foreground">
                        {rt('مبدأ الإحماء', 'Warm-up Principle')}
                      </h4>
                      <p className="text-muted-foreground leading-relaxed text-lg">
                        {rt(
                          'حركات ديناميكية مستمرة مع عدم وجود فترات راحة على الإطلاق، وتستمر لمدة 5 إلى 10 دقائق بشكل متواصل.',
                          'Continuous dynamic movements with absolutely no rest intervals, lasting for 5 to 10 minutes continuously.'
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="group relative bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-primary/20 p-8 rounded-[2rem] hover:border-primary/40 transition-all hover:shadow-2xl hover:-translate-y-1">
                  <div className="flex items-start gap-6">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-2xl font-black text-white shadow-xl shadow-primary/30 group-hover:rotate-6 transition-transform">
                      1
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-2xl font-black text-foreground">
                        {rt('مرحلة الثبات والتحكم الحركي', 'Phase 1: Stabilization & Motor Control')}
                      </h4>
                      <div className="text-muted-foreground leading-relaxed text-lg">
                        <span className="font-bold text-primary block mb-2 underline decoration-primary/30 underline-offset-4">
                          {rt('التركيز على الثبات الأيزومتري الساكن', 'Focus on static isometric holds')}
                        </span>
                        {rt(
                          'ابدأ بـ 20 ثانية ثبات × مجموعتين. تدرج إلى 20 ثانية ثبات × 3 مجموعات، ثم تقدم إلى 30 ثانية ثبات × 3 مجموعات. التكرار: يتم إجراؤه مرتين يومياً.',
                          'Begin at 20 seconds hold x 2 sets. Progress to 20 seconds hold x 3 sets, then advance to 30 seconds hold x 3 sets. Frequency: Performed 2 times per day.'
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="group relative bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-primary/20 p-8 rounded-[2rem] hover:border-primary/40 transition-all hover:shadow-2xl hover:-translate-y-1">
                  <div className="flex items-start gap-6">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-2xl font-black text-white shadow-xl shadow-primary/30 group-hover:rotate-6 transition-transform">
                      2
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-2xl font-black text-foreground">
                        {rt('مرحلة التقوية العضلية والتكرار', 'Phase 2: Functional Strengthening')}
                      </h4>
                      <p className="text-muted-foreground leading-relaxed text-lg">
                        {rt(
                          'ابدأ بـ 10 تكرارات ديناميكية × مجموعتين، مع الحفاظ على ثبات أيزومتري صارم لمدة 5 ثوانٍ عند ذروة كل تكرار. تدرج تدريجياً عن طريق زيادة التكرارات أولاً، ثم زيادة المجموعات، ثم إدخال تكامل مجموعات العضلات المعقدة، يليها الحمل الزائد التدريجي باستخدام أدوات المقاومة، وأخيراً الانتقال إلى بروتوكولات أجهزة الجيم.',
                          'Begin with 10 dynamic repetitions x 2 sets, maintaining a strict 5-second static isometric hold at the peak of every single repetition. Gradually progress by increasing repetitions first, then increasing sets, then introducing complex muscle group integration, followed by progressive overload using resistance tools, and finally transitioning to Gym machine protocols.'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── FIXED: point to /images/exercises/ subfolder ──
  const currentImage = categoryImages[selectedCategory.id] || `/images/exercises/${selectedCategory.id}.png`;

  return (
    <div className="space-y-6 pb-10 relative">
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            setSelectedCategory(null);
            setIsAdminMode(false);
          }}
          className="flex items-center gap-2 text-primary hover:text-primary/80 transition-all hover:-translate-x-1"
        >
          <ArrowLeft size={20} />
          <span className="font-bold text-lg">{t('عودة', 'Back')}</span>
        </button>

        <button
          onPointerDown={handlePressDown}
          onPointerUp={handlePressUp}
          onPointerLeave={handlePressUp}
          className="p-2 text-primary/30 hover:text-primary/60 transition-colors"
          title="Long press for admin options"
        >
          <Heart size={24} />
        </button>
      </div>

      <div className="space-y-1">
        <h2 className="text-3xl font-black text-foreground tracking-tight">
          {lang === 'ar' ? selectedCategory.titleAr : selectedCategory.titleEn}
        </h2>
        <p className="text-muted-foreground font-medium">
          {t('بروتوكول التمرين الخاص بك', 'Your Personal Exercise Protocol')}
        </p>
      </div>

      {/* ── FIXED: image fills container with correct aspect ratio, no distortion ── */}
      <div className="relative w-full rounded-[2.5rem] border-4 border-primary/20 bg-primary/5 overflow-hidden group">
        {loadingImages ? (
          <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground font-bold animate-pulse">
            {t('جاري التحميل...', 'Loading...')}
          </div>
        ) : (
          <div className="relative w-full">
            <img
              src={currentImage}
              alt="Protocol"
              className="w-full h-auto object-contain rounded-2xl shadow-md"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.insertAdjacentHTML(
                  'afterend',
                  `<p class="text-muted-foreground text-center py-20 px-6">${t('لم يتم العثور على صورة للتمرين', 'No exercise image found')}</p>`
                );
              }}
            />

            {isAdminMode && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-6 z-10 transition-opacity rounded-2xl">
                <label className="p-5 rounded-2xl bg-white/20 backdrop-blur-md text-white cursor-pointer hover:bg-white/30 transition-all flex flex-col items-center gap-2">
                  <ImageIcon size={32} />
                  <span className="font-bold text-sm">{t('رفع صورة', 'Upload Image')}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, selectedCategory.id)}
                    className="hidden"
                  />
                </label>

                {categoryImages[selectedCategory.id] && (
                  <button
                    onClick={async () => {
                      if (confirm(t('هل أنت متأكد من حذف هذا البروتوكول والعودة للصورة الافتراضية؟', 'Are you sure you want to delete this protocol and return to default?'))) {
                        const nextImages = { ...categoryImages };
                        delete nextImages[selectedCategory.id];
                        setCategoryImages(nextImages);
                        await persistImages(nextImages);
                        toast.success(t('تم الحذف بنجاح', 'Deleted successfully'));
                        setIsAdminMode(false);
                      }
                    }}
                    className="p-5 rounded-2xl bg-destructive/60 backdrop-blur-md text-white hover:bg-destructive/80 transition-all flex flex-col items-center gap-2"
                  >
                    <RotateCcw size={32} />
                    <span className="font-bold text-sm">{t('مسح', 'Delete')}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExercisesPage;
