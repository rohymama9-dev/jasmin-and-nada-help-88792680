import { useState, useEffect } from 'react';
import { BookOpenText, Palette, BookOpen, Wand2, UtensilsCrossed, Lock, Check, Sparkles, Sticker, GraduationCap, FileArchive, FileCode2, Crop, DollarSign } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import KidsStories from '@/components/KidsStories';
import ColoringBook from '@/components/ColoringBook';
import BookSummaries from '@/components/BookSummaries';
import InspirationalQuotes from '@/components/InspirationalQuotes';
import RecipesCare from '@/components/RecipesCare';
import MakeWebhookForm from '@/components/MakeWebhookForm';
import StickerStore from '@/components/StickerStore';
import QuizEngine from '@/components/QuizEngine';
import CombinedOrderForm from '@/components/CombinedOrderForm';
import PersonalityQuizzes from '@/components/PersonalityQuizzes';
import FileCompressor from '@/components/FileCompressor';
import FormatConverter from '@/components/FormatConverter';
import ImageResizer from '@/components/ImageResizer';
import CurrencyConverter from '@/components/CurrencyConverter';
import floralBg from '@/assets/floral-bg.jpg';

interface ServicesPageProps {
  points: number;
  addPoints: (n: number) => void;
}

const UNLOCKED_KEY = 'app-services-unlocked';

interface ServiceCard {
  id: string;
  icon: React.ElementType;
  nameAr: string;
  nameEn: string;
  cost: number;
  color: string;
}

const services: ServiceCard[] = [
  { id: 'quotes', icon: Sparkles, nameAr: 'اقتباسات ملهمة', nameEn: 'Inspirational Quotes', cost: 0, color: 'from-amber-400 to-orange-500' },
  { id: 'stories', icon: BookOpenText, nameAr: 'قصص الأطفال', nameEn: 'Kids Stories', cost: 5, color: 'from-teal-400 to-cyan-500' },
  { id: 'coloring', icon: Palette, nameAr: 'استوديو التلوين', nameEn: 'Coloring Studio', cost: 0, color: 'from-violet-400 to-purple-500' },
  { id: 'books', icon: BookOpen, nameAr: 'ملخصات الكتب', nameEn: 'Book Summaries', cost: 3, color: 'from-sky-400 to-blue-500' },
  { id: 'recipes', icon: UtensilsCrossed, nameAr: 'وصفات وعناية', nameEn: 'Recipes & Care', cost: 2, color: 'from-emerald-400 to-green-500' },
  { id: 'stickers', icon: Sticker, nameAr: 'متجر الملصقات', nameEn: 'Sticker Store', cost: 0, color: 'from-fuchsia-400 to-pink-500' },
  { id: 'aitools', icon: Wand2, nameAr: 'أدوات الذكاء الاصطناعي', nameEn: 'AI Image Tool', cost: 0, color: 'from-indigo-400 to-blue-500' },
  { id: 'quiz', icon: GraduationCap, nameAr: 'محرك الاختبارات', nameEn: 'Quiz Engine', cost: 20, color: 'from-fuchsia-500 to-purple-700' },
  { id: 'personalityquizzes', icon: Sparkles, nameAr: 'اختبارات الشخصية', nameEn: 'Personality Quizzes', cost: 20, color: 'from-purple-500 to-indigo-600' },
  { id: 'contact', icon: Sparkles, nameAr: 'مراسلة المسؤولة (مجاني)', nameEn: 'Contact Admin (Free)', cost: 0, color: 'from-emerald-500 to-teal-600' },
  // ── Locked premium tools — cost 80 points each ──────────────
  { id: 'compressor', icon: FileArchive, nameAr: '🗜️ ضغط الملفات والصور', nameEn: '🗜️ Compress Files & Images', cost: 80, color: 'from-teal-500 to-cyan-600' },
  { id: 'converter', icon: FileCode2, nameAr: '🔄 محول الصيغ الشامل', nameEn: '🔄 Universal Format Converter', cost: 80, color: 'from-indigo-500 to-violet-600' },
  { id: 'resizer', icon: Crop, nameAr: '🖼️ معدّل المقاسات الدقيق', nameEn: '🖼️ Precision Resizer', cost: 80, color: 'from-orange-500 to-amber-600' },
  { id: 'currency', icon: DollarSign, nameAr: '💱 حاسبة العملات', nameEn: '💱 Currency Converter', cost: 0, color: 'from-emerald-500 to-lime-500' },
];

// localStorage keys for each premium tool unlock state
const TOOL_UNLOCK_KEYS: Record<string, string> = {
  compressor: 'isCompressorUnlocked',
  converter: 'isConverterUnlocked',
  resizer: 'app-imageresizer-unlocked',
};

