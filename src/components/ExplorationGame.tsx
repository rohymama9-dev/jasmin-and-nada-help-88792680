import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useLang } from '@/contexts/LanguageContext';

interface ExplorationGameProps {
  onScore: (pts: number) => void;
}

const TILE = 32;
const COLS = 11;
const ROWS = 13;
const W = COLS * TILE;
const H = ROWS * TILE;
const MAX_LEVEL = 15;

const MAP = [
  [1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,1,0,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,0,1,1,1,0,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,0,1,0,1,0,1,0,1],
  [1,0,0,0,0,0,0,0,1,0,1],
  [1,0,1,1,0,1,0,0,0,0,1],
  [1,0,0,0,0,1,0,1,1,0,1],
  [1,0,1,0,0,0,0,0,0,0,1],
  [1,0,0,0,1,0,1,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1],
];

interface Gem { x: number; y: number; collected: boolean; color: string }
interface Enemy { x: number; y: number; emoji: string; cooldown: number }

const ENEMY_EMOJIS = ['👻', '🦇', '🐺', '👹', '🕷️'];
const GEM_COLORS = ['#E74C3C', '#F39C12', '#2ECC71', '#3498DB', '#9B59B6', '#00BCD4', '#FF5722', '#E91E63'];

// Find shortest BFS step from (sx,sy) toward (tx,ty), returning next (x,y) or null
function bfsStep(sx: number, sy: number, tx: number, ty: number): { x: number; y: number } | null {
  if (sx === tx && sy === ty) return null;
  const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  const parent: ({ x: number; y: number } | null)[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  const queue: [number, number][] = [[sx, sy]];
  visited[sy][sx] = true;
  while (queue.length) {
    const [x, y] = queue.shift()!;
    if (x === tx && y === ty) {
      // walk back to find first step
      let cx = x, cy = y;
      while (parent[cy][cx] && !(parent[cy][cx]!.x === sx && parent[cy][cx]!.y === sy)) {
        const p = parent[cy][cx]!;
        cx = p.x; cy = p.y;
      }
      return { x: cx, y: cy };
    }
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
      if (MAP[ny][nx] !== 0) continue;
      if (visited[ny][nx]) continue;
      visited[ny][nx] = true;
      parent[ny][nx] = { x, y };
      queue.push([nx, ny]);
    }
  }
  return null;
}

