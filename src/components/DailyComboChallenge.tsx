import { Droplets, Zap, Pill, BookOpen, ClipboardCheck, Heart } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useDailyComboChallenge, type DailyComboTaskId } from '@/contexts/DailyComboChallengeContext';

interface TaskSpec {
  id: DailyComboTaskId;
  labelAr: string;
  labelEn: string;
  icon: React.ElementType;
  target: string;
}

const TASKS: TaskSpec[] = [
  { id: 'water', labelAr: 'شرب 6 كوبيات ماء', labelEn: 'Drink 6 cups of water', icon: Droplets, target: '6 cups' },
  { id: 'fasting', labelAr: 'صيام اليوم', labelEn: 'Fasted Today', icon: Zap, target: 'fasted' },
  { id: 'habit', labelAr: 'عادة تمت', labelEn: 'Habit Checked', icon: ClipboardCheck, target: '1' },
  { id: 'medication', labelAr: 'دواء تم', labelEn: 'Medication Taken', icon: Pill, target: '1' },
  { id: 'education', labelAr: 'تعليم/قرآن', labelEn: 'Education/Quran', icon: BookOpen, target: '1' },
  { id: 'diet', labelAr: 'تغذية مسجلة', labelEn: 'Diet Logged', icon: Heart, target: '1' },
];

const DailyComboChallenge = () => {
  const { lang } = useLang();
  const { completed, pointsAwarded } = useDailyComboChallenge();

  const completedCount = completed.size;
  const allDone = completedCount === TASKS.length;

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4 bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 shadow-[0_0_25px_rgba(168,85,247,0.4)] border-none animate-slide-up text-white">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg text-white">{lang === 'ar' ? '🌟 تحدي اليوم المتكامل' : '🌟 Daily Combo Challenge'}</h3>
        <span className="text-sm font-bold text-white/90">{completedCount}/{TASKS.length}</span>
      </div>

      <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
        <div className="h-full bg-white transition-all duration-300 shadow-[0_0_10px_white]" style={{ width: `${(completedCount / TASKS.length) * 100}%` }} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {TASKS.map(t => {
          const Icon = t.icon as any;
          const isDone = completed.has(t.id);
          return (
            <div key={t.id} className={`p-3 rounded-xl flex items-center gap-2 transition-all backdrop-blur-sm ${isDone ? 'bg-white/30 border border-white/50 shadow-inner' : 'bg-white/10 border border-white/20'}`}>
              <Icon size={18} className={isDone ? 'text-white' : 'text-white/70'} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold truncate ${isDone ? 'text-white' : 'text-white/90'}`}>{lang === 'ar' ? t.labelAr : t.labelEn}</span>
                  {isDone && <span className="text-xs ml-auto text-white drop-shadow-md">✓</span>}
                </div>
                <p className="text-[10px] text-white/70 mt-0.5 truncate">{t.target}</p>
              </div>
            </div>
          );
        })}
      </div>

      {allDone && (
        <div className="p-3 rounded-xl bg-white/20 text-white font-bold text-center border border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.3)] animate-pulse-soft">
          {lang === 'ar' ? '🎉 حصلتِ على ٦٠ نقطة!' : '🎉 60 points awarded!'}
        </div>
      )}

      {!pointsAwarded && (
        <p className="text-xs text-violet-700 text-center leading-relaxed">
          {lang === 'ar'
            ? 'أكملي جميع المهام اليومية للحصول على مكافأة! يعاد تعيين التحدي كل يوم.'
            : 'Complete all tasks daily to earn rewards! Challenge resets every day.'}
        </p>
      )}
    </div>
  );
};

export default DailyComboChallenge;
