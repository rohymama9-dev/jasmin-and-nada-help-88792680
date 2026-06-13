import { useState, useEffect, useRef, useMemo } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { RotateCcw, ChevronRight, ChevronLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

/**
 * Car Escape Puzzle — a Rush Hour style game.
 * The red car (player) must reach the right edge.
 * Move blocking cars/trucks horizontally or vertically (according to their orientation)
 * by dragging them. Includes 12 progressively harder levels.
 */

interface Vehicle {
  id: string;
  row: number;
  col: number;
  length: 2 | 3;
  orient: 'h' | 'v';
  isPlayer?: boolean;
}

interface Level {
  vehicles: Vehicle[];
  parAr: string;
  parEn: string;
}

const GRID = 6; // 6×6 board, exit on right side at row 2

const LEVELS: Level[] = [
  // L1 — trivial: just push 1 car aside
  {
    vehicles: [
      { id: 'p', row: 2, col: 1, length: 2, orient: 'h', isPlayer: true },
      { id: 'a', row: 0, col: 0, length: 2, orient: 'v' },
      { id: 'b', row: 4, col: 4, length: 2, orient: 'h' },
    ],
    parAr: 'سهل', parEn: 'Easy',
  },
  // L2
  {
    vehicles: [
      { id: 'p', row: 2, col: 0, length: 2, orient: 'h', isPlayer: true },
      { id: 'a', row: 0, col: 3, length: 3, orient: 'v' },
      { id: 'b', row: 4, col: 0, length: 3, orient: 'h' },
      { id: 'c', row: 1, col: 5, length: 2, orient: 'v' },
    ],
    parAr: 'سهل', parEn: 'Easy',
  },
  // L3
  {
    vehicles: [
      { id: 'p', row: 2, col: 1, length: 2, orient: 'h', isPlayer: true },
      { id: 'a', row: 0, col: 0, length: 2, orient: 'h' },
      { id: 'b', row: 0, col: 3, length: 2, orient: 'v' },
      { id: 'c', row: 3, col: 0, length: 3, orient: 'v' },
      { id: 'd', row: 4, col: 4, length: 2, orient: 'h' },
      { id: 'e', row: 3, col: 5, length: 3, orient: 'v' },
    ],
    parAr: 'متوسط', parEn: 'Medium',
  },
  // L4
  {
    vehicles: [
      { id: 'p', row: 2, col: 0, length: 2, orient: 'h', isPlayer: true },
      { id: 'a', row: 0, col: 0, length: 3, orient: 'h' },
      { id: 'b', row: 0, col: 5, length: 3, orient: 'v' },
      { id: 'c', row: 3, col: 2, length: 2, orient: 'v' },
      { id: 'd', row: 4, col: 0, length: 2, orient: 'h' },
      { id: 'e', row: 4, col: 3, length: 3, orient: 'h' },
      { id: 'f', row: 1, col: 3, length: 2, orient: 'v' },
    ],
    parAr: 'متوسط', parEn: 'Medium',
  },
  // L5
  {
    vehicles: [
      { id: 'p', row: 2, col: 1, length: 2, orient: 'h', isPlayer: true },
      { id: 'a', row: 0, col: 0, length: 2, orient: 'v' },
      { id: 'b', row: 0, col: 1, length: 3, orient: 'h' },
      { id: 'c', row: 0, col: 4, length: 3, orient: 'v' },
      { id: 'd', row: 3, col: 3, length: 2, orient: 'v' },
      { id: 'e', row: 4, col: 0, length: 2, orient: 'h' },
      { id: 'f', row: 5, col: 0, length: 3, orient: 'h' },
      { id: 'g', row: 4, col: 4, length: 2, orient: 'h' },
    ],
    parAr: 'صعب', parEn: 'Hard',
  },
  // L6
  {
    vehicles: [
      { id: 'p', row: 2, col: 0, length: 2, orient: 'h', isPlayer: true },
      { id: 'a', row: 0, col: 0, length: 3, orient: 'h' },
      { id: 'b', row: 0, col: 3, length: 2, orient: 'v' },
      { id: 'c', row: 0, col: 4, length: 2, orient: 'h' },
      { id: 'd', row: 1, col: 5, length: 3, orient: 'v' },
      { id: 'e', row: 3, col: 2, length: 3, orient: 'h' },
      { id: 'f', row: 4, col: 0, length: 2, orient: 'v' },
      { id: 'g', row: 5, col: 1, length: 3, orient: 'h' },
      { id: 'h', row: 4, col: 5, length: 2, orient: 'v' },
    ],
    parAr: 'صعب', parEn: 'Hard',
  },
];

const cellsOf = (v: Vehicle): [number, number][] => {
  const out: [number, number][] = [];
  for (let i = 0; i < v.length; i++) {
    out.push(v.orient === 'h' ? [v.row, v.col + i] : [v.row + i, v.col]);
  }
  return out;
};

const toMatrix = (vehicles: Vehicle[]): (string | null)[][] => {
  const m: (string | null)[][] = Array.from({ length: GRID }, () => Array(GRID).fill(null));
  for (const v of vehicles) {
    for (const [r, c] of cellsOf(v)) {
      if (r >= 0 && r < GRID && c >= 0 && c < GRID) m[r][c] = v.id;
    }
  }
  return m;
};

const COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500',
  'bg-pink-500', 'bg-cyan-500', 'bg-orange-500', 'bg-teal-500',
];

