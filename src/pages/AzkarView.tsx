
import { useState, useMemo } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { RotateCcw, Plus, Sun, Moon, Plane, ArrowLeft, ArrowRight } from 'lucide-react';
import { usePoints } from '@/hooks/usePoints';
import { toast } from 'sonner';
import { morningAzkar, eveningAzkar, travelAzkar } from '@/data/azkarLists';
import { useDailyComboChallenge } from '@/contexts/DailyComboChallengeContext';

interface Zekr {
  id: string | number;
  textAr: string;
  textEn: string;
  target: number;
  time: 'morning' | 'evening' | 'travel';
}

interface Category {
  id: 'morning' | 'evening' | 'travel';
  titleAr: string;
  titleEn: string;
  icon: React.ElementType;
  color: string;
}

const AzkarView = () => {
  const { lang, dir } = useLang();
  const { addPoints } = usePoints();
  const { updateChallenge } = useDailyComboChallenge();
  const [selectedCategory, setSelectedCategory] = useState<'morning' | 'evening' | 'travel' | null>(null);
  const BackArrow = dir === 'rtl' ? ArrowRight : ArrowLeft;

  const categories: Category[] = [
    { id: 'morning', titleAr: 'أذكار الصباح', titleEn: 'Morning Remembrance', icon: Sun, color: 'from-amber-400 to-orange-500' },
    { id: 'evening', titleAr: 'أذكار المساء', titleEn: 'Evening Remembrance', icon: Moon, color: 'from-indigo-400 to-purple-500' },
    { id: 'travel', titleAr: 'أذكار السفر', titleEn: 'Travel Invocations', icon: Plane, color: 'from-cyan-400 to-blue-500' },
  ];
  
  const azkarList = useMemo(() => [...morningAzkar, ...eveningAzkar, ...travelAzkar], []);

  const [counts, setCounts] = useState<{ [key: string]: number }>({});

  const increment = (id: string | number, target: number) => {
    setCounts((prev) => {
      const current = prev[id] || 0;
      if (current < target) {
        const next = current + 1;
        import('@/lib/audio').then(m => m.playPopSound());
        updateChallenge('education', true);
        if (next === target) {
          addPoints(2);
          toast.success(lang === 'ar' ? '+2 نقاط للأذكار 🌟' : '+2 points for Azkar 🌟');
        }
        return { ...prev, [id]: next };
      }
      return prev;
    });
  };

  const reset = (id: string | number) => {
    setCounts((prev) => ({ ...prev, [id]: 0 }));
  };

  const renderCategoryCard = (category: Category) => {
    const filtered = azkarList.filter(z => z.time === category.id);
    const Icon = category.icon;
    
    return (
      <button
        key={category.id}
        onClick={() => setSelectedCategory(category.id)}
        className={`group relative overflow-hidden rounded-[2rem] p-6 transition-all duration-300 hover:shadow-lg active:scale-95 bg-gradient-to-br ${category.color} text-white shadow-lg`}
      >
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all" />
        <div className="relative flex flex-col items-center gap-3">
          <div className="p-4 rounded-full bg-white/20 backdrop-blur-sm">
            <Icon size={32} />
          </div>
          <div>
            <h3 className="font-bold text-lg">{lang === 'ar' ? category.titleAr : category.titleEn}</h3>
            <p className="text-sm opacity-90">{filtered.length} {lang === 'ar' ? 'تسبيحة' : 'reminders'}</p>
          </div>
        </div>
      </button>
    );
  };

  const renderDetailedCategory = (category: Category | null) => {
    if (!category) return null;
    
    const filtered = azkarList.filter(z => z.time === category.id);
    const Icon = category.icon;

    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-primary/20 sticky top-0 bg-background/95 backdrop-blur z-10">
          <button
            onClick={() => setSelectedCategory(null)}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <BackArrow size={20} className="text-primary" />
          </button>
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Icon size={20} />
          </div>
          <h3 className="text-xl font-black text-foreground flex-1">
            {lang === 'ar' ? category.titleAr : category.titleEn}
          </h3>
          <span className="text-xs font-bold px-2 py-1 rounded-full bg-primary/10 text-primary">
            {filtered.length}
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
          <div className="space-y-4 p-4 pb-20">
            {filtered.map((zekr) => {
              const count = counts[zekr.id] || 0;
              const isCompleted = count >= zekr.target;

              return (
                <div 
                  key={zekr.id} 
                  className={`group relative overflow-hidden transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-primary/5 border-primary/30' 
                      : 'glass-card border-border hover:border-primary/30'
                  } border p-5 rounded-[2rem] flex flex-col gap-4 shadow-sm hover:shadow-md`}
                >
                  <div 
                    className="absolute bottom-0 left-0 h-1 bg-primary/20 transition-all duration-500"
                    style={{ width: `${(count / zekr.target) * 100}%` }}
                  />

                  <p className={`text-lg leading-relaxed font-bold text-center transition-colors ${
                    lang === 'ar' ? 'font-arabic' : 'font-sans'
                  } ${isCompleted ? 'text-primary' : 'text-foreground'}`}>
                    {lang === 'ar' ? zekr.textAr : zekr.textEn}
                  </p>

                  <div className="flex items-center justify-between gap-6">
                    <button
                      onClick={() => reset(zekr.id)}
                      className="p-4 rounded-2xl bg-secondary/30 text-secondary-foreground hover:bg-secondary/50 transition-all active:scale-90"
                    >
                      <RotateCcw size={20} />
                    </button>

                    <div className="flex-1 flex flex-col items-center justify-center">
                      <div className="flex items-baseline gap-1">
                        <span className={`text-4xl font-black transition-colors ${
                          isCompleted ? 'text-primary' : 'text-foreground'
                        }`}>
                          {count}
                        </span>
                        <span className="text-sm font-bold text-muted-foreground">
                          / {zekr.target}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => increment(zekr.id, zekr.target)}
                      disabled={isCompleted}
                      className={`p-5 rounded-[1.5rem] transition-all active:scale-95 shadow-lg ${
                        isCompleted
                          ? 'bg-primary/10 text-primary/40 cursor-not-allowed'
                          : 'bg-primary text-primary-foreground hover:shadow-primary/30 hover:-translate-y-1'
                      }`}
                    >
                      <Plus size={28} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const selectedCat = categories.find(c => c.id === selectedCategory);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {selectedCategory && selectedCat ? (
        renderDetailedCategory(selectedCat)
      ) : (
        <div className="flex flex-col gap-4 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent pb-20">
          <div className="grid grid-cols-1 gap-4">
            {categories.map(category => renderCategoryCard(category))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AzkarView;
