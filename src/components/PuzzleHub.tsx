import { useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';

interface Props { onScore?: (n: number) => void; }

/** Puzzle Hub: rotating mini brain teasers (sequence, missing-number, odd-one-out). */

type Puzzle =
  | { type: 'seq'; q: string; opts: string[]; ans: string; }
  | { type: 'odd'; q: string; opts: string[]; ans: string; }
  | { type: 'missing'; q: string; opts: string[]; ans: string; };

const POOL: Puzzle[] = [
  { type: 'seq', q: '2, 4, 8, 16, ?', opts: ['24', '32', '20', '18'], ans: '32' },
  { type: 'seq', q: '1, 4, 9, 16, ?', opts: ['25', '20', '24', '36'], ans: '25' },
  { type: 'seq', q: '3, 6, 12, 24, ?', opts: ['36', '48', '30', '40'], ans: '48' },
  { type: 'odd', q: 'Apple · Banana · Carrot · Cherry', opts: ['Apple','Banana','Carrot','Cherry'], ans: 'Carrot' },
  { type: 'odd', q: 'Cat · Dog · Fish · Car', opts: ['Cat','Dog','Fish','Car'], ans: 'Car' },
  { type: 'missing', q: 'A, C, E, G, ?', opts: ['H','I','J','K'], ans: 'I' },
  { type: 'missing', q: '5, 10, ?, 20, 25', opts: ['12','14','15','18'], ans: '15' },
  { type: 'seq', q: '1, 1, 2, 3, 5, 8, ?', opts: ['11','12','13','14'], ans: '13' },
  { type: 'odd', q: 'Triangle · Square · Circle · Cube', opts: ['Triangle','Square','Circle','Cube'], ans: 'Cube' },
  { type: 'missing', q: 'Mon, Tue, ?, Thu', opts: ['Sun','Wed','Fri','Sat'], ans: 'Wed' },
];

const reshuffle = () => [...POOL].sort(() => Math.random() - 0.5);

const PuzzleHub = ({ onScore }: Props) => {
  const { lang } = useLang();
  const [shuffled, setShuffled] = useState<Puzzle[]>(() => reshuffle());
  const [idx, setIdx] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const p = shuffled[idx];
  const correct = pick === p.ans;

  const next = () => {
    setPick(null);
    const ni = idx + 1;
    if (ni >= shuffled.length) {
      // Reshuffle with a different order so puzzles don't repeat in the same sequence.
      let fresh = reshuffle();
      if (fresh[0]?.q === shuffled[shuffled.length - 1]?.q) fresh = reshuffle();
      setShuffled(fresh);
      setIdx(0);
    } else {
      setIdx(ni);
    }
  };

  const choose = (opt: string) => {
    if (pick) return;
    setPick(opt);
    if (opt === p.ans) {
      setScore(s => s + 1);
      onScore?.(2);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center mx-auto mb-2">
          <span className="text-2xl">🧩</span>
        </div>
        <h2 className="text-lg font-bold">{lang === 'ar' ? 'مركز الألغاز' : 'Puzzle Hub'}</h2>
        <p className="text-xs text-muted-foreground">
          {lang === 'ar' ? `ألغاز سريعة لتنشيط الذهن — نقاطك: ${score}` : `Quick puzzles to activate your brain — score: ${score}`}
        </p>
      </div>

      <div className="glass-card rounded-2xl p-5 space-y-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {p.type === 'seq' && (lang === 'ar' ? 'تسلسل' : 'Sequence')}
          {p.type === 'odd' && (lang === 'ar' ? 'الشاذ' : 'Odd one out')}
          {p.type === 'missing' && (lang === 'ar' ? 'الناقص' : 'Find the missing')}
        </p>
        <p className="text-xl font-bold text-center">{p.q}</p>
        <div className="grid grid-cols-2 gap-2">
          {p.opts.map(opt => {
            const isAns = pick && opt === p.ans;
            const isWrong = pick === opt && opt !== p.ans;
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
            {correct ? '✓ ' : '✗ '}{lang === 'ar' ? 'التالي' : 'Next puzzle'}
          </button>
        )}
      </div>
    </div>
  );
};

export default PuzzleHub;