const CELL = 48; // px per cell

const randomizeVehicles = (baseVehicles: Vehicle[]): Vehicle[] => {
  const player = baseVehicles.find(v => v.isPlayer)!;
  const others = baseVehicles.filter(v => !v.isPlayer);

  // Try to generate a fresh random layout. Player car always stays on row 2
  // (exit row) but its starting column is randomized. Blocker vehicles get
  // randomized rows/cols/orientations while preserving length counts so the
  // puzzle "changes places" every time without overlaps.
  const fits = (v: Vehicle, occ: boolean[][]): boolean => {
    for (const [r, c] of cellsOf(v)) {
      if (r < 0 || r >= GRID || c < 0 || c >= GRID) return false;
      if (occ[r][c]) return false;
    }
    return true;
  };
  const place = (v: Vehicle, occ: boolean[][]) => {
    for (const [r, c] of cellsOf(v)) occ[r][c] = true;
  };

  for (let attempt = 0; attempt < 60; attempt++) {
    const occ: boolean[][] = Array.from({ length: GRID }, () => Array(GRID).fill(false));
    // Random player start col on row 2 (leave at least 1 cell room from exit).
    const pStart = Math.floor(Math.random() * (GRID - player.length - 1));
    const newPlayer: Vehicle = { ...player, row: 2, col: pStart };
    place(newPlayer, occ);

    const newOthers: Vehicle[] = [];
    let ok = true;
    for (const o of others) {
      let placed = false;
      for (let tries = 0; tries < 40; tries++) {
        const orient: 'h' | 'v' = Math.random() < 0.5 ? 'h' : 'v';
        const maxRow = orient === 'v' ? GRID - o.length : GRID - 1;
        const maxCol = orient === 'h' ? GRID - o.length : GRID - 1;
        const row = Math.floor(Math.random() * (maxRow + 1));
        const col = Math.floor(Math.random() * (maxCol + 1));
        const cand: Vehicle = { ...o, row, col, orient };
        if (fits(cand, occ)) {
          place(cand, occ);
          newOthers.push(cand);
          placed = true;
          break;
        }
      }
      if (!placed) { ok = false; break; }
    }

    if (!ok) continue;

    // Ensure the puzzle isn't already solved: at least one cell on row 2
    // to the right of the player must be blocked. Otherwise reroll.
    const playerRight = newPlayer.col + newPlayer.length;
    let blocked = false;
    for (let c = playerRight; c < GRID; c++) {
      if (occ[2][c]) { blocked = true; break; }
    }
    if (blocked) return [newPlayer, ...newOthers];
  }

  // Fallback: original layout (still a valid puzzle) if random gen failed.
  return baseVehicles.map(v => ({ ...v }));
};

