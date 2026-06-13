import { useMemo, useState, useEffect } from 'react'; // أضفنا useEffect
import { Volume2, Check, X } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { speak } from '@/lib/speech';
import type { Lesson } from '@/data/educationCatalog';

interface Props {
  lesson: Lesson;
  onAllCorrect?: () => void;
}

const shuffle = <T,>(arr: T[]) => arr.slice().sort(() => Math.random() - 0.5);

const LessonExercises = ({ lesson, onAllCorrect }: Props) => {
  const { lang } = useLang();
  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  const items = (lang === 'ar' ? lesson.itemsAr : lesson.itemsEn) ?? [];
  const altItems = (lang === 'ar' ? lesson.itemsEn : lesson.itemsAr) ?? [];

  // ---- 1. Matching ----
  const matchPairs = useMemo(() => {
    const n = Math.min(4, items.length, altItems.length);
    return Array.from({ length: n }, (_, i) => ({ a: items[i], b: altItems[i] }));
  }, [items, altItems]);
  const [matchSelected, setMatchSelected] = useState<{ a?: string; b?: string }>({});
  const [matched, setMatched] = useState<Set<string>>(new Set());

  const tryMatch = (side: 'a' | 'b', val: string) => {
    const next = { ...matchSelected, [side]: val };
    setMatchSelected(next);
    if (next.a && next.b) {
      const pair = matchPairs.find(p => p.a === next.a);
      if (pair && pair.b === next.b) {
        setMatched(prev => new Set(prev).add(next.a!));
      }
      setTimeout(() => setMatchSelected({}), 350);
    }
  };

  // ---- 2. Fill blank ----
  const sentence = lang === 'ar' ? lesson.bodyAr : lesson.bodyEn;
  const { masked, answer, options } = useMemo(() => {
    const words = sentence.split(' ').filter(w => w.length > 2);
    if (!words.length) return { masked: sentence, answer: '', options: [] as string[] };
    const ans = words[Math.floor(words.length / 2)];
    const masked = sentence.replace(ans, '____');
    const distractors = shuffle((items.length ? items : words).filter(w => w !== ans)).slice(0, 3);
    return { masked, answer: ans, options: shuffle([ans, ...distractors]) };
  }, [sentence, items]);
  const [fillPick, setFillPick] = useState<string | null>(null);

  // ---- 3. Listening ----
  const listeningOptions = useMemo(() => {
    if (!items.length) return [] as string[];
    const target = items[Math.floor(Math.random() * items.length)];
    const distractors = shuffle(items.filter(x => x !== target)).slice(0, 3);
    return shuffle([target, ...distractors]).slice(0, 4);
  }, [items]);
  const [listenTarget] = useState(() => listeningOptions[0] ?? items[0] ?? '');
  const [listenPick, setListenPick] = useState<string | null>(null);

  const allDone =
    matched.size === matchPairs.length &&
    matchPairs.length > 0 &&
    fillPick === answer &&
    listenPick === listenTarget;

  // 🔴 الإصلاح الأساسي: نقلنا الفحص لداخل useEffect
  useEffect(() => {
    if (allDone) {
      onAllCorrect?.();
    }
  }, [allDone, onAllCorrect]);

  return (
    <div className="space-y-4">
      {/* 1. Matching */}
      {matchPairs.length > 0 && (
        <div className="rounded-2xl border border-border p-3 bg-background">
          <p className="text-xs font-semibold text-muted-foreground mb-2">
            {t('١. طابقي بين العمودين', '1. Match the columns')}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              {matchPairs.map(p => (
                <button key={`a-${p.a}`} onClick={() => tryMatch('a', p.a)}
                  disabled={matched.has(p.a)}
                  className={`w-full text-xs p-2 rounded-lg ${
                    matched.has(p.a) ? 'bg-success/20 text-success line-through'
                    : matchSelected.a === p.a ? 'bg-primary/30' : 'bg-secondary/50 hover:bg-secondary'
                  }`}>{p.a}</button>
              ))}
            </div>
            <div className="space-y-1">
              {shuffle(matchPairs).map(p => (
                <button key={`b-${p.b}`} onClick={() => tryMatch('b', p.b)}
                  disabled={matched.has(p.a)}
                  className={`w-full text-xs p-2 rounded-lg ${
                    matched.has(p.a) ? 'bg-success/20 text-success line-through'
                    : matchSelected.b === p.b ? 'bg-primary/30' : 'bg-secondary/50 hover:bg-secondary'
                  }`}>{p.b}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Fill blank */}
      {answer && (
        <div className="rounded-2xl border border-border p-3 bg-background">
          <p className="text-xs font-semibold text-muted-foreground mb-2">
            {t('٢. املأي الفراغ', '2. Fill in the blank')}
          </p>
          <p className="text-sm mb-2" dir={lang === 'ar' ? 'rtl' : 'ltr'}>{masked}</p>
          <div className="flex flex-wrap gap-2">
            {options.map(opt => {
              const isPicked = fillPick === opt;
              const correct = isPicked && opt === answer;
              const wrong = isPicked && opt !== answer;
              return (
                <button key={opt} onClick={() => setFillPick(opt)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                    correct ? 'bg-success/20 text-success' :
                    wrong ? 'bg-destructive/20 text-destructive' :
                    'bg-secondary/60 hover:bg-secondary'
                  }`}>
                  {opt} {correct && <Check size={12} className="inline" />}
                  {wrong && <X size={12} className="inline" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Listening quiz */}
      {listeningOptions.length > 1 && listenTarget && (
        <div className="rounded-2xl border border-border p-3 bg-background">
          <p className="text-xs font-semibold text-muted-foreground mb-2">
            {t('٣. اختبار استماع', '3. Listening quiz')}
          </p>
          <button onClick={() => speak(listenTarget, lang)}
            className="px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm font-semibold flex items-center gap-2 mb-2">
            <Volume2 size={14} /> {t('شغّلي الصوت', 'Play sound')}
          </button>
          <div className="grid grid-cols-2 gap-2">
            {listeningOptions.map(opt => {
              const isPicked = listenPick === opt;
              const correct = isPicked && opt === listenTarget;
              const wrong = isPicked && opt !== listenTarget;
              return (
                <button key={opt} onClick={() => setListenPick(opt)}
                  className={`p-2 rounded-lg text-xs font-medium ${
                    correct ? 'bg-success/20 text-success' :
                    wrong ? 'bg-destructive/20 text-destructive' :
                    'bg-secondary/60 hover:bg-secondary'
                  }`}>{opt}</button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonExercises;