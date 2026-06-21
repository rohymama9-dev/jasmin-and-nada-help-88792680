import { useState, useEffect, useCallback, useRef } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { usePoints } from '@/hooks/usePoints';
import { Sparkles, Heart, Droplets, Sprout, Award, Wheat, Snowflake } from 'lucide-react';
import { toast } from 'sonner';

type PetState = 'egg_selection' | 'incubating' | 'hatched';

interface PetData {
  state: PetState;
  selectedEgg: number | null;
  incubationProgress: number;
  dinoType: number | null;
  seedsOwned: number;
  waterOwned: number;
  plantStage: number; // 0=empty dirt, 1=seed 🌱, 2=sprout 🌿, 3=plant 🪴
  petHunger: number;
  lastFedDate: string | null;
  isSick: boolean;
}

const DINO_EMOJIS = ['🦖', '🦕', '🐉', '🦎'];
const PLANT_STAGES = ['🟫', '🌱', '🌿', '🪴'];

const HUE_ROTATES = [
  '0deg', '45deg', '90deg', '135deg', '180deg', '225deg', '270deg', '315deg',
  '30deg', '60deg', '150deg', '270deg'
];

const loadPetData = (): PetData => {
  try {
    const saved = localStorage.getItem('dino_pet_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        state: parsed.state ?? 'egg_selection',
        selectedEgg: parsed.selectedEgg ?? null,
        incubationProgress: parsed.incubationProgress ?? 0,
        dinoType: parsed.dinoType ?? null,
        seedsOwned: parsed.seedsOwned ?? 0,
        waterOwned: parsed.waterOwned ?? 0,
        plantStage: parsed.plantStage ?? 0,
        petHunger: parsed.petHunger ?? 100,
        lastFedDate: parsed.lastFedDate ?? null,
        isSick: parsed.isSick ?? false,
      };
    }
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
    isSick: false,
  };
};

