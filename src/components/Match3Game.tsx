import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import LevelHUD from './games/LevelHUD';

interface Props { onScore: (pts: number) => void; }

const MAX_LEVEL = 20;
const SIZE = 7;
const ICONS = ['🍎', '🍇', '🍋', '🍓', '🍒', '🥝'];
const POWERUP = '💥'; // bomb tile from 4-match

type Cell = { id: number; icon: string; jelly: number };

let nid = 0;
const make = (icon?: string, jelly = 0): Cell => ({
  id: ++nid,
  icon: icon ?? ICONS[Math.floor(Math.random() * ICONS.length)],
  jelly,
});

interface MatchResult {
  cells: Set<string>;
  bigGroups: { r: number; c: number; horiz: boolean; len: number }[];
}

function findMatches(b: Cell[][]): MatchResult {
  const out = new Set<string>();
  const bigGroups: MatchResult['bigGroups'] = [];
  for (let r = 0; r < SIZE; r++) {
    let runStart = 0;
    for (let c = 1; c <= SIZE; c++) {
      const same =
        c < SIZE && b[r][c] && b[r][c - 1] &&
        b[r][c].icon !== POWERUP && b[r][c - 1].icon !== POWERUP &&
        b[r][c].icon === b[r][c - 1].icon;
      if (same) continue;
      const len = c - runStart;
      if (len >= 3) {
        for (let k = runStart; k < c; k++) out.add(`${r},${k}`);
        if (len >= 4) bigGroups.push({ r, c: runStart, horiz: true, len });
      }
      runStart = c;
    }
  }
  for (let c = 0; c < SIZE; c++) {
    let runStart = 0;
    for (let r = 1; r <= SIZE; r++) {
      const same =
        r < SIZE && b[r][c] && b[r - 1][c] &&
        b[r][c].icon !== POWERUP && b[r - 1][c].icon !== POWERUP &&
        b[r][c].icon === b[r - 1][c].icon;
      if (same) continue;
      const len = r - runStart;
      if (len >= 3) {
        for (let k = runStart; k < r; k++) out.add(`${k},${c}`);
        if (len >= 4) bigGroups.push({ r: runStart, c, horiz: false, len });
      }
      runStart = r;
    }
  }
  return { cells: out, bigGroups };
}

const buildBoard = (level: number): Cell[][] => {
  let b: Cell[][] = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => make()),
  );
  let safety = 50;
  while (findMatches(b).cells.size > 0 && safety-- > 0) {
    const m = findMatches(b);
    m.cells.forEach(k => {
      const [r, c] = k.split(',').map(Number);
      b[r][c] = make();
    });
  }
  // Sprinkle jelly/ice obstacles — denser as level increases
  const jellyCount = Math.min(SIZE * SIZE - 4, 4 + level * 2);
  let placed = 0, attempts = 0;
  while (placed < jellyCount && attempts++ < 200) {
    const r = Math.floor(Math.random() * SIZE);
    const c = Math.floor(Math.random() * SIZE);
    if (b[r][c].jelly === 0) {
      // Layers: levels 1-5 → 1 layer, 6-12 → up to 2, 13+ → up to 3
      const maxLayers = level >= 13 ? 3 : level >= 6 ? 2 : 1;
      b[r][c].jelly = 1 + Math.floor(Math.random() * maxLayers);
      placed++;
    }
  }
  return b;
};

