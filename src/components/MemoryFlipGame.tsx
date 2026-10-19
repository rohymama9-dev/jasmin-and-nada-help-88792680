import { useState, useEffect, useMemo } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import LevelHUD from './games/LevelHUD';

interface Props { onScore: (pts: number) => void; }

const MAX_LEVEL = 15;
const ICON_BANK = ['🐶','🐱','🦊','🐼','🐧','🐸','🐵','🦁','🐯','🐨','🐰','🦄','🐲','🐝','🐞','🦋','🐢','🐳','🐙','🦀','🌸','🌻','🍀','⭐','🌈','🍓','🍕','🚀','🎈','🎲'];

const shuffle = <T,>(a: T[]) => { const x = [...a]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };

interface Card { id: number; icon: string; matched: boolean; }

const MemoryFlipGame = ({ onScore }: Props) => {
  const { lang } = useLang();
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [seed, setSeed] = useState(0);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  const pairCount = Math.min(3 + level, 14);
  const cols = pairCount <= 6 ? 4 : pairCount <= 10 ? 5 : 6;

  const cards = useMemo<Card[]>(() => {
    const picks = shuffle(ICON_BANK).slice(0, pairCount);
    const arr = shuffle([...picks, ...picks]);
    return arr.map((icon, id) => ({ id, icon, matched: false }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, seed]);

  const [state, setState] = useState<Card[]>(cards);
  useEffect(() => { setState(cards); setFlipped([]); setMoves(0); }, [cards]);

  const flip = (id: number) => {
    if (flipped.includes(id) || state[id].matched || flipped.length === 2) return;
    const next = [...flipped, id];
    setFlipped(next);
    if (next.length === 2) {
      setMoves(m => m + 1);
      const [a, b] = next;
      if (state[a].icon === state[b].icon) {
        setTimeout(() => {
          setState(s => s.map(c => c.id === a || c.id === b ? { ...c, matched: true } : c));
          setFlipped([]);
        }, 400);
      } else {
        setTimeout(() => setFlipped([]), 850);
      }
    }
  };

  useEffect(() => {
    if (state.length && state.every(c => c.matched)) {
      const bonus = Math.max(1, pairCount * 2 - Math.floor(moves / 2));
      setScore(s => s + bonus);
      onScore(2);
      setTimeout(() => { if (level < MAX_LEVEL) setLevel(l => l + 1); else setSeed(s => s + 1); }, 700);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="space-y-3">
      <LevelHUD level={level} score={score} />
      <div className="flex justify-center text-[10px] gap-2">
        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary">{lang === 'ar' ? 'حركات' : 'Moves'}: {moves}</span>
        <span className="px-2 py-0.5 rounded-full bg-success/10 text-success">{state.filter(c=>c.matched).length/2}/{pairCount}</span>
      </div>
      <div className="glass-card rounded-2xl p-3 mx-auto" style={{ maxWidth: 360 }}>
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {state.map(card => {
            const shown = flipped.includes(card.id) || card.matched;
            return (
              <button key={card.id} onClick={() => flip(card.id)}
                className={`aspect-square rounded-lg flex items-center justify-center text-2xl transition-all ${
                  shown ? (card.matched ? 'bg-success/30' : 'bg-primary/20') : 'bg-secondary hover:bg-primary/10 active:scale-95'
                }`}>
                {shown ? card.icon : '❓'}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MemoryFlipGame;
