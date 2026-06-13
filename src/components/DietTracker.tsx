import { useState, useMemo } from 'react';
import { Plus, X, Flame } from 'lucide-react';
import { toast } from 'sonner';
import { useLang } from '@/contexts/LanguageContext';
import { getUserProfile, type UserProfile } from './OnboardingScreen';
import HealthProfileSetup from './HealthProfileSetup';
import { foodDatabase, type FoodItem } from '@/data/foodDatabase';
import { getLocalDateKey, pruneWeeklyArray, readWeeklyObject } from '@/lib/localStorageLogics';

// 💡 مكون السجل الأسبوعي مدمج هنا داخلياً لإنهاء مشكلة الحروف والمسارات تماماً
const LocalWeeklyLog = ({ logs, title, type }: { logs: any[]; title: string; type: string }) => {
  const last7Days = logs.slice(-7);
  return (
    <div className="border-t border-border/50 pt-4 mt-4">
      <p className="text-xs font-bold text-muted-foreground mb-3 uppercase">{title}</p>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {last7Days.map((log, i) => (
          <div key={i} className="min-w-[60px] glass-card p-2 text-center rounded-lg">
            <p className="text-[10px] text-muted-foreground">{log.date?.slice(5) || ''}</p>
            <p className="text-sm font-bold">
              {type === 'fasting' ? `${log.hours || 0}h` : `${log.totalCalories || 0}c`}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const DIET_KEY = 'app-diet-tracker-v2';
const DIET_POINTS_KEY = 'app-diet-points-today';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface MealEntry {
  name: string;
  serving?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meal: MealType;
}

interface DayDiet {
  date: string;
  entries: MealEntry[];
}

const computeTargets = (p: UserProfile) => {
  const weight = p.weight ?? 60;
  const height = p.height ?? 165;
  const age = p.age ?? 25;
  const gender = p.gender ?? 'female';
  const goal = p.goal ?? 'maintain';
  let bmr = gender === 'male'
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;
  bmr *= 1.4;
  if (goal === 'lose') bmr -= 500;
  if (goal === 'gain') bmr += 400;
  const calories = Math.round(bmr);
  return {
    calories,
    protein: Math.round((calories * 0.30) / 4),
    carbs: Math.round((calories * 0.45) / 4),
    fat: Math.round((calories * 0.25) / 9),
  };
};

const DietTracker = ({ onPoints = () => {} }: { onPoints?: (n: number) => void } = {}) => {
  const { lang } = useLang();
  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const today = getLocalDateKey();
  const POINTS_PER_FOOD = 2;
  const DAILY_LIMIT = 10;

  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const p = getUserProfile();
    if (p && p.gender && p.age && p.height && p.weight && p.goal) return p;
    return null;
  });

  const [dayData, setDayData] = useState<DayDiet>(() => {
    const all = readWeeklyObject<DayDiet>(DIET_KEY);
    return all[today] || { date: today, entries: [] };
  });

  const [addingMeal, setAddingMeal] = useState<MealType | null>(null);
  const [search, setSearch] = useState('');
  const [customName, setCustomName] = useState('');
  const [customCal, setCustomCal] = useState('');
  const [pointsAwarded, setPointsAwarded] = useState<number>(() => {
    try { return parseInt(localStorage.getItem(DIET_POINTS_KEY) || '0', 10); } catch { return 0; }
  });

  if (!profile) {
    return <HealthProfileSetup initialName={getUserProfile()?.name || ''} onComplete={setProfile} />;
  }

  const targets = computeTargets(profile);
  const totals = dayData.entries.reduce(
    (s, e) => ({
      calories: s.calories + e.calories,
      protein: s.protein + (e.protein || 0),
      carbs: s.carbs + (e.carbs || 0),
      fat: s.fat + (e.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const save = (entries: MealEntry[], isNewEntry: boolean = false) => {
    const nd = { date: today, entries };
    setDayData(nd);
    const all = readWeeklyObject<DayDiet>(DIET_KEY);
    all[today] = nd;
    localStorage.setItem(DIET_KEY, JSON.stringify(all));

    try {
      const totalCalories = entries.reduce((s, e) => s + (e.calories || 0), 0);
      const existing = JSON.parse(localStorage.getItem('DietLog') || '[]');
      const weeklyLog = pruneWeeklyArray(Array.isArray(existing) ? existing : [], (item: any) => item?.date).filter(
        (item: any) => item?.date !== today,
      );
      weeklyLog.push({
        date: today,
        meals: entries.map((entry) => ({ name: entry.name, calories: entry.calories, meal: entry.meal })),
        totalCalories,
      });
      localStorage.setItem('DietLog', JSON.stringify(weeklyLog));
    } catch { /* ignore */ }

    if (isNewEntry && pointsAwarded < DAILY_LIMIT) {
      const newPointsAwarded = pointsAwarded + 1;
      setPointsAwarded(newPointsAwarded);
      localStorage.setItem(DIET_POINTS_KEY, String(newPointsAwarded));
      onPoints(POINTS_PER_FOOD);
    }
    try { window.dispatchEvent(new CustomEvent('combo-diet-updated')); } catch {}
    try { window.dispatchEvent(new StorageEvent('storage', { key: DIET_KEY } as any)); } catch {}
  };

  const addFood = (f: FoodItem) => {
    if (!addingMeal) return;
    save([...dayData.entries, {
      name: lang === 'ar' ? f.nameAr : f.nameEn,
      serving: f.serving,
      calories: f.calories, protein: f.protein, carbs: f.carbs, fat: f.fat,
      meal: addingMeal,
    }], true);
  };

  const addCustom = () => {
    if (!addingMeal || !customName || !customCal) return;
    save([...dayData.entries, {
      name: customName, calories: parseInt(customCal) || 0,
      protein: 0, carbs: 0, fat: 0, meal: addingMeal,
    }], true);
    setAddingMeal(null);
    setCustomName(''); setCustomCal('');
  };

  const removeEntry = (idx: number) => save(dayData.entries.filter((_, i) => i !== idx), false);

  const meals: { key: MealType; emoji: string; ar: string; en: string }[] = [
    { key: 'breakfast', emoji: '🌅', ar: 'فطور', en: 'Breakfast' },
    { key: 'lunch', emoji: '☀️', ar: 'غداء', en: 'Lunch' },
    { key: 'dinner', emoji: '🌙', ar: 'عشاء', en: 'Dinner' },
    { key: 'snack', emoji: '🍎', ar: 'وجبة خفيفة', en: 'Snack' },
  ];

  const filteredFoods = foodDatabase.filter(f =>
    (lang === 'ar' ? f.nameAr : f.nameEn).toLowerCase().includes(search.toLowerCase())
  );

  const consumed = totals.calories;
  const remaining = Math.max(0, targets.calories - consumed);
  const pct = Math.min((consumed / targets.calories) * 100, 100);

  const Macro = ({ label, cur, max, color }: { label: string; cur: number; max: number; color: string }) => {
    const p = Math.min((cur / max) * 100, 100);
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium text-foreground">{cur}/{max}g</span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${p}%` }} />
        </div>
      </div>
    );
  };

  return (
    <div className="glass-card rounded-2xl p-5 animate-slide-up space-y-4">
      <div className="flex items-center gap-2">
        <Flame size={18} className="text-orange-500" />
        <h3 className="font-semibold text-foreground">{t('متتبع التغذية', 'Nutrition Tracker')}</h3>
        <button
          onClick={() => { if (confirm(t('إعادة تعيين الملف الصحي؟', 'Reset health profile?'))) setProfile(null); }}
          className="ms-auto text-[10px] text-muted-foreground hover:text-foreground">
          {t('تعديل', 'Edit')}
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
            <circle cx="50" cy="50" r="42" fill="none"
              stroke={pct >= 100 ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
              strokeWidth="8" strokeDasharray={`${pct * 2.64} 264`}
              strokeLinecap="round" className="transition-all duration-700" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-sm font-bold text-foreground">{remaining}</p>
            <p className="text-[9px] text-muted-foreground">{t('متبقي', 'left')}</p>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{t('الهدف', 'Goal')}</span>
            <span className="font-medium text-foreground">{targets.calories} {t('سعرة', 'cal')}</span>
          </div>
          <Macro label={t('بروتين', 'Protein')} cur={totals.protein} max={targets.protein} color="bg-rose-400" />
          <Macro label={t('كربوهيدرات', 'Carbs')} cur={totals.carbs} max={targets.carbs} color="bg-amber-400" />
          <Macro label={t('دهون', 'Fat')} cur={totals.fat} max={targets.fat} color="bg-sky-400" />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {meals.map(m => {
          const mealCals = dayData.entries.filter(e => e.meal === m.key).reduce((s, e) => s + e.calories, 0);
          return (
            <button key={m.key} onClick={() => setAddingMeal(m.key)}
              className="flex flex-col items-center gap-1 p-2 rounded-xl bg-secondary/50 hover:bg-secondary transition-all active:scale-95">
              <span className="text-lg">{m.emoji}</span>
              <span className="text-[10px] font-medium text-foreground">{lang === 'ar' ? m.ar : m.en}</span>
              {mealCals > 0 && <span className="text-[9px] text-primary font-bold">{mealCals}</span>}
            </button>
          );
        })}
      </div>

      {dayData.entries.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {meals.map(m => {
            const items = dayData.entries.map((e, i) => ({ ...e, _i: i })).filter(e => e.meal === m.key);
            if (!items.length) return null;
            return (
              <div key={m.key} className="space-y-1">
                <p className="text-[10px] font-semibold text-muted-foreground">{m.emoji} {lang === 'ar' ? m.ar : m.en}</p>
                {items.map(e => (
                  <div key={e._i} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-secondary/30 text-xs">
                    <div className="flex-1 min-w-0 me-2">
                      <span className="text-foreground truncate block">{e.name}</span>
                      {e.serving && <span className="text-[9px] text-muted-foreground">{e.serving}</span>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-muted-foreground">{e.calories}c</span>
                      <button onClick={() => removeEntry(e._i)} className="text-destructive/60 hover:text-destructive"><X size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* استدعاء السجل المدمج محلياً لإنهاء الخطأ */}
      {(() => {
        try {
          const raw = localStorage.getItem('DietLog');
          const logs = raw ? JSON.parse(raw) : [];
          return (
            <div className="mt-4 border-t border-border/50 pt-4">
              <LocalWeeklyLog 
                logs={logs} 
                title={lang === 'ar' ? 'سجل التغذية الأسبوعي' : 'Weekly Diet Log'} 
                type="diettracker" 
              />
            </div>
          );
        } catch { return null; }
      })()}

      {addingMeal && (
        <div className="glass-card rounded-xl p-4 space-y-3 animate-slide-up border border-primary/20">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">
              {t('إضافة طعام', 'Add Food')} — {meals.find(m => m.key === addingMeal)?.[lang === 'ar' ? 'ar' : 'en']}
            </h4>
            <button onClick={() => setAddingMeal(null)}><X size={16} className="text-muted-foreground" /></button>
          </div>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('ابحثي عن طعام...', 'Search food...')}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <div className="max-h-60 overflow-y-auto space-y-1">
            {filteredFoods.map((f, i) => {
              const name = lang === 'ar' ? f.nameAr : f.nameEn;
              const count = dayData.entries.filter(e => e.meal === addingMeal && e.name === name).length;
              const removeOne = () => {
                const entries = dayData.entries.slice();
                for (let j = entries.length - 1; j >= 0; j--) {
                  if (entries[j].meal === addingMeal && entries[j].name === name) { entries.splice(j, 1); break; }
                }
                save(entries);
              };
              return (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/40 text-xs">
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground truncate">{name}</p>
                    <p className="text-[9px] text-muted-foreground">
                      <span className="font-semibold text-primary">{f.serving}</span> · {f.calories} cal · P {f.protein} · C {f.carbs} · F {f.fat}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={removeOne} disabled={count === 0}
                      className="w-7 h-7 rounded-full bg-background border border-border text-foreground font-bold disabled:opacity-30 active:scale-90 transition">−</button>
                    <span className="w-6 text-center font-bold text-foreground tabular-nums">{count}</span>
                    <button onClick={() => addFood(f)}
                      className="w-7 h-7 rounded-full gradient-primary text-primary-foreground font-bold active:scale-90 transition">+</button>
                  </div>
                </div>
              );
            })}
            {!filteredFoods.length && <p className="text-center text-xs text-muted-foreground py-3">{t('لا نتائج', 'No results')}</p>}
          </div>
          <div className="border-t border-border pt-2">
            <p className="text-[10px] text-muted-foreground mb-1">{t('أو أضيفي يدوياً', 'Or add manually')}</p>
            <div className="flex gap-2">
              <input value={customName} onChange={e => setCustomName(e.target.value)}
                placeholder={t('اسم الطعام', 'Food name')}
                className="flex-1 px-2 py-1.5 rounded-lg bg-background border border-border text-xs focus:outline-none" />
              <input type="number" value={customCal} onChange={e => setCustomCal(e.target.value)}
                placeholder="cal" className="w-16 px-2 py-1.5 rounded-lg bg-background border border-border text-xs focus:outline-none" />
              <button onClick={addCustom} className="px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground text-xs">
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DietTracker;