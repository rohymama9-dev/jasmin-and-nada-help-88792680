import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLang } from '@/contexts/LanguageContext';

interface Props { onScore?: (n: number) => void; }

/**
 * Classic Ludo — 4 colors (red, green, yellow, blue), 4 tokens each.
 * - Roll a 6 to leave the yard onto your start square.
 * - Loop the 52-cell main track, then enter your colored home column,
 *   land EXACTLY on the center to finish that token.
 * - Capture: landing on an opponent's single token sends it back to its yard.
 * - Roll a 6 = bonus roll. First player to finish all 4 tokens wins (50 coins).
 * - Modes: 2P or 4P, each seat can be Human or Bot.
 *
 * The board is rendered as a 15×15 grid using a path map shared by all players,
 * with each color's start offset on the loop.
 */

type Color = 'R' | 'G' | 'Y' | 'B';
const COLORS: Color[] = ['R', 'G', 'Y', 'B'];
const COLOR_HEX: Record<Color, string> = {
  R: '#ef4444', G: '#22c55e', Y: '#eab308', B: '#3b82f6',
};
const COLOR_BG: Record<Color, string> = {
  R: 'bg-red-500', G: 'bg-green-500', Y: 'bg-yellow-500', B: 'bg-blue-500',
};
const COLOR_NAME_AR: Record<Color, string> = { R: 'أحمر', G: 'أخضر', Y: 'أصفر', B: 'أزرق' };
const COLOR_NAME_EN: Record<Color, string> = { R: 'Red', G: 'Green', Y: 'Yellow', B: 'Blue' };

// 52-cell main loop traced as [row, col] on a 15×15 grid.
// Path begins at red's entry (row 6, col 1) and goes clockwise.
const LOOP: [number, number][] = [
  [6,1],[6,2],[6,3],[6,4],[6,5],
  [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],
  [0,7],
  [0,8],[1,8],[2,8],[3,8],[4,8],[5,8],
  [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],
  [7,14],
  [8,14],[8,13],[8,12],[8,11],[8,10],[8,9],
  [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
  [14,7],
  [14,6],[13,6],[12,6],[11,6],[10,6],[9,6],
  [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],
  [7,0],
];

// Each color's start index on the loop (where its tokens enter).
const START_INDEX: Record<Color, number> = { R: 0, G: 13, Y: 26, B: 39 };

// Each color's home-stretch path (6 cells leading into center).
const HOME_PATH: Record<Color, [number, number][]> = {
  R: [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]],
  G: [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],
  Y: [[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]],
  B: [[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]],
};

// Yard "parking" cell positions per color (4 cells in each corner block).
const YARD: Record<Color, [number, number][]> = {
  R: [[1,1],[1,4],[4,1],[4,4]],
  G: [[1,10],[1,13],[4,10],[4,13]],
  Y: [[10,10],[10,13],[13,10],[13,13]],
  B: [[10,1],[10,4],[13,1],[13,4]],
};

// "Safe" loop indices (stars) — tokens here can't be captured.
const SAFE_INDICES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

type TokenPos =
  | { kind: 'yard'; slot: 0|1|2|3 }
  | { kind: 'loop'; index: number }       // 0..51 absolute loop index
  | { kind: 'home'; step: number }        // 0..5 home stretch
  | { kind: 'finished' };

interface Token { color: Color; pos: TokenPos; }

interface PlayerCfg { color: Color; isBot: boolean; name: string; }

