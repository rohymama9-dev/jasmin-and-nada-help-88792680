import { useEffect, useMemo, useRef, useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { usePoints } from '@/contexts/PointsContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface GlobalLeaderboardProps {
  points?: number;
  currentPoints?: number;
  section?: 'games' | 'education' | string;
}

type LeaderboardEntry = {
  name: string;
  score: number;
};

const getWeekStartDate = (date: Date) => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = (day + 6) % 7; // Monday as start of week
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - diff);
  return result;
};

const toWeekStartKey = (date: Date) => {
  const start = getWeekStartDate(date);
  return start.toISOString().slice(0, 10);
};

const getWeeklyReward = (rank: number) => {
  if (rank === 1) return 100;
  if (rank <= 5) return 50;
  if (rank <= 10) return 20;
  return 0;
};

const getRewardClaimKey = (name: string, section: string, weekStartKey: string) =>
  `leaderboard-reward-claim:${section}:${weekStartKey}:${name.toLowerCase()}`;

const GlobalLeaderboard = ({ points, currentPoints, section = 'global' }: GlobalLeaderboardProps) => {
  const { lang } = useLang();
  const { addPoints } = usePoints();
  const [displayName, setDisplayName] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const hasShownFetchError = useRef(false);

  const totalScore = typeof currentPoints === 'number' ? currentPoints : points ?? 0;
  const weekStartKey = useMemo(() => toWeekStartKey(new Date()), []);
  const sectionTitle = section === 'education'
    ? (lang === 'ar' ? 'التعليم' : 'Education')
    : section === 'games'
      ? (lang === 'ar' ? 'الألعاب' : 'Games')
      : (lang === 'ar' ? 'العالمي' : 'Global');
  const rewardSummary = lang === 'ar'
    ? 'أول ١٠ يحصلون على جوائز أسبوعية: المركز الأول ١٠٠، أفضل ٥ يحصلون على ٥٠، أفضل ١٠ يحصلون على ٢٠.'
    : 'Weekly rewards: 1st +100, top 5 +50, top 10 +20.';

  const fetchLeaderboard = async () => {
    setLoading(true);
    let result = await supabase
      .from('leaderboards' as any)
      .select('name,score')
      .eq('section', section)
      .eq('week_start', weekStartKey)
      .order('score', { ascending: false })
      .limit(10);

    if (result.error) {
      console.warn('Leaderboard section load failed, retrying fallback:', result.error.message || result.error);
      const fallback = await supabase
        .from('leaderboards' as any)
        .select('name,score')
        .order('score', { ascending: false })
        .limit(10);

      if (!fallback.error && fallback.data && fallback.data.length >= 10 && !hasShownFetchError.current) {
        toast.error(lang === 'ar' ? 'فشل في تحميل لوحة الصدارة' : 'Failed to load leaderboard');
        hasShownFetchError.current = true;
      }

      result = fallback;
    }

    if (result.error) {
      console.error('Failed to load leaderboard:', result.error);
      setLeaderboard([]);
    } else {
      setLeaderboard(result.data ?? []);
    }

    setLoading(false);
  };

  useEffect(() => {
    void fetchLeaderboard();
    const interval = window.setInterval(() => {
      void fetchLeaderboard();
    }, 20000);

    return () => window.clearInterval(interval);
  }, [section, weekStartKey]);

  const awardWeeklyBonus = (name: string, rank: number) => {
    const reward = getWeeklyReward(rank);
    if (!reward || !['games', 'education'].includes(section)) return;

    const key = getRewardClaimKey(name, section, weekStartKey);
    if (localStorage.getItem(key)) return;

    addPoints(reward, section as 'games' | 'education');
    localStorage.setItem(key, String(Date.now()));
    toast.success(
      lang === 'ar'
        ? `مبروك! حصلت على ${reward} نقطة مكافأة لأفضل ${rank} هذا الأسبوع.`
        : `Nice! You earned ${reward} bonus points for placing #${rank} this week.`
    );
  };

  const calculateRank = (name: string) => {
    const index = leaderboard.findIndex(entry => entry.name === name);
    return index >= 0 ? index + 1 : null;
  };

  const handleSubmit = async () => {
    const name = displayName.trim();
    if (!name) {
      toast.error(lang === 'ar' ? 'أدخل اسم العرض' : 'Enter your display name');
      return;
    }

    if (totalScore <= 0) {
      toast.error(lang === 'ar' ? 'لا يوجد نقاط ليتم إرسالها' : 'No points to submit');
      return;
    }

    setSubmitting(true);

    const { data: existingRows, error: fetchError } = await supabase
      .from('leaderboards' as any)
      .select('id,score')
      .eq('name', name)
      .eq('section', section)
      .eq('week_start', weekStartKey)
      .limit(1);

    if (fetchError) {
      console.error('Leaderboard lookup failed:', fetchError);
      toast.error(lang === 'ar' ? 'حدث خطأ أثناء الإرسال' : 'Submission failed');
      setSubmitting(false);
      return;
    }

    const existing = Array.isArray(existingRows) ? existingRows[0] : existingRows;

    if (existing && totalScore <= existing.score) {
      toast.error(
        lang === 'ar'
          ? 'النقاط الحالية ليست أعلى من نتيجتك السابقة في اللوحة.'
          : 'Your score is not higher than your existing leaderboard result.'
      );
      await fetchLeaderboard();
      setSubmitting(false);
      return;
    }

    let mutationError = null;

    if (existing) {
      const { error } = await supabase
        .from('leaderboards' as any)
        .update({ score: totalScore })
        .eq('id', existing.id);

      mutationError = error;
    } else {
      const { error } = await supabase
        .from('leaderboards' as any)
        .insert([{ name, section, week_start: weekStartKey, score: totalScore }]);

      mutationError = error;
    }

    if (mutationError) {
      console.error('Failed to save leaderboard entry:', mutationError);
      toast.error(lang === 'ar' ? 'فشل في حفظ النتيجة' : 'Failed to save score');
      setSubmitting(false);
      return;
    }

    await fetchLeaderboard();
    const rank = calculateRank(name);
    if (rank) {
      awardWeeklyBonus(name, rank);
    }

    setSubmitted(true);
    toast.success(lang === 'ar' ? 'تم إرسال نتيجتك' : 'Your score was submitted');
    setSubmitting(false);
  };

  return (
    <div className="glass-card rounded-3xl p-5 border border-white/10 bg-white/10 shadow-xl shadow-black/5">
      <div className="flex flex-col gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">
              {lang === 'ar' ? 'لوحة الصدارة' : 'Global Leaderboard'}
            </span>
            <span className="text-[10px] text-muted-foreground">{sectionTitle}</span>
          </div>
          <h3 className="text-lg font-bold text-foreground">
            {lang === 'ar'
              ? 'انضم إلى أفضل المنافسين'
              : 'Join the top competitor'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === 'ar'
              ? 'أدخل اسم العرض ثم أرسل نقاطك الإجمالية ليظهر في اللوحة.'
              : 'Enter your display name and submit your total points to appear on the leaderboard.'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{rewardSummary}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-muted-foreground">
              {lang === 'ar' ? 'أدخل اسمك للمشاركة في لوحة الصدارة' : 'Enter your display name'}
            </span>
            <input
              value={displayName}
              onChange={(event) => { setDisplayName(event.target.value); setSubmitted(false); }}
              placeholder={lang === 'ar' ? 'مثال: علي' : 'e.g. Sara'}
              className="w-full rounded-2xl border border-border bg-background/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
              aria-label={lang === 'ar' ? 'اسم العرض' : 'Display name'}
            />
          </label>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              lang === 'ar' ? 'أرسل النقاط' : 'Submit Score'
            )}
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-primary/10 bg-primary/5 px-4 py-3">
          <p className="text-sm text-foreground">
            {lang === 'ar' ? 'نقاطك الحالية' : 'Your current score'}
          </p>
          <div className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
            {totalScore}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">
              {lang === 'ar' ? 'أفضل ١٠' : 'Top 10'}
            </p>
            <span className="text-xs text-muted-foreground">
              {loading ? (lang === 'ar' ? 'جارٍ التحديث...' : 'Refreshing...') : (lang === 'ar' ? 'محدثة تلقائياً' : 'Auto refresh')}
            </span>
          </div>

          {leaderboard.length === 0 ? (
            <div className="rounded-3xl border border-border bg-background/80 p-4 text-sm text-muted-foreground">
              {lang === 'ar' ? 'لا توجد نتائج بعد.' : 'No leaderboard entries yet.'}
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry, index) => (
                <div key={`${entry.name}-${index}`} className="flex items-center justify-between gap-3 rounded-3xl bg-secondary/10 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {index + 1}. {entry.name}
                    </p>
                  </div>
                  <div className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                    {entry.score}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalLeaderboard;
