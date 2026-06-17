import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { getLocalDateKey, getWeekStartKey } from '@/lib/localStorageLogics';
import { toast } from '@/hooks/use-toast';

interface HighScoreEntry {
  name: string;
  score: number;
  date: number;
}

interface DailyLogEntry {
  score: number;
  date: number;
}

interface weeklylogStore {
  weekStart: string;
  days: Record<string, DailyLogEntry>;
}

const LEADERBOARD_KEY = 'game2048-local-leaderboard';
const DAILY_LOG_KEY = 'game2048-weekly-daily-log';
const MAX_LEADERBOARD = 5;

const Game2048Viewer = ({ onBack, onScore }: { onBack?: () => void; onScore?: (result: number) => void }) => {
  const { lang, dir } = useLang();
  const GAME_URL = '/games/2048/index.html';
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  const previousScoreRef = useRef(0);
  const lossHandledRef = useRef(false);
  const winHandledRef = useRef(false);

  const [leaderboard, setLeaderboard] = useState<HighScoreEntry[]>([]);
  const [dailyLog, setDailyLog] = useState<Record<string, DailyLogEntry>>({});
  const [currentScore, setCurrentScore] = useState(0);
  const [pendingScore, setPendingScore] = useState<number | null>(null);
  const [playerName, setPlayerName] = useState('');
  const BackIcon = dir === 'rtl' ? null : ArrowLeft;

  const topFive = useMemo(() => leaderboard.slice(0, 5), [leaderboard]);
  const weeklyEntries = useMemo(
    () => Object.entries(dailyLog).sort((a, b) => a[0].localeCompare(b[0])),
    [dailyLog],
  );

  const readweeklylog = (): weeklylogStore => {
    const currentWeek = getWeekStartKey();
    try {
      const parsed = JSON.parse(localStorage.getItem(DAILY_LOG_KEY) || 'null') as weeklylogStore | null;
      if (!parsed || parsed.weekStart !== currentWeek || !parsed.days || typeof parsed.days !== 'object') {
        return { weekStart: currentWeek, days: {} };
      }
      return parsed;
    } catch {
      return { weekStart: currentWeek, days: {} };
    }
  };

  useEffect(() => {
    try {
      const savedLeaderboard = localStorage.getItem(LEADERBOARD_KEY);
      if (savedLeaderboard) {
        setLeaderboard(JSON.parse(savedLeaderboard));
      }
    } catch (e) {
      console.error('Failed to load data:', e);
    }
    const weekly = readweeklylog();
    setDailyLog(weekly.days);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      iframeRef.current?.focus();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const saveWeeklyScore = (score: number) => {
    const todayKey = getLocalDateKey();
    const now = Date.now();
    const weekly = readweeklylog();
    const existing = weekly.days[todayKey];
    weekly.days[todayKey] = existing ? { ...existing, score: Math.max(existing.score, score), date: now } : { score, date: now };
    localStorage.setItem(DAILY_LOG_KEY, JSON.stringify(weekly));
    setDailyLog({ ...weekly.days });
  };

  const handleLoss = (score: number) => {
    if (lossHandledRef.current) return;
    lossHandledRef.current = true;
    winHandledRef.current = false;
    setPendingScore(score);
    setCurrentScore(score);
    saveWeeklyScore(score);
    onScore?.(0);
    toast({ title: lang === 'ar' ? 'تم تسجيل نتيجة اليوم' : 'Today score logged' });
  };

  const handleWin = () => {
    if (winHandledRef.current) return;
    winHandledRef.current = true;
    lossHandledRef.current = false;
    onScore?.(1);
    toast({ title: lang === 'ar' ? 'فوز رائع في 2048!' : 'Great 2048 win!' });
  };

  const inspectIframeState = () => {
    const frame = iframeRef.current;
    const doc = frame?.contentDocument;
    if (!doc) return;

    const scoreValue = Array.from(doc.querySelectorAll('.score_score__1m_x7 div'))
      .map((node) => Number(node.textContent || '0'))
      .find((value) => !Number.isNaN(value));
    const nextScore = scoreValue ?? 0;
    setCurrentScore(nextScore);

    const overlayTitle = doc.querySelector('.splash_splash__wscpw h1')?.textContent?.trim().toLowerCase() || '';
    const isWon = overlayTitle.includes('you won') || overlayTitle.includes('you win');
    const isLost = overlayTitle.includes('you lost');

    if (!isLost && nextScore === 0 && previousScoreRef.current > 0) {
      lossHandledRef.current = false;
      winHandledRef.current = false;
      setPendingScore(null);
      setPlayerName('');
    }

    if (isWon) {
      handleWin();
    } else if (isLost) {
      handleLoss(nextScore);
    } else if (nextScore > previousScoreRef.current) {
      lossHandledRef.current = false;
    }

    previousScoreRef.current = nextScore;
  };

  useEffect(() => {
    const attachObserver = () => {
      const doc = iframeRef.current?.contentDocument;
      if (!doc?.body) return;
      observerRef.current?.disconnect();
      observerRef.current = new MutationObserver(() => inspectIframeState());
      observerRef.current.observe(doc.body, { childList: true, subtree: true, characterData: true });
      inspectIframeState();
    };

    const frame = iframeRef.current;
    if (!frame) return;
    frame.addEventListener('load', attachObserver);
    const timer = window.setTimeout(attachObserver, 1200);
    return () => {
      frame.removeEventListener('load', attachObserver);
      window.clearTimeout(timer);
      observerRef.current?.disconnect();
    };
  }, [lang]);

  const saveHighScore = () => {
    if (!playerName.trim() || pendingScore === null) return;

    const candidate: HighScoreEntry = {
      name: playerName.trim(),
      score: pendingScore,
      date: Date.now(),
    };

    const merged = [...leaderboard];
    const existingIndex = merged.findIndex((entry) => entry.name.toLowerCase() === candidate.name.toLowerCase());
    if (existingIndex >= 0) {
      if (merged[existingIndex].score >= candidate.score) {
        toast({ title: lang === 'ar' ? 'اسمك لديه نتيجة أعلى بالفعل' : 'Your saved score is already higher' });
        return;
      }
      merged.splice(existingIndex, 1, candidate);
    } else {
      merged.push(candidate);
    }

    const updated = merged
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_LEADERBOARD);

    setLeaderboard(updated);
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(updated));
    setPlayerName('');
    toast({ title: lang === 'ar' ? 'تم حفظ النتيجة في الصدارة! 🎉' : 'Score saved to leaderboard! 🎉' });
  };

  return (
    <div className="fixed inset-x-0 top-0 bottom-16 max-w-3xl mx-auto flex flex-col bg-background overflow-hidden z-50">
      {/* Header with Back button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background/50 backdrop-blur-sm flex-shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors active:scale-95"
        >
          {BackIcon && <BackIcon size={20} />}
          <span className="text-sm font-medium">{lang === 'ar' ? 'رجوع' : 'Back'}</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎮</span>
          <h2 className="font-bold text-foreground">{lang === 'ar' ? '2048' : '2048 Game'}</h2>
        </div>
        <div className="w-20" />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Game iframe */}
        <div
          className="flex-[1.55] w-full overflow-hidden bg-muted/20"
          style={{ touchAction: 'none' }}
          onTouchStart={(e) => e.preventDefault()}
          onTouchMove={(e) => e.preventDefault()}
        >
          <iframe
            ref={iframeRef}
            src={GAME_URL}
            title={lang === 'ar' ? 'لعبة 2048' : '2048 Game'}
            className="w-full h-full border-0 scale-[1.12] origin-center"
            allow="autoplay; clipboard-write; fullscreen; accelerometer; gyroscope; picture-in-picture"
            loading="lazy"
          />
        </div>

        <div className="border-t border-border/50 bg-background/50 backdrop-blur-sm p-2.5 max-h-[135px] flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
          <div className="rounded-2xl border border-primary/15 bg-primary/5 p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-foreground">{lang === 'ar' ? 'نتيجة اللعبة الحالية' : 'Current game score'}</p>
              <span className="text-base font-black text-primary">{currentScore}</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {lang === 'ar'
                ? 'بعد ظهور "You Lost" سجلي اسمك لحفظ أعلى نتيجة لك في لوحة 2048.'
                : 'When "You Lost" appears, save your name to keep your best 2048 score.'}
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value)}
                placeholder={lang === 'ar' ? 'اسمك هنا...' : 'Your name...'}
                className="flex-1 px-3 py-2 rounded-xl border border-primary/20 bg-background text-sm text-foreground placeholder-muted-foreground font-bold focus:outline-none focus:border-primary transition-colors"
                onKeyDown={(event) => event.key === 'Enter' && saveHighScore()}
              />
              <button
                onClick={saveHighScore}
                disabled={!playerName.trim() || pendingScore === null}
                className="px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-black disabled:opacity-50 transition-all"
              >
                {lang === 'ar' ? 'حفظ' : 'Save'}
              </button>
            </div>
            {pendingScore !== null && (
              <p className="text-xs font-semibold text-primary">
                {lang === 'ar' ? `آخر نتيجة خاسرة جاهزة للحفظ: ${pendingScore}` : `Last lost score ready to save: ${pendingScore}`}
              </p>
            )}
            <div className="space-y-2 pt-1">
              <p className="text-xs font-bold text-foreground">{lang === 'ar' ? 'أفضل ٥ نتائج 2048' : 'Top 5 2048 scores'}</p>
              {topFive.length === 0 ? (
                <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'لا توجد نتائج بعد' : 'No scores yet'}</p>
              ) : (
                topFive.map((entry, index) => (
                  <div key={`${entry.name}-${index}`} className="flex items-center justify-between text-xs bg-secondary/40 rounded-lg p-2">
                    <span className="font-black text-primary w-6">#{index + 1}</span>
                    <span className="truncate flex-1 mx-2 text-foreground/90 font-medium">{entry.name}</span>
                    <span className="font-black text-primary text-sm">{entry.score}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background/70 p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-foreground">{lang === 'ar' ? 'السجل الأسبوعي الشخصي' : 'Personal weekly log'}</p>
              <span className="text-[11px] text-muted-foreground">{getWeekStartKey()}</span>
            </div>
            {weeklyEntries.length === 0 ? (
              <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'لا توجد نتائج مسجلة هذا الأسبوع' : 'No scores logged this week'}</p>
            ) : (
              <div className="space-y-2">
                {weeklyEntries.map(([day, entry]) => (
                  <div key={day} className="flex items-center justify-between text-xs bg-secondary/40 rounded-lg p-2">
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground/90">{day}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(entry.date).toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span className="font-black text-foreground text-sm">{entry.score}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game2048Viewer;
