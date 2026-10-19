import { useMemo, useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Lightbulb, Play } from 'lucide-react';
import { toast } from 'sonner';

interface Props { onScore?: (n: number) => void; }

// A handful of seed puzzles (0 = blank).
const PUZZLES: { puzzle: number[]; solution: number[] }[] = [
  {
    puzzle: [
      5,3,0, 0,7,0, 0,0,0,
      6,0,0, 1,9,5, 0,0,0,
      0,9,8, 0,0,0, 0,6,0,
      8,0,0, 0,6,0, 0,0,3,
      4,0,0, 8,0,3, 0,0,1,
      7,0,0, 0,2,0, 0,0,6,
      0,6,0, 0,0,0, 2,8,0,
      0,0,0, 4,1,9, 0,0,5,
      0,0,0, 0,8,0, 0,7,9,
    ],
    solution: [
      5,3,4, 6,7,8, 9,1,2,
      6,7,2, 1,9,5, 3,4,8,
      1,9,8, 3,4,2, 5,6,7,
      8,5,9, 7,6,1, 4,2,3,
      4,2,6, 8,5,3, 7,9,1,
      7,1,3, 9,2,4, 8,5,6,
      9,6,1, 5,3,7, 2,8,4,
      2,8,7, 4,1,9, 6,3,5,
      3,4,5, 2,8,6, 1,7,9,
    ],
  },
];

const FREE_HINTS = 2;
const HINTS_KEY = 'sudoku-hints-used';

const Sudoku = ({ onScore }: Props) => {
  const { lang } = useLang();
  const [pIdx] = useState(0);
  const seed = PUZZLES[pIdx];
  const initial = useMemo(() => seed.puzzle.slice(), [seed]);
  const [cells, setCells] = useState<number[]>(() => seed.puzzle.slice());
  const [sel, setSel] = useState<number | null>(null);
  const [hintsUsed, setHintsUsed] = useState(() => parseInt(localStorage.getItem(HINTS_KEY) || '0', 10) || 0);
  const [adPlaying, setAdPlaying] = useState(false);
  const [adProgress, setAdProgress] = useState(0);

  const setCell = (n: number) => {
    if (sel === null || initial[sel] !== 0) return;
    const nc = cells.slice(); nc[sel] = n;
    setCells(nc);
    if (nc.every((v, i) => v === seed.solution[i])) {
      onScore?.(50);
      toast.success(lang === 'ar' ? '🎉 أحسنتِ! +50' : '🎉 Solved! +50');
    }
  };

  const useHint = () => {
    if (sel === null || initial[sel] !== 0 || cells[sel] === seed.solution[sel]) return;
    const apply = () => { const nc = cells.slice(); nc[sel] = seed.solution[sel]; setCells(nc); };
    if (hintsUsed < FREE_HINTS) {
      apply();
      const nu = hintsUsed + 1; setHintsUsed(nu); localStorage.setItem(HINTS_KEY, String(nu));
    } else {
      setAdPlaying(true); setAdProgress(0);
      const id = setInterval(() => {
        setAdProgress(p => {
          if (p >= 100) { clearInterval(id); setAdPlaying(false); apply(); return 100; }
          return p + 5;
        });
      }, 150);
    }
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-extrabold text-center">🧩 {lang === 'ar' ? 'سودوكو' : 'Sudoku'}</h2>
      <div className="grid grid-cols-9 gap-px bg-slate-900 p-1 rounded-xl max-w-md mx-auto">
        {cells.map((v, i) => {
          const fixed = initial[i] !== 0;
          const wrong = v !== 0 && v !== seed.solution[i];
          const br = i % 9 === 2 || i % 9 === 5 ? 'border-r-2 border-r-slate-900' : '';
          const bb = Math.floor(i / 9) === 2 || Math.floor(i / 9) === 5 ? 'border-b-2 border-b-slate-900' : '';
          return (
            <button key={i} onClick={() => setSel(i)}
              className={`aspect-square text-sm font-extrabold flex items-center justify-center ${br} ${bb} ${
                sel === i ? 'bg-amber-200' : fixed ? 'bg-slate-200 text-slate-900' : 'bg-white'
              } ${wrong ? 'text-red-600' : 'text-slate-800'}`}>
              {v || ''}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-9 gap-1 max-w-md mx-auto">
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button key={n} onClick={() => setCell(n)}
            className="aspect-square rounded-lg bg-primary text-primary-foreground font-bold">{n}</button>
        ))}
      </div>
      <div className="flex gap-2 max-w-md mx-auto">
        <button onClick={() => setCell(0)} className="flex-1 py-2 rounded-lg bg-secondary font-bold text-sm">
          {lang === 'ar' ? 'مسح' : 'Erase'}
        </button>
        <button onClick={useHint} disabled={adPlaying}
          className="flex-1 py-2 rounded-lg bg-amber-400 text-amber-950 font-bold text-sm flex items-center justify-center gap-1">
          <Lightbulb size={14} />
          {hintsUsed < FREE_HINTS
            ? `${lang === 'ar' ? 'تلميح' : 'Hint'} (${FREE_HINTS - hintsUsed})`
            : (lang === 'ar' ? '🎬 إعلان' : '🎬 Ad')}
        </button>
      </div>
      {adPlaying && (
        <div className="rounded-xl p-3 bg-slate-900 text-white text-center space-y-2 max-w-md mx-auto">
          <Play className="mx-auto animate-pulse" size={18} />
          <p className="text-xs font-bold">{lang === 'ar' ? 'إعلان...' : 'Ad playing...'}</p>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-400 transition-all" style={{ width: `${adProgress}%` }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Sudoku;