const Ludo = ({ onScore }: Props) => {
  const { lang } = useLang();
  const [mode, setMode] = useState<'2p' | '4p' | null>(null);
  const [bots, setBots] = useState<Record<Color, boolean>>({ R: false, G: true, Y: false, B: true });
  const [tokens, setTokens] = useState<Token[]>([]);
  const [active, setActive] = useState<Color>('R');
  const [dice, setDice] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [winner, setWinner] = useState<Color | null>(null);
  const [msg, setMsg] = useState('');
  const [awardedRef, setAwardedRef] = useState(false);

  const players: PlayerCfg[] = useMemo(() => {
    if (mode === '2p') {
      return [
        { color: 'R', isBot: false, name: lang === 'ar' ? 'لاعب 1' : 'Player 1' },
        { color: 'Y', isBot: bots.Y, name: bots.Y ? (lang === 'ar' ? 'البوت' : 'Bot') : (lang === 'ar' ? 'لاعب 2' : 'Player 2') },
      ];
    }
    return COLORS.map(c => ({
      color: c,
      isBot: bots[c],
      name: bots[c]
        ? (lang === 'ar' ? `بوت ${COLOR_NAME_AR[c]}` : `${COLOR_NAME_EN[c]} Bot`)
        : (lang === 'ar' ? COLOR_NAME_AR[c] : COLOR_NAME_EN[c]),
    }));
  }, [mode, bots, lang]);

  const activeColors = useMemo(() => players.map(p => p.color), [players]);

  const startGame = (m: '2p' | '4p') => {
    setMode(m);
    setWinner(null);
    setAwardedRef(false);
    setDice(null);
    setActive('R');
    const colors: Color[] = m === '2p' ? ['R', 'Y'] : COLORS;
    const init: Token[] = [];
    colors.forEach(c => {
      [0, 1, 2, 3].forEach(i => init.push({ color: c, pos: { kind: 'yard', slot: i as 0|1|2|3 } }));
    });
    setTokens(init);
  };

  // Determine valid token moves for a color given a roll.
  const getMoves = useCallback((color: Color, roll: number, ts: Token[]): number[] => {
    const moves: number[] = [];
    ts.forEach((tok, i) => {
      if (tok.color !== color) return;
      const np = nextPos(color, tok.pos, roll);
      if (np) moves.push(i);
    });
    return moves;
  }, []);

  const nextPos = (color: Color, pos: TokenPos, roll: number): TokenPos | null => {
    if (pos.kind === 'finished') return null;
    if (pos.kind === 'yard') {
      if (roll === 6) return { kind: 'loop', index: START_INDEX[color] };
      return null;
    }
    if (pos.kind === 'loop') {
      // distance from start to current cell on its own loop
      const stepsTaken = (pos.index - START_INDEX[color] + 52) % 52;
      const newSteps = stepsTaken + roll;
      if (newSteps < 51) {
        return { kind: 'loop', index: (pos.index + roll) % 52 };
      }
      // entering home column
      const homeStep = newSteps - 51; // 0..
      if (homeStep > 5) return null; // overshoot — invalid
      if (homeStep === 5) return { kind: 'finished' };
      return { kind: 'home', step: homeStep };
    }
    if (pos.kind === 'home') {
      const newStep = pos.step + roll;
      if (newStep > 5) return null;
      if (newStep === 5) return { kind: 'finished' };
      return { kind: 'home', step: newStep };
    }
    return null;
  };

  const applyMove = (tokenIdx: number, roll: number) => {
    setTokens(prev => {
      const ts = prev.map(t => ({ ...t, pos: { ...t.pos } as TokenPos }));
      const tok = ts[tokenIdx];
      const np = nextPos(tok.color, tok.pos, roll);
      if (!np) return prev;
      tok.pos = np;
      // Capture: if landed on a loop cell (not safe) with exactly one opposing token, send it back.
      if (np.kind === 'loop' && !SAFE_INDICES.has(np.index)) {
        const others = ts.filter(t => t !== tok && t.pos.kind === 'loop' && (t.pos as { kind: 'loop'; index: number }).index === np.index);
        const enemies = others.filter(t => t.color !== tok.color);
        const friends = others.filter(t => t.color === tok.color);
        if (friends.length === 0 && enemies.length === 1) {
          const e = enemies[0];
          // send back to first empty yard slot
          const used = ts.filter(t => t.color === e.color && t.pos.kind === 'yard').map(t => (t.pos as {kind:'yard';slot:0|1|2|3}).slot);
          const free = ([0,1,2,3] as (0|1|2|3)[]).find(s => !used.includes(s)) ?? 0;
          e.pos = { kind: 'yard', slot: free };
        }
      }
      return ts;
    });
  };

  const checkWin = useCallback((ts: Token[]): Color | null => {
    for (const c of activeColors) {
      const mine = ts.filter(t => t.color === c);
      if (mine.length === 4 && mine.every(t => t.pos.kind === 'finished')) return c;
    }
    return null;
  }, [activeColors]);

  // Award winner once
  useEffect(() => {
    if (!winner || awardedRef) return;
    const me = players.find(p => p.color === winner);
    if (me && !me.isBot) onScore?.(50);
    setAwardedRef(true);
  }, [winner, awardedRef, players, onScore]);

  // Watch tokens for win
  useEffect(() => {
    if (winner) return;
    const w = checkWin(tokens);
    if (w) {
      setWinner(w);
      setMsg(lang === 'ar' ? `🏆 الفائز: ${COLOR_NAME_AR[w]}` : `🏆 Winner: ${COLOR_NAME_EN[w]}`);
    }
  }, [tokens, winner, checkWin, lang]);

  const nextTurn = useCallback((rolledSix: boolean) => {
    if (rolledSix) return; // bonus roll
    setDice(null);
    setActive(prev => {
      const idx = activeColors.indexOf(prev);
      return activeColors[(idx + 1) % activeColors.length];
    });
  }, [activeColors]);

  const roll = useCallback((auto = false) => {
    if (rolling || winner || dice !== null) return;
    setRolling(true);
    let frames = 8;
    const id = window.setInterval(() => {
      setDice(1 + Math.floor(Math.random() * 6));
      if (--frames <= 0) {
        clearInterval(id);
        const r = 1 + Math.floor(Math.random() * 6);
        setDice(r);
        setRolling(false);
        const moves = getMoves(active, r, tokens);
        if (moves.length === 0) {
          setMsg(lang === 'ar' ? '🚫 لا توجد حركة ممكنة' : '🚫 No moves available');
          setTimeout(() => { setMsg(''); nextTurn(r === 6); }, 900);
          return;
        }
        const me = players.find(p => p.color === active);
        if (me?.isBot || auto) {
          // Bot: prefer captures > leave yard > advance furthest
          setTimeout(() => botMove(r, moves), 600);
        }
      }
    }, 60);
  }, [rolling, winner, dice, active, tokens, getMoves, players, lang, nextTurn]);

  const botMove = (r: number, moves: number[]) => {
    let best = moves[0];
    let bestScore = -1;
    moves.forEach(i => {
      const tok = tokens[i];
      const np = nextPos(tok.color, tok.pos, r);
      if (!np) return;
      let s = 0;
      if (np.kind === 'finished') s = 100;
      else if (tok.pos.kind === 'yard') s = 50;
      else if (np.kind === 'loop' && !SAFE_INDICES.has(np.index)) {
        const enemies = tokens.filter(t => t !== tok && t.color !== tok.color && t.pos.kind === 'loop' && (t.pos as {kind:'loop';index:number}).index === np.index);
        if (enemies.length === 1) s = 80;
        else s = 10 + r;
      } else s = 5 + r;
      if (s > bestScore) { bestScore = s; best = i; }
    });
    pickToken(best, r);
  };

  const pickToken = (idx: number, r: number) => {
    applyMove(idx, r);
    setDice(null);
    setMsg('');
    setTimeout(() => nextTurn(r === 6), 350);
  };

  // Auto-roll for bot turns
  useEffect(() => {
    if (winner || mode === null) return;
    const me = players.find(p => p.color === active);
    if (me?.isBot && dice === null && !rolling) {
      const t = setTimeout(() => roll(true), 700);
      return () => clearTimeout(t);
    }
  }, [active, dice, rolling, winner, mode, players, roll]);

  // ─── Render ───
  if (mode === null) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-extrabold">🎲 {lang === 'ar' ? 'لودو كلاسيك' : 'Classic Ludo'}</h2>
          <p className="text-xs text-muted-foreground">
            {lang === 'ar' ? 'اختر عدد اللاعبين — الفائز يحصل على 50 🪙' : 'Pick player count — winner earns 50 🪙'}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => startGame('2p')} className="p-5 rounded-2xl bg-gradient-to-br from-red-500 to-yellow-500 text-white font-extrabold shadow-lg active:scale-95">
            👥 {lang === 'ar' ? '٢ لاعبين' : '2 Players'}
            <p className="text-xs font-medium opacity-90 mt-1">{lang === 'ar' ? 'أحمر vs أصفر' : 'Red vs Yellow'}</p>
          </button>
          <button onClick={() => startGame('4p')} className="p-5 rounded-2xl bg-gradient-to-br from-green-500 to-blue-500 text-white font-extrabold shadow-lg active:scale-95">
            👨‍👩‍👧‍👦 {lang === 'ar' ? '٤ لاعبين' : '4 Players'}
            <p className="text-xs font-medium opacity-90 mt-1">{lang === 'ar' ? 'كل الألوان' : 'All colors'}</p>
          </button>
        </div>
        <div className="glass-card rounded-2xl p-3">
          <p className="text-xs font-bold mb-2">{lang === 'ar' ? 'حدّد البوتات' : 'Pick bots'}</p>
          <div className="flex flex-wrap gap-2">
            {COLORS.map(c => (
              <label key={c} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${bots[c] ? COLOR_BG[c] + ' text-white' : 'bg-secondary'}`}>
                <input type="checkbox" checked={bots[c]} onChange={e => setBots(b => ({ ...b, [c]: e.target.checked }))} className="accent-current" />
                {lang === 'ar' ? COLOR_NAME_AR[c] : COLOR_NAME_EN[c]} {bots[c] ? '🤖' : '🧑'}
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const cellSize = 22;
  const boardSize = 15 * cellSize;

  // Build a quick lookup: which loop index lives at [r,c]?
  const loopAt: Record<string, number> = {};
  LOOP.forEach(([r, c], i) => { loopAt[`${r},${c}`] = i; });
  // Home stretch lookups
  const homeAt: Record<string, { color: Color; step: number }> = {};
  COLORS.forEach(c => HOME_PATH[c].forEach(([r, cc], step) => {
    homeAt[`${r},${cc}`] = { color: c, step };
  }));

  const cellBg = (r: number, c: number): string => {
    // Yard quadrants
    if (r < 6 && c < 6) return 'bg-red-200';
    if (r < 6 && c > 8) return 'bg-green-200';
    if (r > 8 && c < 6) return 'bg-blue-200';
    if (r > 8 && c > 8) return 'bg-yellow-200';
    // Center
    if (r >= 6 && r <= 8 && c >= 6 && c <= 8) return 'bg-gradient-to-br from-pink-300 via-purple-300 to-indigo-300';
    // Home paths
    const h = homeAt[`${r},${c}`];
    if (h) return COLOR_BG[h.color] + '/70';
    // Loop
    const li = loopAt[`${r},${c}`];
    if (li !== undefined) {
      if (li === START_INDEX.R) return 'bg-red-400';
      if (li === START_INDEX.G) return 'bg-green-400';
      if (li === START_INDEX.Y) return 'bg-yellow-400';
      if (li === START_INDEX.B) return 'bg-blue-400';
      if (SAFE_INDICES.has(li)) return 'bg-amber-100';
      return 'bg-white';
    }
    return 'bg-stone-100';
  };

  // What tokens render at [r,c]?
  const tokensAt = (r: number, c: number): { tok: Token; idx: number }[] => {
    const out: { tok: Token; idx: number }[] = [];
    tokens.forEach((tok, idx) => {
      if (tok.pos.kind === 'yard') {
        const colorYard = YARD[tok.color];
        const [yr, yc] = colorYard[tok.pos.slot];
        if (yr === r && yc === c) out.push({ tok, idx });
      } else if (tok.pos.kind === 'loop') {
        const [lr, lc] = LOOP[tok.pos.index];
        if (lr === r && lc === c) out.push({ tok, idx });
      } else if (tok.pos.kind === 'home') {
        const [hr, hc] = HOME_PATH[tok.color][tok.pos.step];
        if (hr === r && hc === c) out.push({ tok, idx });
      }
    });
    return out;
  };

  const finishedCounts: Record<Color, number> = { R: 0, G: 0, Y: 0, B: 0 };
  tokens.forEach(t => { if (t.pos.kind === 'finished') finishedCounts[t.color] += 1; });

  const movableIndices = dice !== null ? getMoves(active, dice, tokens) : [];
  const activePlayer = players.find(p => p.color === active)!;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold">🎲 {lang === 'ar' ? 'لودو' : 'Ludo'}</h2>
        <button onClick={() => setMode(null)} className="text-xs text-muted-foreground underline">
          {lang === 'ar' ? 'إعادة' : 'Restart'}
        </button>
      </div>

      {/* Player banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {players.map(p => (
          <div key={p.color}
            className={`px-2 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
              p.color === active ? COLOR_BG[p.color] + ' text-white ring-2 ring-foreground' : 'bg-secondary'
            }`}>
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: COLOR_HEX[p.color] }} />
            <span className="truncate">{p.name}</span>
            <span className="ml-auto">{finishedCounts[p.color]}/4</span>
          </div>
        ))}
      </div>

      {/* Board */}
      <div className="mx-auto rounded-2xl p-1.5 bg-gradient-to-br from-stone-300 to-stone-500 shadow-2xl"
        style={{ width: boardSize + 12 }}>
        <div className="grid" style={{
          gridTemplateColumns: `repeat(15, ${cellSize}px)`,
          gridTemplateRows: `repeat(15, ${cellSize}px)`,
        }}>
          {Array.from({ length: 15 }).map((_, r) =>
            Array.from({ length: 15 }).map((__, c) => {
              const here = tokensAt(r, c);
              const isCenter = r === 7 && c === 7;
              return (
                <div key={`${r},${c}`}
                  className={`relative border border-stone-300/40 ${cellBg(r, c)} flex items-center justify-center`}>
                  {isCenter && <span className="text-xs">🏁</span>}
                  {SAFE_INDICES.has(loopAt[`${r},${c}`]) && here.length === 0 && <span className="text-[8px] text-amber-600">★</span>}
                  {here.map(({ tok, idx }, i) => {
                    const movable = movableIndices.includes(idx);
                    const myTurn = tok.color === active && !activePlayer.isBot && dice !== null;
                    return (
                      <button
                        key={i}
                        disabled={!myTurn || !movable || !!winner}
                        onClick={() => pickToken(idx, dice!)}
                        className={`absolute rounded-full border-2 border-white shadow ${COLOR_BG[tok.color]} ${
                          myTurn && movable ? 'ring-2 ring-amber-400 animate-pulse' : ''
                        }`}
                        style={{
                          width: cellSize - 6, height: cellSize - 6,
                          transform: here.length > 1 ? `translate(${i * 3 - 3}px, ${i * 3 - 3}px) scale(0.85)` : undefined,
                          zIndex: 5 + i,
                        }}
                      />
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-white border-2 border-foreground flex items-center justify-center text-3xl font-extrabold shadow">
          {dice ?? '?'}
        </div>
        {winner === null ? (
          <button
            onClick={() => roll()}
            disabled={rolling || dice !== null || activePlayer.isBot}
            className="px-5 py-3 rounded-xl gradient-primary text-primary-foreground font-bold disabled:opacity-50">
            🎲 {activePlayer.isBot
              ? (lang === 'ar' ? 'دور البوت...' : 'Bot turn...')
              : (lang === 'ar' ? `ارم النرد (${activePlayer.name})` : `Roll (${activePlayer.name})`)}
          </button>
        ) : (
          <button onClick={() => startGame(mode)} className="px-5 py-3 rounded-xl bg-emerald-500 text-white font-bold">
            🏆 {msg} — {lang === 'ar' ? 'العب مجدداً' : 'Play again'}
          </button>
        )}
      </div>

      {msg && winner === null && (
        <p className="text-center text-xs text-muted-foreground">{msg}</p>
      )}
      <p className="text-center text-[10px] text-muted-foreground">
        {lang === 'ar' ? '★ المربعات الآمنة — احصل على ٦ للخروج من الزاوية — الفائز ٥٠ 🪙' : '★ Safe squares — roll 6 to leave yard — winner gets 50 🪙'}
      </p>
    </div>
  );
};

export default Ludo;
