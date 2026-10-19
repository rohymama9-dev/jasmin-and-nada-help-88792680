import { useState, useMemo } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import LevelHUD from './games/LevelHUD';

interface Props { onScore: (pts: number) => void; }

const MAX_LEVEL = 15;
const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#78350f', '#64748b'];

// Build a target pattern per level (grid of color indices, 0 = empty)
function buildTarget(level: number): number[][] {
  const size = Math.min(4 + Math.floor((level - 1) / 2), 9);
  const fillRatio = 0.4 + Math.min(0.4, level * 0.03);
  const grid: number[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => Math.random() < fillRatio ? 1 + Math.floor(Math.random() * Math.min(3 + Math.floor(level / 2), COLORS.length)) : 0)
  );
  return grid;
}

const VoxelBuilder = ({ onScore }: Props) => {
  const { lang } = useLang();
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [seed, setSeed] = useState(0);
  const [color, setColor] = useState(1);
  const target = useMemo(() => buildTarget(level), [level, seed]);
  const size = target.length;
  const [grid, setGrid] = useState<number[][]>(() => Array.from({ length: size }, () => Array(size).fill(0)));

  // Reset grid when target changes
  useMemo(() => {
    setGrid(Array.from({ length: target.length }, () => Array(target.length).fill(0)));
  }, [target]);

  const paint = (r: number, c: number) => {
    setGrid(g => g.map((row, i) => i === r ? row.map((v, j) => j === c ? color : v) : row));
  };

  const matches = grid.flat().filter((v, i) => v === target.flat()[i]).length;
  const total = size * size;
  const pct = Math.round((matches / total) * 100);
  const complete = pct === 100;

  const submit = () => {
    if (!complete) return;
    setScore(s => s + level * 4);
    onScore(3);
    if (level < MAX_LEVEL) setLevel(l => l + 1); else setSeed(s => s + 1);
  };

  return (
    <div className="space-y-3">
      <LevelHUD level={level} score={score} />
      <p className="text-center text-xs text-muted-foreground">
        {lang === 'ar' ? 'انسخ النموذج باستخدام الألوان' : 'Copy the target pattern using colors'}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-2xl p-2">
          <p className="text-[10px] text-center text-muted-foreground mb-1">{lang === 'ar' ? 'النموذج' : 'Target'}</p>
          <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
            {target.flat().map((v, i) => (
              <div key={i} className="aspect-square rounded-sm border border-border/30"
                style={{ backgroundColor: v === 0 ? 'transparent' : COLORS[v - 1] }} />
            ))}
          </div>
        </div>
        <div className="glass-card rounded-2xl p-2">
          <p className="text-[10px] text-center text-muted-foreground mb-1">{lang === 'ar' ? 'بناؤك' : 'Yours'} ({pct}%)</p>
          <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
            {grid.flat().map((v, i) => {
              const r = Math.floor(i / size), c = i % size;
              return (
                <button key={i} onClick={() => paint(r, c)}
                  className="aspect-square rounded-sm border border-border/30 active:scale-90"
                  style={{ backgroundColor: v === 0 ? 'hsl(var(--muted))' : COLORS[v - 1] }} />
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex gap-1.5 justify-center flex-wrap">
        <button onClick={() => setColor(0)}
          className={`w-8 h-8 rounded-lg border-2 ${color === 0 ? 'border-primary ring-2 ring-primary' : 'border-border'} bg-muted text-xs`}>✕</button>
        {COLORS.map((c, i) => (
          <button key={c} onClick={() => setColor(i + 1)}
            className={`w-8 h-8 rounded-lg border-2 ${color === i + 1 ? 'border-primary ring-2 ring-primary' : 'border-border'}`}
            style={{ backgroundColor: c }} />
        ))}
      </div>
      <div className="flex justify-center">
        <button onClick={submit} disabled={!complete}
          className={`px-5 py-2 rounded-xl text-sm font-bold ${complete ? 'gradient-primary text-primary-foreground animate-bounce-in' : 'bg-secondary text-muted-foreground'}`}>
          {complete ? (lang === 'ar' ? '✅ انتقل للمستوى التالي' : '✅ Next Level') : (lang === 'ar' ? `أكمل (${pct}%)` : `Continue (${pct}%)`)}
        </button>
      </div>
    </div>
  );
};

export default VoxelBuilder;
