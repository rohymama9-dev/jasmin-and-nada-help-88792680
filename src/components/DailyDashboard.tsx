import { useState, useMemo, useEffect } from 'react';
import { Calendar as CalendarIcon, Check, X, Smile, Frown, Battery, Zap } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { usePoints } from '@/hooks/usePoints';
import { toast } from 'sonner';

const DASHBOARD_KEY = 'app-daily-dashboard';
const MOOD_KEY = 'app-daily-mood';
const MOOD_REWARD_KEY = 'app-daily-mood-reward';
const VISITS_KEY = 'app-daily-visits';
const VISIT_TIMES_KEY = 'app-daily-visit-times';

interface DayRecord {
  water: boolean;
  steps: boolean;
  quran: boolean;
}

type Mood = 'happy' | 'sad' | 'tired' | 'motivated';

const moodQuotes: Record<Mood, { ar: string; en: string }[]> = {
  happy: [
    { ar: 'ابتسامتكِ نور يضيء العالم 🌸', en: 'Your smile lights up the world 🌸' },
    { ar: 'اللهم أدم هذا الفرح والسعادة ✨', en: 'May this joy last forever ✨' },
    { ar: 'السعادة الحقيقية في الرضا بما عندك 🌷', en: 'True happiness is contentment 🌷' },
  ],
  sad: [
    { ar: 'بعد كل ضيق فرج، لا تحزني 🤍', en: 'After every hardship comes ease 🤍' },
    { ar: 'إن مع العسر يسراً، فاصبري 🕊️', en: 'Indeed, with hardship comes ease 🕊️' },
    { ar: 'الدموع تغسل القلب وتجعله أنقى 💧', en: 'Tears cleanse the heart 💧' },
  ],
  tired: [
    { ar: 'استريحي قليلاً، فجسدكِ أمانة 🌙', en: 'Rest a little, your body is a trust 🌙' },
    { ar: 'النوم الجيد نصف الصحة 😴', en: 'Good sleep is half of health 😴' },
    { ar: 'خذي نفساً عميقاً وابدئي من جديد 🍃', en: 'Take a deep breath and start again 🍃' },
  ],
  motivated: [
    { ar: 'أنتِ قادرة على تحقيق المستحيل! 🔥', en: "You can achieve the impossible! 🔥" },
    { ar: 'كل خطوة تقربكِ من حلمكِ 🚀', en: 'Every step brings you closer to your dream 🚀' },
    { ar: 'الإرادة القوية تصنع المعجزات ⚡', en: 'Strong will creates miracles ⚡' },
  ],
};

const moods: { key: Mood; emoji: string; labelAr: string; labelEn: string; icon: React.ElementType }[] = [
  { key: 'happy', emoji: '😊', labelAr: 'سعيدة', labelEn: 'Happy', icon: Smile },
  { key: 'sad', emoji: '😢', labelAr: 'حزينة', labelEn: 'Sad', icon: Frown },
  { key: 'tired', emoji: '😴', labelAr: 'متعبة', labelEn: 'Tired', icon: Battery },
  { key: 'motivated', emoji: '💪', labelAr: 'متحمسة', labelEn: 'Motivated', icon: Zap },
];

const getDateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const loadDashboard = (): Record<string, DayRecord> => {
  try { return JSON.parse(localStorage.getItem(DASHBOARD_KEY) || '{}'); } catch { return {}; }
};

const loadVisits = (): Record<string, boolean> => {
  try { return JSON.parse(localStorage.getItem(VISITS_KEY) || '{}'); } catch { return {}; }
};

const loadVisitTimes = (): Record<string, string> => {
  try { return JSON.parse(localStorage.getItem(VISIT_TIMES_KEY) || '{}'); } catch { return {}; }
};

