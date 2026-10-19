import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import GameInstructions from './GameInstructions';

interface MazeGameProps {
  onScore: (pts: number) => void;
  difficulty?: string;
}

const MAX_LEVEL = 15;

// Maze size grows with level. Always odd for proper recursive backtracker.
function sizeForLevel(level: number) {
  // L1: 7x7, L15: 21x21
  const base = 7 + Math.floor((level - 1) * 1);
  const s = base % 2 === 0 ? base + 1 : base;
  return Math.min(s, 23);
}

/**
 * Generate a perfect maze using recursive backtracking.
 * Returns 2D grid: 1 = wall, 0 = path, 2 = exit (bottom-right corner area)
 * Starting position is always (1,1).
 */
function generateMaze(size: number): number[][] {
  // Init full of walls
  const grid: number[][] = Array.from({ length: size }, () => Array(size).fill(1));

  const carve = (x: number, y: number) => {
    grid[y][x] = 0;
    const dirs = [[0, -2], [2, 0], [0, 2], [-2, 0]];
    // Shuffle directions
    for (let i = dirs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
    }
    for (const [dx, dy] of dirs) {
      const nx = x + dx, ny = y + dy;
      if (nx > 0 && nx < size - 1 && ny > 0 && ny < size - 1 && grid[ny][nx] === 1) {
        grid[y + dy / 2][x + dx / 2] = 0; // remove wall between
        carve(nx, ny);
      }
    }
  };

  carve(1, 1);

  // Place exit — find nearest open cell to bottom-right
  let ex = size - 2, ey = size - 2;
  if (grid[ey][ex] !== 0) {
    // walk back along odd coords
    outer: for (let y = size - 2; y >= 1; y--) {
      for (let x = size - 2; x >= 1; x--) {
        if (grid[y][x] === 0) { ex = x; ey = y; break outer; }
      }
    }
  }
  grid[ey][ex] = 2;
  return grid;
}

type Theme = { player: string; goal: string; nameAr: string; nameEn: string };
const THEMES: Theme[] = [
  { player: '🐰', goal: '🥕', nameAr: 'الأرنب والجزرة', nameEn: 'Rabbit to Carrot' },
  { player: '🐶', goal: '🏠', nameAr: 'الكلب والمنزل', nameEn: 'Dog to House' },
  { player: '🐱', goal: '🐟', nameAr: 'القطة والسمكة', nameEn: 'Cat to Fish' },
  { player: '🐝', goal: '🌻', nameAr: 'النحلة والزهرة', nameEn: 'Bee to Flower' },
  { player: '🚗', goal: '🏁', nameAr: 'السيارة والهدف', nameEn: 'Car to Finish' },
  { player: '🦊', goal: '🍇', nameAr: 'الثعلب والعنب', nameEn: 'Fox to Grapes' },
];

