import { useEffect, useState, useCallback, useMemo } from 'react';
import { LogOut, Palette, CalendarDays, Skull } from 'lucide-react';
import { toast } from 'sonner';
import { useLang } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { getGuestName, GUEST_NAME_KEY } from '@/components/OnboardingScreen';
import PointsBadge from '@/components/PointsBadge';
import HabitTracker from '@/components/HabitTracker';
import DailyDashboard from '@/components/DailyDashboard';
import AdPlaceholder from '@/components/AdPlaceholder';
import ServicesBanner from '@/components/ServicesBanner';
import StudyHabitTools from '@/components/StudyHabitTools';
import DailyComboChallenge from '@/components/DailyComboChallenge';
import { InstallBanner } from '@/components/InstallBanner';
import floralBg from '@/assets/floral-bg.jpg';
import { MonthlyWrapped } from '@/components/viral/MonthlyWrapped';
import { ShareableResult } from '@/components/viral/ShareableResult';
import VirtualPet from '@/components/VirtualPet';
import TimeCapsule from '@/components/TimeCapsule';

interface HomePageProps {
  points: number;
  addPoints: (n: number) => void;
}

const isIOSDevice = () => {
  try {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
      && !('standalone' in navigator && (navigator as any).standalone);
  } catch { return false; }
};

const DEFAULT_WIDGET_ORDER = [
  'daily_dashboard',
  'services_banner',
  'promo_compressor',
  'combo_challenge',
  'dino_pet',
  'weekly_challenge',
  'study_tools',
  'habit_tracker'
];

