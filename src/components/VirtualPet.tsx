import { useState, useEffect, useCallback, useRef } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { usePoints } from '@/hooks/usePoints';
import { Sparkles, Heart, Droplets, Flame, Snowflake, Sprout, Award, Wheat } from 'lucide-react';
import { toast } from 'sonner';

type PetState = 'egg_selection' | 'incubating' | 'hatched';

interface PetData {
  state: PetState;
  selectedEgg: number | null;
  incubationProgress: number;
  dinoType: number | null;
  seedsOwned: number;
  waterOwned?: number;
  plantStage?: number;
  petHunger: number;
  lastFedDate: string | null;
  isSick?: boolean;
}

const DINO_EMOJIS = ['🦖', '🦕', '🐉', '🦎'];
const PLANT_EMOJIS = ['🟫', '🌱', '🌿', '🪴'];

const HUE_ROTATES = [
  '0deg', '30deg', '60deg', '90deg', '120deg', '150deg', 
  '180deg', '210deg', '240deg', '270deg', '300deg', '330deg'
];

export default function VirtualPet() {
  const { lang } = useLang();
  const { points, addPoints } = usePoints();
  const t = useCallback((ar: string, en: string) => lang === 'ar' ? ar : en, [lang]);

  const [todayPoints, setTodayPoints] = useState(0);
  const prevPointsRef = useRef(points);

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
      waterOwned: 0,
      plantStage: 0,
      petHunger: 100,
      lastFedDate: null,
    };
  });

  useEffect(() => {
    const today = new Date().toDateString();
    try {
      const savedDaily = JSON.parse(localStorage.getItem('daily_earned_points') || '{"date":"","amount":0}');
      let dailyAmount = savedDaily.date === today ? savedDaily.amount : 0;

      if (points > prevPointsRef.current) {
        dailyAmount += (points - prevPointsRef.current);
        localStorage.setItem('daily_earned_points', JSON.stringify({ date: today, amount: dailyAmount }));
      }
      
      setTodayPoints(dailyAmount);
    } catch {}
    prevPointsRef.current = points;
  }, [points]);

  useEffect(() => {
    if (petData.state !== 'hatched') return;
    
    let isSick = petData.isSick;
    try {
      const lastHabitStr = localStorage.getItem('combo-habit-today');
      if (lastHabitStr) {
        const diffTime = Math.abs(new Date().getTime() - new Date(lastHabitStr).getTime());
        const diffHours = diffTime / (1000 * 60 * 60);
        if (diffHours > 48 && !isSick) {
          isSick = true;
        }
      }
    } catch {}

    const today = new Date().toDateString();
    let newHunger = petData.petHunger;
    let newLastFedDate = petData.lastFedDate;

    if (petData.lastFedDate && petData.lastFedDate !== today) {
      const diffTime = Math.abs(new Date().getTime() - new Date(petData.lastFedDate).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      newHunger = Math.max(0, petData.petHunger - (diffDays * 20));
      newLastFedDate = today;
    } else if (!petData.lastFedDate) {
      newLastFedDate = today;
    }

    if (newHunger !== petData.petHunger || newLastFedDate !== petData.lastFedDate || isSick !== petData.isSick) {
      const newData = { ...petData, petHunger: newHunger, lastFedDate: newLastFedDate, isSick };
      setPetData(newData);
      localStorage.setItem('dino_pet_state', JSON.stringify(newData));
    }
  }, [petData]);

  useEffect(() => {
    localStorage.setItem('dino_pet_state', JSON.stringify(petData));
  }, [petData]);

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
          newDinoType = Math.floor(Math.random() * 12) + 1;
          toast.success(t('🎉 فقست البيضة وخرج ديناصورك الأليف!', '🎉 Your egg hatched into a pet Dino!'));
        } else {
          toast(t(`+${pts} نقطة حضانة!`, `+${pts} Incubation points!`), { icon: '🥚' });
        }
        
        return { ...prev, incubationProgress: newProgress, state: newState, dinoType: newDinoType };
      });
    };

    window.addEventListener('pet-action-completed', handlePetAction);
    return () => window.removeEventListener('pet-action-completed', handlePetAction);
  }, [petData.state, t]);

  const selectEgg = (num: number) => {
    setPetData(prev => ({ ...prev, state: 'incubating', selectedEgg: num, incubationProgress: 0 }));
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

  const buyWater = () => {
    if (points >= 20) {
      addPoints(-20);
      setPetData(prev => ({ ...prev, waterOwned: (prev.waterOwned || 0) + 1 }));
      toast.success(t('تم شراء ماء!', 'Water purchased!'));
    } else {
      toast.error(t('تحتاج إلى 20 نقطة', 'Need 20 points'));
    }
  };

  const feedPet = () => {
    if (petData.isSick) {
      toast.error(t('الديناصور مريض، لن يأكل حتى تعالجه!', 'Dino is sick, won\'t eat until cured!'));
      return;
    }
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

  const plantSeed = () => {
    if (petData.seedsOwned > 0 && (petData.plantStage || 0) === 0) {
      setPetData(prev => ({ ...prev, seedsOwned: prev.seedsOwned - 1, plantStage: 1 }));
    }
  };

  const waterPlant = () => {
    if ((petData.waterOwned || 0) > 0 && (petData.plantStage || 0) >= 1 && (petData.plantStage || 0) < 3) {
      setPetData(prev => ({ ...prev, waterOwned: (petData.waterOwned || 0) - 1, plantStage: (prev.plantStage || 0) + 1 }));
    }
  };

  const harvestAndFeed = () => {
    if (petData.isSick) {
      toast.error(t('الديناصور مريض!', 'Dino is sick!'));
      return;
    }
    if ((petData.plantStage || 0) === 3) {
      if (petData.petHunger >= 100) {
         toast(t('ديناصورك شبعان بالفعل!', 'Your dino is already full!'));
         return;
      }
      setPetData(prev => ({ ...prev, plantStage: 0, petHunger: Math.min(100, prev.petHunger + 50) }));
      toast.success(t('يم يم! الديناصور تناول النبتة الطازجة', 'Yum yum! Dino ate the fresh plant'));
    }
  };

  const buyMedicine = () => {
    if (points >= 100) {
      addPoints(-100);
      setPetData(prev => ({ ...prev, isSick: false }));
      toast.success(t('تم علاج الديناصور! 💊', 'Dino is cured! 💊'));
      localStorage.setItem('combo-habit-today', new Date().toDateString());
    } else {
      toast.error(t('تحتاج إلى 100 نقطة لشراء الدواء', 'You need 100 points to buy medicine'));
    }
  };

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
      </div>
    );
  }

  const dinoEmoji = DINO_EMOJIS[(petData.dinoType || 1) % DINO_EMOJIS.length];
  const dinoColor = HUE_ROTATES[(petData.dinoType || 1) % HUE_ROTATES.length];
  const fireLit = todayPoints >= 100;
  const plantStage = petData.plantStage || 0;

  return (
    <div className="mx-1 space-y-4">
      {/* CARD 1: ENVIRONMENT */}
      <div className="glass-card rounded-[2.5rem] relative overflow-hidden border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-blue-100 to-white dark:from-slate-900 dark:to-slate-800 p-6 min-h-[220px]">
        {/* Mountain Background Shapes */}
        <div className="absolute bottom-0 left-0 w-full h-1/2 opacity-30 pointer-events-none">
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-200 dark:bg-slate-700 rotate-45 transform origin-bottom-left" />
          <div className="absolute bottom-0 left-1/4 w-60 h-60 bg-white dark:bg-slate-600 rotate-45 transform origin-bottom-left" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-300 dark:bg-slate-500 rotate-45 transform origin-bottom-right" />
        </div>

        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="flex justify-between items-start">
             <div className="flex items-center gap-1.5 bg-white/50 dark:bg-black/20 px-3 py-1 rounded-full shadow-sm backdrop-blur-md">
                <Award size={14} className="text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {t('المستوى 1', 'Level 1')}
                </span>
             </div>
             <div className="flex items-center gap-1 bg-white/50 dark:bg-black/20 px-3 py-1 rounded-full shadow-sm backdrop-blur-md">
                <Heart size={12} className={petData.petHunger < 30 ? "text-red-500" : "text-emerald-500"} />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{petData.petHunger}%</span>
             </div>
          </div>

          <div className="flex items-end justify-center gap-6 mt-8">
             {/* Campfire */}
             <div className="flex flex-col items-center">
                <div className={`text-5xl ${fireLit ? 'animate-pulse drop-shadow-[0_0_15px_rgba(255,165,0,0.8)]' : 'opacity-70 grayscale'}`}>
                   {fireLit ? '🔥' : '🧊'}
                </div>
                <div className="mt-2 text-[9px] font-bold text-slate-600 dark:text-slate-400 bg-white/50 dark:bg-black/30 px-2 py-0.5 rounded-full backdrop-blur-sm">
                   {fireLit ? t('مشتعلة', 'Warm') : t('باردة (تحتاج 100 نقطة اليوم)', 'Cold (Need 100 pts today)')}
                </div>
             </div>

             {/* Pet */}
             <div className="relative group">
               {petData.isSick ? (
                 <div className="text-7xl drop-shadow-xl animate-pulse cursor-pointer grayscale opacity-80" onClick={() => toast.error(t('الديناصور مريض!', 'Sick!'))}>
                   🤒
                 </div>
               ) : (
                 <div className="text-7xl drop-shadow-2xl animate-[bounce_3s_infinite] cursor-pointer" style={{ filter: `hue-rotate(${dinoColor})` }}>
                   {dinoEmoji}
                 </div>
               )}
               {petData.isSick && <div className="absolute -top-2 -right-2 bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse font-bold shadow-sm">{t('مريض!', 'Sick!')}</div>}
               {!petData.isSick && !fireLit && <div className="absolute -top-2 -left-2 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm"><Snowflake size={10} /></div>}
             </div>

             {/* Plant Patch */}
             <div className="flex flex-col items-center cursor-pointer" onClick={plantStage === 3 ? harvestAndFeed : undefined}>
                <div className="text-5xl drop-shadow-md hover:scale-105 transition-transform">
                   {PLANT_EMOJIS[plantStage]}
                </div>
                {plantStage === 3 && (
                  <div className="mt-1 text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full animate-pulse">
                     {t('جاهز للحصاد!', 'Harvest!')}
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>

      {/* CARD 2: STORE / STATS */}
      <div className="glass-card rounded-3xl p-4 bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
        <h4 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider text-center">{t('متجر وموارد الديناصور', 'Dino Store & Resources')}</h4>
        
        {petData.isSick ? (
           <button onClick={buyMedicine} className="w-full flex items-center justify-center gap-2 bg-purple-500 text-white rounded-xl py-3 px-4 hover:bg-purple-600 active:scale-95 transition-all shadow-sm">
             <Sparkles size={16} className="text-yellow-300" />
             <span className="text-sm font-bold">{t('شراء دواء (100 نقطة)', 'Buy Medicine (100 pts)')}</span>
           </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {/* Seeds & Planting */}
            <div className="space-y-2">
               <button onClick={buySeed} className="w-full flex items-center justify-between bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 rounded-xl py-2 px-3 hover:bg-amber-200 dark:hover:bg-amber-800/50 transition-colors border border-amber-200 dark:border-amber-800">
                 <div className="flex items-center gap-1.5"><Sprout size={14} /><span className="text-xs font-bold">{t('شراء بذرة', 'Buy Seed')}</span></div>
                 <span className="text-[10px] font-bold flex items-center gap-0.5 text-amber-700 dark:text-amber-300">50 <Sparkles size={10} /></span>
               </button>
               <button onClick={plantSeed} disabled={petData.seedsOwned === 0 || plantStage !== 0} className="w-full flex justify-center items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl py-2 px-3 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50">
                 <span className="text-xs font-bold">{t('زراعة (', 'Plant (')}{petData.seedsOwned}{t(')', ')')}</span>
               </button>
            </div>
            {/* Water & Watering */}
            <div className="space-y-2">
               <button onClick={buyWater} className="w-full flex items-center justify-between bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 rounded-xl py-2 px-3 hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors border border-blue-200 dark:border-blue-800">
                 <div className="flex items-center gap-1.5"><Droplets size={14} /><span className="text-xs font-bold">{t('شراء ماء', 'Buy Water')}</span></div>
                 <span className="text-[10px] font-bold flex items-center gap-0.5 text-blue-700 dark:text-blue-300">20 <Sparkles size={10} /></span>
               </button>
               <button onClick={waterPlant} disabled={(petData.waterOwned || 0) === 0 || plantStage === 0 || plantStage === 3} className="w-full flex justify-center items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl py-2 px-3 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50">
                 <span className="text-xs font-bold">{t('سقي (', 'Water (')}{petData.waterOwned || 0}{t(')', ')')}</span>
               </button>
            </div>
            {/* Generic Feed */}
            <div className="col-span-2 mt-1">
               <button onClick={feedPet} disabled={petData.seedsOwned === 0} className="w-full flex justify-center items-center gap-2 bg-emerald-500 text-white rounded-xl py-2.5 px-3 hover:bg-emerald-600 transition-colors disabled:opacity-50 shadow-sm">
                 <Wheat size={16} />
                 <span className="text-sm font-bold">{t('إطعام مباشر ببذرة', 'Feed Seed Directly')}</span>
               </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