const MazeGame = ({ onScore }: MazeGameProps) => {
  const { lang } = useLang();
  const [level, setLevel] = useState(1);
  const [seed, setSeed] = useState(0);
  const [pos, setPos] = useState({ x: 1, y: 1 });
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [failed, setFailed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  const size = sizeForLevel(level);
  const maze = useMemo(() => generateMaze(size), [size, seed, level]);
  const theme = THEMES[(level - 1) % THEMES.length];

  // Countdown timer scales with difficulty
  const initialTime = Math.max(20, 80 - level * 4);

  useEffect(() => {
    setPos({ x: 1, y: 1 });
    setMoves(0);
    setWon(false);
    setFailed(false);
    setTimeLeft(initialTime);
  }, [maze, initialTime]);

  // Tick timer
  useEffect(() => {
    if (won || failed) return;
    if (timeLeft <= 0) { setFailed(true); return; }
    const id = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft, won, failed]);

  const move = useCallback((dx: number, dy: number) => {
    if (won || failed) return;
    setPos(prev => {
      const nx = prev.x + dx;
      const ny = prev.y + dy;
      if (ny < 0 || ny >= maze.length || nx < 0 || nx >= maze[0].length) return prev;
      if (maze[ny][nx] === 1) return prev;
      setMoves(m => m + 1);
      if (maze[ny][nx] === 2) setWon(true);
      return { x: nx, y: ny };
    });
  }, [maze, won, failed]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': e.preventDefault(); move(0, -1); break;
        case 'ArrowDown': case 's': case 'S': e.preventDefault(); move(0, 1); break;
        case 'ArrowLeft': case 'a': case 'A': e.preventDefault(); move(-1, 0); break;
        case 'ArrowRight': case 'd': case 'D': e.preventDefault(); move(1, 0); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [move]);

  useEffect(() => {
    if (won) {
      onScore(2); // Set to 2 points per game as requested
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [won]);

  const nextLevel = () => {
    if (level < MAX_LEVEL) setLevel(l => l + 1);
    else setSeed(s => s + 1);
  };
  const retry = () => setSeed(s => s + 1);

  const cellSize = Math.max(14, Math.min(28, Math.floor(360 / size)));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-foreground">
          {theme.player}→{theme.goal} {lang === 'ar' ? theme.nameAr : theme.nameEn} — {lang === 'ar' ? 'مستوى' : 'Lv'} {level}/{MAX_LEVEL}
        </span>
        <GameInstructions titleAr="كيف تلعب المتاهة" titleEn="How to Play Maze"
          stepsAr={['استخدم الأسهم أو الأزرار للتحرك','الجدران تمنع الحركة','الوصول للهدف ينقلك للمستوى التالي','أكمل قبل انتهاء العدّاد']}
          stepsEn={['Use arrows or buttons to move','Walls block you','Reach the goal to advance','Beat the countdown!']} />
      </div>

      <div className="flex items-center justify-center gap-2 text-[10px]">
        <span className={`px-2 py-0.5 rounded-full font-medium ${timeLeft <= 10 ? 'bg-destructive/20 text-destructive' : 'bg-primary/10 text-primary'}`}>
          ⏱ {timeLeft}s
        </span>
        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
          {moves} {lang === 'ar' ? 'حركة' : 'moves'}
        </span>
        <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
          {size}×{size}
        </span>
        <button onClick={retry} className="px-2 py-0.5 rounded-full bg-secondary text-foreground hover:bg-primary/10">
          🔄 {lang === 'ar' ? 'جديد' : 'New'}
        </button>
      </div>

      <div className="flex justify-center" dir="ltr">
        <div className="rounded-xl overflow-hidden border border-border bg-background">
          {maze.map((row, y) => (
            <div key={y} className="flex">
              {row.map((cell, x) => (
                <div key={x} style={{ width: cellSize, height: cellSize }}
                  className={`flex items-center justify-center text-[10px] ${
                    pos.x === x && pos.y === y ? 'bg-primary' :
                    cell === 1 ? 'bg-foreground/25' :
                    cell === 2 ? 'bg-success/40' : 'bg-background'
                  }`}>
                  {pos.x === x && pos.y === y && theme.player}
                  {cell === 2 && !(pos.x === x && pos.y === y) && theme.goal}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {won && (
        <div className="text-center p-3 rounded-xl bg-success/10 animate-bounce-in space-y-2">
          <p className="font-bold text-success">
            🎉 {lang === 'ar' ? `أحسنت! انتهيت من المستوى ${level}` : `Level ${level} complete!`}
          </p>
          <button onClick={nextLevel} className="px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold">
            {level < MAX_LEVEL
              ? (lang === 'ar' ? `المستوى التالي ▶` : `Next Level ▶`)
              : (lang === 'ar' ? 'متاهة جديدة 🔄' : 'New Maze 🔄')}
          </button>
        </div>
      )}

      {failed && (
        <div className="text-center p-3 rounded-xl bg-destructive/10 space-y-2">
          <p className="font-bold text-destructive">
            ⏱ {lang === 'ar' ? 'انتهى الوقت!' : 'Time up!'}
          </p>
          <button onClick={retry} className="px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold">
            {lang === 'ar' ? 'حاول مجدداً' : 'Retry'}
          </button>
        </div>
      )}

      {/* Controls — forced LTR so the visible ← always moves left, → moves right */}
      <div className="flex flex-col items-center gap-1" dir="ltr">
        <button onClick={() => move(0, -1)} aria-label="up" className="w-12 h-12 rounded-xl bg-secondary text-foreground font-bold active:scale-90">↑</button>
        <div className="flex gap-1">
          <button onClick={() => move(-1, 0)} aria-label="left" className="w-12 h-12 rounded-xl bg-secondary text-foreground font-bold active:scale-90">←</button>
          <button onClick={() => move(0, 1)} aria-label="down" className="w-12 h-12 rounded-xl bg-secondary text-foreground font-bold active:scale-90">↓</button>
          <button onClick={() => move(1, 0)} aria-label="right" className="w-12 h-12 rounded-xl bg-secondary text-foreground font-bold active:scale-90">→</button>
        </div>
      </div>
    </div>
  );
};

export default MazeGame;
