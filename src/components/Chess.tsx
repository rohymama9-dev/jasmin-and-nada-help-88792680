import { useState, useMemo } from 'react';
import { useLang } from '@/contexts/LanguageContext';

interface Props { onScore?: (n: number) => void; }

/**
 * Simplified Chess vs random-greedy AI.
 *
 * This is a beginner-friendly implementation:
 * - Standard 8×8 setup with all 6 piece types.
 * - Pseudo-legal moves (no en-passant, no castling, no promotion choice — auto-Queen).
 * - AI plays the highest-capture move available, falling back to a random legal move.
 * - No check/checkmate enforcement — capturing the king ends the game.
 *
 * Designed as a learning toy, not a serious engine. Use a real chess library
 * if you need full FIDE rules.
 */

type Color = 'w' | 'b';
type Piece = { type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k'; color: Color };
type Square = Piece | null;
type Board = Square[][]; // [row][col], row 0 = top (black side)

const GLYPH: Record<string, string> = {
  wp: '♙', wn: '♘', wb: '♗', wr: '♖', wq: '♕', wk: '♔',
  bp: '♟', bn: '♞', bb: '♝', br: '♜', bq: '♛', bk: '♚',
};
const VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };

const initBoard = (): Board => {
  const back = ['r','n','b','q','k','b','n','r'] as const;
  const b: Board = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (let c = 0; c < 8; c++) {
    b[0][c] = { type: back[c] as Piece['type'], color: 'b' };
    b[1][c] = { type: 'p', color: 'b' };
    b[6][c] = { type: 'p', color: 'w' };
    b[7][c] = { type: back[c] as Piece['type'], color: 'w' };
  }
  return b;
};

const inBounds = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;

const movesFor = (b: Board, r: number, c: number): [number, number][] => {
  const p = b[r][c];
  if (!p) return [];
  const moves: [number, number][] = [];
  const opp: Color = p.color === 'w' ? 'b' : 'w';
  const push = (rr: number, cc: number) => {
    if (!inBounds(rr, cc)) return false;
    const t = b[rr][cc];
    if (!t) { moves.push([rr, cc]); return true; }
    if (t.color === opp) moves.push([rr, cc]);
    return false;
  };
  const ray = (dr: number, dc: number) => { let rr = r + dr, cc = c + dc; while (push(rr, cc) && b[rr][cc] === null) { rr += dr; cc += dc; } };

  if (p.type === 'p') {
    const dir = p.color === 'w' ? -1 : 1;
    if (inBounds(r + dir, c) && !b[r + dir][c]) {
      moves.push([r + dir, c]);
      const startRow = p.color === 'w' ? 6 : 1;
      if (r === startRow && !b[r + 2 * dir][c]) moves.push([r + 2 * dir, c]);
    }
    for (const dc of [-1, 1]) {
      const rr = r + dir, cc = c + dc;
      if (inBounds(rr, cc) && b[rr][cc]?.color === opp) moves.push([rr, cc]);
    }
  } else if (p.type === 'n') {
    for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]] as [number,number][]) push(r + dr, c + dc);
  } else if (p.type === 'k') {
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (dr || dc) push(r + dr, c + dc);
  } else {
    if (p.type === 'b' || p.type === 'q') for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]] as [number,number][]) ray(dr, dc);
    if (p.type === 'r' || p.type === 'q') for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]] as [number,number][]) ray(dr, dc);
  }
  return moves;
};

