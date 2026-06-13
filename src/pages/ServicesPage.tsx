import { useState, useEffect } from 'react';
import { BookOpenText, Palette, BookOpen, Wand2, UtensilsCrossed, Lock, Check, Sparkles, Sticker, GraduationCap, ShoppingCart } from 'lucide-react';
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
  { id: 'stories', icon: BookOpenText, nameAr: 'قصص الأطفال', nameEn: 'Kids Stories', cost: 5, color: 'from-pink-400 to-rose-500' },
  { id: 'coloring', icon: Palette, nameAr: 'استوديو التلوين', nameEn: 'Coloring Studio', cost: 0, color: 'from-violet-400 to-purple-500' },
  { id: 'books', icon: BookOpen, nameAr: 'ملخصات الكتب', nameEn: 'Book Summaries', cost: 3, color: 'from-sky-400 to-blue-500' },
  { id: 'recipes', icon: UtensilsCrossed, nameAr: 'وصفات وعناية', nameEn: 'Recipes & Care', cost: 2, color: 'from-emerald-400 to-green-500' },
  { id: 'stickers', icon: Sticker, nameAr: 'متجر الملصقات', nameEn: 'Sticker Store', cost: 0, color: 'from-fuchsia-400 to-pink-500' },
  { id: 'aitools', icon: Wand2, nameAr: 'أدوات الذكاء الاصطناعي', nameEn: 'AI Image Tool', cost: 0, color: 'from-indigo-400 to-blue-500' },
  { id: 'quiz', icon: GraduationCap, nameAr: 'محرك الاختبارات', nameEn: 'Quiz Engine', cost: 20, color: 'from-fuchsia-500 to-purple-700' },
  { id: 'personalityquizzes', icon: Sparkles, nameAr: 'اختبارات الشخصية', nameEn: 'Personality Quizzes', cost: 20, color: 'from-purple-500 to-pink-600' },
  { id: 'contact', icon: Sparkles, nameAr: 'مراسلة المسؤولة (مجاني)', nameEn: 'Contact Admin (Free)', cost: 0, color: 'from-emerald-500 to-teal-600' },
];

const ServicesPage = ({ points, addPoints }: ServicesPageProps) => {
  const { t, lang } = useLang();
  const [unlocked, setUnlocked] = useState<string[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(UNLOCKED_KEY) || '["quotes","aitools","carescape","coloring","stickers"]');
      return stored;
    } catch {
      return ['quotes', 'aitools', 'carescape', 'coloring', 'stickers'];
    }
  });
  const [activeService, setActiveService] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(UNLOCKED_KEY, JSON.stringify(unlocked));
  }, [unlocked]);

  const handleUnlock = (service: ServiceCard) => {
    if (unlocked.includes(service.id) || service.id === 'coloring' || service.id === 'stickers' || service.cost === 0) {
      if (!unlocked.includes(service.id)) {
        setUnlocked(prev => [...prev, service.id]);
      }
      setActiveService(service.id);
      return;
    }

    if (points < service.cost) {
      toast({ title: t('notEnoughPoints'), variant: 'destructive' });
      return;
    }
    addPoints(-service.cost);
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
        default: return null;
      }
    };

    return (
      <div className="pb-4">
        <button onClick={() => setActiveService(null)} className="text-primary text-sm font-medium mb-4 flex items-center gap-1">← {t('back')}</button>
        {renderService()}
      </div>
    );
  }

  return (
    <div className="pb-4">
      <h2 className="text-xl font-bold text-foreground mb-1">{t('services')}</h2>
      <p className="text-sm text-muted-foreground mb-5">{t('servicesDesc')}</p>
      <div className="grid grid-cols-2 gap-3">
        {services.map(service => {
          const isUnlocked = unlocked.includes(service.id) || service.id === 'coloring' || service.id === 'stickers';
          const Icon = service.icon;
          return (
            <button key={service.id} onClick={() => handleUnlock(service)}
              className={`relative rounded-2xl p-4 text-start transition-all duration-300 active:scale-[0.97] ${isUnlocked ? 'glass-card border-primary/20' : 'glass-card opacity-80'}`}>
              
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-3`}>
                <Icon size={20} className="text-primary-foreground" />
              </div>
              <p className="font-semibold text-foreground text-sm leading-tight">{lang === 'ar' ? service.nameAr : service.nameEn}</p>
              <div className="mt-2 flex items-center gap-1">
                {isUnlocked ? (
                  <span className="text-xs text-primary flex items-center gap-1"><Check size={12} /> {lang === 'ar' ? 'مفتوح' : 'Unlocked'}</span>
                ) : (
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Lock size={12} /> {service.cost} {t('points')}</span>
                )}
              </div>
              {!isUnlocked && <div className="absolute inset-0 rounded-2xl bg-background/30 backdrop-blur-[1px]" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ServicesPage;