export default function VirtualPet() {
  const { lang } = useLang();
  const { points, addPoints } = usePoints();
  const t = useCallback((ar: string, en: string) => lang === 'ar' ? ar : en, [lang]);

  const [petData, setPetData] = useState<PetData>(loadPetData);

  // Track today's earned points for campfire
  const [todayPoints, setTodayPoints] = useState<number>(() => {
    try {
      const today = new Date().toDateString();
      const saved = JSON.parse(localStorage.getItem('daily_earned_points') || '{"date":"","amount":0}');
      return saved.date === today ? saved.amount : 0;
    } catch { return 0; }
  });
  const prevPointsRef = useRef(points);

  // Update todayPoints tracker when global points increase
  useEffect(() => {
    if (points > prevPointsRef.current) {
      const today = new Date().toDateString();
      const delta = points - prevPointsRef.current;
      setTodayPoints(prev => {
        const next = prev + delta;
        try {
          localStorage.setItem('daily_earned_points', JSON.stringify({ date: today, amount: next }));
        } catch {}
        return next;
      });
    }
    prevPointsRef.current = points;
  }, [points]);

  // Egg progress: each 5 global points = +1 incubation progress (capped at 100)
  useEffect(() => {
    if (petData.state !== 'incubating') return;
    const derived = Math.min(100, Math.floor(points / 5));
    if (derived !== petData.incubationProgress) {
      setPetData(prev => {
        if (prev.state !== 'incubating') return prev;
        if (derived >= 100) {
          const newDinoType = Math.floor(Math.random() * 12);
          toast.success(t('🎉 فقست البيضة! ديناصورك وُلد!', '🎉 Egg hatched! Your dino is born!'));
          return { ...prev, incubationProgress: 100, state: 'hatched', dinoType: newDinoType };
        }
        return { ...prev, incubationProgress: derived };
      });
    }
  }, [points, petData.state, petData.incubationProgress, t]);

  // Sickness check: >48h since last habit
  useEffect(() => {
    if (petData.state !== 'hatched') return;
    try {
      const lastHabitStr = localStorage.getItem('combo-habit-today');
      if (lastHabitStr) {
        const diffHours = (Date.now() - new Date(lastHabitStr).getTime()) / 3600000;
        if (diffHours > 48 && !petData.isSick) {
          setPetData(prev => ({ ...prev, isSick: true }));
        }
      }
    } catch {}
  }, [petData.state, petData.isSick]);

  // Hunger decay
  useEffect(() => {
    if (petData.state !== 'hatched') return;
    const today = new Date().toDateString();
    if (petData.lastFedDate && petData.lastFedDate !== today) {
      const diffDays = Math.ceil((Date.now() - new Date(petData.lastFedDate).getTime()) / 86400000);
      const newHunger = Math.max(0, petData.petHunger - diffDays * 20);
      setPetData(prev => ({ ...prev, petHunger: newHunger, lastFedDate: today }));
    } else if (!petData.lastFedDate) {
      setPetData(prev => ({ ...prev, lastFedDate: today }));
    }
  }, [petData.state, petData.lastFedDate, petData.petHunger]);

  // Save whenever petData changes
  useEffect(() => {
    try {
      localStorage.setItem('dino_pet_state', JSON.stringify(petData));
    } catch {}
  }, [petData]);

  const selectEgg = (num: number) => {
    setPetData(prev => ({ ...prev, state: 'incubating', selectedEgg: num, incubationProgress: 0 }));
    toast(t('اخترت بيضتك! أكمل مهامك اليومية لفقسها.', 'Egg chosen! Complete daily tasks to hatch it.'), { icon: '🥚' });
  };

  const buySeed = () => {
    if (points < 50) { toast.error(t('تحتاج 50 نقطة', 'Need 50 pts')); return; }
    addPoints(-50);
    setPetData(prev => ({ ...prev, seedsOwned: prev.seedsOwned + 1 }));
    toast.success(t('تم شراء بذرة! 🌱', 'Seed purchased! 🌱'));
  };

  const buyWater = () => {
    if (points < 20) { toast.error(t('تحتاج 20 نقطة', 'Need 20 pts')); return; }
    addPoints(-20);
    setPetData(prev => ({ ...prev, waterOwned: prev.waterOwned + 1 }));
    toast.success(t('تم شراء ماء! 💧', 'Water purchased! 💧'));
  };

  const plantSeed = () => {
    if (petData.seedsOwned <= 0) { toast.error(t('لا توجد بذور', 'No seeds')); return; }
    if (petData.plantStage !== 0) { toast(t('النبتة موجودة بالفعل', 'Plant already growing')); return; }
    setPetData(prev => ({ ...prev, seedsOwned: prev.seedsOwned - 1, plantStage: 1 }));
    toast.success(t('تم زراعة البذرة! 🌱', 'Seed planted! 🌱'));
  };

  const waterPlant = () => {
    if (petData.waterOwned <= 0) { toast.error(t('لا يوجد ماء', 'No water')); return; }
    if (petData.plantStage === 0) { toast(t('ازرع البذرة أولاً', 'Plant a seed first')); return; }
    if (petData.plantStage >= 3) { toast(t('النبتة اكتملت! احصدها لإطعام الدينو', 'Plant ready! Harvest to feed dino')); return; }
    setPetData(prev => ({ ...prev, waterOwned: prev.waterOwned - 1, plantStage: Math.min(3, prev.plantStage + 1) }));
    toast.success(t('تم سقي النبتة! 💧', 'Plant watered! 💧'));
  };

  const harvestPlant = () => {
    if (petData.plantStage < 3) { toast(t('النبتة لم تنضج بعد', 'Plant not ready yet')); return; }
    if (petData.isSick) { toast.error(t('الدينو مريض، اعلجه أولاً', 'Dino sick, cure first')); return; }
    setPetData(prev => ({ ...prev, plantStage: 0, petHunger: Math.min(100, prev.petHunger + 50) }));
    toast.success(t('يم يم! الدينو يأكل النبتة الطازجة 🌿', 'Yum! Dino ate fresh plant 🌿'));
  };

  const feedDino = () => {
    if (petData.isSick) { toast.error(t('الدينو مريض!', 'Dino sick!')); return; }
    if (petData.seedsOwned <= 0) { toast.error(t('لا توجد بذور', 'No seeds')); return; }
    if (petData.petHunger >= 100) { toast(t('الدينو شبعان!', 'Dino is full!')); return; }
    setPetData(prev => ({ ...prev, seedsOwned: prev.seedsOwned - 1, petHunger: Math.min(100, prev.petHunger + 25) }));
    toast.success(t('يم يم! 🌱', 'Yum yum! 🌱'));
  };

  const buyMedicine = () => {
    if (points < 100) { toast.error(t('تحتاج 100 نقطة للدواء', 'Need 100 pts for medicine')); return; }
    addPoints(-100);
    setPetData(prev => ({ ...prev, isSick: false }));
    localStorage.setItem('combo-habit-today', new Date().toDateString());
    toast.success(t('تم علاج الدينو! 💊', 'Dino cured! 💊'));
  };

  const p = petData.incubationProgress;
  let eggEmoji = '🥚';
  if (p >= 90) eggEmoji = '🐣';
  else if (p >= 70) eggEmoji = '🥚';
  else if (p >= 40) eggEmoji = '🥚';
  const bounceClass = p >= 80 ? 'animate-bounce' : p >= 40 ? 'animate-pulse' : '';
  const crackFilter = p >= 70 ? 'contrast(1.3) saturate(1.5)' : p >= 40 ? 'contrast(1.15)' : undefined;

  const dinoEmoji = DINO_EMOJIS[(petData.dinoType || 0) % DINO_EMOJIS.length];
  const dinoHue = HUE_ROTATES[(petData.dinoType || 0) % HUE_ROTATES.length];
  const fireLit = todayPoints >= 100;

  return (
    <div className="mx-1 space-y-3">
      {/* ── ENVIRONMENT CARD ── */}
      <div className="relative rounded-3xl overflow-hidden border-4 border-blue-300 bg-gradient-to-b from-blue-200 via-blue-100 to-slate-100 min-h-[200px] p-4">
        {/* Mountain backdrop shapes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute bottom-0 left-0 w-0 h-0 border-l-[80px] border-l-transparent border-r-[80px] border-r-transparent border-b-[120px] border-b-white/40" />
          <div className="absolute bottom-0 left-8 w-0 h-0 border-l-[60px] border-l-transparent border-r-[60px] border-r-transparent border-b-[100px] border-b-slate-200/50" />
          <div className="absolute bottom-0 right-0 w-0 h-0 border-l-[70px] border-l-transparent border-r-[70px] border-r-transparent border-b-[110px] border-b-blue-200/60" />
          <div className="absolute bottom-0 right-6 w-0 h-0 border-l-[50px] border-l-transparent border-r-[50px] border-r-transparent border-b-[90px] border-b-white/30" />
          {/* Snow on peaks */}
          <div className="absolute top-4 left-6 text-2xl opacity-60">❄️</div>
          <div className="absolute top-6 right-8 text-xl opacity-50">❄️</div>
        </div>

        {/* Stats row */}
        <div className="relative z-10 flex justify-between items-center mb-3">
          <div className="flex items-center gap-1.5 bg-white/60 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm">
            <Award size={12} className="text-blue-700" />
            <span className="text-[11px] font-bold text-blue-900">{t('المستوى 1', 'Lv.1')}</span>
          </div>
          <div className="flex items-center gap-1 bg-white/60 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm">
            <Heart size={12} className={petData.petHunger < 30 ? 'text-red-500 animate-pulse' : 'text-emerald-600'} />
            <span className="text-[11px] font-bold text-slate-800">{petData.petHunger}%</span>
          </div>
          <div className="flex items-center gap-1 bg-white/60 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm">
            <Sparkles size={12} className="text-amber-500" />
            <span className="text-[11px] font-bold text-slate-800">{t(`اليوم: ${todayPoints}`, `Today: ${todayPoints}`)}</span>
          </div>
        </div>

        {/* Main scene */}
        <div className="relative z-10 flex items-end justify-around pb-2 mt-4">

          {/* Campfire */}
          <div className="flex flex-col items-center gap-1">
            <div className={`text-5xl transition-all duration-500 ${fireLit ? 'drop-shadow-[0_0_20px_rgba(255,140,0,1)] animate-pulse' : 'grayscale opacity-40'}`}>
              {fireLit ? '🔥' : '🧊'}
            </div>
            <div className={`text-[9px] font-bold px-2 py-1 rounded-lg text-center max-w-[120px] leading-tight ${fireLit ? 'bg-orange-100 text-orange-700' : 'bg-slate-200 text-slate-600'}`}>
              {fireLit ? t('الشعلة دافئة! الدينو محمي 🔥', 'Warm! Dino is safe 🔥') : t(`اجمع 100 نقطة اليوم لتشعل الشعلة وتحمي الدينو (${todayPoints}/100)`, `Earn 100 pts today to light the fire (${todayPoints}/100)`)}
            </div>
          </div>

          {/* Pet Dino or Egg */}
          <div className="flex flex-col items-center relative">
            {petData.state === 'egg_selection' && (
              <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3].map(num => (
                  <button key={num} onClick={() => selectEgg(num)}
                    className="text-4xl hover:scale-110 active:scale-95 transition-transform drop-shadow-md cursor-pointer animate-pulse"
                    style={{ filter: `hue-rotate(${num * 80}deg)` }}>
                    🥚
                  </button>
                ))}
              </div>
            )}
            
            {petData.state === 'incubating' && (
              <div className="relative mb-2">
                <div className={`text-6xl drop-shadow-xl ${bounceClass} transition-all duration-300`}
                  style={{ filter: `hue-rotate(${(petData.selectedEgg || 1) * 80}deg)${crackFilter ? ` ${crackFilter}` : ''}` }}>
                  {eggEmoji}
                </div>
                {p >= 40 && p < 90 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-2xl opacity-40 font-black text-amber-800" style={{textShadow:'0 0 8px orange'}}>{p >= 70 ? '🐥🐥' : '🐥'}</span>
                  </div>
                )}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-20 text-center">
                  <div className="text-[9px] font-bold text-amber-900 bg-white/60 px-1 rounded-full mb-0.5">{p}/100</div>
                  <div className="h-1.5 w-full bg-white/40 rounded-full overflow-hidden border border-white/60">
                    <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${p}%` }} />
                  </div>
                </div>
              </div>
            )}

            {petData.state === 'hatched' && (
              <>
                {petData.isSick && (
                  <div className="absolute -top-3 -right-3 bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse z-20">
                    {t('مريض!', 'Sick!')}
                  </div>
                )}
                {!petData.isSick && !fireLit && (
                  <div className="absolute -top-3 -left-3 z-20">
                    <Snowflake size={16} className="text-blue-500 animate-pulse" />
                  </div>
                )}
                {!petData.isSick && petData.petHunger < 30 && (
                  <div className="absolute -top-3 -right-3 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse z-20">
                    {t('جائع!', 'Hungry!')}
                  </div>
                )}
                <div
                  className={`text-7xl drop-shadow-2xl cursor-pointer transition-all ${petData.isSick ? 'grayscale opacity-70 animate-pulse' : 'animate-[bounce_3s_ease-in-out_infinite]'}`}
                  style={{ filter: petData.isSick ? undefined : `hue-rotate(${dinoHue})` }}
                  onClick={() => {
                    if (petData.isSick) toast.error(t('الدينو مريض! اشترِ دواء.', 'Dino sick! Buy medicine.'), { icon: '🤒' });
                    else toast(t('الدينو يحبك! 💖', 'Dino loves you! 💖'));
                  }}
                >
                  {petData.isSick ? '🤒' : dinoEmoji}
                </div>
              </>
            )}
          </div>

          {/* Plant patch */}
          <div className="flex flex-col items-center gap-1">
            <div
              className={`text-5xl transition-all duration-500 cursor-pointer ${petData.plantStage === 3 ? 'drop-shadow-[0_0_8px_rgba(0,200,0,0.6)] hover:scale-110' : ''}`}
              onClick={petData.plantStage === 3 ? harvestPlant : undefined}
              title={petData.plantStage === 3 ? (lang === 'ar' ? 'اضغط للحصاد!' : 'Tap to harvest!') : undefined}
            >
              {PLANT_STAGES[petData.plantStage]}
            </div>
            {petData.plantStage === 3 && (
              <div className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full animate-pulse">
                {t('اضغط للحصاد! 🌿', 'Harvest! 🌿')}
              </div>
            )}
            {petData.plantStage === 0 && (
              <div className="text-[9px] text-slate-500 font-medium">{t('تربة', 'Dirt')}</div>
            )}
          </div>
        </div>
      </div>

      {/* ── STORE CARD ── */}
      <div className="rounded-3xl border border-slate-200 bg-white/80 dark:bg-slate-900/80 p-4 space-y-3 shadow-sm">
        <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest text-center">{t('المتجر والإجراءات', 'Store & Actions')}</h4>

        {petData.isSick ? (
          <button onClick={buyMedicine}
            className="w-full flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white rounded-2xl py-3 font-bold text-sm active:scale-95 transition-all shadow-sm">
            💊 {t('علاج الدينو (100 نقطة)', 'Cure Dino (100 pts)')}
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {/* Buy Seed */}
            <button onClick={buySeed}
              className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 text-amber-900 dark:text-amber-100 rounded-xl py-2.5 px-3 transition-colors active:scale-95">
              <div className="flex items-center gap-1.5">
                <Sprout size={14} className="text-amber-600" />
                <span className="text-xs font-bold">{t('شراء بذرة', 'Buy Seed')}</span>
              </div>
              <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5">50<Sparkles size={9}/></span>
            </button>

            {/* Plant Seed */}
            <button onClick={plantSeed} disabled={petData.seedsOwned === 0 || petData.plantStage !== 0}
              className="flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl py-2.5 px-3 disabled:opacity-40 transition-colors active:scale-95">
              <span className="text-xs font-bold">{t(`زرع (${petData.seedsOwned})`, `Plant (${petData.seedsOwned})`)}</span>
            </button>

            {/* Buy Water */}
            <button onClick={buyWater}
              className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 text-blue-900 dark:text-blue-100 rounded-xl py-2.5 px-3 transition-colors active:scale-95">
              <div className="flex items-center gap-1.5">
                <Droplets size={14} className="text-blue-600" />
                <span className="text-xs font-bold">{t('شراء ماء', 'Buy Water')}</span>
              </div>
              <span className="text-[10px] font-bold text-blue-600 flex items-center gap-0.5">20<Sparkles size={9}/></span>
            </button>

            {/* Water Plant */}
            <button onClick={waterPlant}
              disabled={petData.waterOwned === 0 || petData.plantStage === 0 || petData.plantStage >= 3}
              className="flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl py-2.5 px-3 disabled:opacity-40 transition-colors active:scale-95">
              <span className="text-xs font-bold">{t(`سقي (${petData.waterOwned})`, `Water (${petData.waterOwned})`)}</span>
            </button>

            {/* Feed directly */}
            <div className="col-span-2">
              <button onClick={feedDino} disabled={petData.seedsOwned === 0}
                className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl py-2.5 font-bold text-sm disabled:opacity-40 active:scale-95 transition-all shadow-sm">
                <Wheat size={16} />
                {t(`إطعام الدينو ببذرة (${petData.seedsOwned})`, `Feed Dino a Seed (${petData.seedsOwned})`)}
              </button>
            </div>
          </div>
        )}

        {/* Hunger bar */}
        <div className="pt-1">
          <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
            <span className="flex items-center gap-1"><Heart size={10}/>{t('الشبع', 'Fullness')}</span>
            <span>{petData.petHunger}%</span>
          </div>
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${petData.petHunger < 30 ? 'bg-red-500' : petData.isSick ? 'bg-purple-400' : 'bg-emerald-500'}`}
              style={{ width: `${petData.petHunger}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