const Chess = ({ onScore }: Props) => {
  const { lang } = useLang();
  const [mode, setMode] = useState<'ai' | '2p' | null>(null);
  const [board, setBoard] = useState<Board>(initBoard);
  const [sel, setSel] = useState<[number, number] | null>(null);
  const [turn, setTurn] = useState<Color>('w');
  const [msg, setMsg] = useState('');
  const [over, setOver] = useState(false);
  const legal = useMemo(() => sel ? movesFor(board, sel[0], sel[1]) : [], [sel, board]);

  const move = (b: Board, fr: number, fc: number, tr: number, tc: number): Board => {
    const nb = b.map(row => row.slice());
    const piece = nb[fr][fc]!;
    nb[tr][tc] = piece;
    nb[fr][fc] = null;
    // Auto-promote
    if (piece.type === 'p' && (tr === 0 || tr === 7)) nb[tr][tc] = { type: 'q', color: piece.color };
    return nb;
  };

  const onClick = (r: number, c: number) => {
    if (over) return;
    // In AI mode, only White (the player) can move via clicks.
    if (mode === 'ai' && turn !== 'w') return;
    const sq = board[r][c];
    if (sel) {
      const [sr, sc] = sel;
      if (legal.some(([mr, mc]) => mr === r && mc === c)) {
        const captured = board[r][c];
        const nb = move(board, sr, sc, r, c);
        setBoard(nb); setSel(null);
        if (captured?.type === 'k') {
          const winner = turn === 'w' ? (lang === 'ar' ? 'الأبيض' : 'White') : (lang === 'ar' ? 'الأسود' : 'Black');
          setMsg(lang === 'ar' ? `🏆 فاز ${winner}! (أكل الملك)` : `🏆 ${winner} wins! (Captured king)`);
          setOver(true); onScore?.(15); return;
        }
        const next: Color = turn === 'w' ? 'b' : 'w';
        setTurn(next);
        if (mode === 'ai' && next === 'b') setTimeout(() => aiMove(nb), 400);
        return;
      }
      if (sq?.color === turn) { setSel([r, c]); return; }
      setSel(null);
      return;
    }
    if (sq?.color === turn) setSel([r, c]);
  };

  const aiMove = (b: Board) => {
    const all: { fr: number; fc: number; tr: number; tc: number; gain: number }[] = [];
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const p = b[r][c];
      if (!p || p.color !== 'b') continue;
      for (const [tr, tc] of movesFor(b, r, c)) {
        const target = b[tr][tc];
        all.push({ fr: r, fc: c, tr, tc, gain: target ? VALUES[target.type] : 0 });
      }
    }
    if (!all.length) { setMsg(lang === 'ar' ? '🏆 فزت!' : '🏆 You win!'); setOver(true); onScore?.(15); return; }
    all.sort((a, z) => z.gain - a.gain);
    const best = all[0].gain > 0 ? all[0] : all[Math.floor(Math.random() * Math.min(8, all.length))];
    const captured = b[best.tr][best.tc];
    const nb = move(b, best.fr, best.fc, best.tr, best.tc);
    setBoard(nb);
    if (captured?.type === 'k') { setMsg(lang === 'ar' ? '😞 خسرت' : '😞 AI wins'); setOver(true); return; }
    setTurn('w');
  };

  const reset = () => { setBoard(initBoard()); setSel(null); setTurn('w'); setMsg(''); setOver(false); };

  if (mode === null) {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-2xl p-6 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white">
          <h2 className="text-2xl font-extrabold">♟ {lang === 'ar' ? 'الشطرنج' : 'Chess'}</h2>
          <p className="text-sm mt-1 opacity-90">{lang === 'ar' ? 'اختر طريقة اللعب' : 'Choose game mode'}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto">
          <button onClick={() => setMode('ai')}
            className="py-5 rounded-2xl gradient-primary text-primary-foreground font-extrabold active:scale-95">
            🤖 {lang === 'ar' ? 'اللعب ضد الكمبيوتر' : 'Play vs Computer'}
          </button>
          <button onClick={() => setMode('2p')}
            className="py-5 rounded-2xl bg-secondary text-secondary-foreground font-extrabold active:scale-95">
            👥 {lang === 'ar' ? 'لاعبان (نفس الجهاز)' : '2 Players (same device)'}
          </button>
        </div>
      </div>
    );
  }

  const turnLabel = mode === 'ai'
    ? (turn === 'w' ? (lang === 'ar' ? 'دورك (أبيض)' : 'Your turn (White)') : (lang === 'ar' ? 'الذكاء يفكر...' : 'AI thinking...'))
    : (turn === 'w' ? (lang === 'ar' ? 'دور الأبيض' : "White's turn") : (lang === 'ar' ? 'دور الأسود' : "Black's turn"));

  return (
    <div className="space-y-3">
      <div className="text-center">
        <h2 className="text-lg font-extrabold">♟ {lang === 'ar' ? 'الشطرنج' : 'Chess'}</h2>
        <p className="text-xs text-muted-foreground">{turnLabel}</p>
      </div>
      {/* Board palette: white & green squares; pieces are blue (player) and black (AI). */}
      <div className="grid grid-cols-8 max-w-md mx-auto rounded-xl overflow-hidden ring-2 ring-emerald-700 shadow-2xl shadow-emerald-900/40" dir="ltr">
        {board.map((row, r) => row.map((sq, c) => {
          const dark = (r + c) % 2 === 1;
          const isSel = sel && sel[0] === r && sel[1] === c;
          const isMove = legal.some(([mr, mc]) => mr === r && mc === c);
          return (
            <button key={`${r}-${c}`} onClick={() => onClick(r, c)}
              className={`aspect-square text-2xl flex items-center justify-center transition-colors ${
                dark ? 'bg-emerald-600' : 'bg-white'
              } ${isSel ? 'ring-2 ring-amber-400 ring-inset' : ''} ${isMove ? 'ring-2 ring-amber-300 ring-inset' : ''}`}>
              {sq && (
                <span className={sq.color === 'w'
                  ? 'text-blue-700 drop-shadow font-extrabold'
                  : 'text-slate-950 drop-shadow font-extrabold'}>
                  {GLYPH[sq.color + sq.type]}
                </span>
              )}
            </button>
          );
        }))}
      </div>
      <p className="text-center text-sm font-bold h-5">{msg}</p>
      <div className="flex justify-center gap-2">
        <button onClick={reset} className="px-4 py-2 rounded-xl bg-secondary text-sm font-bold">↺ {lang === 'ar' ? 'إعادة' : 'Reset'}</button>
        <button onClick={() => { reset(); setMode(null); }} className="px-4 py-2 rounded-xl bg-secondary text-sm font-bold">⇦ {lang === 'ar' ? 'تغيير الوضع' : 'Change mode'}</button>
      </div>
    </div>
  );
};

export default Chess;
