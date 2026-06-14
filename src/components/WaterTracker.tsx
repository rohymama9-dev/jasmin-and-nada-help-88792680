import { useState } from 'react';
import { Plus, RotateCcw, Droplets, GlassWater, Target } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { getLocalDateKey, readWeeklyArray, pruneWeeklyArray } from '@/lib/localStorageLogics';

const WATER_KEY = 'app-water-cups';
const WATER_GOAL_KEY = 'app-water-goal';

interface WaterTrackerProps {
  onDrink: () => void;
}

const WaterTracker = ({ onDrink }: WaterTrackerProps) => {
  const { lang } = useLang();
  const today = getLocalDateKey();

  // مصفوفة سجل الماء كـ State لضمان رصد التحديثات فوراً
  const [waterLog, setWaterLog] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('waterLog');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  
  const [cups, setCups] = useState<number>(() => {
    const entries = readWeeklyArray<any>('waterLog', (item) => item?.time || item?.date);
    const todaysEntries = entries.filter((item) => getLocalDateKey(item.time || item.date) === today);
    if (entries.length > 0) return todaysEntries.length;
    return parseInt(localStorage.getItem(WATER_KEY) || '0', 10) || 0;
  });

  const [unit, setUnit] = useState<'cups' | 'liters'>('cups');
  const [customAmount, setCustomAmount] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [goalSet, setGoalSet] = useState<boolean>(() => !!localStorage.getItem(WATER_GOAL_KEY));
  const [goal, setGoal] = useState<number>(() => parseInt(localStorage.getItem(WATER_GOAL_KEY) || '0', 10));
  const [goalInput, setGoalInput] = useState('8');
  const [goalUnit, setGoalUnit] = useState<'cups' | 'liters'>('cups');

  const setDailyGoal = () => {
    const val = parseFloat(goalInput);
    if (!val || val <= 0) return;
    const goalCups = goalUnit === 'liters' ? Math.round(val * 4) : Math.round(val);
    setGoal(goalCups);
    localStorage.setItem(WATER_GOAL_KEY, String(goalCups));
    setGoalSet(true);
  };

  const addCups = (n: number) => {
    const next = cups + n;
    setCups(next);
    localStorage.setItem(WATER_KEY, String(next));
    
    try {
      const todayDateStr = new Date().toDateString();
      const arr = pruneWeeklyArray([...waterLog], (item: any) => item?.time || item?.date);
      
      for (let i = 0; i < n; i++) {
        arr.push({ date: todayDateStr, time: new Date().toISOString(), amount: 250 });
      }
      
      localStorage.setItem('waterLog', JSON.stringify(arr));
      setWaterLog(arr); // تحديث الـ State ليظهر في السجل السفلي فوراً

      window.dispatchEvent(new CustomEvent('combo-water-logged'));
      try { window.dispatchEvent(new StorageEvent('storage', { key: 'waterLog' } as any)); } catch {}
    } catch {}
    
    for (let i = 0; i < n; i++) onDrink();
  };

  const addCustom = () => {
    const val = parseFloat(customAmount);
    if (!val || val <= 0) return;
    const cupsToAdd = unit === 'liters' ? Math.round(val * 4) : Math.round(val);
    if (cupsToAdd > 0 && cupsToAdd <= 20) {
      addCups(cupsToAdd);
      setCustomAmount('');
      setShowCustom(false);
    }
  };

  const reset = () => {
    setCups(0);
    localStorage.setItem(WATER_KEY, '0');
    try {
      const arr = pruneWeeklyArray([...waterLog], (item: any) => item?.time || item?.date).filter(
        (item: any) => getLocalDateKey(item.time || item.date) !== today,
      );
      localStorage.setItem('waterLog', JSON.stringify(arr));
      setWaterLog(arr); // تحديث الـ State فوراً ليختفي كوب اليوم من السجل
    } catch {
      /* ignore */
    }
  };

  if (!goalSet) {
    return (
      <div className="glass-card rounded-2xl p-5 animate-slide-up space-y-4">
        <div className="flex items-center gap-2">
          <Droplets size={18} className="text-accent" />
          <h3 className="font-semibold text-foreground">{lang === 'ar' ? 'متتبع الماء' : 'Water Tracker'}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{lang === 'ar' ? 'حددي هدفك اليومي أولاً' : 'Set your daily goal first'}</p>
        
        <div className="flex gap-2 mb-2">
          <button onClick={() => setGoalUnit('cups')}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${goalUnit === 'cups' ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
            ☕ {lang === 'ar' ? 'أكواب' : 'Cups'}
          </button>
          <button onClick={() => setGoalUnit('liters')}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${goalUnit === 'liters' ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
            💧 {lang === 'ar' ? 'لترات' : 'Liters'}
          </button>
        </div>

        <div className="flex gap-2">
          <input type="number" value={goalInput} onChange={e => setGoalInput(e.target.value)}
            placeholder={goalUnit === 'cups' ? '8' : '2'}
            className="flex-1 px-3 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            min="1" max={goalUnit === 'cups' ? '20' : '5'} />
          <button onClick={setDailyGoal} className="px-6 py-3 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold">
            <Target size={16} className="inline mr-1" /> {lang === 'ar' ? 'تعيين' : 'Set'}
          </button>
        </div>
      </div>
    );
  }

  const fillPercent = Math.min((cups / goal) * 100, 100);
  const liters = (cups * 0.25).toFixed(1);

  const presets = [
    { labelAr: 'كوب صغير', labelEn: 'Small Cup', cups: 1, icon: '☕' },
    { labelAr: 'كوب كبير', labelEn: 'Large Cup', cups: 2, icon: '🥤' },
    { labelAr: 'زجاجة صغيرة', labelEn: 'Small Bottle', cups: 2, icon: '💧' },
    { labelAr: 'زجاجة كبيرة', labelEn: 'Large Bottle', cups: 3, icon: '🍶' },
  ];

  const groupedLog = waterLog.reduce((acc: any, item: any) => {
    const d = new Date(item.time || item.date);
    const dateStr = d.toLocaleDateString();
    if (!acc[dateStr]) {
      acc[dateStr] = { cups: 0, ml: 0, lastTime: '—' };
    }
    acc[dateStr].cups += 1;
    acc[dateStr].ml += (item.amount || 250);
    if (item.time) {
      acc[dateStr].lastTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return acc;
  }, {});

  const groupedEntries = Object.entries(groupedLog).reverse();

  return (
    <div className="glass-card rounded-2xl p-5 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Droplets size={18} className="text-accent" />
          {lang === 'ar' ? 'متتبع الماء' : 'Water Tracker'}
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={() => { setGoalSet(false); localStorage.removeItem(WATER_GOAL_KEY); }}
            className="text-muted-foreground hover:text-primary transition-colors p-1">
            <Target size={14} />
          </button>
          <button onClick={reset} className="text-muted-foreground hover:text-primary transition-colors p-1">
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setUnit('cups')}
          className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${unit === 'cups' ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
          ☕ {lang === 'ar' ? 'أكواب' : 'Cups'}
        </button>
        <button onClick={() => setUnit('liters')}
          className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${unit === 'liters' ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
          💧 {lang === 'ar' ? 'لترات' : 'Liters'}
        </button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-16 h-32 shrink-0">
          <div className="absolute inset-0 rounded-b-2xl rounded-t-lg border-2 border-accent/40 overflow-hidden">
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-accent/60 to-accent/30 transition-all duration-700 ease-out rounded-b-xl"
              style={{ height: `${fillPercent}%` }}>
              {fillPercent > 0 && <div className="absolute top-0 left-0 right-0 h-2 bg-accent/20 animate-pulse-soft rounded-full" />}
            </div>
          </div>
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-3 rounded-t-md border-2 border-accent/40 border-b-0 bg-secondary" />
        </div>

        <div className="flex-1">
          <p className="text-2xl font-bold text-foreground">{cups} <span className="text-sm font-normal text-muted-foreground">{lang === 'ar' ? 'كوب' : 'cups'}</span></p>
          <p className="text-xs text-muted-foreground">{liters} {lang === 'ar' ? 'لتر' : 'L'} — +1⭐ {lang === 'ar' ? 'لكل كوب' : 'per cup'}</p>
          <div className="w-full h-2 rounded-full bg-secondary mt-2">
            <div className="h-full rounded-full gradient-primary transition-all duration-700" style={{ width: `${fillPercent}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{Math.round(fillPercent)}% {lang === 'ar' ? 'من الهدف' : 'of goal'} ({goal} {lang === 'ar' ? 'أكواب' : 'cups'})</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        {presets.map((p, i) => (
          <button key={i} onClick={() => addCups(p.cups)}
            className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/50 hover:bg-secondary transition-all active:scale-95 text-start">
            <span className="text-lg">{p.icon}</span>
            <div>
              <p className="text-xs font-medium text-foreground">{lang === 'ar' ? p.labelAr : p.labelEn}</p>
              <p className="text-[10px] text-muted-foreground">{p.cups} {lang === 'ar' ? 'كوب' : 'cup(s)'} = +{p.cups}⭐</p>
            </div>
          </button>
        ))}
      </div>

      {showCustom ? (
        <div className="flex gap-2 animate-slide-up">
          <input type="number" value={customAmount} onChange={e => setCustomAmount(e.target.value)}
            placeholder={unit === 'cups' ? (lang === 'ar' ? 'عدد الأكواب' : 'Cups...') : (lang === 'ar' ? 'لترات' : 'Liters...')}
            className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            min="0.1" max="20" step={unit === 'liters' ? '0.25' : '1'} />
          <button onClick={addCustom} className="px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-medium">
            <Plus size={16} />
          </button>
          <button onClick={() => setShowCustom(false)} className="px-3 py-2 rounded-xl bg-muted text-muted-foreground text-sm">✕</button>
        </div>
      ) : (
        <button onClick={() => setShowCustom(true)}
          className="w-full py-2 rounded-xl border border-dashed border-primary/30 text-primary text-sm font-medium hover:bg-primary/5 transition-colors flex items-center justify-center gap-1">
          <GlassWater size={14} /> {lang === 'ar' ? 'كمية مخصصة' : 'Custom Amount'}
        </button>
      )}

      {groupedEntries.length > 0 && (
        <div className="border-t border-border/50 pt-3 mt-4 space-y-2 animate-slide-up">
          <p className="text-xs font-medium text-muted-foreground uppercase">{lang === 'ar' ? 'سجل الأسبوع' : 'Weekly Record'}</p>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {groupedEntries.map(([date, data]: [string, any]) => (
              <div key={date} className="glass-card rounded-lg p-3 text-sm flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="font-bold text-foreground">{date}</span>
                  <span className="text-[10px] text-muted-foreground">{data.cups} {lang === 'ar' ? 'أكواب' : 'cups'} — {data.ml >= 1000 ? (data.ml / 1000).toFixed(1) + ' L' : data.ml + ' ml'}</span>
                </div>
                <div className="text-right flex flex-col">
                  <span className="text-xs text-muted-foreground">{lang === 'ar' ? 'آخر شربة' : 'Last Drink'}</span>
                  <span className="font-bold text-foreground text-accent">{data.lastTime}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WaterTracker;