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
    <div className="glass-card rounded-2xl p-5 space-y-4 bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200 animate-slide-up">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg text-violet-900">{lang === 'ar' ? '🌟 تحدي اليوم المتكامل' : '🌟 Daily Combo Challenge'}</h3>
        <span className="text-sm font-bold text-violet-700">{completedCount}/{TASKS.length}</span>
      </div>

      <div className="w-full h-2 bg-violet-200 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-300" style={{ width: `${(completedCount / TASKS.length) * 100}%` }} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {TASKS.map(t => {
          const Icon = t.icon as any;
          const isDone = completed.has(t.id);
          return (
            <div key={t.id} className={`p-3 rounded-xl flex items-center gap-2 transition-all ${isDone ? 'bg-success/20 border border-success/30' : 'bg-violet-100 border border-violet-200'}`}>
              <Icon size={18} className={isDone ? 'text-success' : 'text-violet-600'} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${isDone ? 'text-success' : 'text-violet-700'}`}>{lang === 'ar' ? t.labelAr : t.labelEn}</span>
                  {isDone && <span className="text-xs ml-auto">✓</span>}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">{t.target}</p>
              </div>
            </div>
          );
        })}
      </div>

      {allDone && (
        <div className="p-3 rounded-xl bg-success/10 text-success font-bold text-center border border-success/20">{lang === 'ar' ? '🎉 حصلتِ على ٦٠ نقطة!' : '🎉 60 points awarded!'}</div>
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
