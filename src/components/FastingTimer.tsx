import { useState, useEffect, useCallback } from 'react';
import { Timer, Play, Pause, RotateCcw, Award } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';

interface LogEntry {
  date?: string;
  amount?: number;
  hours?: number;
  duration?: number;
  count?: number;
}

const LocalWeeklyLog = ({ logs, title, type }: { logs: LogEntry[]; title: string; type: string }) => {
  const last7Days = logs.slice(-7);
  return (
    <div className="border-t border-border/50 pt-4 mt-4">
      <p className="text-xs font-bold text-muted-foreground mb-3 uppercase">{title}</p>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
        {last7Days.map((log, i) => (
          <div key={i} className="min-w-[60px] flex-shrink-0 glass-card p-2 text-center rounded-lg snap-start border border-border/30">
            <p className="text-[10px] text-muted-foreground">{log.date?.slice(5) || ''}</p>
            <p className="text-sm font-bold text-foreground">
              {type === 'fasting' ? `${log.hours || 0}h` : `${Math.round((log.duration || 0) / 60)}m`}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const FASTING_KEY = 'app-fasting';

interface FastingState {
  startTime: number | null;
  windowHours: number;
  active: boolean;
}

interface FastingTimerProps {
  onScore?: (points: number) => void;
}

const stages = [
  { hours: 0, emoji: '🍽️', ar: 'بدء الصيام', en: 'Fasting Started', color: 'text-muted-foreground' },
  { hours: 4, emoji: '📉', ar: 'استقرار سكر الدم', en: 'Blood Sugar Normalizes', color: 'text-blue-500' },
  { hours: 8, emoji: '🔄', ar: 'بدء حرق الجليكوجين', en: 'Glycogen Depletion', color: 'text-amber-500' },
  { hours: 12, emoji: '🔥', ar: 'بدء حرق الدهون', en: 'Fat Burning Begins', color: 'text-orange-500' },
  { hours: 16, emoji: '♻️', ar: 'الالتهام الذاتي', en: 'Autophagy', color: 'text-green-500' },
  { hours: 20, emoji: '🧬', ar: 'هرمون النمو يرتفع', en: 'Growth Hormone Surge', color: 'text-purple-500' },
  { hours: 24, emoji: '⚡', ar: 'الكيتوزية الكاملة', en: 'Full Ketosis', color: 'text-red-500' },
];

const FastingTimer = ({ onScore }: FastingTimerProps = {}) => {
  const { lang } = useLang();
  const [state, setState] = useState<FastingState>(() => {
    try { return JSON.parse(localStorage.getItem(FASTING_KEY) || '{"startTime":null,"windowHours":16,"active":false}'); }
    catch { return { startTime: null, windowHours: 16, active: false }; }
  });
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!state.active) return;
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, [state.active]);

  const save = useCallback((s: FastingState) => {
    setState(s);
    localStorage.setItem(FASTING_KEY, JSON.stringify(s));
  }, []);

  const appendFastingLog = (startTs: number, endTs: number) => {
    try {
      const d = new Date(startTs);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const hours = Number(((endTs - startTs) / 3600000).toFixed(2));
      const logItem = { date: dateKey, startTime: startTs, endTime: endTs, hours };
      const all = JSON.parse(localStorage.getItem('fastingLog') || '[]');
      all.push(logItem);
      localStorage.setItem('fastingLog', JSON.stringify(all));
      try { window.dispatchEvent(new CustomEvent('combo-fasting-updated')); } catch {}
      try { window.dispatchEvent(new StorageEvent('storage', { key: 'fastingLog' } as any)); } catch {}
    } catch { /* ignore */ }
  };

  const start = () => save({ ...state, startTime: Date.now(), active: true });
  const stop = () => {
    if (state.startTime) {
      const endTs = Date.now();
      appendFastingLog(state.startTime, endTs);
    }
    save({ ...state, active: false });
  };
  const reset = () => save({ startTime: null, windowHours: state.windowHours, active: false });

  const elapsed = state.active && state.startTime ? (now - state.startTime) / 1000 : 0;
  const elapsedHours = elapsed / 3600;
  const totalSeconds = state.windowHours * 3600;
  const remaining = Math.max(0, totalSeconds - elapsed);
  const pct = Math.min((elapsed / totalSeconds) * 100, 100);

  const hrs = Math.floor(remaining / 3600);
  const mins = Math.floor((remaining % 3600) / 60);
  const secs = Math.floor(remaining % 60);

  const currentStage = [...stages].reverse().find(s => elapsedHours >= s.hours) || stages[0];
  const windows = [14, 16, 18, 20, 24];

  return (
    <div className="glass-card rounded-2xl p-5 animate-slide-up space-y-4">
      <div className="flex items-center gap-2">
        <Timer size={18} className="text-primary" />
        <h3 className="font-semibold text-foreground">{lang === 'ar' ? 'الصيام المتقطع' : 'Intermittent Fasting'}</h3>
      </div>

      {!state.active && !state.startTime && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'اختاري نافذة الصيام' : 'Choose fasting window'}</p>
          <div className="flex gap-2">
            {windows.map(w => (
              <button key={w} onClick={() => save({ ...state, windowHours: w })}
                className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                  state.windowHours === w ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                }`}>
                {w}h
              </button>
            ))}
          </div>
        </div>
      )}

      {(state.active || state.startTime) && (
        <div className="text-center space-y-3">
          <div className="relative w-32 h-32 mx-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--secondary))" strokeWidth="6" />
              <circle cx="50" cy="50" r="42" fill="none"
                stroke={remaining <= 0 ? "hsl(var(--success))" : "hsl(var(--primary))"}
                strokeWidth="6" strokeDasharray={`${pct * 2.64} 264`}
                strokeLinecap="round" className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {remaining > 0 ? (
                <>
                  <p className="text-xl font-bold text-foreground font-mono">{String(hrs).padStart(2,'0')}:{String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}</p>
                  <p className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'متبقي' : 'remaining'}</p>
                </>
              ) : (
                <>
                  <span className="text-2xl">🎉</span>
                  <p className="text-xs font-bold text-success">{lang === 'ar' ? 'انتهى!' : 'Complete!'}</p>
                  <button onClick={() => { onScore?.(10); reset(); }}
                    className="mt-2 px-3 py-1 rounded-lg bg-success text-success-foreground text-xs font-bold flex items-center justify-center gap-1 mx-auto">
                    <Award size={12} /> {lang === 'ar' ? '+10 نقاط' : '+10 Pts'}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className={`p-3 rounded-xl bg-secondary/50 ${currentStage.color}`}>
            <span className="text-xl">{currentStage.emoji}</span>
            <p className="text-sm font-semibold mt-1">{lang === 'ar' ? currentStage.ar : currentStage.en}</p>
            <p className="text-[10px] text-muted-foreground">{Math.floor(elapsedHours)}h {Math.floor((elapsedHours % 1) * 60)}m {lang === 'ar' ? 'منذ البدء' : 'elapsed'}</p>
          </div>

          <div className="flex gap-1">
            {stages.map((s, i) => (
              <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${
                elapsedHours >= s.hours ? 'bg-primary' : 'bg-secondary'
              }`} title={lang === 'ar' ? s.ar : s.en} />
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {!state.active ? (
          <button onClick={start}
            className="flex-1 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2">
            <Play size={16} /> {lang === 'ar' ? 'بدء الصيام' : 'Start Fasting'}
          </button>
        ) : (
          <button onClick={stop}
            className="flex-1 py-3 rounded-xl bg-destructive text-destructive-foreground font-semibold text-sm flex items-center justify-center gap-2">
            <Pause size={16} /> {lang === 'ar' ? 'إيقاف' : 'Stop'}
          </button>
        )}
        {state.startTime && (
          <button onClick={reset} className="px-4 py-3 rounded-xl bg-secondary text-secondary-foreground">
            <RotateCcw size={16} />
          </button>
        )}
      </div>

      {(() => {
        try {
          const raw = localStorage.getItem('fastingLog');
          const logs = raw ? JSON.parse(raw) : [];
          if (logs.length === 0) return null;
          return (
            <LocalWeeklyLog 
              logs={logs} 
              title={lang === 'ar' ? 'سجل الصيام الأسبوعي' : 'Weekly Fasting Log'} 
              type="fasting" 
            />
          );
        } catch { return null; }
      })()}
    </div>
  );
};

export default FastingTimer;