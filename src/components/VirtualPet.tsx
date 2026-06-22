import { useState, useEffect, useCallback, useRef } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { usePoints } from '@/hooks/usePoints';
import { Sparkles, Heart, Droplets, Sprout, Award, Wheat, Snowflake } from 'lucide-react';
import { toast } from 'sonner';
import { addDinoXP, getDinoXP } from '@/lib/appStore';

type PetState = 'egg_selection' | 'incubating' | 'hatched';

interface PetData {
  state: PetState;
  selectedEgg: number | null;
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

  const [todayPoints, setTodayPoints] = useState<number>(() => {
    try {
      const today = new Date().toDateString();
      const saved = JSON.parse(localStorage.getItem('daily_earned_points') || '{"date":"","amount":0}');
      return saved.date === today ? saved.amount : 0;
    } catch { return 0; }
  });
  const prevPointsRef = useRef(points);

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

  // Derived progress (0 to 500)
  const derived = Math.min(500, points);

  // Floating emojis state
  interface FloatingEmoji {
    id: number;
    emoji: string;
    x: number;
    y: number;
  }
  const [emojis, setEmojis] = useState<FloatingEmoji[]>([]);
  const addEmoji = useCallback((emoji: string, x: number, y: number) => {
    const id = Date.now() + Math.random();
    setEmojis(prev => [...prev, { id, emoji, x, y }]);
    setTimeout(() => {
      setEmojis(prev => prev.filter(e => e.id !== id));
    }, 1500);
  }, []);

  // Dino movement state
  const [dinoPos, setDinoPos] = useState({ left: 50, bottom: 30 });
  const [dinoAction, setDinoAction] = useState<'idle'|'eating'|'warming'|'walking'>('idle');
  const dinoActionRef = useRef(dinoAction);
  useEffect(() => { dinoActionRef.current = dinoAction; }, [dinoAction]);

  const fireLit = todayPoints >= 100;

  // Hatching logic
  useEffect(() => {
    if (petData.state === 'incubating' && derived >= 500) {
      const newDinoType = Math.floor(Math.random() * DINO_EMOJIS.length);
      setPetData(prev => ({ ...prev, state: 'hatched', dinoType: newDinoType }));
      toast.success(t('🎉 فقست البيضة! ديناصورك وُلد!', '🎉 Egg hatched! Your dino is born!'));
      
      // Confetti Explosion
      for (let i = 0; i < 30; i++) {
        setTimeout(() => {
          addEmoji(['🎉','✨','💥','💖'][Math.floor(Math.random()*4)], 30 + Math.random()*40, 20 + Math.random()*40);
        }, i * 50);
      }
    }
  }, [derived, petData.state, t, addEmoji]);

  // Dino random movement
  useEffect(() => {
    if (petData.state !== 'hatched') {
       setDinoPos({ left: 50, bottom: 25 });
       return;
    }
    
    const moveDino = () => {
      if (dinoActionRef.current === 'eating') return;
      
      const actions = ['idle', 'idle', 'walking'];
      if (fireLit) actions.push('warming', 'warming');
      const next = actions[Math.floor(Math.random() * actions.length)] as any;
      
      setDinoAction(next);
      
      if (next === 'warming') {
         setDinoPos({ left: 75, bottom: 25 });
         setTimeout(() => addEmoji('❤️', 75, 35), 1000);
      } else if (next === 'walking') {
         setDinoPos({ left: 25 + Math.random() * 50, bottom: 15 + Math.random() * 15 });
         setTimeout(() => {
           if (dinoActionRef.current === 'walking') setDinoAction('idle');
         }, 2000);
      } else {
         setDinoPos(prev => ({
           left: Math.max(20, Math.min(80, prev.left + (Math.random() * 10 - 5))),
           bottom: Math.max(15, Math.min(40, prev.bottom + (Math.random() * 6 - 3)))
         }));
      }
    };

    const interval = setInterval(moveDino, 4000);
    return () => clearInterval(interval);
  }, [petData.state, fireLit, addEmoji]);

  // Sickness check
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

  // Save state
  useEffect(() => {
    try {
      localStorage.setItem('dino_pet_state', JSON.stringify(petData));
    } catch {}
  }, [petData]);

