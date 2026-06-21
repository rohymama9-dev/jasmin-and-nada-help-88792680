import { useState, useEffect, useCallback } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { usePoints } from '@/hooks/usePoints';
import { Sparkles, Heart, Wheat, ShieldAlert, Award } from 'lucide-react';
import { toast } from 'sonner';

type PetState = 'egg_selection' | 'incubating' | 'hatched';

interface PetData {
  state: PetState;
  selectedEgg: number | null;
  incubationProgress: number;
  dinoType: number | null;
  seedsOwned: number;
  petHunger: number;
  lastFedDate: string | null;
}

const DINO_EMOJIS = ['🦖', '🦕', '🐉', '🦎'];

const HUE_ROTATES = [
  '0deg', '30deg', '60deg', '90deg', '120deg', '150deg', 
  '180deg', '210deg', '240deg', '270deg', '300deg', '330deg'
];

export default function VirtualPet() {
  const { lang } = useLang();
  const { points, addPoints } = usePoints();
  const t = useCallback((ar: string, en: string) => lang === 'ar' ? ar : en, [lang]);

  const [petData, setPetData] = useState<PetData>(() => {
    try {
      const saved = localStorage.getItem('dino_pet_state');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      state: 'egg_selection',
      selectedEgg: null,
      incubationProgress: 0,
      dinoType: null,
      seedsOwned: 0,
      petHunger: 100,
      lastFedDate: null,
    };
  });

  // Calculate hunger decay
  useEffect(() => {
    if (petData.state !== 'hatched') return;
    
    const today = new Date().toDateString();
    if (petData.lastFedDate && petData.lastFedDate !== today) {
      // Decode days since last fed
      const diffTime = Math.abs(new Date().getTime() - new Date(petData.lastFedDate).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const newHunger = Math.max(0, petData.petHunger - (diffDays * 20));
      
      if (newHunger !== petData.petHunger) {
        const newData = { ...petData, petHunger: newHunger, lastFedDate: today };
        setPetData(newData);
        localStorage.setItem('dino_pet_state', JSON.stringify(newData));
      }
    } else if (!petData.lastFedDate) {
      const newData = { ...petData, lastFedDate: today };
      setPetData(newData);
      localStorage.setItem('dino_pet_state', JSON.stringify(newData));
    }
  }, [petData]);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('dino_pet_state', JSON.stringify(petData));
  }, [petData]);

  // Listen for global events to increase incubation
  useEffect(() => {
    const handlePetAction = (e: any) => {
      if (petData.state !== 'incubating') return;
      const pts = e.detail?.points || 2;
      
      setPetData(prev => {
        const newProgress = Math.min(100, prev.incubationProgress + pts);
        let newState = prev.state;
        let newDinoType = prev.dinoType;
        
        if (newProgress >= 100) {
          newState = 'hatched';
          newDinoType = Math.floor(Math.random() * 12) + 1; // 1-12
          toast.success(t('🎉 فقست البيضة وخرج ديناصورك الأليف!', '🎉 Your egg hatched into a pet Dino!'));
        } else {
          toast(t(`+${pts} نقطة حضانة!`, `+${pts} Incubation points!`), { icon: '🥚' });
        }
        
        return {
          ...prev,
          incubationProgress: newProgress,
          state: newState,
          dinoType: newDinoType
        };
      });
    };

    window.addEventListener('pet-action-completed', handlePetAction);
    return () => window.removeEventListener('pet-action-completed', handlePetAction);
  }, [petData.state, t]);

  const selectEgg = (num: number) => {
    setPetData(prev => ({
      ...prev,
      state: 'incubating',
      selectedEgg: num,
      incubationProgress: 0,
    }));
  };

  const buySeed = () => {
    if (points >= 50) {
      addPoints(-50);
      setPetData(prev => ({ ...prev, seedsOwned: prev.seedsOwned + 1 }));
      toast.success(t('تم شراء بذرة!', 'Seed purchased!'));
    } else {
      toast.error(t('تحتاج إلى 50 نقطة لشراء بذرة', 'You need 50 points to buy a seed'));
    }
  };

  const feedPet = () => {
    if (petData.seedsOwned > 0) {
      if (petData.petHunger >= 100) {
        toast(t('ديناصورك شبعان بالفعل!', 'Your dino is already full!'));
        return;
      }
      setPetData(prev => ({
        ...prev,
        seedsOwned: prev.seedsOwned - 1,
        petHunger: Math.min(100, prev.petHunger + 30)
      }));
      toast.success(t('يم يم! الديناصور سعيد', 'Yum yum! Dino is happy'));
    } else {
      toast.error(t('لا تملك بذور كافية، اشترِ المزيد!', 'Not enough seeds, buy more!'));
    }
  };

  // Render Egg Selection
  if (petData.state === 'egg_selection') {
    return (
      <div className="glass-card rounded-[2.5rem] p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900 mx-1">
        <h3 className="font-extrabold text-xl text-center text-indigo-900 dark:text-indigo-200 mb-2">
          {t('حيوانك الأليف الافتراضي', 'Virtual Pet')}
        </h3>
        <p className="text-center text-sm text-indigo-700 dark:text-indigo-400 font-bold mb-6">
          {t('اختر بيضتك بحكمة...', 'Choose your egg wisely...')}
        </p>
        <div className="flex justify-center gap-4">
          {[1, 2, 3].map(num => (
            <button
              key={num}
              onClick={() => selectEgg(num)}
              className="text-6xl hover:scale-110 active:scale-95 transition-transform filter drop-shadow-md cursor-pointer animate-pulse-soft"
              style={{ filter: `hue-rotate(${num * 60}deg)` }}
            >
              🥚
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Render Incubating
  if (petData.state === 'incubating') {
    const p = petData.incubationProgress;
    let eggEmoji = '🥚';
    let bounceClass = 'animate-pulse-soft';
    
    if (p >= 80) { eggEmoji = '🐣'; bounceClass = 'animate-bounce'; }
    else if (p >= 50) { eggEmoji = '🥚'; bounceClass = 'animate-wiggle'; }
    else if (p >= 20) { eggEmoji = '🥚'; bounceClass = 'animate-shake'; }

    return (
      <div className="glass-card rounded-[2.5rem] p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-900 mx-1 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
        
        <h3 className="font-extrabold text-xl text-center text-amber-900 dark:text-amber-200 mb-2">
          {t('حضانة البيضة', 'Egg Incubation')}
        </h3>
        
        <div className="flex flex-col items-center justify-center py-6">
          <div className={`text-7xl drop-shadow-xl ${bounceClass} transition-all duration-300`} style={{ filter: `hue-rotate(${petData.selectedEgg! * 60}deg) ${p >= 20 && p < 80 ? 'contrast(1.2)' : ''}` }}>
            {eggEmoji}
          </div>
          
          <div className="w-full max-w-[200px] mt-6">
            <div className="flex justify-between text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">
              <span>{t('التقدم', 'Progress')}</span>
              <span>{p} / 100</span>
            </div>
            <div className="h-2.5 w-full bg-amber-200 dark:bg-amber-900/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-1000 ease-out relative"
                style={{ width: `${p}%` }}
              >
                <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite]"></div>
              </div>
            </div>
          </div>
        </div>
        
        <p className="text-center text-xs text-amber-700 dark:text-amber-400 font-bold bg-amber-100/50 dark:bg-amber-900/30 p-2 rounded-xl">
          {t('استمر في إنجاز مهامك اليومية لتسريع فقس البيضة!', 'Keep completing your daily tasks to speed up hatching!')}
        </p>
      </div>
    );
  }

  // Render Hatched Dino
  const dinoEmoji = DINO_EMOJIS[(petData.dinoType || 1) % DINO_EMOJIS.length];
  const dinoColor = HUE_ROTATES[(petData.dinoType || 1) % HUE_ROTATES.length];

  return (
    <div className="glass-card rounded-[2.5rem] p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-900 mx-1 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-extrabold text-xl text-emerald-900 dark:text-emerald-200">
          {t('مرافقي اللطيف', 'My Cute Companion')}
        </h3>
        <div className="flex items-center gap-1.5 bg-white/50 dark:bg-black/20 px-3 py-1 rounded-full shadow-sm">
          <Award size={14} className="text-emerald-600" />
          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
            {t('المستوى 1', 'Level 1')}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        {/* Dino Avatar */}
        <div className="relative shrink-0 w-24 h-24 flex items-center justify-center bg-white/40 dark:bg-black/20 rounded-3xl shadow-inner border border-emerald-100/50 dark:border-emerald-800/50 group">
          <div 
            className="text-6xl drop-shadow-xl animate-[bounce_3s_infinite] group-hover:scale-110 transition-transform cursor-pointer"
            style={{ filter: `hue-rotate(${dinoColor})` }}
            onClick={() => toast(t('الديناصور يحبك!', 'Dino loves you!'), { icon: '💖' })}
          >
            {dinoEmoji}
          </div>
          {petData.petHunger < 30 && (
            <div className="absolute -top-2 -right-2 bg-destructive text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse font-bold shadow-sm">
              {t('جائع!', 'Hungry!')}
            </div>
          )}
        </div>
        
        {/* Stats & Actions */}
        <div className="flex-1 space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
              <span className="flex items-center gap-1"><Heart size={10} /> {t('الطاقة (الشبع)', 'Energy (Fullness)')}</span>
              <span>{petData.petHunger}%</span>
            </div>
            <div className="h-2 w-full bg-emerald-200/50 dark:bg-emerald-900/50 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${petData.petHunger < 30 ? 'bg-red-500' : 'bg-emerald-500'}`}
                style={{ width: `${petData.petHunger}%` }}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={feedPet}
              className="flex-1 flex flex-col items-center justify-center gap-1 bg-emerald-500 text-white rounded-xl py-2 px-1 hover:bg-emerald-600 active:scale-95 transition-all shadow-sm"
            >
              <Wheat size={16} />
              <span className="text-[10px] font-bold">{t('إطعام (', 'Feed (')}{petData.seedsOwned}{t(')', ')')}</span>
            </button>
            <button 
              onClick={buySeed}
              className="flex-1 flex flex-col items-center justify-center gap-1 bg-white dark:bg-emerald-900 text-emerald-700 dark:text-emerald-100 rounded-xl py-2 px-1 hover:bg-emerald-50 dark:hover:bg-emerald-800 active:scale-95 transition-all border border-emerald-200 dark:border-emerald-800 shadow-sm"
            >
              <div className="flex items-center gap-1">
                <Sparkles size={12} className="text-yellow-500" />
                <span className="text-[10px] font-bold">50</span>
              </div>
              <span className="text-[10px] font-bold">{t('شراء بذرة', 'Buy Seed')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
