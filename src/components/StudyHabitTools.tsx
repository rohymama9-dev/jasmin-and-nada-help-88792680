import { useState, useEffect, useRef } from 'react';
import { Timer, Fingerprint, Target, Coffee, Play, Pause, RotateCcw, Trophy } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { usePoints } from '@/hooks/usePoints';
import { toast } from 'sonner';

const WEEKLY_GOAL = 5000;
const SMART_ROSARY_KEY = 'smart_rosary_weekly';

interface SmartRosaryState {
  count: number;
  weekStartDate: string;
  pointsAwarded: boolean;
}

const StudyHabitTools = () => {
  const { lang } = useLang();
  const { addPoints } = usePoints();
  const [activeTab, setActiveTab] = useState<'rosary' | 'pomodoro'>('rosary');
  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  // Get the start of the current week (Monday)
  const getWeekStartDate = (): string => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const weekStart = new Date(now.setDate(diff));
    return weekStart.toDateString();
  };

  // Initialize Smart Rosary state with weekly reset
  const getInitialRosaryState = (): SmartRosaryState => {
    try {
      const storedData = localStorage.getItem(SMART_ROSARY_KEY);
      const data = storedData ? JSON.parse(storedData) : {};
      const currentWeekStart = getWeekStartDate();
      
      // If it's a new week, reset the counter and points flag
      if (data.weekStartDate !== currentWeekStart) {
        return { count: 0, weekStartDate: currentWeekStart, pointsAwarded: false };
      }
      return {
        count: data.count || 0,
        weekStartDate: data.weekStartDate || currentWeekStart,
        pointsAwarded: data.pointsAwarded || false,
      };
    } catch {
      return { count: 0, weekStartDate: getWeekStartDate(), pointsAwarded: false };
    }
  };

  // Rosary State
  const initialRosaryState = getInitialRosaryState();
  const [rosaryCount, setRosaryCount] = useState(initialRosaryState.count);
  const [weekStartDate, setWeekStartDate] = useState(initialRosaryState.weekStartDate);
  const [pointsAwarded, setPointsAwarded] = useState(initialRosaryState.pointsAwarded);

  useEffect(() => {
    // Check if we need to reset for a new week
    const currentWeekStart = getWeekStartDate();
    if (currentWeekStart !== weekStartDate) {
      setWeekStartDate(currentWeekStart);
      setRosaryCount(0);
      setPointsAwarded(false);
      localStorage.setItem(SMART_ROSARY_KEY, JSON.stringify({
        count: 0,
        weekStartDate: currentWeekStart,
        pointsAwarded: false,
      }));
      return;
    }

    // Save rosary count with weekly state
    const state: SmartRosaryState = {
      count: rosaryCount,
      weekStartDate,
      pointsAwarded,
    };
    localStorage.setItem(SMART_ROSARY_KEY, JSON.stringify(state));

    // Award 200 points when reaching 5000 in the week (only once)
    if (rosaryCount >= WEEKLY_GOAL && !pointsAwarded) {
      addPoints(200);
      setPointsAwarded(true);
      const updatedState = { ...state, pointsAwarded: true };
      localStorage.setItem(SMART_ROSARY_KEY, JSON.stringify(updatedState));
      toast.success(lang === 'ar' 
        ? '🎉 مبروك! وصلتِ لـ ٥٠٠٠ تسبيحة وحصلتِ على ٢٠٠ نقطة!' 
        : '🎉 Congrats! You reached 5000 counts and earned 200 points!');
    }
  }, [rosaryCount, lang, addPoints, weekStartDate, pointsAwarded]);

  // Pomodoro State
  const [pomoTime, setPomoTime] = useState(25 * 60);
  const [pomoActive, setPomoActive] = useState(false);
  const [pomoMode, setPomoMode] = useState<'focus' | 'break'>('focus');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (pomoActive && pomoTime > 0) {
      timerRef.current = setInterval(() => {
        setPomoTime((prev) => prev - 1);
      }, 1000);
    } else if (pomoTime === 0) {
      setPomoActive(false);
      if (pomoMode === 'focus') {
        setPomoMode('break');
        setPomoTime(5 * 60);
      } else {
        setPomoMode('focus');
        setPomoTime(25 * 60);
      }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [pomoActive, pomoTime, pomoMode]);

  const togglePomo = () => setPomoActive(!pomoActive);
  const resetPomo = () => {
    setPomoActive(false);
    setPomoMode('focus');
    setPomoTime(25 * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 p-1 bg-secondary/50 rounded-2xl">
        <button onClick={() => setActiveTab('rosary')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'rosary' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'}`}>
          {t('المسبحة الذكية', 'Smart Rosary')}
        </button>
        <button onClick={() => setActiveTab('pomodoro')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'pomodoro' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'}`}>
          {t('مؤقت الدراسة', 'Pomodoro Timer')}
        </button>
      </div>

      <div className="glass-card rounded-[2.5rem] p-8 min-h-[350px] flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
        {activeTab === 'rosary' && (
          <div className="w-full space-y-8">
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-primary">
                <Trophy size={20} />
                <p className="text-sm font-black uppercase tracking-widest">
                  {t(`الهدف الأسبوعي: الوصول إلى ${WEEKLY_GOAL} نقرة!`, `Weekly Goal: Reach ${WEEKLY_GOAL} taps!`)}
                </p>
              </div>
              <div className="w-full h-3 bg-secondary rounded-full overflow-hidden border border-border">
                <div 
                  className="h-full gradient-primary transition-all duration-500"
                  style={{ width: `${Math.min(100, (rosaryCount / WEEKLY_GOAL) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground font-bold">
                {rosaryCount} / {WEEKLY_GOAL} ({Math.round((rosaryCount / WEEKLY_GOAL) * 100)}%)
              </p>
            </div>

            <button 
              onClick={() => setRosaryCount(c => c + 1)}
              className="w-48 h-48 rounded-full bg-background border-[12px] border-primary/20 shadow-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-all group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-primary/5 group-active:bg-primary/10 transition-colors" />
              <Fingerprint size={48} className="text-primary/40 group-active:text-primary transition-colors" />
              <span className="text-5xl font-black text-foreground relative z-10">{rosaryCount}</span>
            </button>

            <button onClick={() => {
              setRosaryCount(0);
              setPointsAwarded(false);
              const weekStart = getWeekStartDate();
              setWeekStartDate(weekStart);
              localStorage.setItem(SMART_ROSARY_KEY, JSON.stringify({
                count: 0,
                weekStartDate: weekStart,
                pointsAwarded: false,
              }));
            }} className="text-xs text-muted-foreground hover:text-primary font-bold transition-colors">
              {t('إعادة التصفير', 'Reset Counter')}
            </button>
          </div>
        )}

        {activeTab === 'pomodoro' && (
          <div className="w-full space-y-8">
            <div className="flex flex-col items-center gap-4">
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg transition-colors ${pomoMode === 'focus' ? 'bg-indigo-500 text-white' : 'bg-emerald-500 text-white'}`}>
                {pomoMode === 'focus' ? <Target size={40} /> : <Coffee size={40} />}
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-foreground uppercase tracking-widest">
                  {pomoMode === 'focus' ? t('وقت التركيز', 'Focus Session') : t('وقت الراحة', 'Break Time')}
                </h3>
                <p className="text-xs text-muted-foreground font-medium">
                  {pomoMode === 'focus' ? t('٢٥ دقيقة من العمل العميق', '25 minutes of deep work') : t('٥ دقائق لاستعادة النشاط', '5 minutes to recharge')}
                </p>
              </div>
            </div>

            <div className="text-8xl font-black text-foreground font-mono tracking-tighter">
              {formatTime(pomoTime)}
            </div>

            <div className="flex items-center justify-center gap-4">
              <button onClick={resetPomo} className="p-4 rounded-2xl bg-secondary text-muted-foreground hover:text-foreground transition-all active:scale-90">
                <RotateCcw size={24} />
              </button>
              <button onClick={togglePomo} className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl transition-all active:scale-90 ${pomoActive ? 'bg-secondary text-foreground' : 'gradient-primary text-white shadow-primary/20'}`}>
                {pomoActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
              </button>
              <div className="w-14" /> {/* Spacer */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyHabitTools;