const HomePage = ({ points, addPoints }: HomePageProps) => {
  const { t, lang, toggleLang } = useLang();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState<string>(() => getGuestName());
  const [streak, setStreak] = useState(0);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showWrapped, setShowWrapped] = useState(false);
  const [habitsDoneToday, setHabitsDoneToday] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(() => {
    try {
      return isIOSDevice() && !localStorage.getItem('pwa-ios-hint-dismissed');
    } catch { return false; }
  });

  const [savageMode, setSavageMode] = useState(() => localStorage.getItem('savageMode') === 'true');
  const toggleSavageMode = () => {
    const next = !savageMode;
    setSavageMode(next);
    localStorage.setItem('savageMode', String(next));
    toast.success(next ? (lang === 'ar' ? 'الوضع الساخر مفعل 💀' : 'Savage Mode ON 💀') : (lang === 'ar' ? 'تم إيقاف الوضع الساخر 😇' : 'Savage Mode OFF 😇'));
  };

  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  const handleLogoClick = () => {
    const now = Date.now();
    if (now - lastClickTime > 2000) {
      setClickCount(1);
      setLastClickTime(now);
    } else {
      const newCount = clickCount + 1;
      setClickCount(newCount);
      setLastClickTime(now);
      
      if (newCount === 5) {
        if (!localStorage.getItem('easter_egg_found')) {
          addPoints(10);
          localStorage.setItem('easter_egg_found', 'true');
          toast.success(lang === 'ar' ? 'اكتشفت السر! +10 نقاط 🙃' : 'You found the secret! +10 points 🙃');
        }
        document.body.style.transition = 'transform 0.5s ease';
        document.body.style.transform = 'rotate(180deg)';
        setTimeout(() => {
          document.body.style.transform = '';
        }, 2000);
        setClickCount(0);
      }
    }
  };

  const getRPGTitle = (pts: number) => {
    if (pts >= 5000) return lang === 'ar' ? 'أسطورة الإنجاز 👑' : 'Legend of Achievement 👑';
    if (pts >= 2000) return lang === 'ar' ? 'سيد التركيز 🔮' : 'Focus Master 🔮';
    if (pts >= 500) return lang === 'ar' ? 'مقاتل العادات ⚔️' : 'Habit Warrior ⚔️';
    return lang === 'ar' ? 'مبتدئ يبحث عن الطريق 🌱' : 'Beginner Seeking the Path 🌱';
  };

  const [flashChallenge, setFlashChallenge] = useState<{ name: string, expires: number } | null>(null);
  const [flashTimeLeft, setFlashTimeLeft] = useState('');

  useEffect(() => {
    const generateFlashChallenge = () => {
      const now = Date.now();
      if (Math.random() < 0.3) {
        const challenges = [
          { ar: 'العب لعبة الذاكرة', en: 'Play the Memory Game' },
          { ar: 'اقرأ صفحة من القرآن', en: 'Read a page of Quran' },
          { ar: 'اشرب كوبين من الماء', en: 'Drink 2 cups of water' },
        ];
        const selected = challenges[Math.floor(Math.random() * challenges.length)];
        const expires = now + 2 * 60 * 60 * 1000;
        const challenge = { name: lang === 'ar' ? selected.ar : selected.en, expires };
        localStorage.setItem('flash_challenge', JSON.stringify(challenge));
        setFlashChallenge(challenge);
      }
    };

    try {
      const saved = localStorage.getItem('flash_challenge');
      const now = Date.now();
      if (saved) {
        const parsed = JSON.parse(saved);
        if (now < parsed.expires) {
          setFlashChallenge(parsed);
        } else {
          localStorage.removeItem('flash_challenge');
          generateFlashChallenge();
        }
      } else {
        generateFlashChallenge();
      }
    } catch {}
  }, [lang]);

  useEffect(() => {
    if (!flashChallenge) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = flashChallenge.expires - now;
      if (diff <= 0) {
        setFlashChallenge(null);
        localStorage.removeItem('flash_challenge');
        clearInterval(interval);
      } else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setFlashTimeLeft(`${m}:${s.toString().padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [flashChallenge]);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !active) return;
      const { data } = await (supabase as any).from('profiles').select('name').eq('id', user.id).maybeSingle();
      if (active && (data as any)?.name) setName((data as any).name);
    })();
    return () => { active = false; };
  }, []);

  // Streak logic (Silsila)
  useEffect(() => {
    try {
      const lastVisitStr = localStorage.getItem('lastVisitDate');
      const streakStr = localStorage.getItem('userStreak');
      const today = new Date().toDateString();

      let currentStreak = parseInt(streakStr || '0', 10);

      if (lastVisitStr !== today) {
        if (lastVisitStr) {
          const lastVisitDate = new Date(lastVisitStr);
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          
          if (lastVisitDate.toDateString() === yesterday.toDateString()) {
            currentStreak += 1;
          } else {
            currentStreak = 1; // Missed a day, reset to 1
          }
        } else {
          currentStreak = 1; // First visit
        }
        localStorage.setItem('lastVisitDate', today);
        localStorage.setItem('userStreak', currentStreak.toString());
      }
      setStreak(currentStreak);
    } catch (e) {
      // Ignore local storage errors
    }
  }, []);

  // WIDGETS_MAP
  const WIDGETS_MAP: Record<string, React.ReactNode> = useMemo(() => ({
    'daily_dashboard': <DailyDashboard />,
    'services_banner': <ServicesBanner />,
    'promo_compressor': (
      <div
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
        className="rounded-2xl p-4 flex items-center gap-4 shadow-md cursor-pointer transition-all active:scale-95 hover:-translate-y-1 bg-gradient-to-br from-indigo-600 to-violet-700 mx-1"
      >
        <div className="flex flex-col items-center gap-1 shrink-0">
          <span className="text-2xl">🗜️</span>
          <span className="text-2xl">🔄</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-white text-sm leading-tight">
            {lang === 'ar' ? 'أدوات الضغط وتحويل الصيغ' : 'Compression & Format Converter Tools'}
          </p>
          <p className="text-white/70 text-[11px] mt-0.5">
            {lang === 'ar'
              ? 'متوفرة في قسم الخدمات · مجانية · أوفلاين بالكامل'
              : 'Available in Services tab · Free · Fully offline'}
          </p>
        </div>
        <span className="shrink-0 bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
          {lang === 'ar' ? 'الخدمات ←' : '← Services'}
        </span>
      </div>
    ),
    'combo_challenge': <DailyComboChallenge />,
    'weekly_challenge': (
      <div className="glass-card rounded-2xl p-5 space-y-3 bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200 dark:from-teal-950/30 dark:to-cyan-950/30 dark:border-teal-900/40 transition-all hover:-translate-y-1 mx-1">
        <h3 className="font-bold text-base text-emerald-900 dark:text-emerald-200 text-center">
          {lang === 'ar' ? 'التحدي الأسبوعي' : 'Weekly Challenge'}
        </h3>
        <p className="text-sm text-emerald-800 dark:text-emerald-300 text-center font-semibold leading-relaxed">
          {lang === 'ar'
            ? '5000 تسبيحة بالمسبحة الذكية = 200 نقطة'
            : '5000 recitations with Smart Rosary = 200 points'}
        </p>
        <p className="text-xs text-emerald-700 dark:text-emerald-400 text-center">
          {lang === 'ar'
            ? 'تُمنح النقاط تلقائياً عند الوصول للهدف الأسبوعي'
            : 'Points awarded automatically when weekly goal is reached'}
        </p>
      </div>
    ),
    'study_tools': <StudyHabitTools />,
    'habit_tracker': (
      <div className="space-y-4">
        <HabitTracker onComplete={() => {
          window.dispatchEvent(new CustomEvent('combo-habit-checked'));
          setHabitsDoneToday(true);
        }} />
        {/* ShareableResult card — appears after completing habits */}
        {habitsDoneToday && (
          <ShareableResult
            title={lang === 'ar' ? 'أتممت عاداتي اليوم! 🎉' : 'Habits Done Today! 🎉'}
            score={`${points}✨`}
            subtitle={lang === 'ar' ? 'نقاطي الإجمالية' : 'Total Points'}
            lang={lang as 'ar' | 'en'}
          />
        )}
      </div>
    )
  }), [lang]);

  const visibleWidgets = DEFAULT_WIDGET_ORDER;

  return (
    <div className="pb-4 space-y-5">
      {/* ── Header ── */}
      <div className="relative -mx-5 -mt-5 rounded-b-3xl overflow-hidden mb-2 bg-gradient-to-r from-rose-500 via-pink-500 to-orange-400 shadow-lg">
        <img src={floralBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay pointer-events-none" />
        <div className="relative px-5 pt-8 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 cursor-pointer select-none" onClick={handleLogoClick}>
                <h1 className="text-2xl font-bold text-white">
                  {name ? `${lang === 'ar' ? 'مرحباً' : 'Welcome'} ${name}` : t('welcome')} 🌸
                </h1>
              </div>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold border border-white/30">
                  {getRPGTitle(points)}
                </span>
                {streak >= 2 && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-100 text-[10px] font-bold border border-orange-500/30" title={lang === 'ar' ? 'سلسلة الحضور' : 'Visit Streak'}>
                    <span className="text-sm leading-none">🔥</span>
                    <span>{streak}</span>
                  </div>
                )}
                <span className="px-2 py-0.5 rounded-full bg-success/20 text-success text-[10px] font-bold border border-success/30">
                  {lang === 'ar' ? '✅ تم تسجيل الحضور' : '✅ Checked In'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button onClick={() => setShowThemeMenu(!showThemeMenu)} aria-label="Theme Selector"
                  className="w-10 h-10 flex items-center justify-center p-2 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
                  <Palette size={14} />
                </button>
                {showThemeMenu && (
                  <div className="absolute top-full mt-2 right-0 bg-background border border-border rounded-lg shadow-xl p-2 flex flex-col gap-1 z-50 min-w-[150px]">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase px-2 pb-1 border-b border-border/50">{t('المظهر', 'Theme')}</div>
                    <button onClick={() => { setTheme('light'); setShowThemeMenu(false); }} className={`text-left text-sm p-2 rounded hover:bg-secondary ${theme === 'light' ? 'bg-secondary font-bold' : ''}`}>Light</button>
                    <button onClick={() => { setTheme('dark'); setShowThemeMenu(false); }} className={`text-left text-sm p-2 rounded hover:bg-secondary ${theme === 'dark' ? 'bg-secondary font-bold' : ''}`}>Dark</button>
                    <button onClick={() => { setTheme('hacker'); setShowThemeMenu(false); }} className={`text-left text-sm p-2 rounded hover:bg-secondary ${theme === 'hacker' ? 'bg-secondary font-bold' : ''}`}>Hacker 🟩</button>
                    <button onClick={() => { setTheme('win98'); setShowThemeMenu(false); }} className={`text-left text-sm p-2 rounded hover:bg-secondary ${theme === 'win98' ? 'bg-secondary font-bold' : ''}`}>Win 98 🪟</button>
                    <button onClick={() => { setTheme('neon-dark'); setShowThemeMenu(false); }} className={`text-left text-sm p-2 rounded hover:bg-secondary ${theme === 'neon-dark' ? 'bg-secondary font-bold' : ''}`}>Neon 💜</button>
                    
                    <div className="text-[10px] font-bold text-muted-foreground uppercase px-2 pt-2 pb-1 mt-1 border-t border-border/50">{t('إعدادات إضافية', 'Extras')}</div>
                    <button onClick={() => { toggleSavageMode(); setShowThemeMenu(false); }} className={`flex justify-between items-center text-left text-sm p-2 rounded hover:bg-red-500/10 hover:text-red-500 transition-colors ${savageMode ? 'text-red-500 font-bold bg-red-500/10' : ''}`}>
                      <span>{lang === 'ar' ? 'الوضع الساخر' : 'Savage Mode'}</span>
                      <Skull size={14} />
                    </button>
                  </div>
                )}
              </div>
              <button onClick={toggleLang}
                className="w-10 h-10 flex items-center justify-center p-2 rounded-full bg-secondary text-secondary-foreground text-[10px] font-bold hover:bg-secondary/80 transition-colors">
                {lang === 'ar' ? 'EN' : 'AR'}
              </button>
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem(GUEST_NAME_KEY);
                    window.dispatchEvent(new CustomEvent('guest-name-changed', { detail: '' }));
                  } catch {/* ignore */}
                  void supabase.auth.signOut().catch(() => {});
                  window.location.reload();
                }}
                aria-label={lang === 'ar' ? 'تسجيل الخروج' : 'Sign out'}
                className="w-10 h-10 flex items-center justify-center p-2 rounded-full bg-secondary text-secondary-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                <LogOut size={14} />
              </button>
            </div>
          </div>
          <div className="animate-in slide-in-from-left duration-500 flex items-center gap-2">
            <PointsBadge points={points} />
            {/* Monthly Wrapped trigger */}
            <button
              onClick={() => setShowWrapped(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/20 text-white text-[11px] font-bold hover:bg-white/30 transition-colors backdrop-blur-sm"
              title={lang === 'ar' ? 'ملخص شهري' : 'Monthly Wrapped'}
            >
              <CalendarDays size={13} />
              <span>{lang === 'ar' ? 'شهري ✨' : 'Wrapped ✨'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Wrapped full-screen story */}
      {showWrapped && <MonthlyWrapped onClose={() => setShowWrapped(false)} />}

      {/* ── iOS Install Mini-Banner (Apple users only) ── */}
      {showIOSHint && (
        <div
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
          className="relative rounded-2xl overflow-hidden flex items-center gap-3 px-4 py-3 shadow-md bg-gradient-to-br from-teal-500 to-cyan-600 transition-all active:scale-95 hover:-translate-y-1"
        >
          <span className="text-2xl shrink-0">🌸</span>
          <div className="flex-1 min-w-0">
            <p className="text-white/80 text-[11px] mt-0.5">
              لتحميل التطبيق على الآيفون، اضغط على زر المشاركة بالأسفل ثم اختر إضافة إلى الشاشة الرئيسية
            </p>
          </div>
          <button
            onClick={() => {
              setShowIOSHint(false);
              try { localStorage.setItem('pwa-ios-hint-dismissed', '1'); } catch {}
            }}
            className="shrink-0 w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Flash Challenge Banner */}
      {flashChallenge && (
        <div className="mx-1 p-3 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-lg animate-bounce-in flex justify-between items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-wider text-yellow-100">{lang === 'ar' ? '⚡ تحدي مفاجئ!' : '⚡ Flash Challenge!'}</p>
            <p className="font-bold text-sm leading-tight mt-0.5">{flashChallenge.name}</p>
          </div>
          <div className="relative z-10 shrink-0 bg-black/20 px-2 py-1 rounded-lg text-center">
            <p className="text-[9px] uppercase font-bold text-yellow-100">{lang === 'ar' ? 'ينتهي في' : 'Ends in'}</p>
            <p className="text-sm font-black font-mono">{flashTimeLeft}</p>
          </div>
        </div>
      )}

      {/* Virtual Pet */}
      <VirtualPet />

      {/* Time Capsule */}
      <TimeCapsule />

      {/* Main Widgets */}
      <div className="space-y-4">
        {visibleWidgets.map((wKey) => (
          <div key={wKey}>{WIDGETS_MAP[wKey]}</div>
        ))}
      </div>

      <AdPlaceholder size="rectangle" />

      {/* ── iOS Install Hint (bottom, Apple devices only) ── */}
      <InstallBanner />
    </div>
  );
};

export default HomePage;