  const selectEgg = (num: number) => {
    setPetData(prev => ({ ...prev, state: 'incubating', selectedEgg: num }));
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

  const moveDinoToPlant = useCallback((emoji: string) => {
    setDinoAction('eating');
    setDinoPos({ left: 25, bottom: 25 });
    setTimeout(() => {
      addEmoji(emoji, 25, 35);
    }, 1000);
    setTimeout(() => {
      if (dinoActionRef.current === 'eating') {
         setDinoAction('idle');
         setDinoPos({ left: 40, bottom: 25 });
      }
    }, 3000);
  }, [addEmoji]);

  const harvestPlant = () => {
    if (petData.plantStage < 3) { toast(t('النبتة لم تنضج بعد', 'Plant not ready yet')); return; }
    if (petData.isSick) { toast.error(t('الدينو مريض، اعلجه أولاً', 'Dino sick, cure first')); return; }
    setPetData(prev => ({ ...prev, plantStage: 0, petHunger: Math.min(100, prev.petHunger + 50) }));
    addDinoXP(5);
    toast.success(t('يم يم! الدينو يأكل النبتة الطازجة 🌿', 'Yum! Dino ate fresh plant 🌿'));
    moveDinoToPlant('🌿');
  };

  const feedDino = () => {
    if (petData.isSick) { toast.error(t('الدينو مريض!', 'Dino sick!')); return; }
    if (petData.seedsOwned <= 0) { toast.error(t('لا توجد بذور', 'No seeds')); return; }
    if (petData.petHunger >= 100) { toast(t('الدينو شبعان!', 'Dino is full!')); return; }
    setPetData(prev => ({ ...prev, seedsOwned: prev.seedsOwned - 1, petHunger: Math.min(100, prev.petHunger + 25) }));
    addDinoXP(5);
    toast.success(t('يم يم! 🌱', 'Yum yum! 🌱'));
    moveDinoToPlant('🌱');
  };

  const buyMedicine = () => {
    if (points < 100) { toast.error(t('تحتاج 100 نقطة للدواء', 'Need 100 pts for medicine')); return; }
    addPoints(-100);
    setPetData(prev => ({ ...prev, isSick: false }));
    localStorage.setItem('combo-habit-today', new Date().toDateString());
    toast.success(t('تم علاج الدينو! 💊', 'Dino cured! 💊'));
  };

  // Rapid Click Secret
  const clickCountRef = useRef(0);
  const lastClickTimeRef = useRef(0);

  const playPopSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch(e) {}
  };

  const handleDinoClick = () => {
    if (petData.isSick) {
       toast.error(t('الدينو مريض! اشترِ دواء.', 'Dino sick! Buy medicine.'), { icon: '🤒' });
       return;
    }
    
    const now = Date.now();
    if (now - lastClickTimeRef.current > 1000) {
      clickCountRef.current = 0;
    }
    clickCountRef.current += 1;
    lastClickTimeRef.current = now;
    
    if (clickCountRef.current === 5) {
       clickCountRef.current = 0;
       const lastCooldown = localStorage.getItem('dino_secret_cooldown');
       if (!lastCooldown || now - parseInt(lastCooldown) > 3600000) {
          addPoints(2);
          toast.success("الدينو سعيد بوجودك! ✨");
          localStorage.setItem('dino_secret_cooldown', now.toString());
          playPopSound();
          addEmoji('✨', dinoPos.left, dinoPos.bottom + 10);
       } else {
          toast(t('الدينو يحبك! 💖', 'Dino loves you! 💖'));
       }
    } else if (clickCountRef.current < 5) {
        addEmoji('💖', dinoPos.left, dinoPos.bottom + 10);
    }
  };

  const dinoEmoji = DINO_EMOJIS[(petData.dinoType || 0) % DINO_EMOJIS.length];
  const dinoHue = HUE_ROTATES[(petData.dinoType || 0) % HUE_ROTATES.length];
  // Evolution stages by Dino XP: 0-Baby, 20-Teen, 60-Adult, 150-Mythic
  const dinoXp = getDinoXP();
  const evoStage = dinoXp >= 150 ? 4 : dinoXp >= 60 ? 3 : dinoXp >= 20 ? 2 : 1;
  const evoScale = [1, 1, 1.15, 1.3, 1.5][evoStage] || 1;
  const evoLabel = ['', 'Baby', 'Teen', 'Adult', 'Mythic'][evoStage];
  const evoAura = evoStage >= 4 ? 'drop-shadow-[0_0_18px_rgba(255,215,0,0.85)]'
                : evoStage >= 3 ? 'drop-shadow-[0_0_10px_rgba(168,85,247,0.7)]'
                : evoStage >= 2 ? 'drop-shadow-[0_0_6px_rgba(56,189,248,0.6)]' : '';