const ExplorationGame = ({ onScore }: ExplorationGameProps) => {
  const { lang } = useLang();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [level, setLevel] = useState(1);
  const [seed, setSeed] = useState(0);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [dead, setDead] = useState(false);
  const animRef = useRef<number>(0);
  const playerRef = useRef({ x: 1, y: 1 });
  const [, forceRender] = useState(0);

  // Determine enemies count from level (start adding at level 3)
  const enemyCount = Math.max(0, Math.min(level - 2, 5));
  const enemySpeedTicks = Math.max(8, 22 - level); // smaller = faster

  // Generate gems + enemies per level
  const initial = useMemo(() => {
    const g: Gem[] = [];
    let count = 0;
    const targetGems = Math.min(8 + level, 18);
    for (let y = 0; y < ROWS && count < targetGems; y++) {
      for (let x = 0; x < COLS && count < targetGems; x++) {
        if (MAP[y][x] === 0 && !(x === 1 && y === 1) && Math.random() < 0.35) {
          g.push({ x, y, collected: false, color: GEM_COLORS[count % GEM_COLORS.length] });
          count++;
        }
      }
    }
    // Place enemies far from player start
    const enemies: Enemy[] = [];
    const farCells: [number, number][] = [];
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (MAP[y][x] === 0 && (Math.abs(x - 1) + Math.abs(y - 1) > 6)) farCells.push([x, y]);
      }
    }
    for (let i = 0; i < enemyCount && farCells.length; i++) {
      const idx = Math.floor(Math.random() * farCells.length);
      const [ex, ey] = farCells.splice(idx, 1)[0];
      enemies.push({ x: ex, y: ey, emoji: ENEMY_EMOJIS[i % ENEMY_EMOJIS.length], cooldown: 0 });
    }
    return { gems: g, enemies };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, seed, enemyCount]);

  const gemsRef = useRef<Gem[]>(initial.gems);
  const enemiesRef = useRef<Enemy[]>(initial.enemies);

  // Reset on new level
  useEffect(() => {
    gemsRef.current = initial.gems.map(g => ({ ...g }));
    enemiesRef.current = initial.enemies.map(e => ({ ...e }));
    playerRef.current = { x: 1, y: 1 };
    setScore(0);
    setDead(false);
    forceRender(n => n + 1);
  }, [initial]);

  const startGame = () => { setGameStarted(true); };

  const movePlayer = useCallback((dx: number, dy: number) => {
    if (dead) return;
    const nx = playerRef.current.x + dx;
    const ny = playerRef.current.y + dy;
    if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS || MAP[ny][nx] !== 0) return;
    playerRef.current = { x: nx, y: ny };
    // Collect gem
    const g = gemsRef.current.find(g => !g.collected && g.x === nx && g.y === ny);
    if (g) {
      g.collected = true;
      setScore(s => s + 10);
    }
    // Hit enemy?
    if (enemiesRef.current.some(e => e.x === nx && e.y === ny)) {
      setDead(true);
    }
    forceRender(n => n + 1);
  }, [dead]);

  // Keyboard
  useEffect(() => {
    if (!gameStarted) return;
    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': e.preventDefault(); movePlayer(0, -1); break;
        case 'ArrowDown': case 's': case 'S': e.preventDefault(); movePlayer(0, 1); break;
        case 'ArrowLeft': case 'a': case 'A': e.preventDefault(); movePlayer(-1, 0); break;
        case 'ArrowRight': case 'd': case 'D': e.preventDefault(); movePlayer(1, 0); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [gameStarted, movePlayer]);

  // Enemy AI tick + render loop
  useEffect(() => {
    if (!gameStarted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let tick = 0;
    const render = () => {
      tick++;
      // Enemy movement (every N ticks)
      if (!dead && tick % enemySpeedTicks === 0) {
        enemiesRef.current.forEach(en => {
          const next = bfsStep(en.x, en.y, playerRef.current.x, playerRef.current.y);
          if (next) {
            // Don't overlap other enemies
            if (!enemiesRef.current.some(o => o !== en && o.x === next.x && o.y === next.y)) {
              en.x = next.x;
              en.y = next.y;
            }
          }
          if (en.x === playerRef.current.x && en.y === playerRef.current.y) {
            setDead(true);
          }
        });
      }

      ctx.clearRect(0, 0, W, H);
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          if (MAP[y][x] === 1) {
            ctx.fillStyle = '#D4A5A5';
            ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
            ctx.strokeStyle = '#C48B8B';
            ctx.strokeRect(x * TILE, y * TILE, TILE, TILE);
          } else {
            ctx.fillStyle = '#FFF5F7';
            ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
          }
        }
      }
      // Gems
      gemsRef.current.forEach(g => {
        if (!g.collected) {
          ctx.beginPath();
          ctx.arc(g.x * TILE + TILE / 2, g.y * TILE + TILE / 2, 8, 0, Math.PI * 2);
          ctx.fillStyle = g.color;
          ctx.fill();
          ctx.strokeStyle = '#FFF';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });
      // Enemies
      ctx.font = `${TILE - 6}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      enemiesRef.current.forEach(en => {
        ctx.fillText(en.emoji, en.x * TILE + TILE / 2, en.y * TILE + TILE / 2);
      });
      // Player
      const p = playerRef.current;
      ctx.fillStyle = dead ? '#888' : '#E91E63';
      ctx.beginPath();
      ctx.arc(p.x * TILE + TILE / 2, p.y * TILE + TILE / 2, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.arc(p.x * TILE + TILE / 2 - 4, p.y * TILE + TILE / 2 - 3, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x * TILE + TILE / 2 + 4, p.y * TILE + TILE / 2 - 3, 3, 0, Math.PI * 2);
      ctx.fill();

      animRef.current = requestAnimationFrame(render);
    };
    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [gameStarted, dead, enemySpeedTicks]);

  const allCollected = gemsRef.current.length > 0 && gemsRef.current.every(g => g.collected) && !dead;

  useEffect(() => {
    if (allCollected) onScore(Math.floor(score / 10) + level);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCollected]);

  const nextLevel = () => {
    if (level < MAX_LEVEL) setLevel(l => l + 1);
    else setSeed(s => s + 1);
  };
  const retry = () => setSeed(s => s + 1);

  // Touch Swipe / Touchmove mapping
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart.current || dead) return;
    const dx = e.touches[0].clientX - touchStart.current.x;
    const dy = e.touches[0].clientY - touchStart.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 30) {
      if (Math.abs(dx) > Math.abs(dy)) {
        movePlayer(dx > 0 ? 1 : -1, 0);
      } else {
        movePlayer(0, dy > 0 ? 1 : -1);
      }
      touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  if (!gameStarted) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center space-y-4">
        <span className="text-5xl">🗺️</span>
        <h3 className="text-lg font-bold text-foreground">{lang === 'ar' ? 'عالم الاستكشاف' : '2D Explorer'}</h3>
        <p className="text-sm text-muted-foreground">
          {lang === 'ar' ? 'اجمع كل الجواهر! واحذر من الوحوش في المستويات المتقدمة 👻' : 'Collect all gems! Beware of monsters at higher levels 👻'}
        </p>
        <button onClick={startGame} className="px-6 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold">
          {lang === 'ar' ? 'ابدأ' : 'Start'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm font-bold text-foreground">
          💎 {score} • {lang === 'ar' ? 'مستوى' : 'Lv'} {level}/{MAX_LEVEL}
        </span>
        <span className="text-xs text-muted-foreground">
          {enemyCount > 0 ? `👻 × ${enemyCount}` : (lang === 'ar' ? 'آمن' : 'Safe')}
        </span>
      </div>
      <canvas ref={canvasRef} width={W} height={H} 
        onTouchStart={onTouchStart} onTouchMove={onTouchMove}
        className="w-full rounded-2xl border border-border touch-none" 
        style={{ transform: 'translate3d(0,0,0)' }} />

      {dead && (
        <div className="text-center p-3 rounded-xl bg-destructive/10 animate-bounce-in space-y-2">
          <p className="font-bold text-destructive">💀 {lang === 'ar' ? 'أمسك بك الوحش!' : 'A monster caught you!'}</p>
          <button onClick={retry} className="px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-sm">
            {lang === 'ar' ? 'حاول مرة أخرى' : 'Try Again'}
          </button>
        </div>
      )}

      {allCollected && (
        <div className="text-center p-3 rounded-xl bg-success/10 animate-bounce-in space-y-2">
          <p className="font-bold text-success">🎉 {lang === 'ar' ? `أحسنت! انتهيت من المستوى ${level}` : `Level ${level} complete!`}</p>
          <button onClick={nextLevel} className="px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold">
            {level < MAX_LEVEL
              ? (lang === 'ar' ? `المستوى التالي ▶` : `Next Level ▶`)
              : (lang === 'ar' ? 'لعبة جديدة 🔄' : 'New Game 🔄')}
          </button>
        </div>
      )}

      <div className="flex flex-col items-center gap-1" dir="ltr">
        <button onClick={() => movePlayer(0, -1)} className="w-12 h-12 rounded-xl bg-secondary text-foreground font-bold">↑</button>
        <div className="flex gap-1">
          <button onClick={() => movePlayer(-1, 0)} className="w-12 h-12 rounded-xl bg-secondary text-foreground font-bold">←</button>
          <button onClick={() => movePlayer(0, 1)} className="w-12 h-12 rounded-xl bg-secondary text-foreground font-bold">↓</button>
          <button onClick={() => movePlayer(1, 0)} className="w-12 h-12 rounded-xl bg-secondary text-foreground font-bold">→</button>
        </div>
      </div>
    </div>
  );
};

export default ExplorationGame;