const ServicesPage = ({ points, addPoints }: ServicesPageProps) => {
  const { t, lang } = useLang();
  const [unlocked, setUnlocked] = useState<string[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(UNLOCKED_KEY) || '["quotes","aitools","carescape","coloring","stickers","currency"]');
      // Also restore any previously individually-unlocked premium tools
      const result: string[] = Array.isArray(stored) ? stored : ['quotes', 'aitools', 'coloring', 'stickers', 'currency'];
      if (localStorage.getItem('isCompressorUnlocked') === 'true' && !result.includes('compressor')) result.push('compressor');
      if (localStorage.getItem('isConverterUnlocked') === 'true' && !result.includes('converter')) result.push('converter');
      if (localStorage.getItem('app-imageresizer-unlocked') === 'true' && !result.includes('resizer')) result.push('resizer');
      return result;
    } catch {
      return ['quotes', 'aitools', 'coloring', 'stickers', 'currency'];
    }
  });
  const [activeService, setActiveService] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(UNLOCKED_KEY, JSON.stringify(unlocked));
  }, [unlocked]);

  const handleUnlock = (service: ServiceCard) => {
    const isFree = service.cost === 0 || service.id === 'coloring' || service.id === 'stickers' || service.id === 'currency';

    if (unlocked.includes(service.id) || isFree) {
      if (!unlocked.includes(service.id)) {
        setUnlocked(prev => [...prev, service.id]);
      }
      setActiveService(service.id);
      return;
    }

    // Check against the global points from PointsContext (passed via props)
    if (points < service.cost) {
      toast({ title: lang === 'ar' ? `تحتاجين ${service.cost} نقطة للفتح ❌` : `You need ${service.cost} points to unlock ❌`, variant: 'destructive' });
      return;
    }

    // Deduct points via global context
    addPoints(-service.cost);

    // Persist individual tool unlock flag for backward compat
    const toolKey = TOOL_UNLOCK_KEYS[service.id];
    if (toolKey) {
      localStorage.setItem(toolKey, 'true');
    }

    setUnlocked(prev => [...prev, service.id]);
    toast({ title: lang === 'ar' ? 'تم الفتح! ✨' : 'Unlocked! ✨' });
    setActiveService(service.id);
  };

  if (activeService) {
    const renderService = () => {
      switch (activeService) {
        case 'quotes': return <InspirationalQuotes />;
        case 'stories': return <KidsStories points={points} addPoints={addPoints} />;
        case 'coloring': return <ColoringBook />;
        case 'books': return <BookSummaries />;
        case 'recipes': return <RecipesCare />;
        case 'stickers': return <StickerStore />;
        case 'aitools': return <MakeWebhookForm />;
        case 'quiz': return <QuizEngine onScore={addPoints} />;
        case 'personalityquizzes': return <PersonalityQuizzes />;
        case 'contact': return <CombinedOrderForm onClose={() => setActiveService(null)} lang={lang} hideOffers={true} />;
        case 'compressor': return <FileCompressor />;
        case 'converter': return <FormatConverter />;
        case 'resizer': return <ImageResizer />;
        case 'currency': return <CurrencyConverter />;
        default: return null;
      }
    };

    return (
      <div className="pb-4">
        <button
          onClick={() => setActiveService(null)}
          className="text-primary text-sm font-medium mb-4 flex items-center gap-1 hover:-translate-y-0.5 active:scale-95 transition-all duration-150"
        >
          ← {t('back')}
        </button>
        {renderService()}
      </div>
    );
  }

  return (
    <div className="pb-4">
      <div className="relative -mx-5 -mt-5 rounded-b-3xl overflow-hidden mb-4 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-rose-500 shadow-lg px-5 pt-8 pb-6 text-center">
        <img src={floralBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-2xl font-extrabold text-white mb-2">{t('services')}</h2>
          <p className="text-white/80 text-sm">{t('servicesDesc')}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {services.map(service => {
          const isUnlocked = unlocked.includes(service.id) || service.id === 'coloring' || service.id === 'stickers' || service.cost === 0;
          const Icon = service.icon;
          const isPremiumLocked = !isUnlocked && service.cost >= 80;
          return (
            <button
              key={service.id}
              onClick={() => handleUnlock(service)}
              className={`relative rounded-2xl p-4 text-start transition-all duration-150 active:scale-95 hover:-translate-y-1 shadow-lg shadow-slate-200/40 dark:shadow-black/20 ${
                isUnlocked
                  ? 'glass-card border-primary/20'
                  : isPremiumLocked
                    ? 'glass-card opacity-85 border-amber-400/30'
                    : 'glass-card opacity-80'
              }`}
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-3 shadow-md`}>
                <Icon size={20} className="text-white" />
              </div>
              <p className="font-semibold text-foreground text-sm leading-tight">{lang === 'ar' ? service.nameAr : service.nameEn}</p>
              <div className="mt-2 flex items-center gap-1">
                {isUnlocked ? (
                  <span className="text-xs text-primary flex items-center gap-1 font-semibold"><Check size={12} /> {lang === 'ar' ? 'مفتوح' : 'Unlocked'}</span>
                ) : (
                  <span className={`text-xs flex items-center gap-1 font-bold ${isPremiumLocked ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
                    <Lock size={12} />
                    {service.cost} {t('points')}
                  </span>
                )}
              </div>
              {!isUnlocked && <div className="absolute inset-0 rounded-2xl bg-background/20 backdrop-blur-[1px]" />}
              {isPremiumLocked && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center shadow-sm">
                  <Lock size={10} className="text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-8 mb-4">
        <div className="glass-card rounded-3xl p-5 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 border border-teal-200 dark:border-teal-900/40 text-center">
          <div className="text-3xl mb-2">📲</div>
          <p className="font-extrabold text-teal-800 dark:text-teal-300 text-sm">
            {lang === 'ar' ? 'لتحميل التطبيق على الآيفون 📲' : 'Install the app on your iPhone 📲'}
          </p>
          <p className="text-teal-700 dark:text-teal-400 text-xs mt-1 font-medium">
            {lang === 'ar'
              ? 'اضغط على زر المشاركة ⎋ ثم اختر «إضافة إلى الشاشة الرئيسية» 🏠'
              : 'Tap Share ⎋ then choose "Add to Home Screen" 🏠'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;
