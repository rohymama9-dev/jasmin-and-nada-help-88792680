import { useState, useMemo, useRef, useEffect } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import GameInstructions from './GameInstructions';
import { TRIVIA_BANK, type TriviaQuestion } from '@/data/triviaBank';

interface TriviaGameProps {
  onScore: (pts: number) => void;
  difficulty?: string;
}

const TOTAL_ROUNDS = 15;

// Shuffle helper
const shuffle = <T,>(arr: T[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * Shuffle a question's options ONCE — applying the SAME permutation to AR + EN
 * and recalculating correctIndex. This fixes the previous bug where AR/EN/correct
 * were each shuffled independently leading to wrong answers being marked correct.
 */
function shuffleQuestion(q: TriviaQuestion): TriviaQuestion {
  const order = shuffle([0, 1, 2, 3]);
  return {
    ...q,
    optionsAr: order.map(i => q.optionsAr[i]),
    optionsEn: order.map(i => q.optionsEn[i]),
    correctIndex: order.indexOf(q.correctIndex),
  };
}

const TriviaGame = ({ onScore }: TriviaGameProps) => {
  const { lang } = useLang();
  const poolsRef = useRef<Record<1 | 2 | 3 | 4 | 5, number[]>>({ 1: [], 2: [], 3: [], 4: [], 5: [] });

  const [internalLevel, setInternalLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [lifelines, setLifelines] = useState({ fiftyFifty: true, skip: true, hint: true });
  const [eliminated, setEliminated] = useState<number[]>([]);
  const [currentQ, setCurrentQ] = useState<TriviaQuestion | null>(null);
  const [hintShown, setHintShown] = useState(false);

  const prizeTable = useMemo(
    () => [10, 20, 30, 50, 75, 100, 150, 200, 300, 400, 500, 750, 1000, 1500, 2000],
    []
  );

  const refillPools = () => {
    const nextPools: Record<1 | 2 | 3 | 4 | 5, number[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };

    TRIVIA_BANK.forEach((question, index) => {
      nextPools[question.level].push(index);
    });

    (Object.keys(nextPools) as Array<keyof typeof nextPools>).forEach((level) => {
      nextPools[level] = shuffle(nextPools[level]);
    });

    poolsRef.current = nextPools;
  };

  const pickQuestion = (level: number): TriviaQuestion | null => {
    const pools = poolsRef.current;
    const order = [level, level - 1, level + 1, level - 2, level + 2, level + 3, level - 3]
      .filter(l => l >= 1 && l <= 5);

    const isExhausted = (Object.keys(pools) as Array<keyof typeof pools>).every((poolLevel) => pools[poolLevel].length === 0);
    if (isExhausted) {
      refillPools();
    }

    for (const l of order) {
      const levelPool = poolsRef.current[l as 1 | 2 | 3 | 4 | 5];
      const pickedIndex = levelPool.pop();
      if (pickedIndex !== undefined) {
        return shuffleQuestion(TRIVIA_BANK[pickedIndex]);
      }
    }

    refillPools();
    const fallbackIndex = poolsRef.current[1].pop();
    return fallbackIndex === undefined ? null : shuffleQuestion(TRIVIA_BANK[fallbackIndex]);
  };

  useEffect(() => {
    refillPools();
    if (!currentQ && !gameOver) {
      setCurrentQ(pickQuestion(1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const advance = (correct: boolean) => {
    let nextLevel = internalLevel;
    let nextStreak = streak;
    if (correct) {
      nextStreak = streak + 1;
      if (nextStreak >= 2 && internalLevel < 5) {
        nextLevel = internalLevel + 1;
        nextStreak = 0;
      }
    } else {
      nextStreak = 0;
      if (internalLevel > 1) nextLevel = internalLevel - 1;
    }
    setInternalLevel(nextLevel);
    setStreak(nextStreak);

    const nextRound = round + 1;
    if (nextRound >= TOTAL_ROUNDS) {
      setGameOver(true);
      return;
    }
    setRound(nextRound);
    setSelected(null);
    setEliminated([]);
    setHintShown(false);
    setCurrentQ(pickQuestion(nextLevel));
  };

  const handleAnswer = (idx: number) => {
    if (selected !== null || !currentQ) return;
    setSelected(idx);
    const correct = idx === currentQ.correctIndex;
    onScore(correct ? 1 : 0);
    setTimeout(() => {
      if (correct) {
        setScore(s => s + 1);
        advance(true);
      } else {
        // Wrong answer restarts the run, but the question pool stays consumed.
        setTimeout(() => {
          setRound(0);
          setScore(0);
          setSelected(null);
          setEliminated([]);
          setHintShown(false);
          setInternalLevel(1);
          setStreak(0);
          setLifelines({ fiftyFifty: true, skip: true, hint: true });
          setCurrentQ(pickQuestion(1));
        }, 1200);
      }
    }, 1400);
  };

  const useFiftyFifty = () => {
    if (!lifelines.fiftyFifty || !currentQ) return;
    setLifelines(l => ({ ...l, fiftyFifty: false }));
    const wrong = [0, 1, 2, 3].filter(i => i !== currentQ.correctIndex);
    setEliminated(shuffle(wrong).slice(0, 2));
  };

  const useSkip = () => {
    if (!lifelines.skip || !currentQ) return;
    setLifelines(l => ({ ...l, skip: false }));
    advance(false); // skip without penalty to score
  };

  const useHint = () => {
    if (!lifelines.hint) return;
    setLifelines(l => ({ ...l, hint: false }));
    setHintShown(true);
  };

  const restart = () => {
    setRound(0); setScore(0); setSelected(null); setGameOver(false);
    setLifelines({ fiftyFifty: true, skip: true, hint: true });
    setEliminated([]); setInternalLevel(1); setStreak(0); setHintShown(false);
    setCurrentQ(pickQuestion(1));
  };

  if (gameOver) {
    return (
      <div className="text-center space-y-4 p-6 animate-bounce-in">
        <span className="text-5xl block">{score >= 12 ? '🏆' : score >= 8 ? '🎉' : '😅'}</span>
        <h3 className="text-xl font-bold text-foreground">
          {lang === 'ar' ? 'انتهت اللعبة!' : 'Game Over!'}
        </h3>
        <p className="text-foreground">
          {lang === 'ar' ? `أجبت إجابات صحيحة: ${score} من ${TOTAL_ROUNDS}` : `Correct answers: ${score} of ${TOTAL_ROUNDS}`}
        </p>
        <p className="text-lg font-bold text-primary">
          {lang === 'ar' ? 'النقاط تُحتسب فور كل إجابة' : 'Points are awarded instantly per answer'}
        </p>
        <button onClick={restart} className="px-6 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold">
          {lang === 'ar' ? 'العب مرة أخرى' : 'Play Again'}
        </button>
      </div>
    );
  }

  if (!currentQ) return <div className="text-center text-muted-foreground py-10">…</div>;

  const options = lang === 'ar' ? currentQ.optionsAr : currentQ.optionsEn;
  const levelLabel = lang === 'ar'
    ? ['','سهل جداً','سهل','متوسط','صعب','صعب جداً'][currentQ.level]
    : ['','Very Easy','Easy','Medium','Hard','Very Hard'][currentQ.level];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-foreground">💰 {lang === 'ar' ? 'من سيربح المليون' : 'Millionaire'}</span>
        <GameInstructions titleAr="كيف تلعب" titleEn="How to Play"
          stepsAr={['الصعوبة تزداد تلقائياً مع كل إجابة صحيحة','لا تتكرر الأسئلة في نفس الجلسة','استخدم وسائل المساعدة بحكمة','جميع الأسئلة موثقة وصحيحة 100٪']}
          stepsEn={['Difficulty rises automatically with each correct answer','No question repeats in the same session','Use lifelines wisely','All facts are verified 100%']} />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{lang === 'ar' ? 'سؤال' : 'Q'} {round + 1}/{TOTAL_ROUNDS}</span>
        <div className="flex-1 h-1.5 rounded-full bg-secondary">
          <div className="h-full rounded-full gradient-primary transition-all" style={{ width: `${((round + 1) / TOTAL_ROUNDS) * 100}%` }} />
        </div>
        <span className="text-xs font-bold text-primary">🏆 {prizeTable[Math.min(round, prizeTable.length - 1)]}</span>
      </div>
      <div className="flex items-center justify-center gap-2 text-[10px]">
        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
          {lang === 'ar' ? 'المستوى' : 'Level'}: {levelLabel}
        </span>
        {streak > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-medium">
            🔥 {streak}
          </span>
        )}
        <span className="px-2 py-0.5 rounded-full bg-success/10 text-success font-medium">
          ✓ {score}
        </span>
      </div>

      <div className="flex gap-2 justify-center">
        <button onClick={useFiftyFifty} disabled={!lifelines.fiftyFifty}
          className={`px-3 py-1.5 rounded-full text-xs font-medium ${lifelines.fiftyFifty ? 'bg-primary/10 text-primary' : 'bg-secondary/50 text-muted-foreground line-through'}`}>
          50:50
        </button>
        <button onClick={useSkip} disabled={!lifelines.skip}
          className={`px-3 py-1.5 rounded-full text-xs font-medium ${lifelines.skip ? 'bg-primary/10 text-primary' : 'bg-secondary/50 text-muted-foreground line-through'}`}>
          ⏭️ {lang === 'ar' ? 'تخطي' : 'Skip'}
        </button>
        <button onClick={useHint} disabled={!lifelines.hint}
          className={`px-3 py-1.5 rounded-full text-xs font-medium ${lifelines.hint ? 'bg-primary/10 text-primary' : 'bg-secondary/50 text-muted-foreground line-through'}`}>
          💡 {lang === 'ar' ? 'تلميح' : 'Hint'}
        </button>
      </div>

      <div className="glass-card rounded-2xl p-5">
        <p className="text-sm font-semibold text-foreground text-center mb-4">{lang === 'ar' ? currentQ.qAr : currentQ.qEn}</p>
        {hintShown && (
          <p className="text-[11px] text-center text-amber-600 mb-3 animate-fade-in">
            💡 {lang === 'ar' ? 'الحرف الأول للإجابة:' : 'First letter:'} <strong>{options[currentQ.correctIndex].charAt(0)}</strong>
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {options.map((opt, i) => {
            if (eliminated.includes(i)) return <div key={i} className="p-3 rounded-xl bg-secondary/20 opacity-30" />;
            return (
              <button key={i} onClick={() => handleAnswer(i)}
                disabled={selected !== null}
                className={`p-3 rounded-xl text-xs font-medium transition-all text-start ${
                  selected === null ? 'bg-secondary/50 hover:bg-primary/10 active:scale-95' :
                  i === currentQ.correctIndex ? 'bg-success/20 text-success ring-2 ring-success' :
                  i === selected ? 'bg-destructive/20 text-destructive ring-2 ring-destructive' :
                  'bg-secondary/30 opacity-50'
                }`}>
                <span className="font-bold mr-1">{['A','B','C','D'][i]}.</span> {opt}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TriviaGame;