  return (
    <div className="mx-1 space-y-3">
      <style>{`
        @keyframes floatUp {
          0% { transform: translate(-50%, 50%) scale(0.5); opacity: 1; }
          100% { transform: translate(-50%, -100%) scale(1.5); opacity: 0; }
        }
        .emoji-float {
          animation: floatUp 1.5s ease-out forwards;
        }
      `}</style>
      
      {/* Stats top row */}
      <div className="flex justify-between items-center bg-white/50 dark:bg-slate-900/50 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2 py-1 rounded-full shadow-sm">
          <Award size={12} className="text-blue-700 dark:text-blue-400" />
          <span className="text-[11px] font-bold text-blue-900 dark:text-blue-300">{t('المستوى 1', 'Lv.1')}</span>
        </div>
        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-1 rounded-full shadow-sm">
          <Heart size={12} className={petData.petHunger < 30 ? 'text-red-500 animate-pulse' : 'text-emerald-600'} />
          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{petData.petHunger}%</span>
        </div>
        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-1 rounded-full shadow-sm">
          <Sparkles size={12} className="text-amber-500" />
          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{t(`اليوم: ${todayPoints}`, `Today: ${todayPoints}`)}</span>
        </div>
      </div>

      {/* Landscape Container */}
      <div className="relative w-full aspect-[2/1] rounded-[50%] bg-gradient-to-br from-green-100 to-emerald-100 border-4 border-emerald-300 shadow-inner overflow-hidden flex-shrink-0">
         {/* Static background features */}
         <div className="absolute top-[15%] left-[60%] w-[30%] h-[25%] bg-blue-300/60 rounded-[50%] border-2 border-blue-400/40 shadow-inner"></div>
         <div className="absolute top-[10%] left-[25%] text-2xl opacity-80">🌲</div>
         <div className="absolute top-[20%] left-[15%] text-3xl opacity-90">🌳</div>
         <div className="absolute top-[25%] left-[45%] text-xl opacity-70">🌲</div>

         {/* Plant Area (Left side) */}
         <div className="absolute left-[20%] bottom-[20%] flex flex-col items-center justify-end -translate-x-1/2 translate-y-1/2 z-10 w-16 h-16">
            <div
              className={`text-4xl transition-all duration-500 z-10 ${petData.plantStage === 3 ? 'drop-shadow-[0_0_8px_rgba(0,200,0,0.6)] cursor-pointer hover:scale-110 animate-pulse' : ''}`}
              onClick={petData.plantStage === 3 ? harvestPlant : undefined}
            >
              {PLANT_STAGES[petData.plantStage]}
            </div>
            {petData.plantStage === 0 && <div className="absolute -bottom-4 text-[9px] text-emerald-800/60 font-bold">{t('تربة', 'Dirt')}</div>}
         </div>

         {/* Campfire Area (Right side) */}
         <div className="absolute left-[80%] bottom-[20%] flex flex-col items-center justify-end -translate-x-1/2 translate-y-1/2 z-10 w-16 h-16">
            <div className={`text-4xl transition-all duration-500 z-10 ${fireLit ? 'drop-shadow-[0_0_20px_rgba(255,140,0,1)] animate-pulse' : 'grayscale opacity-40'}`}>
              {fireLit ? '🔥' : '🧊'}
            </div>
         </div>

         {/* Pet Entity */}
         <div 
           className="absolute flex flex-col items-center justify-end z-20"
           style={{ 
             left: `${dinoPos.left}%`, 
             bottom: `${dinoPos.bottom}%`, 
             transform: 'translate(-50%, 50%)',
             transition: 'all 1s ease-in-out' 
           }}
         >
            {petData.state === 'egg_selection' && (
               <div className="flex gap-2 -mt-4">
                 {[1,2,3].map(num => (
                    <button key={num} onClick={() => selectEgg(num)} 
                      className="w-10 h-14 rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%] bg-gradient-to-br from-pink-300 via-purple-300 to-indigo-400 shadow-md cursor-pointer hover:scale-110 active:scale-95 transition-transform drop-shadow-lg" 
                      style={{ filter: `hue-rotate(${num * 80}deg)` }} />
                 ))}
               </div>
            )}
            
            {petData.state === 'incubating' && (
               <div className="relative flex flex-col items-center gap-1">
                 <div className="relative w-16 h-20 rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%] bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-500 shadow-[inset_-4px_-4px_10px_rgba(0,0,0,0.2),_0_5px_10px_rgba(0,0,0,0.3)] flex items-center justify-center overflow-hidden transition-all duration-300 animate-[pulse_2s_ease-in-out_infinite]">
                    <div className="absolute top-2 left-2 w-4 h-4 bg-white/20 rounded-full"></div>
                    <div className="absolute top-8 right-2 w-5 h-5 bg-white/20 rotate-45 rounded-sm"></div>
                    <div className="absolute bottom-3 left-6 w-3 h-3 bg-white/20 rounded-sm rotate-12"></div>
                    
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                      {derived >= 100 && <path d="M 40 100 L 50 80" stroke="rgba(0,0,0,0.5)" strokeWidth="1.5" fill="none" />}
                      {derived >= 200 && <path d="M 50 80 L 30 60 L 60 40" stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" fill="none" />}
                      {derived >= 300 && (
                         <>
                           <path d="M 60 40 L 40 20 L 70 10" stroke="rgba(0,0,0,0.7)" strokeWidth="2" fill="none" />
                           <path d="M 30 60 L 10 50" stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" fill="none" />
                           <path d="M 60 40 L 90 45" stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" fill="none" />
                         </>
                      )}
                      {derived >= 400 && (
                         <>
                           <path d="M 0 30 L 20 40 L 40 25 L 60 35 L 80 20 L 100 30" stroke="#222" strokeWidth="3" fill="none" />
                           <path d="M 0 28 L 20 38 L 40 23 L 60 33 L 80 18 L 100 28" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" fill="none" />
                         </>
                      )}
                    </svg>
                 </div>
                 <div className="absolute -bottom-5 w-20 flex flex-col items-center">
                   <div className="text-[9px] font-bold text-amber-900 bg-white/80 px-1.5 rounded-full mb-0.5 shadow-sm">{derived}/500</div>
                   <div className="h-1.5 w-full bg-white/60 rounded-full overflow-hidden border border-white/80 shadow-sm">
                     <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${(derived/500)*100}%` }} />
                   </div>
                 </div>
               </div>
            )}

            {petData.state === 'hatched' && (
               <div 
                 className={`relative text-6xl cursor-pointer drop-shadow-xl transition-transform ${evoAura} ${petData.isSick ? 'grayscale opacity-70' : ''} ${dinoAction === 'walking' || dinoAction === 'warming' ? 'animate-[bounce_1s_infinite]' : 'hover:scale-110 active:scale-95'}`} 
                 onClick={handleDinoClick}
                 style={{ filter: petData.isSick ? undefined : `hue-rotate(${dinoHue})`, transform: `scale(${evoScale})`, transformOrigin: 'bottom center' }}
                 title={evoLabel ? `${evoLabel} (Dino XP ${dinoXp})` : undefined}
               >
                 {petData.isSick && <div className="absolute -top-2 -right-2 bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full z-30 shadow-md animate-pulse">{t('مريض!', 'Sick!')}</div>}
                 {(!petData.isSick && !fireLit) && <Snowflake size={16} className="absolute -top-2 -left-2 text-blue-500 animate-pulse z-30 drop-shadow-sm" />}
                 {(!petData.isSick && petData.petHunger < 30) && <div className="absolute -top-2 right-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full z-30 shadow-md animate-pulse">{t('جائع!', 'Hungry!')}</div>}
                 {evoStage >= 2 && (
                   <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-slate-900/90 text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-white/60 shadow z-30">
                     {evoLabel}
                   </div>
                 )}
                 {petData.isSick ? '🤒' : dinoEmoji}
               </div>
            )}
         </div>

         {/* Floating Emojis */}
         {emojis.map(e => (
           <div 
             key={e.id} 
             className="absolute text-2xl z-30 pointer-events-none emoji-float drop-shadow-md"
             style={{ left: `${e.x}%`, bottom: `${e.y}%` }}
           >
             {e.emoji}
           </div>
         ))}
      </div>

      {/* Campfire Message Overlay (if not lit) */}
      {petData.state === 'hatched' && !fireLit && (
        <div className="text-[10px] font-bold px-3 py-1.5 rounded-xl text-center bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 animate-pulse">
          {t(`اجمع 100 نقطة اليوم لتشعل الشعلة وتحمي الدينو من البرد! (${todayPoints}/100)`, `Earn 100 pts today to light the fire! (${todayPoints}/100)`)}
        </div>
      )}

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
          <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
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

