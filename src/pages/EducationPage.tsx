import { useEffect, useState } from 'react';
import { GraduationCap, Volume2, ArrowLeft, Check } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { lsGetJSON, lsSetJSON } from '@/lib/userStorage';
import GlobalLeaderboard from '@/components/GlobalLeaderboard';
import {
  ALL_LESSONS, CATEGORY_META, lessonsByCategory,
  type Lesson, type LessonCategory,
} from '@/data/educationCatalog';
import { speak, cancelSpeech } from '@/lib/speech';
import { toast } from 'sonner';
import PronunciationExercise from '@/components/PronunciationExercise';
import LessonExercises from '@/components/LessonExercises';
import MathLab from '@/components/MathLab';
import DictationPhonics from '@/components/DictationPhonics';
import GrammarQuestions from '@/components/GrammarQuestions';
import { useDailyComboChallenge } from '@/contexts/DailyComboChallengeContext';

interface Props {
  points: number;
  educationPoints: number;
  addPoints: (n: number) => void;
}

const CATEGORIES: LessonCategory[] =
  ['letters','words','grammar','listening','texts','phrases','conversations'];
const COMPLETED_BASE = 'app-lessons-completed';

const EducationPage = ({ points, educationPoints, addPoints }: Props) => {
  const { lang } = useLang();
  const { updateChallenge } = useDailyComboChallenge();
  
  // تاম نقل activeTab هنا لأعلى لتجنب أخطاء React Hooks
  const [activeTab, setActiveTab] = useState<'math' | 'dictation' | 'grammarQuestions'>('math');
  
  const [activeCat, setActiveCat] = useState<LessonCategory | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(
    () => new Set(lsGetJSON<string[]>(COMPLETED_BASE, [])),
  );

  // Re-hydrate when the guest name changes (logout / fresh name).
  useEffect(() => {
    const sync = () => setCompleted(new Set(lsGetJSON<string[]>(COMPLETED_BASE, [])));
    window.addEventListener('guest-name-changed', sync);
    return () => {
      window.removeEventListener('guest-name-changed', sync);
      cancelSpeech();
    };
  }, []);

  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  const completeLesson = (lesson: Lesson) => {
    if (completed.has(lesson.id)) {
      toast.info(t('أكملتِ هذا الدرس مسبقاً', 'Already completed'));
      return;
    }
    const next = new Set(completed).add(lesson.id);
    setCompleted(next);
    lsSetJSON(COMPLETED_BASE, Array.from(next));
    addPoints(3); // Set to 3 points per lesson as requested
    updateChallenge('education', true);
    toast.success(t(`+3 نقاط 🌟`, `+3 points 🌟`));
  };


  // ============= Lesson view =============
  if (activeLesson) {
    const lesson = activeLesson;
    const items = (lang === 'ar' ? lesson.itemsAr : lesson.itemsEn) ?? [];
    return (
      <div className="space-y-4 pb-4" style={{ textAlign: 'start' }}>
        <button onClick={() => { cancelSpeech(); setActiveLesson(null); }}
          className="text-primary text-sm font-medium flex items-center gap-1"
          style={{ flexDirection: 'row' }}>
          <ArrowLeft size={16} className={lang === 'ar' ? 'rotate-180' : ''} /> {t('رجوع', 'Back')}
        </button>

        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs" style={{ flexDirection: 'row' }}>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
              {CATEGORY_META[lesson.category][lang]} {CATEGORY_META[lesson.category].emoji}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
              {t('مستوى', 'Level')} {lesson.difficulty}/5
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-semibold">
              ⭐ 3
            </span>
          </div>

          <h2 className="text-xl font-bold text-foreground">
            {lang === 'ar' ? lesson.titleAr : lesson.titleEn}
          </h2>

          {/* Body — also tappable to hear the whole thing */}
          <button
            onClick={() => speak(lang === 'ar' ? lesson.bodyAr : lesson.bodyEn, lang)}
            className="w-full rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-all p-4"
            style={{ textAlign: 'start' }}
          >
            <p className="text-sm leading-relaxed text-foreground">
              {lang === 'ar' ? lesson.bodyAr : lesson.bodyEn}
            </p>
            <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1" style={{ flexDirection: 'row' }}>
              <Volume2 size={12} /> {t('اضغطي للاستماع', 'Tap to listen')}
            </p>
          </button>

          {/* Per-item pronunciation */}
          {items.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">
                {t('استمعي وكرّري', 'Listen & repeat')}
              </p>
              <div className="flex flex-wrap gap-2" style={{ flexDirection: 'row' }}>
                {items.map((it, i) => (
                  <button key={i} onClick={() => speak(it, lang)}
                    className="px-3 py-2 rounded-xl bg-primary/5 hover:bg-primary/10 text-foreground text-sm font-medium flex items-center gap-2 active:scale-95 transition-all"
                    style={{ flexDirection: 'row' }}>
                    <Volume2 size={14} className="text-primary" />
                    <span>{it}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pronunciation correction (STT) */}
          <PronunciationExercise target={lang === 'ar' ? lesson.bodyAr : lesson.bodyEn} lang={lang} />

          {/* Interactive exercises */}
          <LessonExercises lesson={lesson} />

          <button
            onClick={() => completeLesson(lesson)}
            disabled={completed.has(lesson.id)}
            className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {completed.has(lesson.id)
              ? <><Check size={16} /> {t('تم الإكمال', 'Completed')}</>
              : t(`إنهاء الدرس (+3)`, `Complete lesson (+3)`)}
          </button>
        </div>
      </div>
    );
  }

  // ============= Category view =============
  if (activeCat) {
    const list = lessonsByCategory(activeCat);
    const meta = CATEGORY_META[activeCat];
    return (
      <div className="space-y-3 pb-4" style={{ textAlign: 'start' }}>
        <button onClick={() => setActiveCat(null)}
          className="text-primary text-sm font-medium flex items-center gap-1"
          style={{ flexDirection: 'row' }}>
          <ArrowLeft size={16} className={lang === 'ar' ? 'rotate-180' : ''} /> {t('رجوع', 'Back')}
        </button>
        <div className="text-center">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${meta.color} flex items-center justify-center mx-auto mb-2 shadow-lg`}>
            <span className="text-2xl">{meta.emoji}</span>
          </div>
          <h2 className="text-lg font-bold text-foreground">{meta[lang]}</h2>
          <p className="text-xs text-muted-foreground">{list.length} {t('درس', 'lessons')}</p>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {list.map((l, idx) => {
            const done = completed.has(l.id);
            return (
              <button key={l.id} onClick={() => setActiveLesson(l)}
                className="glass-card rounded-xl p-3 flex items-center gap-3 hover:bg-primary/5 transition-all active:scale-[0.98]"
                style={{ textAlign: 'start', flexDirection: 'row' }}>
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${meta.color} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">
                    {lang === 'ar' ? l.titleAr : l.titleEn}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {t('مستوى', 'Lvl')} {l.difficulty} · ⭐ 3
                  </p>
                </div>
                {done && <Check size={16} className="text-success" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ============= Hub view =============
  const totalCompleted = completed.size;

  return (
    <div className="space-y-4 pb-4">
      <div className="text-center mb-2">
        <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-3 shadow-lg">
          <GraduationCap size={28} className="text-primary-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground">
          {t('مركز التعليم', 'Education Center')}
        </h2>
        <GlobalLeaderboard currentPoints={educationPoints} section="education" />
      <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => setActiveTab('math')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'math' ? 'gradient-primary text-white' : 'bg-secondary text-muted-foreground'}`}
          >
            {t('مختبر الرياضيات', 'Math Lab')}
          </button>
          <button
            onClick={() => setActiveTab('dictation')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'dictation' ? 'gradient-primary text-white' : 'bg-secondary text-muted-foreground'}`}
          >
            {t('الإملاء والنطق', 'Dictation')}
          </button>
          <button
            onClick={() => setActiveTab('grammarQuestions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'grammarQuestions' ? 'gradient-primary text-white' : 'bg-secondary text-muted-foreground'}`}
          >
            {t('أسئلة قواعد', 'Grammar Questions')}
          </button>
        </div>
      </div>

      {activeTab === 'math' && (
        <div className="glass-card rounded-2xl p-4">
          <MathLab onScore={addPoints} />
        </div>
      )}

      {activeTab === 'grammarQuestions' && (
        <div className="glass-card rounded-2xl p-4">
          <GrammarQuestions onScore={addPoints} />
        </div>
      )}

      {activeTab === 'dictation' && (
        <DictationPhonics onScore={addPoints} />
      )}
    </div>
  );
};

export default EducationPage;