const CarEscape = ({ onScore }: { onScore: (n: number) => void }) => {
  const { lang } = useLang();
  const [levelIndex, setLevelIndex] = useState(0);
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => randomizeVehicles(LEVELS[0].vehicles));
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);

  // Drag state
  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    origRow: number;
    origCol: number;
  } | null>(null);
  const [dragOffset, setDragOffset] = useState<{ id: string; dx: number; dy: number } | null>(null);

  const matrix = useMemo(() => toMatrix(vehicles), [vehicles]);

  useEffect(() => {
    setVehicles(randomizeVehicles(LEVELS[levelIndex].vehicles));
    setMoves(0);
    setWon(false);
  }, [levelIndex]);

  // Win condition: player at right edge
  useEffect(() => {
    const player = vehicles.find(v => v.isPlayer);
    if (player && player.col + player.length === GRID && !won) {
      setWon(true);
      onScore(10);
      toast({ title: lang === 'ar' ? `🏁 خرجت السيارة! +10 نقاط` : `🏁 Car escaped! +10 points` });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicles]);

  const colorOf = (v: Vehicle, idx: number) =>
    v.isPlayer ? 'bg-red-600' : COLORS[idx % COLORS.length];

  // Try to move vehicle by `delta` along its orientation; returns true if moved
  const tryMove = (id: string, delta: number): boolean => {
    if (delta === 0) return false;
    const v = vehicles.find(x => x.id === id);
    if (!v) return false;
    const step = delta > 0 ? 1 : -1;
    let moved = 0;
    const m = matrix.map(r => r.slice());
    // erase current
    for (const [r, c] of cellsOf(v)) m[r][c] = null;
    let newRow = v.row, newCol = v.col;
    for (let i = 0; i < Math.abs(delta); i++) {
      const next = v.orient === 'h'
        ? { row: newRow, col: newCol + step }
        : { row: newRow + step, col: newCol };
      // Check the new leading cell
      const lead = v.orient === 'h'
        ? [next.row, step > 0 ? next.col + v.length - 1 : next.col]
        : [step > 0 ? next.row + v.length - 1 : next.row, next.col];
      const [lr, lc] = lead as [number, number];
      if (lr < 0 || lr >= GRID || lc < 0 || lc >= GRID) break;
      if (m[lr][lc] !== null) break;
      newRow = next.row; newCol = next.col; moved++;
    }
    if (moved === 0) return false;
    setVehicles(prev => prev.map(x => x.id === id ? { ...x, row: newRow, col: newCol } : x));
    setMoves(m => m + 1);
    return true;
  };

  const onPointerDown = (e: React.PointerEvent, id: string) => {
    if (won) return;
    const v = vehicles.find(x => x.id === id);
    if (!v) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = {
      id, startX: e.clientX, startY: e.clientY, origRow: v.row, origCol: v.col,
    };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const { id, startX, startY } = dragRef.current;
    const v = vehicles.find(x => x.id === id);
    if (!v) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (v.orient === 'h') setDragOffset({ id, dx, dy: 0 });
    else setDragOffset({ id, dx: 0, dy });
  };
  const onPointerUp = (_e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const { id } = dragRef.current;
    const v = vehicles.find(x => x.id === id);
    if (!v) { dragRef.current = null; setDragOffset(null); return; }
    const off = dragOffset;
    if (off && off.id === id) {
      const delta = v.orient === 'h'
        ? Math.round(off.dx / CELL)
        : Math.round(off.dy / CELL);
      if (delta !== 0) tryMove(id, delta);
    }
    dragRef.current = null;
    setDragOffset(null);
  };

  const reset = () => {
    setVehicles(LEVELS[levelIndex].vehicles.map(v => ({ ...v })));
    setMoves(0);
    setWon(false);
  };

  const lvl = LEVELS[levelIndex];

  return (
    <div className="space-y-4 select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-foreground">
            {lang === 'ar' ? 'المستوى' : 'Level'} {levelIndex + 1} / {LEVELS.length}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
            {lang === 'ar' ? lvl.parAr : lvl.parEn}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {lang === 'ar' ? 'حركات' : 'Moves'}: {moves}
          </span>
          <button onClick={reset} aria-label="reset"
            className="p-2 rounded-lg bg-secondary text-foreground active:scale-90">
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      <div className="flex justify-center">
        <div
          className="relative rounded-2xl bg-slate-800 p-2 shadow-xl"
          style={{ width: GRID * CELL + 16, height: GRID * CELL + 16 }}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* grid cells */}
          <div className="grid gap-0" style={{
            gridTemplateColumns: `repeat(${GRID}, ${CELL}px)`,
            gridTemplateRows: `repeat(${GRID}, ${CELL}px)`,
          }}>
            {Array.from({ length: GRID * GRID }).map((_, i) => (
              <div key={i} className="border border-slate-700/60 bg-slate-700/40" />
            ))}
          </div>

          {/* exit marker (right side, row 2) */}
          <div
            className="absolute flex items-center justify-center text-2xl text-amber-300 font-bold pointer-events-none"
            style={{
              right: -4,
              top: 8 + 2 * CELL,
              width: 14,
              height: CELL,
            }}>
            ▶
          </div>

          {/* vehicles */}
          {vehicles.map((v, idx) => {
            const w = (v.orient === 'h' ? v.length : 1) * CELL - 6;
            const h = (v.orient === 'v' ? v.length : 1) * CELL - 6;
            const offset = dragOffset?.id === v.id ? dragOffset : null;
            const dx = offset?.dx ?? 0;
            const dy = offset?.dy ?? 0;
            return (
              <div
                key={v.id}
                onPointerDown={(e) => onPointerDown(e, v.id)}
                className={`absolute rounded-xl shadow-lg flex items-center justify-center text-2xl text-white touch-none cursor-grab active:cursor-grabbing transition-transform ${colorOf(v, idx)} ${
                  v.isPlayer ? 'ring-2 ring-yellow-300' : ''
                }`}
                style={{
                  left: 8 + v.col * CELL + 3,
                  top: 8 + v.row * CELL + 3,
                  width: w,
                  height: h,
                  transform: `translate(${dx}px, ${dy}px)`,
                  transition: dragOffset?.id === v.id ? 'none' : 'transform 0.15s',
                  zIndex: dragOffset?.id === v.id ? 10 : 2,
                }}
              >
                {v.isPlayer ? '🚗' : v.length === 3 ? '🚛' : '🚙'}
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        {lang === 'ar'
          ? 'اسحبي السيارات لإخراج 🚗 الحمراء من الجهة اليمنى'
          : 'Drag cars to escort the red 🚗 out the right side'}
      </p>

      {won && (
        <div className="text-center p-4 rounded-2xl bg-success/10 space-y-3 animate-bounce-in">
          <p className="text-lg font-bold text-success">
            🎉 {lang === 'ar' ? `نجحتِ في ${moves} حركة!` : `Solved in ${moves} moves!`}
          </p>
          {levelIndex < LEVELS.length - 1 ? (
            <button
              onClick={() => setLevelIndex(i => i + 1)}
              className="px-5 py-2.5 rounded-xl gradient-primary text-primary-foreground font-bold">
              {lang === 'ar' ? 'المستوى التالي ▶' : 'Next Level ▶'}
            </button>
          ) : (
            <button
              onClick={() => setLevelIndex(0)}
              className="px-5 py-2.5 rounded-xl gradient-primary text-primary-foreground font-bold">
              {lang === 'ar' ? 'أنهيت كل المستويات! 🏆 إعادة' : 'All levels done! 🏆 Restart'}
            </button>
          )}
        </div>
      )}

      <div className="flex items-center justify-center gap-2">
        <button
          disabled={levelIndex === 0 || !won}
          onClick={() => setLevelIndex(i => Math.max(0, i - 1))}
          className="px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-semibold disabled:opacity-40 flex items-center gap-1">
          <ChevronLeft size={14} /> {lang === 'ar' ? 'السابق' : 'Prev'}
        </button>
        <button
          disabled={levelIndex === LEVELS.length - 1 || !won}
          onClick={() => setLevelIndex(i => Math.min(LEVELS.length - 1, i + 1))}
          className="px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-semibold disabled:opacity-40 flex items-center gap-1">
          {lang === 'ar' ? 'التالي' : 'Next'} <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default CarEscape;
