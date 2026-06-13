import { useState, useEffect } from 'react';
import { useLang } from '@/contexts/LanguageContext';

interface Props { onScore?: (n: number) => void; }
type Cell = 'X' | 'O' | null;

const LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

function winner(b: Cell[]): Cell | 'draw' | null {
  for (const [a,c,d] of LINES) if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  if (b.every(Boolean)) return 'draw';
  return null;
}

// Standard Minimax with depth penalty for faster wins
function evaluate(b: Cell[]): number {
  const w = winner(b);
  if (w === 'O') return 10;
  if (w === 'X') return -10;
  return 0;
}

function minimax(b: Cell[], depth: number, isMax: boolean): number {
  const score = evaluate(b);
  if (score === 10) return score - depth;
  if (score === -10) return score + depth;
  if (b.every(Boolean)) return 0;

  if (isMax) {
    let best = -1000;
    for (let i = 0; i < 9; i++) {
      if (!b[i]) {
        b[i] = 'O';
        best = Math.max(best, minimax(b, depth + 1, false));
        b[i] = null;
      }
    }
    return best;
  } else {
    let best = 1000;
    for (let i = 0; i < 9; i++) {
      if (!b[i]) {
        b[i] = 'X';
        best = Math.min(best, minimax(b, depth + 1, true));
        b[i] = null;
      }
    }
    return best;
  }
}

function bestMove(b: Cell[]): number {
  // 1. If board is empty, take the center for the strongest start
  if (b.every(c => c === null)) return 4;

  let bestVal = -1000;
  const moves: number[] = [];

  for (let i = 0; i < 9; i++) {
    if (!b[i]) {
      b[i] = 'O';
      const moveVal = minimax(b, 0, false);
      b[i] = null;
      if (moveVal > bestVal) {
        bestVal = moveVal;
        moves.length = 0; // Reset moves list
        moves.push(i);
      } else if (moveVal === bestVal) {
        moves.push(i);
      }
    }
  }

  // 2. Prioritize center if it's among the best moves
  if (moves.includes(4)) return 4;

  // 3. Prioritize corners if they are among the best moves
  const corners = [0, 2, 6, 8].filter(c => moves.includes(c));
  if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];

  // 4. Otherwise, randomly pick one of the best moves
  return moves[Math.floor(Math.random() * moves.length)];
}

const TicTacToe = ({ onScore }: Props) => {
  const { lang } = useLang();
  const [mode, setMode] = useState<'pvc' | 'pvp' | null>(null);
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<Cell>('X');

  const w = winner(board);

  useEffect(() => {
    if (mode !== 'pvc' || w || turn !== 'O') return;
    const id = setTimeout(() => {
      const i = bestMove(board);
      if (i >= 0) {
        const nb = board.slice(); nb[i] = 'O';
        setBoard(nb); setTurn('X');
      }
    }, 600);
    return () => clearTimeout(id);
  }, [board, turn, mode, w]);

  useEffect(() => {
    if (w === 'X' && mode === 'pvc') onScore?.(10);
  }, [w, mode, onScore]);

  const click = (i: number) => {
    if (board[i] || w) return;
    if (mode === 'pvc' && turn !== 'X') return;
    const nb = board.slice(); nb[i] = turn;
    setBoard(nb); setTurn(turn === 'X' ? 'O' : 'X');
  };

  const reset = () => { setBoard(Array(9).fill(null)); setTurn('X'); };

  if (!mode) {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl p-8 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-center font-extrabold text-3xl">
          ⭕ {lang === 'ar' ? 'إكس و أو' : 'Tic-Tac-Toe'} ✖️
        </div>
        <button onClick={() => setMode('pvc')}
          className="w-full p-5 rounded-2xl bg-rose-400/30 border-2 border-rose-400 font-extrabold text-lg">
          🤖 {lang === 'ar' ? 'ضد الكمبيوتر' : 'vs Computer'}
        </button>
        <button onClick={() => setMode('pvp')}
          className="w-full p-5 rounded-2xl bg-secondary font-extrabold text-lg">
          👥 {lang === 'ar' ? 'لاعبان' : '2 Players'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center font-bold">
        {w
          ? w === 'draw'
            ? (lang === 'ar' ? 'تعادل!' : 'Draw!')
            : `🏆 ${w} ${lang === 'ar' ? 'فاز' : 'wins'}`
          : `${lang === 'ar' ? 'الدور' : 'Turn'}: ${turn}`}
      </div>
      <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto p-3 rounded-2xl bg-slate-800">
        {board.map((c, i) => (
          <button key={i} onClick={() => click(i)}
            className="aspect-square rounded-xl bg-slate-900 text-5xl font-black flex items-center justify-center"
            style={{ color: c === 'X' ? '#3b82f6' : '#ef4444' }}>
            {c}
          </button>
        ))}
      </div>
      <div className="flex gap-2 justify-center">
        <button onClick={reset} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold">
          {lang === 'ar' ? 'إعادة' : 'Reset'}
        </button>
        <button onClick={() => { setMode(null); reset(); }} className="px-4 py-2 rounded-xl bg-secondary font-bold">
          {lang === 'ar' ? 'الوضع' : 'Mode'}
        </button>
      </div>
    </div>
  );
};

export default TicTacToe;