const Match3Game = ({ onScore }: Props) => {
  const { lang } = useLang();
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [board, setBoard] = useState<Cell[][]>(() => buildBoard(1));
  const [moves, setMoves] = useState(20);
  const [target, setTarget] = useState(20);
  const [collected, setCollected] = useState(0);
  const [jellyLeft, setJellyLeft] = useState(0);
  const [sel, setSel] = useState<{ r: number; c: number } | null>(null);
  const [drag, setDrag] = useState<{ r: number; c: number } | null>(null);
  const [flash, setFlash] = useState<Set<string>>(new Set());
  // Movable cursor for the arrow-pad controls
  const [cursor, setCursor] = useState<{ r: number; c: number }>({ r: Math.floor(SIZE / 2), c: Math.floor(SIZE / 2) });
  const [hammers, setHammers] = useState<number>(3);

  const targetIcon = useMemo(() => ICONS[(level - 1) % ICONS.length], [level]);

  useEffect(() => {
    const b = buildBoard(level);
    setMoves(Math.max(15, 32 - level));
    setTarget(12 + level * 2);
    setCollected(0);
    setBoard(b);
    setJellyLeft(b.flat().reduce((a, x) => a + x.jelly, 0));
    setSel(null);
    setDrag(null);
    setCursor({ r: Math.floor(SIZE / 2), c: Math.floor(SIZE / 2) });
    setHammers(3 + Math.floor(level / 4)); // refill with a few extra at higher levels
  }, [level]);

  const reduceJellyAround = (b: Cell[][], cleared: Set<string>) => {
    // Each cleared cell weakens any jelly directly under/at that position.
    // (Already-cleared cell becomes empty; we apply jelly damage BEFORE it becomes null.)
    let jellyKilled = 0;
    cleared.forEach(k => {
      const [r, c] = k.split(',').map(Number);
      if (b[r] && b[r][c] && b[r][c].jelly > 0) {
        b[r][c].jelly -= 1;
        if (b[r][c].jelly === 0) jellyKilled++;
      }
    });
    return jellyKilled;
  };

  const resolve = useCallback((b: Cell[][]) => {
    let nb = b.map(r => r.slice());
    let totalCleared = 0;
    let targetCleared = 0;
    let jellyCleared = 0;
    let powerupsToPlace: { r: number; c: number }[] = [];
    let safety = 20;

    while (safety-- > 0) {
      const m = findMatches(nb);
      if (m.cells.size === 0) break;
      m.bigGroups.forEach(g => {
        const cr = g.horiz ? g.r : g.r + Math.floor(g.len / 2);
        const cc = g.horiz ? g.c + Math.floor(g.len / 2) : g.c;
        powerupsToPlace.push({ r: cr, c: cc });
      });
      m.cells.forEach(k => {
        const [r, c] = k.split(',').map(Number);
        if (nb[r][c].icon === targetIcon) targetCleared++;
        totalCleared++;
      });
      // Damage jelly first, then clear tiles
      jellyCleared += reduceJellyAround(nb, m.cells);
      setFlash(new Set(m.cells));
      m.cells.forEach(k => {
        const [r, c] = k.split(',').map(Number);
        nb[r][c] = null as any;
      });
      for (let c = 0; c < SIZE; c++) {
        const col: Cell[] = [];
        for (let r = SIZE - 1; r >= 0; r--) if (nb[r][c]) col.push(nb[r][c]);
        while (col.length < SIZE) col.push(make());
        for (let r = SIZE - 1, i = 0; r >= 0; r--, i++) nb[r][c] = col[i];
      }
      powerupsToPlace.forEach(p => {
        if (p.r >= 0 && p.r < SIZE && p.c >= 0 && p.c < SIZE) {
          nb[Math.min(p.r, SIZE - 1)][p.c] = make(POWERUP);
        }
      });
      powerupsToPlace = [];
    }
    setTimeout(() => setFlash(new Set()), 250);
    return { board: nb, totalCleared, targetCleared, jellyCleared };
  }, [targetIcon]);

  const detonateBomb = (b: Cell[][], r: number, c: number) => {
    let cleared = 0;
    let targetClr = 0;
    let jellyClr = 0;
    const nb = b.map(row => row.slice());
    const damaged = new Set<string>();
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) continue;
        if (nb[nr][nc].icon === targetIcon) targetClr++;
        damaged.add(`${nr},${nc}`);
        cleared++;
      }
    }
    jellyClr += reduceJellyAround(nb, damaged);
    damaged.forEach(k => {
      const [nr, nc] = k.split(',').map(Number);
      nb[nr][nc] = null as any;
    });
    for (let cc = 0; cc < SIZE; cc++) {
      const col: Cell[] = [];
      for (let rr = SIZE - 1; rr >= 0; rr--) if (nb[rr][cc]) col.push(nb[rr][cc]);
      while (col.length < SIZE) col.push(make());
      for (let rr = SIZE - 1, i = 0; rr >= 0; rr--, i++) nb[rr][cc] = col[i];
    }
    return { nb, cleared, targetClr, jellyClr };
  };

  const advanceProgress = (cleared: number, targetClr: number, jellyClr: number, finalBoard: Cell[][]) => {
    if (targetClr > 0) onScore(targetClr);
    if (jellyClr > 0) onScore(jellyClr * 2);
    setScore(s => s + cleared * level + jellyClr * 5);
    const remainingJelly = finalBoard.flat().reduce((a, x) => a + x.jelly, 0);
    setJellyLeft(remainingJelly);
    setCollected(prev => {
      const np = prev + targetClr;
      // Win = collected target AND all jelly cleared
      if (np >= target && remainingJelly === 0) {
        setTimeout(() => {
          if (level < MAX_LEVEL) setLevel(l => l + 1);
          else setLevel(1);
        }, 600);
      }
      return np;
    });
  };

  const swap = (r1: number, c1: number, r2: number, c2: number) => {
    if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return;
    if (moves <= 0) return;
    let nb = board.map(r => r.slice());
    [nb[r1][c1], nb[r2][c2]] = [nb[r2][c2], nb[r1][c1]];

    let bombHits: { r: number; c: number }[] = [];
    if (nb[r1][c1].icon === POWERUP) bombHits.push({ r: r1, c: c1 });
    if (nb[r2][c2].icon === POWERUP) bombHits.push({ r: r2, c: c2 });

    if (bombHits.length === 0 && findMatches(nb).cells.size === 0) return;

    setMoves(m => m - 1);
    let cleared = 0, targetClr = 0, jellyClr = 0;
    bombHits.forEach(({ r, c }) => {
      const det = detonateBomb(nb, r, c);
      nb = det.nb; cleared += det.cleared; targetClr += det.targetClr; jellyClr += det.jellyClr;
    });
    const res = resolve(nb);
    cleared += res.totalCleared;
    targetClr += res.targetCleared;
    jellyClr += res.jellyCleared;
    setBoard(res.board);
    advanceProgress(cleared, targetClr, jellyClr, res.board);
  };

  const tap = (r: number, c: number) => {
    if (moves <= 0) return;
    if (!sel) { setSel({ r, c }); return; }
    if (sel.r === r && sel.c === c) { setSel(null); return; }
    swap(sel.r, sel.c, r, c);
    setSel(null);
  };

  const onPointerDown = (r: number, c: number) => setDrag({ r, c });
  const onPointerEnter = (r: number, c: number) => {
    if (!drag) return;
    if (drag.r === r && drag.c === c) return;
    if (Math.abs(drag.r - r) + Math.abs(drag.c - c) === 1) {
      swap(drag.r, drag.c, r, c);
      setDrag(null);
      setSel(null);
    }
  };
  const onPointerUp = () => setDrag(null);

  // Arrow-pad: try to swap cursor with neighbor in given direction;
  // if swap doesn't trigger a match, just move the cursor instead (no move spent).
  const moveCursor = (dr: number, dc: number) => {
    const nr = Math.max(0, Math.min(SIZE - 1, cursor.r + dr));
    const nc = Math.max(0, Math.min(SIZE - 1, cursor.c + dc));
    if (nr === cursor.r && nc === cursor.c) return;
    if (moves > 0) {
      // Test if swapping would create a match or hit a bomb
      const test = board.map(row => row.slice());
      [test[cursor.r][cursor.c], test[nr][nc]] = [test[nr][nc], test[cursor.r][cursor.c]];
      const hasBomb =
        test[cursor.r][cursor.c].icon === POWERUP || test[nr][nc].icon === POWERUP;
      if (hasBomb || findMatches(test).cells.size > 0) {
        swap(cursor.r, cursor.c, nr, nc);
        setCursor({ r: nr, c: nc });
        return;
      }
    }
    // Otherwise just slide the cursor
    setCursor({ r: nr, c: nc });
  };

  // "Pick fruit" tool — directly collect the target fruit under the cursor.
  // Limited uses per level. Costs one move. Only works when the cursor is on
  // a tile of the current target fruit (no random destruction).
  const [picks, setPicks] = useState<number>(3);
  useEffect(() => { setPicks(3 + Math.floor(level / 5)); }, [level]);
  const pickFruit = () => {
    if (picks <= 0 || moves <= 0) return;
    const r = cursor.r, c = cursor.c;
    if (board[r][c].icon !== targetIcon) return; // only collects target
    let nb = board.map(row => row.slice());
    const damaged = new Set<string>([`${r},${c}`]);
    let jellyClr = reduceJellyAround(nb, damaged);
    nb[r][c] = null as any;
    for (let cc = 0; cc < SIZE; cc++) {
      const col: Cell[] = [];
      for (let rr = SIZE - 1; rr >= 0; rr--) if (nb[rr][cc]) col.push(nb[rr][cc]);
      while (col.length < SIZE) col.push(make());
      for (let rr = SIZE - 1, i = 0; rr >= 0; rr--, i++) nb[rr][cc] = col[i];
    }
    const res = resolve(nb);
    setBoard(res.board);
    setPicks(p => p - 1);
    setMoves(m => m - 1);
    advanceProgress(1 + res.totalCleared, 1 + res.targetCleared, jellyClr + res.jellyCleared, res.board);
  };

  // "Break block" tool — uses one hammer to clear the tile under the cursor
  // and damage any jelly there. Counts as one move.
  const breakBlock = () => {
    if (hammers <= 0 || moves <= 0) return;
    const r = cursor.r, c = cursor.c;
    let nb = board.map(row => row.slice());
    const damaged = new Set<string>([`${r},${c}`]);
    let targetClr = nb[r][c].icon === targetIcon ? 1 : 0;
    let cleared = 1;
    let jellyClr = reduceJellyAround(nb, damaged);
    nb[r][c] = null as any;
    for (let cc = 0; cc < SIZE; cc++) {
      const col: Cell[] = [];
      for (let rr = SIZE - 1; rr >= 0; rr--) if (nb[rr][cc]) col.push(nb[rr][cc]);
      while (col.length < SIZE) col.push(make());
      for (let rr = SIZE - 1, i = 0; rr >= 0; rr--, i++) nb[rr][cc] = col[i];
    }
    const res = resolve(nb);
    cleared += res.totalCleared;
    targetClr += res.targetCleared;
    jellyClr += res.jellyCleared;
    setBoard(res.board);
    setHammers(h => h - 1);
    setMoves(m => m - 1);
    advanceProgress(cleared, targetClr, jellyClr, res.board);
  };


  const restart = () => {
    const b = buildBoard(level);
    setBoard(b);
    setMoves(Math.max(15, 32 - level));
    setCollected(0);
    setJellyLeft(b.flat().reduce((a, x) => a + x.jelly, 0));
    setSel(null);
    setDrag(null);
    setCursor({ r: Math.floor(SIZE / 2), c: Math.floor(SIZE / 2) });
    setHammers(3 + Math.floor(level / 4));
  };
  const won = collected >= target && jellyLeft === 0;
  const failed = moves <= 0 && !won;

  return (
    <div className="space-y-3" onMouseUp={onPointerUp} onTouchEnd={onPointerUp}>
      <LevelHUD level={level} score={score} />
      <div className="flex flex-wrap items-center justify-center gap-2 text-[10px]">
        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
          {lang === 'ar' ? 'حركات' : 'Moves'}: {moves}
        </span>
        <span className="px-2 py-0.5 rounded-full bg-success/10 text-success font-medium">
          {lang === 'ar' ? 'اجمعي' : 'Collect'} {targetIcon} {collected}/{target}
        </span>
        <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 font-medium">
          🧊 {lang === 'ar' ? 'جيلي متبقي' : 'Jelly left'}: {jellyLeft}
        </span>
        <button onClick={restart} className="px-2 py-0.5 rounded-full bg-secondary text-foreground">🔄</button>
      </div>
      <div className="glass-card rounded-2xl p-3 mx-auto" style={{ maxWidth: 320 }}>
        <div
          className="grid gap-1 select-none"
          style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)`, touchAction: 'none' }}
        >
          {board.map((row, r) => row.map((cell, c) => {
            const key = `${r},${c}`;
            const isSel = sel?.r === r && sel?.c === c;
            const isDrag = drag?.r === r && drag?.c === c;
            const isCursor = cursor.r === r && cursor.c === c;
            const isFlash = flash.has(key);
            const jellyBg =
              cell.jelly === 1 ? 'before:absolute before:inset-0 before:rounded-lg before:bg-sky-300/40 before:ring-1 before:ring-sky-400/60' :
              cell.jelly === 2 ? 'before:absolute before:inset-0 before:rounded-lg before:bg-sky-400/55 before:ring-2 before:ring-sky-500/70' :
              cell.jelly >= 3 ? 'before:absolute before:inset-0 before:rounded-lg before:bg-indigo-500/65 before:ring-2 before:ring-indigo-600/80' : '';
            return (
              <button key={cell.id}
                onPointerDown={(e) => {
                  e.preventDefault();
                  (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                  onPointerDown(r, c);
                }}
                onPointerEnter={() => onPointerEnter(r, c)}
                onPointerMove={(e) => {
                  if (!drag) return;
                  // Use elementFromPoint so dragging across cells works even
                  // when pointer capture keeps events on the original element.
                  const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
                  const rc = el?.dataset?.rc;
                  if (rc) {
                    const [nr, nc] = rc.split(',').map(Number);
                    onPointerEnter(nr, nc);
                  }
                }}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onClick={() => { setCursor({ r, c }); tap(r, c); }}
                data-rc={`${r},${c}`}
                style={{ touchAction: 'none' }}
                className={`relative aspect-square rounded-lg flex items-center justify-center text-xl transition-all active:scale-90 ${jellyBg} ${
                  isFlash ? 'bg-amber-300/60 scale-110' :
                  isSel || isDrag ? 'bg-primary/30 ring-2 ring-primary' :
                  isCursor ? 'bg-amber-200/60 ring-2 ring-amber-500' :
                  'bg-secondary/40 hover:bg-secondary/70'
                }`}>
                <span className="relative z-10">{cell.icon}</span>
                {cell.jelly > 0 && (
                  <span className="absolute z-20 bottom-0.5 right-0.5 text-[8px] font-bold text-white drop-shadow">
                    {cell.jelly}
                  </span>
                )}
              </button>
            );
          }))}
        </div>
      </div>

      {/* Arrow pad + tools — forced LTR so ← always moves the cursor left,
          even when the surrounding page is RTL (Arabic). */}
      <div dir="ltr" className="glass-card rounded-2xl p-3 mx-auto flex items-center justify-between gap-3" style={{ maxWidth: 360 }}>
        <div className="grid grid-cols-3 gap-1.5">
          <span />
          <button onClick={() => moveCursor(-1, 0)} aria-label="up"
            className="w-10 h-10 rounded-xl bg-secondary hover:bg-secondary/70 active:scale-90 flex items-center justify-center text-lg font-bold">↑</button>
          <span />
          <button onClick={() => moveCursor(0, -1)} aria-label="left"
            className="w-10 h-10 rounded-xl bg-secondary hover:bg-secondary/70 active:scale-90 flex items-center justify-center text-lg font-bold">←</button>
          <div className="w-10 h-10 rounded-xl bg-amber-200/60 ring-2 ring-amber-500 flex items-center justify-center text-xs font-bold text-amber-700">◎</div>
          <button onClick={() => moveCursor(0, 1)} aria-label="right"
            className="w-10 h-10 rounded-xl bg-secondary hover:bg-secondary/70 active:scale-90 flex items-center justify-center text-lg font-bold">→</button>
          <span />
          <button onClick={() => moveCursor(1, 0)} aria-label="down"
            className="w-10 h-10 rounded-xl bg-secondary hover:bg-secondary/70 active:scale-90 flex items-center justify-center text-lg font-bold">↓</button>
          <span />
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <button onClick={breakBlock} disabled={hammers <= 0 || moves <= 0}
              className="px-3 py-2 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white font-extrabold shadow-lg active:scale-95 disabled:opacity-40 flex flex-col items-center leading-tight">
              <span className="text-xl">🔨</span>
              <span className="text-[10px]">{lang === 'ar' ? 'كسر' : 'BREAK'}</span>
              <span className="text-[9px] opacity-80">×{hammers}</span>
            </button>
            <button onClick={pickFruit} disabled={picks <= 0 || moves <= 0 || board[cursor.r][cursor.c].icon !== targetIcon}
              className="px-3 py-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white font-extrabold shadow-lg active:scale-95 disabled:opacity-40 flex flex-col items-center leading-tight">
              <span className="text-xl">{targetIcon}</span>
              <span className="text-[10px]">{lang === 'ar' ? 'اقطف' : 'PICK'}</span>
              <span className="text-[9px] opacity-80">×{picks}</span>
            </button>
          </div>
        </div>
      </div>

      {won && (
        <div className="text-center p-3 rounded-xl bg-success/10 animate-bounce-in">
          <p className="text-sm font-bold text-success">
            🎉 {lang === 'ar' ? `أتممت المستوى ${level}!` : `Level ${level} cleared!`}
          </p>
        </div>
      )}
      {failed && (
        <div className="text-center p-3 rounded-xl bg-destructive/10 space-y-2">
          <p className="text-sm font-bold text-destructive">{lang === 'ar' ? 'انتهت الحركات!' : 'Out of moves!'}</p>
          <button onClick={restart} className="px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-sm">
            {lang === 'ar' ? 'حاولي مجدداً' : 'Retry'}
          </button>
        </div>
      )}
      <p className="text-center text-[10px] text-muted-foreground">
        {lang === 'ar' ? 'الأسهم تحرّك المؤشر · التبديل يحدث فقط إذا صنع مطابقة · 🔨 يكسر · ' + targetIcon + ' يقطف' : 'Arrows move cursor · swap only if it makes a match · 🔨 break · ' + targetIcon + ' pick'}
      </p>
    </div>
  );
};

export default Match3Game;
