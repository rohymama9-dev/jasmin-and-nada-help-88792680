import { toast } from 'sonner';
import { useEffect, useState, useRef } from 'react';
import { Play, Pause, X, CheckCircle } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
const EXERCISE_KEY = 'exerciseTimer';

type Mode = 'countdown' | 'countup';

// المكون المدمج للسجل الأسبوعي
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
              {type === 'water' ? `${log.amount || 0}L` : type === 'sleep' ? `${log.hours || 0}h` : type === 'exercise' ? `${log.duration || 0}m` : `${log.count || 0}`}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const beep = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = 880;
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
    o.start();
    setTimeout(() => {
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      o.stop(ctx.currentTime + 0.3);
    }, 250);
  } catch {
    // ignore if WebAudio not available
  }
};

const getTodayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const ExerciseTimer = () => {
  const { lang } = useLang();
  const [mode, setMode] = useState<Mode>('countdown');
  const [minutes, setMinutes] = useState(10); // default
  const [running, setRunning] = useState(false);
  const [prepStage, setPrepStage] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const ivRef = useRef<number | null>(null);

  useEffect(() => {
    const storedEnd = Number(localStorage.getItem('exerciseEndTime') || '0');
    if (storedEnd && !isNaN(storedEnd) && storedEnd > Date.now()) {
      setMode('countdown');
      setRunning(true);
      setSecondsLeft(Math.max(0, Math.floor((storedEnd - Date.now()) / 1000)));
      ivRef.current = window.setInterval(() => {
        const e = Number(localStorage.getItem('exerciseEndTime') || '0');
        if (e && e > Date.now()) {
          setSecondsLeft(Math.max(0, Math.floor((e - Date.now()) / 1000)));
        } else {
          if (ivRef.current) { clearInterval(ivRef.current); ivRef.current = null; }
          setRunning(false);
        }
      }, 1000) as unknown as number;
    } else {
      setSecondsLeft(minutes * 60);
    }
  }, [minutes]); 

  useEffect(() => {
    return () => { if (ivRef.current) clearInterval(ivRef.current); };
  }, []);

  const persistSession = (session: { date: string; duration: number; mode: Mode; completed: boolean }) => {
    try {
      const stored = JSON.parse(localStorage.getItem(EXERCISE_KEY) || '{}');
      stored[session.date] = stored[session.date] || [];
      stored[session.date].push(session);
      localStorage.setItem(EXERCISE_KEY, JSON.stringify(stored));
      try { window.dispatchEvent(new CustomEvent('combo-exercise-updated')); } catch {}
      try { window.dispatchEvent(new StorageEvent('storage', { key: EXERCISE_KEY } as any)); } catch {}
    } catch {}
  };

  const start = async () => {
    if (running) return;
    setPrepStage(2);
    let prep = 2;
    const prepIv = window.setInterval(() => {
      prep -= 1;
      setPrepStage(prep > 0 ? prep : 0);
      if (prep <= 0) {
        clearInterval(prepIv);
        setPrepStage(null);
        setRunning(true);
        if (mode === 'countdown') {
          const end = Date.now() + minutes * 60 * 1000;
          try { localStorage.setItem('exerciseEndTime', String(end)); } catch {}
          setSecondsLeft(minutes * 60);
        } else {
          try { localStorage.removeItem('exerciseEndTime'); } catch {}
        }
        ivRef.current = window.setInterval(() => {
          if (mode === 'countdown') {
            const e = Number(localStorage.getItem('exerciseEndTime') || '0');
            const left = e ? Math.max(0, Math.floor((e - Date.now()) / 1000)) : Math.max(0, secondsLeft - 1);
            setSecondsLeft(left);
            if (left <= 0) stop(true);
          } else {
            setSecondsElapsed(prev => prev + 1);
          }
        }, 1000) as unknown as number;
      }
    }, 1000);
  };

  const stop = (auto = false) => {
    if (ivRef.current) clearInterval(ivRef.current);
    ivRef.current = null;
    setRunning(false);
    setPrepStage(null);
    const today = getTodayKey();
    let duration = 0;
    if (mode === 'countdown') {
      const end = Number(localStorage.getItem('exerciseEndTime') || '0');
      if (end && end > 0) {
        duration = Math.max(0, Math.floor((end - Date.now()) / 1000));
        if (auto) duration = minutes * 60;
      } else {
        duration = minutes * 60 - secondsLeft;
      }
    } else {
      duration = secondsElapsed;
    }
    const completed = auto ? true : false;
    persistSession({ date: today, duration, mode, completed });
    try { localStorage.removeItem('exerciseEndTime'); } catch {}
    if (auto) try { localStorage.setItem('exercise_completed', 'true'); } catch {};
    if (auto) {
      beep();
      toast(lang === 'ar' ? 'انتهى التمرين 🎉' : 'Exercise complete 🎉');
    }
    setSecondsElapsed(0);
    setSecondsLeft(minutes * 60);
  };

  return (
    <div dir="rtl" className="glass-card rounded-2xl p-4 mb-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">{lang === 'ar' ? 'مؤقت التمارين' : 'Exercise Timer'}</h3>
      </div>
      
      <div className="mt-3">
        {(() => {
          try {
            const raw = localStorage.getItem('exerciseTimer');
            const obj = raw ? JSON.parse(raw) : {};
            const flattenedLogs = Object.keys(obj).map(date => {
              const daySessions = obj[date] || [];
              const totalDuration = daySessions.reduce((sum: number, s: any) => sum + (s.duration || 0), 0);
              return { date, duration: totalDuration };
            }).sort((a, b) => a.date.localeCompare(b.date));

            return (
              <LocalWeeklyLog 
                logs={flattenedLogs} 
                title={lang === 'ar' ? 'سجل التمارين الأسبوعي' : 'Weekly Exercise Log'} 
                type="exercise" 
              />
            );
          } catch {
            return null;
          }
        })()}
      </div>

      <div className="space-y-3 mt-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground w-28">{lang === 'ar' ? 'الوضع' : 'Mode'}</label>
          <div className="flex gap-2 ms-auto">
            <button onClick={() => setMode('countdown')} className={`px-3 py-1 rounded-xl ${mode === 'countdown' ? 'gradient-primary text-primary-foreground' : 'bg-secondary'}`}>{lang === 'ar' ? 'عد تنازلي' : 'Countdown'}</button>
            <button onClick={() => setMode('countup')} className={`px-3 py-1 rounded-xl ${mode === 'countup' ? 'gradient-primary text-primary-foreground' : 'bg-secondary'}`}>{lang === 'ar' ? 'عد تصاعدي' : 'Count-up'}</button>
          </div>
        </div>

        {mode === 'countdown' && (
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">{lang === 'ar' ? 'المدة (دقائق)' : 'Duration (minutes)'}</label>
            <input type="range" min={5} max={180} value={minutes} onChange={e => setMinutes(parseInt(e.target.value, 10))} className="w-full" />
            <div className="flex justify-between text-xs"><span>5</span><span>{minutes}</span><span>180</span></div>
          </div>
        )}

        <div className="text-center">
          {prepStage !== null ? (
            <div className="text-4xl font-black">{prepStage > 0 ? prepStage : 'Go'}</div>
          ) : (
            <div className="text-3xl font-mono font-bold">{mode === 'countdown' ? `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}` : `${String(Math.floor(secondsElapsed / 60)).padStart(2, '0')}:${String(secondsElapsed % 60).padStart(2, '0')}`}</div>
          )}
          <p className="text-xs text-muted-foreground mt-1">{mode === 'countdown' ? (lang === 'ar' ? 'متبقي' : 'remaining') : (lang === 'ar' ? 'منذ البدء' : 'elapsed')}</p>
        </div>

        <div className="flex gap-2">
          {!running ? (
            <button onClick={start} className="flex-1 py-3 rounded-xl gradient-primary text-primary-foreground flex items-center justify-center gap-2"><Play />{lang === 'ar' ? 'ابدأ' : 'Start'}</button>
          ) : (
            <>
              <button onClick={() => { if (ivRef.current) clearInterval(ivRef.current); setRunning(false); }} className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground flex items-center justify-center gap-2"><Pause />{lang === 'ar' ? 'إيقاف' : 'Pause'}</button>
              <button onClick={() => stop(false)} className="flex-1 py-3 rounded-xl bg-destructive text-destructive-foreground flex items-center justify-center gap-2"><CheckCircle />{lang === 'ar' ? 'إنهاء' : 'Finish'}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExerciseTimer;