import { useEffect, useMemo, useRef, useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';

interface Props { onScore?: (n: number) => void; }

/**
 * Expanded Logic Games:
 *   - Boolean truth-tables (AND/OR/XOR/NOT)
 *   - Syllogism / category deduction
 *   - Symbol/shape sequence next-element
 *   - Pattern recognition (number rule)
 *   - Memory matrix (memorize lit cells, then recall)
 *   - Liar/truth deduction
 *   - Analogies
 */

type StaticQuiz = {
  kind: 'static';
  q: string;
  opts: string[];
  ans: string;
  hint?: string;
};

type MatrixQuiz = {
  kind: 'matrix';
  size: number;
  lit: number[]; // indices that are lit
};

type Quiz = StaticQuiz | MatrixQuiz;

const buildBoolean = (): StaticQuiz => {
  const a = Math.random() < 0.5;
  const b = Math.random() < 0.5;
  const op = ['AND', 'OR', 'XOR', 'NOT-AND'][Math.floor(Math.random() * 4)];
  let res: boolean;
  if (op === 'AND') res = a && b;
  else if (op === 'OR') res = a || b;
  else if (op === 'XOR') res = a !== b;
  else res = !(a && b);
  return {
    kind: 'static',
    q: `${a ? 'TRUE' : 'FALSE'} ${op} ${b ? 'TRUE' : 'FALSE'} = ?`,
    opts: ['TRUE', 'FALSE'],
    ans: res ? 'TRUE' : 'FALSE',
  };
};

const SYLLOGISMS: StaticQuiz[] = [
  { kind: 'static', q: 'All cats are mammals. Tom is a cat. Tom is a ?', opts: ['Mammal','Bird','Fish','Reptile'], ans: 'Mammal' },
  { kind: 'static', q: 'No fish can fly. A salmon is a fish. Can a salmon fly?', opts: ['Yes','No','Sometimes','Unknown'], ans: 'No' },
  { kind: 'static', q: 'All squares are rectangles. Some rectangles are red. So:', opts: ['All squares are red','Some squares may be red','No squares are red','All red things are squares'], ans: 'Some squares may be red' },
];

const PATTERNS: StaticQuiz[] = [
  { kind: 'static', q: '2, 4, 8, 16, ?', opts: ['24', '32', '20', '18'], ans: '32', hint: '×2' },
  { kind: 'static', q: '1, 4, 9, 16, ?', opts: ['25', '20', '24', '36'], ans: '25', hint: 'squares' },
  { kind: 'static', q: '1, 1, 2, 3, 5, 8, ?', opts: ['11','12','13','14'], ans: '13', hint: 'sum prev 2' },
  { kind: 'static', q: '3, 6, 12, 24, ?', opts: ['36', '48', '30', '40'], ans: '48', hint: '×2' },
  { kind: 'static', q: '🔺 🔵 🔺 🔵 ?', opts: ['🔺','🔵','🟢','🟡'], ans: '🔺' },
  { kind: 'static', q: '⬛ ⬜ ⬛ ⬜ ⬛ ?', opts: ['⬛','⬜','🔺','🔵'], ans: '⬜' },
];

const ANALOGIES: StaticQuiz[] = [
  { kind: 'static', q: 'Hand : Glove :: Foot : ?', opts: ['Sock','Hat','Shoe','Belt'], ans: 'Shoe' },
  { kind: 'static', q: 'Bird : Sky :: Fish : ?', opts: ['Sea','Tree','Cave','Cloud'], ans: 'Sea' },
  { kind: 'static', q: 'Day : Sun :: Night : ?', opts: ['Star','Moon','Owl','Lamp'], ans: 'Moon' },
];

const LIARS: StaticQuiz[] = [
  { kind: 'static', q: 'A says "I am lying". Is A lying?', opts: ['Yes','No','Paradox','Truth'], ans: 'Paradox' },
  { kind: 'static', q: 'A says "B is honest". B says "A lies". Who tells the truth?', opts: ['A','B','Both','Neither / Unknown'], ans: 'Neither / Unknown' },
];

const buildMatrix = (size = 3, lit = 3): MatrixQuiz => {
  const idx = new Set<number>();
  while (idx.size < lit) idx.add(Math.floor(Math.random() * size * size));
  return { kind: 'matrix', size, lit: Array.from(idx) };
};

const buildQuiz = (round: number): Quiz => {
  const r = Math.random();
  if (round > 0 && round % 4 === 0) return buildMatrix(3, Math.min(5, 3 + Math.floor(round / 8)));
  if (r < 0.25) return buildBoolean();
  if (r < 0.45) return SYLLOGISMS[Math.floor(Math.random() * SYLLOGISMS.length)];
  if (r < 0.7)  return PATTERNS[Math.floor(Math.random() * PATTERNS.length)];
  if (r < 0.88) return ANALOGIES[Math.floor(Math.random() * ANALOGIES.length)];
  return LIARS[Math.floor(Math.random() * LIARS.length)];
};

const LogicGames = ({ onScore }: Props) => {
  const { lang } = useLang();
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [pick, setPick] = useState<string | null>(null);

  // Matrix-specific state
  const [matrixPhase, setMatrixPhase] = useState<'show' | 'recall' | 'done'>('show');
  const [matrixGuess, setMatrixGuess] = useState<Set<number>>(new Set());
  const matrixTimer = useRef<number | null>(null);

  const quiz = useMemo(() => buildQuiz(round), [round]);

  // Setup matrix phase
  useEffect(() => {
    setPick(null);
    setMatrixGuess(new Set());
    if (quiz.kind === 'matrix') {
      setMatrixPhase('show');
      if (matrixTimer.current) window.clearTimeout(matrixTimer.current);
      matrixTimer.current = window.setTimeout(() => setMatrixPhase('recall'), 2200) as unknown as number;
    }
    return () => {
      if (matrixTimer.current) window.clearTimeout(matrixTimer.current);
    };
  }, [quiz]);

  const next = () => setRound(r => r + 1);

  const choose = (opt: string) => {
    if (quiz.kind !== 'static' || pick) return;
    setPick(opt);
    if (opt === quiz.ans) {
      setScore(s => s + 1);
      onScore?.(2);
    }
  };

  const submitMatrix = () => {
    if (quiz.kind !== 'matrix') return;
    const correct = quiz.lit.every(i => matrixGuess.has(i)) && matrixGuess.size === quiz.lit.length;
    setMatrixPhase('done');
    if (correct) {
      setScore(s => s + 1);
      onScore?.(3);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center mx-auto mb-2">
          <span className="text-2xl">🧠</span>
        </div>
        <h2 className="text-lg font-bold">{lang === 'ar' ? 'ألعاب المنطق' : 'Logic Games'}</h2>
        <p className="text-xs text-muted-foreground">
          {lang === 'ar' ? `منطق · أنماط · ذاكرة — نقاطك: ${score}` : `Logic · patterns · memory — score: ${score}`}
        </p>
      </div>

      <div className="glass-card rounded-2xl p-5 space-y-4">
        {quiz.kind === 'static' && (
          <>
            <p className="text-lg font-bold text-center" dir="ltr">{quiz.q}</p>
            <div className="grid grid-cols-2 gap-2">
              {quiz.opts.map(opt => {
                const isAns = pick && opt === quiz.ans;
                const isWrong = pick === opt && opt !== quiz.ans;
                return (
                  <button key={opt} onClick={() => choose(opt)}
                    className={`p-3 rounded-xl font-semibold text-sm ${
                      isAns ? 'bg-success/20 text-success' :
                      isWrong ? 'bg-destructive/20 text-destructive' :
                      'bg-secondary hover:bg-secondary/70'
                    }`}>
                    {opt}
                  </button>
                );
              })}
            </div>
            {pick && (
              <button onClick={next} className="w-full py-2.5 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm">
                {pick === quiz.ans ? '✓ ' : '✗ '}{lang === 'ar' ? 'التالي' : 'Next'}
              </button>
            )}
          </>
        )}

        {quiz.kind === 'matrix' && (
          <>
            <p className="text-sm font-bold text-center">
              {matrixPhase === 'show'
                ? (lang === 'ar' ? 'احفظي الخلايا المضيئة 👁️' : 'Memorize the lit cells 👁️')
                : matrixPhase === 'recall'
                  ? (lang === 'ar' ? 'اضغطي على الخلايا التي كانت مضيئة' : 'Tap the cells that were lit')
                  : (lang === 'ar' ? 'النتيجة' : 'Result')}
            </p>
            <div
              className="grid gap-2 mx-auto"
              style={{ gridTemplateColumns: `repeat(${quiz.size}, 1fr)`, maxWidth: quiz.size * 56 }}
            >
              {Array.from({ length: quiz.size * quiz.size }).map((_, i) => {
                const isLit = quiz.lit.includes(i);
                const isGuess = matrixGuess.has(i);
                let bg = 'bg-secondary';
                if (matrixPhase === 'show' && isLit) bg = 'bg-amber-400 ring-2 ring-amber-300';
                else if (matrixPhase === 'recall') bg = isGuess ? 'bg-primary/40 ring-2 ring-primary' : 'bg-secondary hover:bg-secondary/70';
                else if (matrixPhase === 'done') {
                  if (isLit && isGuess) bg = 'bg-success/40 ring-2 ring-success';
                  else if (isLit) bg = 'bg-amber-400/60';
                  else if (isGuess) bg = 'bg-destructive/40 ring-2 ring-destructive';
                }
                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (matrixPhase !== 'recall') return;
                      setMatrixGuess(prev => {
                        const n = new Set(prev);
                        if (n.has(i)) n.delete(i); else n.add(i);
                        return n;
                      });
                    }}
                    className={`aspect-square rounded-lg transition-all ${bg}`} />
                );
              })}
            </div>
            {matrixPhase === 'recall' && (
              <button onClick={submitMatrix} disabled={matrixGuess.size === 0}
                className="w-full py-2.5 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm disabled:opacity-50">
                {lang === 'ar' ? 'تأكيد' : 'Submit'}
              </button>
            )}
            {matrixPhase === 'done' && (
              <button onClick={next} className="w-full py-2.5 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm">
                {lang === 'ar' ? 'لغز جديد ▶' : 'New puzzle ▶'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LogicGames;
