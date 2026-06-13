import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, Trophy, Footprints } from 'lucide-react';
import { toast } from 'sonner';
import { useLang } from '@/contexts/LanguageContext';
import { getLocalDateKey, readWeeklyObject } from '@/lib/localStorageLogics';

const WALKING_KEY = 'app-walking-timer';
const WALKING_POINTS_KEY = 'app-walking-points-today';

interface WalkingSession {
  date: string;
  duration: number; // in seconds
  calories: number;
  pointsAwarded: number;
}

interface WalkingTimerProps {
  onPoints?: (n: number) => void;
}

const WalkingTimer = ({ onPoints = () => {} }: WalkingTimerProps) => {
  const { lang, t } = useLang();
  const today = getLocalDateKey();
  const CALORIES_PER_MINUTE = 4.5; // kcal for moderate walking (70kg person)
  const POINTS_PER_SESSION = 3;
  const DAILY_LIMIT = 1; // Only award points once per day

  const [data, setData] = useState<WalkingSession>(() => {
    try {
      const all = readWeeklyObject<WalkingSession>(WALKING_KEY);
      return all[today] || { date: today, duration: 0, calories: 0, pointsAwarded: 0 };
    } catch {
      return { date: today, duration: 0, calories: 0, pointsAwarded: 0 };
    }
  });

  const [isRunning, setIsRunning] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds
  const [showMilestone, setShowMilestone] = useState(false);
  const ivRef = useRef<number | null>(null);
  const STORAGE_KEY = 'walkingStartTime';

  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const start = Number(stored);
      if (!isNaN(start) && start > 0) {
        const nowElapsed = Math.floor((Date.now() - start) / 1000);
        setElapsed(nowElapsed);
        setIsRunning(true);
      }
    }
    return () => { if (ivRef.current) clearInterval(ivRef.current); };
  }, []);

  useEffect(() => {
    if (!isRunning) {
      if (ivRef.current) { clearInterval(ivRef.current); ivRef.current = null; }
      return;
    }
    const startStored = Number(localStorage.getItem(STORAGE_KEY) || '0');
    if (!startStored || isNaN(startStored)) {
      const start = Date.now() - elapsed * 1000;
      localStorage.setItem(STORAGE_KEY, String(start));
    }
    ivRef.current = window.setInterval(() => {
      const s = Number(localStorage.getItem(STORAGE_KEY) || '0');
      if (s && !isNaN(s)) {
        setElapsed(Math.floor((Date.now() - s) / 1000));
      } else {
        setElapsed(prev => prev + 1);
      }
    }, 1000) as unknown as number;
    return () => { if (ivRef.current) clearInterval(ivRef.current); };
  }, [isRunning, elapsed]);

  const saveData = useCallback((session: WalkingSession) => {
    setData(session);
    try {
      const all = readWeeklyObject<WalkingSession>(WALKING_KEY);
      all[today] = session;
      localStorage.setItem(WALKING_KEY, JSON.stringify(all));
      try { window.dispatchEvent(new CustomEvent('combo-walking-updated')); } catch {}
      try { window.dispatchEvent(new StorageEvent('storage', { key: WALKING_KEY } as any)); } catch {}
    } catch {
      /* ignore */
    }
  }, [today]);

  const startWalking = () => {
    const start = Date.now();
    localStorage.setItem(STORAGE_KEY, String(start));
    setElapsed(0);
    setIsRunning(true);
    toast.success(lang === 'ar' ? 'بدأت المسيرة! 🚶' : 'Walking started! 🚶');
  };

  const finishWalking = () => {
    const storedStart = Number(localStorage.getItem(STORAGE_KEY) || '0');
    const actualElapsed = storedStart && !isNaN(storedStart) ? Math.floor((Date.now() - storedStart) / 1000) : elapsed;
    if (actualElapsed < 60) {
      toast.error(lang === 'ar' ? 'اقضِ دقيقة واحدة على الأقل' : 'Walk at least 1 minute');
      return;
    }
    setIsRunning(false);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    const minutes = actualElapsed / 60;
    const calories = Number((minutes * CALORIES_PER_MINUTE).toFixed(2));
    const newDuration = data.duration + actualElapsed;
    const newCalories = Number((data.calories + calories).toFixed(2));

    const shouldAwardPoints = data.pointsAwarded < DAILY_LIMIT;
    const newPointsAwarded = shouldAwardPoints ? 1 : data.pointsAwarded;

    const updatedSession: WalkingSession = {
      date: today,
      duration: newDuration,
      calories: newCalories,
      pointsAwarded: newPointsAwarded,
    };

    saveData(updatedSession);

    if (shouldAwardPoints) {
      onPoints(POINTS_PER_SESSION);
      setShowMilestone(true);
      setTimeout(() => setShowMilestone(false), 2500);
      toast.success(
        lang === 'ar' 
          ? `✓ تمت المسيرة! +${POINTS_PER_SESSION} نقاط` 
          : `✓ Walk complete! +${POINTS_PER_SESSION} points`
      );
    } else {
      toast.info(
        lang === 'ar'
          ? 'تم تسجيل المسيرة (النقاط تُمنح مرة واحدة يومياً)'
          : 'Walk logged (Points awarded once daily)'
      );
    }

    setElapsed(0);
  };

  const resetToday = () => {
    if (confirm(lang === 'ar' ? 'إعادة تعيين اليوم؟' : 'Reset today?')) {
      setIsRunning(false);
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      setElapsed(0);
      saveData({ date: today, duration: 0, calories: 0, pointsAwarded: 0 });
      toast.success(lang === 'ar' ? 'تم إعادة التعيين' : 'Reset complete');
    }
  };

  const totalMinutes = Math.floor(data.duration / 60);
  const totalSeconds = data.duration % 60;
  const currentMinutes = Math.floor(elapsed / 60);
  const currentSeconds = elapsed % 60;

  return (
    <div className="glass-card rounded-2xl p-5 animate-slide-up space-y-4">
      <div className="flex items-center gap-2">
        <Footprints size={18} className="text-green-500" />
        <h3 className="font-semibold text-foreground">
          {lang === 'ar' ? 'مؤقت المسيرة' : 'Walking Timer'}
        </h3>
        <button onClick={resetToday} className="ml-auto text-muted-foreground hover:text-primary transition-colors p-1">
          <RotateCcw size={14} />
        </button>
      </div>

      {showMilestone && (
        <div className="p-3 rounded-xl gradient-gold text-center animate-bounce-in">
          <Trophy size={20} className="mx-auto mb-1 text-gold-foreground" />
          <p className="font-bold text-gold-foreground text-sm">
            🎉 +{POINTS_PER_SESSION} ⭐
          </p>
        </div>
      )}

      <div className="space-y-3">
        <div className="text-center">
          <div className="text-3xl font-bold text-primary font-mono">
            {String(currentMinutes).padStart(2, '0')}:{String(currentSeconds).padStart(2, '0')}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {lang === 'ar' ? 'المسيرة الحالية' : 'Current Session'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="glass-card rounded-xl p-2">
            <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'السعرات' : 'Calories'}</p>
            <p className="text-lg font-bold text-orange-500">
              {Number((currentMinutes / 60 * CALORIES_PER_MINUTE).toFixed(1))}
            </p>
          </div>
          <div className="glass-card rounded-xl p-2">
            <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'النقاط' : 'Points'}</p>
            <p className="text-lg font-bold text-gold">{data.pointsAwarded > 0 ? '✓' : POINTS_PER_SESSION}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {!isRunning && elapsed === 0 ? (
            <button onClick={startWalking} className="flex-1 py-3 rounded-xl gradient-primary text-primary-foreground font-medium flex items-center justify-center gap-2 active:scale-95 transition">
              <Play size={18} />
              {lang === 'ar' ? 'ابدأي المسيرة' : 'Start Walking'}
            </button>
          ) : isRunning ? (
            <>
              <button onClick={() => setIsRunning(false)} className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground font-medium flex items-center justify-center gap-2 active:scale-95 transition">
                <Pause size={18} />
                {lang === 'ar' ? 'إيقاف' : 'Pause'}
              </button>
              <button onClick={finishWalking} className="flex-1 py-3 rounded-xl gradient-success text-success-foreground font-medium flex items-center justify-center gap-2 active:scale-95 transition">
                <Trophy size={18} />
                {lang === 'ar' ? 'أنهِي' : 'Finish'}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setIsRunning(true)} className="flex-1 py-3 rounded-xl gradient-primary text-primary-foreground font-medium flex items-center justify-center gap-2 active:scale-95 transition">
                <Play size={18} />
                {lang === 'ar' ? 'متابعة' : 'Resume'}
              </button>
              <button onClick={finishWalking} className="flex-1 py-3 rounded-xl gradient-success text-success-foreground font-medium flex items-center justify-center gap-2 active:scale-95 transition">
                <Trophy size={18} />
                {lang === 'ar' ? 'أنهِي' : 'Finish'}
              </button>
            </>
          )}
        </div>
      </div>

      {data.duration > 0 && (
        <div className="border-t border-border/50 pt-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase">
            {lang === 'ar' ? 'إجمالي اليوم' : 'Today Total'}
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'الوقت' : 'Time'}</p>
              <p className="text-sm font-bold text-foreground">
                {totalMinutes}:{String(totalSeconds).padStart(2, '0')}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'السعرات' : 'Calories'}</p>
              <p className="text-sm font-bold text-orange-500">{data.calories.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'النقاط' : 'Points'}</p>
              <p className="text-sm font-bold text-gold">{data.pointsAwarded > 0 ? '✓' : '—'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalkingTimer;