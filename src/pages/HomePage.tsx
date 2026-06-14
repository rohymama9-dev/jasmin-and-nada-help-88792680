import { useEffect, useState } from 'react';
import { LogOut, Moon, Sun } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { getGuestName, GUEST_NAME_KEY } from '@/components/OnboardingScreen';
import PointsBadge from '@/components/PointsBadge';
import HabitTracker from '@/components/HabitTracker';
import DailyDashboard from '@/components/DailyDashboard';
import NewsFeed from '@/components/NewsFeed';
import AdPlaceholder from '@/components/AdPlaceholder';
import ServicesBanner from '@/components/ServicesBanner';
import StudyHabitTools from '@/components/StudyHabitTools';
import DailyComboChallenge from '@/components/DailyComboChallenge';
// تأكدي أن هذه الصورة موجودة في هذا المسار بالضبط
import floralBg from '@/assets/floral-bg.jpg';

interface HomePageProps {
  points: number;
  addPoints: (n: number) => void;
}

const HomePage = ({ points, addPoints }: HomePageProps) => {
  const { t, lang, toggleLang } = useLang();
  const { theme, toggleTheme } = useTheme();
  const [name, setName] = useState<string>(() => getGuestName());

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

  return (
    <div className="pb-4 space-y-5">
      <div className="relative -mx-5 -mt-5 rounded-b-3xl overflow-hidden mb-2">
        <img src={floralBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        <div className="relative px-5 pt-8 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {name ? `${lang === 'ar' ? 'مرحباً' : 'Welcome'} ${name}` : t('welcome')} 🌸
              </h1>
              <p className="text-sm text-muted-foreground">{t('dailyProgress')}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleTheme}
                aria-label="Toggle Theme"
                className="p-1.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              </button>
              <button onClick={toggleLang}
                className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors">
                {lang === 'ar' ? 'EN' : 'عربي'}
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
                className="p-1.5 rounded-full bg-secondary text-secondary-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                <LogOut size={14} />
              </button>
            </div>
          </div>
          <div className="animate-in slide-in-from-left duration-500">
            <PointsBadge points={points} />
          </div>
        </div>
      </div>

      <DailyDashboard />
      <ServicesBanner />
      <NewsFeed onPoints={addPoints} />
      
      <div className="space-y-6 pt-4 border-t border-border/50">
        <DailyComboChallenge />
        <AdPlaceholder size="banner" />
        <div className="glass-card rounded-2xl p-5 space-y-3 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
          <h3 className="font-bold text-base text-emerald-900 text-center">
            {lang === 'ar' ? 'التحدي الأسبوعي' : 'Weekly Challenge'}
          </h3>
          <p className="text-sm text-emerald-800 text-center font-semibold leading-relaxed">
            {lang === 'ar' 
              ? '5000 تسبيحة بالمسبحة الذكية = 200 نقطة' 
              : '5000 recitations with Smart Rosary = 200 points'}
          </p>
          <p className="text-xs text-emerald-700 text-center">
            {lang === 'ar'
              ? 'تُمنح النقاط تلقائياً عند الوصول للهدف الأسبوعي'
              : 'Points awarded automatically when weekly goal is reached'}
          </p>
        </div>
        <StudyHabitTools />
        <HabitTracker onComplete={() => { window.dispatchEvent(new CustomEvent('combo-habit-checked')); }} />
      </div>
      
      <AdPlaceholder size="rectangle" />
    </div>
  );
};

export default HomePage;