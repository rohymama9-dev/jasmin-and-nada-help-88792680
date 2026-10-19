import { useEffect, useMemo, useRef, useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { serviceQuizBank, type QuizBankQuestion } from '@/data/quizData';

interface Props { onScore?: (n: number) => void; }

/**
 * Dynamic Quiz Engine: bilingual, randomly assembled questions across multiple
 * categories. Provides instant correct/incorrect feedback. Awards 2 pts/correct.
 */

const shuffle = <T,>(arr: T[]) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const QuizEngine = ({ onScore }: Props) => {
  const { lang } = useLang();
  const questionPoolRef = useRef<number[]>([]);
  const [pick, setPick] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [questionIndex, setQuestionIndex] = useState<number | null>(null);

  const drawNextQuestion = () => {
    if (questionPoolRef.current.length === 0) {
      questionPoolRef.current = shuffle(serviceQuizBank.map((_, index) => index));
    }

    const nextIndex = questionPoolRef.current.pop();
    setQuestionIndex(nextIndex ?? 0);
  };

  useEffect(() => {
    drawNextQuestion();
  }, []);

  const { q, order } = useMemo(() => {
    const activeIndex = questionIndex ?? 0;
    const q: QuizBankQuestion = serviceQuizBank[activeIndex];
    const indexed = q.opts.map((_, i) => i);
    const order = shuffle(indexed);
    return { q, order };
  }, [questionIndex]);

  const correctOrderedIdx = order.indexOf(q.ansIdx);

  const choose = (i: number) => {
    if (pick !== null) return;
    setPick(i);
    if (i === correctOrderedIdx) {
      setScore(s => s + 1);
      setStreak(s => {
        const ns = s + 1;
        setBestStreak(b => Math.max(b, ns));
        return ns;
      });
      onScore?.(0); // Set to 0 points as it's a Service as requested
    } else {
      setStreak(0);
    }
  };

  const next = () => {
    setPick(null);
    drawNextQuestion();
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-700 flex items-center justify-center mx-auto mb-2">
          <span className="text-2xl">🎓</span>
        </div>
        <h2 className="text-lg font-bold">{lang === 'ar' ? 'محرك الاختبارات' : 'Dynamic Quiz Engine'}</h2>
        <p className="text-xs text-muted-foreground">
          {lang === 'ar' ? `النتيجة: ${score} · سلسلة: ${streak} (الأفضل: ${bestStreak})` : `Score: ${score} · Streak: ${streak} (best: ${bestStreak})`}
        </p>
      </div>

      <div className="glass-card rounded-2xl p-5 space-y-4">
        <p className="text-base font-bold text-center">
          {lang === 'ar' ? q.qAr : q.qEn}
        </p>
        <div className="grid grid-cols-1 gap-2">
          {order.map((origIdx, i) => {
            const opt = q.opts[origIdx];
            const isCorrectChoice = pick !== null && i === correctOrderedIdx;
            const isWrongChoice = pick === i && i !== correctOrderedIdx;
            return (
              <button key={i} onClick={() => choose(i)}
                className={`p-3 rounded-xl font-semibold text-sm text-start ${
                  isCorrectChoice ? 'bg-success/20 text-success' :
                  isWrongChoice ? 'bg-destructive/20 text-destructive' :
                  'bg-secondary hover:bg-secondary/70'
                }`}>
                {lang === 'ar' ? opt.ar : opt.en}
              </button>
            );
          })}
        </div>
        {pick !== null && (
          <button onClick={next}
            className="w-full py-2.5 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm">
            {pick === correctOrderedIdx
              ? `✓ ${lang === 'ar' ? 'صحيح! التالي' : 'Correct! Next'}`
              : `✗ ${lang === 'ar' ? 'الإجابة الصحيحة:' : 'Correct answer:'} ${lang === 'ar' ? q.opts[q.ansIdx].ar : q.opts[q.ansIdx].en}`}
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizEngine;
