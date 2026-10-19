import { useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';

interface Props { onScore?: (n: number) => void; }

/**
 * Snakes & Ladders — local 2-player on a 10×10 board.
 * Roll dice, climb ladders 🪜, fall down snakes 🐍, first to 100 wins.
 */
// Hardcoded per spec — no randomness.
const SNAKES: Record<number, number> = { 17: 7, 54: 34, 62: 19, 64: 60, 87: 36, 93: 73, 95: 75, 98: 79 };
const LADDERS: Record<number, number> = { 1: 38, 4: 14, 9: 31, 21: 42, 28: 84, 51: 67, 72: 91, 80: 99 };

const SnakesLadders = ({ onScore }: Props) => {
  const { lang } = useLang();
  const [pos, setPos] = useState<[number, number]>([1, 1]);
  const [turn, setTurn] = useState<0 | 1>(0);
  const [dice, setDice] = useState<number | null>(null);
  const [winner, setWinner] = useState<0 | 1 | null>(null);
  const [rolling, setRolling] = useState(false);

  const roll = () => {
    if (winner || rolling) return;
    setRolling(true);
    let frames = 8;
    const id = window.setInterval(() => {
      setDice(1 + Math.floor(Math.random() * 6));
      if (--frames <= 0) {
        clearInterval(id);
        const r = 1 + Math.floor(Math.random() * 6);
        setDice(r);
        setRolling(false);
        let next = pos[turn] + r;
        if (next > 100) next = pos[turn]; // need exact roll
        if (LADDERS[next]) next = LADDERS[next];
        else if (SNAKES[next]) next = SNAKES[next];
        const np: [number, number] = [...pos] as [number, number];
        np[turn] = next;
        setPos(np);
        if (next >= 100) {
          setWinner(turn);
          onScore?.(turn === 0 ? 10 : 0);
        } else if (r !== 6) setTurn(turn === 0 ? 1 : 0);
      }
    }, 60);
  };

  const cellNum = (row: number, col: number): number => {
    // Bottom-left = 1, snake-pattern numbering
    const rowFromBottom = 9 - row;
    return rowFromBottom * 10 + (rowFromBottom % 2 === 0 ? col + 1 : 10 - col);
  };

  const reset = () => { setPos([1, 1]); setTurn(0); setDice(null); setWinner(null); };

  return (
    <div className="space-y-3">
      <div className="text-center">
        <h2 className="text-lg font-extrabold">🐍🪜 {lang === 'ar' ? 'السلم والثعبان' : 'Snakes & Ladders'}</h2>
      </div>
      <div className="grid grid-cols-10 gap-0.5 max-w-md mx-auto rounded-2xl p-1 bg-gradient-to-br from-pink-200 to-indigo-200">
        {Array.from({ length: 10 }).map((_, r) =>
          Array.from({ length: 10 }).map((__, c) => {
            const n = cellNum(r, c);
            const isP1 = pos[0] === n;
            const isP2 = pos[1] === n;
            const isLad = !!LADDERS[n];
            const isSnk = !!SNAKES[n];
            return (
              <div key={`${r}-${c}`}
                className={`aspect-square flex items-center justify-center text-[8px] font-bold rounded-sm ${
                  isLad ? 'bg-emerald-300' : isSnk ? 'bg-rose-300' : 'bg-white/80'
                }`}>
                {isP1 || isP2 ? (
                  <span className="text-xs">{isP1 && isP2 ? '🔴🔵' : isP1 ? '🔴' : '🔵'}</span>
                ) : (
                  <span className="opacity-60">{n}{isLad ? '🪜' : isSnk ? '🐍' : ''}</span>
                )}
              </div>
            );
          })
        )}
      </div>
      <div className="flex items-center justify-center gap-3">
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${turn === 0 ? 'bg-rose-500 text-white' : 'bg-secondary text-foreground/60'}`}>
          🔴 P1: {pos[0]}
        </span>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${turn === 1 ? 'bg-blue-500 text-white' : 'bg-secondary text-foreground/60'}`}>
          🔵 P2: {pos[1]}
        </span>
      </div>
      <div className="flex items-center justify-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-700 border-2 border-foreground flex items-center justify-center text-3xl font-extrabold text-foreground dark:text-white shadow">
          {dice ?? '?'}
        </div>
        {winner === null ? (
          <button onClick={roll} disabled={rolling}
            className="px-5 py-3 rounded-xl gradient-primary text-primary-foreground font-bold disabled:opacity-50">
            🎲 {lang === 'ar' ? 'ارم النرد' : 'Roll'}
          </button>
        ) : (
          <button onClick={reset} className="px-5 py-3 rounded-xl bg-emerald-500 text-white font-bold">
            🏆 {lang === 'ar' ? `فاز ${winner === 0 ? 'لاعب 1' : 'لاعب 2'}! إعادة` : `${winner === 0 ? 'P1' : 'P2'} wins! Restart`}
          </button>
        )}
      </div>
      {/* Legend: list every snake and ladder mapping */}
      <div className="max-w-md mx-auto grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-xl bg-emerald-50 border border-emerald-300 p-2">
          <div className="font-extrabold text-emerald-700 mb-1">
            🪜 {lang === 'ar' ? 'السلالم' : 'Ladders'}
          </div>
          <ul className="space-y-0.5 text-emerald-900">
            {Object.entries(LADDERS).map(([from, to]) => (
              <li key={`L${from}`} className="flex justify-between">
                <span>{from}</span><span>⬆ {to}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl bg-rose-50 border border-rose-300 p-2">
          <div className="font-extrabold text-rose-700 mb-1">
            🐍 {lang === 'ar' ? 'الثعابين' : 'Snakes'}
          </div>
          <ul className="space-y-0.5 text-rose-900">
            {Object.entries(SNAKES).map(([from, to]) => (
              <li key={`S${from}`} className="flex justify-between">
                <span>{from}</span><span>⬇ {to}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SnakesLadders;