const DailyDashboard = () => {
  const { lang } = useLang();
  const { addPoints } = usePoints();
  const today = getDateKey(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [allData] = useState<Record<string, DayRecord>>(loadDashboard);
  const [visits, setVisits] = useState<Record<string, boolean>>(loadVisits);
  const [visitTimes, setVisitTimes] = useState<Record<string, string>>(loadVisitTimes);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    const handler = () => {
      setVisits(loadVisits());
      setVisitTimes(loadVisitTimes());
    };
    window.addEventListener('attendance-updated', handler);
    return () => window.removeEventListener('attendance-updated', handler);
  }, []);

  const [mood, setMood] = useState<Mood | null>(() => {
    try {
      const d = JSON.parse(localStorage.getItem(MOOD_KEY) || '{}');
      return d.date === today ? d.mood : null;
    } catch { return null; }
  });

  const selectMood = (m: Mood) => {
    setMood(m);
    localStorage.setItem(MOOD_KEY, JSON.stringify({ date: today, mood: m }));
    // Award 2 coins once per day
    const lastReward = localStorage.getItem(MOOD_REWARD_KEY);
    if (lastReward !== today) {
      localStorage.setItem(MOOD_REWARD_KEY, today);
      addPoints(2); // Award 2 points instead of 3
      toast.success(lang === 'ar' ? '🪙 +٢ نقاط لمشاركتك مزاجك اليوم!' : '🪙 +2 points for sharing your mood today!');
    }
  };

  const quote = useMemo(() => {
    if (!mood) return null;
    const q = moodQuotes[mood];
    return q[Math.floor(Math.random() * q.length)];
  }, [mood]);

  const monthNames = lang === 'ar'
    ? ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
    : ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(selectedYear, selectedMonth, 1).getDay();

  return (
    <div className="glass-card rounded-2xl p-5 animate-slide-up space-y-4">
      <div className="flex items-center gap-2">
        <CalendarIcon size={18} className="text-primary" />
        <h3 className="font-semibold text-foreground">{lang === 'ar' ? 'التقويم اليومي' : 'Daily Calendar'}</h3>
      </div>

      {/* Calendar */}
      <div className="rounded-xl bg-secondary/50 p-3">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => { if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); } else setSelectedMonth(m => m - 1); }}
            className="text-muted-foreground hover:text-primary p-1 text-sm">←</button>
          <span className="text-sm font-semibold text-foreground">{monthNames[selectedMonth]} {selectedYear}</span>
          <button onClick={() => { if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); } else setSelectedMonth(m => m + 1); }}
            className="text-muted-foreground hover:text-primary p-1 text-sm">→</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {(lang === 'ar' ? ['أ','إ','ث','أ','خ','ج','س'] : ['S','M','T','W','T','F','S']).map((d, i) => (
            <div key={i} className="text-[10px] text-muted-foreground font-medium py-1">{d}</div>
          ))}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const key = getDateKey(new Date(selectedYear, selectedMonth, day));
            const rec = allData[key];
            const isToday = key === today;
            const isPast = new Date(selectedYear, selectedMonth, day) < new Date(new Date().setHours(0,0,0,0));
            const allDone = rec && rec.water && rec.steps && rec.quran;
            const anyDone = rec && (rec.water || rec.steps || rec.quran);
            const visited = !!visits[key];
            const checked = allDone || visited;

            return (
              <button
                type="button"
                key={day}
                onClick={() => setSelectedDay(key)}
                className={`text-[11px] py-1.5 rounded-lg transition-all relative w-full ${
                isToday ? 'ring-2 ring-primary font-bold' : ''
              } ${checked ? 'bg-success/20' : anyDone ? 'bg-primary/10' : isPast && !isToday ? 'bg-destructive/5' : ''}`}>
                {day}
                {checked && <span className="block text-[8px] text-success">✅</span>}
                {isPast && !checked && !isToday && <span className="block text-[8px] text-destructive">❌</span>}
              </button>
            );
          })}
        </div>
        {selectedDay && (() => {
          const ts = visitTimes[selectedDay];
          const checkedSel = !!visits[selectedDay] || (allData[selectedDay] && allData[selectedDay].water && allData[selectedDay].steps && allData[selectedDay].quran);
          const dateLabel = new Date(selectedDay + 'T00:00:00').toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' });
          const timeLabel = ts ? new Date(ts).toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : null;
          return (
            <div className="mt-3 p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-start justify-between gap-3 animate-slide-up">
              <div className="text-xs text-foreground leading-relaxed">
                <div className="font-semibold mb-0.5">{dateLabel}</div>
                {checkedSel && timeLabel ? (
                  <div className="text-muted-foreground">
                    {lang === 'ar' ? `آخر تسجيل دخول: ${timeLabel}` : `Last check-in: ${timeLabel}`}
                  </div>
                ) : checkedSel ? (
                  <div className="text-muted-foreground">{lang === 'ar' ? 'تم تسجيل الحضور ✅' : 'Checked in ✅'}</div>
                ) : (
                  <div className="text-muted-foreground">{lang === 'ar' ? 'لا يوجد تسجيل دخول لهذا اليوم' : 'No check-in for this day'}</div>
                )}
              </div>
              <button onClick={() => setSelectedDay(null)} className="text-muted-foreground hover:text-primary text-xs px-1">✕</button>
            </div>
          );
        })()}
      </div>

      {/* Mood Tracker */}
      <div>
        <p className="text-sm font-semibold text-foreground mb-2">{lang === 'ar' ? 'كيف حالكِ اليوم؟' : "How are you today?"}</p>
        <div className="flex gap-2">
          {moods.map(m => (
            <button key={m.key} onClick={() => selectMood(m.key)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all active:scale-95 ${
                mood === m.key ? 'gradient-primary text-primary-foreground shadow-md' : 'bg-secondary/50 hover:bg-secondary'
              }`}>
              <span className="text-xl">{m.emoji}</span>
              <span className="text-[10px] font-medium">{lang === 'ar' ? m.labelAr : m.labelEn}</span>
            </button>
          ))}
        </div>
        {mood && quote && (
          <div className="mt-3 p-3 rounded-xl bg-primary/10 border border-primary/20 animate-slide-up">
            <p className="text-sm text-foreground text-center leading-relaxed">{lang === 'ar' ? quote.ar : quote.en}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyDashboard;
