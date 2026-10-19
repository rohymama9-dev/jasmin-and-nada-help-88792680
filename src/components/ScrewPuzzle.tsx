import { useEffect, useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface Props { onScore?: (n: number) => void; }

/**
 * Screw Puzzle — sort colored screws into tubes so each tube holds one color.
 * Click a source tube then a target. Top screw moves if target is empty or top color matches.
 */
const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#f97316'];

const LEVELS: { numColors: number; tubeCapacity: number; emptyTubes: number; shufflePasses: number }[] = [
  { numColors: 2, tubeCapacity: 3, emptyTubes: 2, shufflePasses: 8 },
  { numColors: 3, tubeCapacity: 3, emptyTubes: 2, shufflePasses: 10 },
  { numColors: 3, tubeCapacity: 4, emptyTubes: 2, shufflePasses: 12 },
  { numColors: 4, tubeCapacity: 4, emptyTubes: 2, shufflePasses: 16 },
  { numColors: 4, tubeCapacity: 4, emptyTubes: 1, shufflePasses: 18 },
  { numColors: 5, tubeCapacity: 4, emptyTubes: 2, shufflePasses: 20 },
  { numColors: 5, tubeCapacity: 5, emptyTubes: 2, shufflePasses: 24 },
  { numColors: 5, tubeCapacity: 5, emptyTubes: 1, shufflePasses: 26 },
  { numColors: 6, tubeCapacity: 5, emptyTubes: 2, shufflePasses: 30 },
  { numColors: 6, tubeCapacity: 5, emptyTubes: 1, shufflePasses: 34 },
  { numColors: 6, tubeCapacity: 6, emptyTubes: 2, shufflePasses: 38 },
  { numColors: 6, tubeCapacity: 6, emptyTubes: 1, shufflePasses: 42 },
  { numColors: 7, tubeCapacity: 5, emptyTubes: 2, shufflePasses: 46 },
  { numColors: 7, tubeCapacity: 6, emptyTubes: 1, shufflePasses: 50 },
  { numColors: 8, tubeCapacity: 6, emptyTubes: 1, shufflePasses: 56 },
];

const MAX_LEVEL = LEVELS.length;

const buildLevel = (cfg: { numColors: number; tubeCapacity: number; emptyTubes: number; shufflePasses: number }): string[][] => {
  const { numColors, tubeCapacity, emptyTubes, shufflePasses } = cfg;
  const colors = COLORS.slice(0, Math.min(numColors, COLORS.length));
  const pool: string[] = [];
  colors.forEach(c => { for (let i = 0; i < tubeCapacity; i++) pool.push(c); });
  for (let i = 0; i < shufflePasses; i += 1) {
    const a = Math.floor(Math.random() * pool.length);
    const b = Math.floor(Math.random() * pool.length);
    [pool[a], pool[b]] = [pool[b], pool[a]];
  }
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const tubes: string[][] = [];
  const filledTubes = colors.length;
  for (let i = 0; i < filledTubes; i++) tubes.push(pool.slice(i * tubeCapacity, (i + 1) * tubeCapacity));
  // add empty work tubes
  for (let e = 0; e < emptyTubes; e++) tubes.push([]);
  return tubes;
};

const ScrewPuzzle = ({ onScore }: Props) => {
  const { lang } = useLang();
  const [level, setLevel] = useState(1);
  const cfg = LEVELS[Math.max(0, Math.min(level - 1, LEVELS.length - 1))];
  const [tubes, setTubes] = useState<string[][]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [status, setStatus] = useState<'playing' | 'won' | 'finished'>('playing');

  useEffect(() => {
    setTubes(buildLevel(cfg));
    setMoves(0);
    setSelected(null);
    setStatus(level >= MAX_LEVEL ? 'playing' : 'playing');
  }, [level]);

  const tap = (i: number) => {
    if (selected === null) {
      if (tubes[i].length > 0) setSelected(i);
      return;
    }
    if (selected === i) { setSelected(null); return; }
    const src = [...tubes[selected]];
    const dst = [...tubes[i]];
    const top = src[src.length - 1];
    const capacity = cfg.tubeCapacity;
    if (dst.length >= capacity) { setSelected(null); return; }
    if (dst.length > 0 && dst[dst.length - 1] !== top) { setSelected(null); return; }
    dst.push(src.pop()!);
    const next = tubes.map((t, idx) => idx === selected ? src : idx === i ? dst : t);
    setTubes(next);
    setMoves(m => m + 1);
    setSelected(null);
    // win check
    const won = next.every(t => t.length === 0 || (t.length === capacity && t.every(c => c === t[0])));
    if (won) {
      setStatus(level === MAX_LEVEL ? 'finished' : 'won');
      onScore?.(2);
      toast.success(lang === 'ar' ? `🎉 تم إنهاء المستوى ${level}` : `🎉 Level ${level} cleared`);
    }
  };

  const reset = () => {
    setTubes(buildLevel(cfg));
    setMoves(0);
    setSelected(null);
    setStatus('playing');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold">🔩 {lang === 'ar' ? 'لغز المسامير' : 'Screw Puzzle'}</h2>
        <div className="flex gap-2 text-xs">
          <span className="px-2 py-1 rounded-lg bg-primary/10 font-bold">Lv {level}/{MAX_LEVEL}</span>
          <span className="px-2 py-1 rounded-lg bg-secondary font-bold">{moves} {lang === 'ar' ? 'حركة' : 'moves'}</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        {lang === 'ar'
          ? `ألوان ${cfg.numColors} · سعة ${cfg.tubeCapacity} · أنابيب فارغة ${cfg.emptyTubes}`
          : `${cfg.numColors} colors · capacity ${cfg.tubeCapacity} · ${cfg.emptyTubes} empty tubes`}
      </p>
      <div className="flex flex-wrap gap-3 justify-center p-4 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200">
        {tubes.map((t, i) => (
          <button key={i} onClick={() => tap(i)}
            className={`relative flex flex-col-reverse w-12 h-44 rounded-b-2xl border-2 border-slate-400 bg-white/80 transition ${
              selected === i ? 'ring-4 ring-primary -translate-y-2' : ''
            }`}>
            {t.map((c, idx) => (
              <div key={idx} className="w-full" style={{ height: `${100 / cfg.tubeCapacity}%`, minHeight: 8, background: c }} />
            ))}
          </button>
        ))}
      </div>
      {status !== 'playing' && (
        <div className="rounded-2xl p-4 bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3">
          <p className="font-bold text-emerald-700">
            {status === 'finished'
              ? (lang === 'ar' ? '🏆 أنهيتِ جميع المستويات الخمسة عشر!' : '🏆 You finished all 15 levels!')
              : (lang === 'ar' ? '✅ جاهزة للمستوى التالي' : '✅ Ready for the next level')}
          </p>
          {status === 'won' && (
            <button
              onClick={() => setLevel((current) => Math.min(MAX_LEVEL, current + 1))}
              className="px-4 py-2 rounded-xl gradient-primary text-primary-foreground font-bold"
            >
              {lang === 'ar' ? 'المستوى التالي' : 'Next level'}
            </button>
          )}
        </div>
      )}
      <div className="flex justify-center gap-3">
        <button onClick={reset} className="px-4 py-2 rounded-xl bg-secondary text-foreground font-bold">
          🔄 {lang === 'ar' ? 'إعادة' : 'Reset'}
        </button>
        {level > 1 && (
          <button
            onClick={() => setLevel((current) => Math.max(1, current - 1))}
            className="px-4 py-2 rounded-xl bg-primary/10 text-primary font-bold"
          >
            {lang === 'ar' ? 'السابق' : 'Previous'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ScrewPuzzle;
