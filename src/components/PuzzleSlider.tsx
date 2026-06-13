import { useState, useCallback, useEffect } from 'react';
import { useLang } from '@/contexts/LanguageContext';

interface PuzzleSliderProps {
  onScore: (pts: number) => void;
  difficulty: 'beginner' | 'intermediate' | 'pro';
}

const PuzzleSlider = ({ onScore, difficulty }: PuzzleSliderProps) => {
  const { lang } = useLang();
  const size = difficulty === 'beginner' ? 3 : difficulty === 'intermediate' ? 4 : 5;
  const total = size * size;

  const createSolved = () => [...Array(total - 1).keys()].map(i => i + 1).concat(0);

  const shuffle = useCallback(() => {
    const arr = createSolved();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [total]);

  const [tiles, setTiles] = useState<number[]>(() => shuffle());
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);

  const isSolved = (t: number[]) => t.every((v, i) => i === total - 1 ? v === 0 : v === i + 1);

  const handleClick = (idx: number) => {
    if (won) return;
    const emptyIdx = tiles.indexOf(0);
    const row = Math.floor(idx / size), col = idx % size;
    const eRow = Math.floor(emptyIdx / size), eCol = emptyIdx % size;
    if ((Math.abs(row - eRow) === 1 && col === eCol) || (Math.abs(col - eCol) === 1 && row === eRow)) {
      const next = [...tiles];
      [next[idx], next[emptyIdx]] = [next[emptyIdx], next[idx]];
      setTiles(next);
      setMoves(m => m + 1);
      if (isSolved(next)) { setWon(true); onScore(size * 2); }
    }
  };

  const restart = () => { setTiles(shuffle()); setMoves(0); setWon(false); };

  const colors = ['#F8BBD0', '#F48FB1', '#EC407A', '#E91E63', '#C2185B', '#AD1457',
    '#FCE4EC', '#FFCDD2', '#EF9A9A', '#E57373', '#EF5350', '#F44336',
    '#FFEBEE', '#FFCDD2', '#E8EAF6', '#C5CAE9', '#9FA8DA', '#7986CB',
    '#FFF3E0', '#FFE0B2', '#FFCC80', '#FFB74D', '#FFA726', '#FF9800', '#FB8C00'];

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground">🧩 {lang === 'ar' ? 'لغز التمرير' : 'Slide Puzzle'}</h3>
        <span className="text-xs text-muted-foreground">{lang === 'ar' ? 'حركات:' : 'Moves:'} {moves}</span>
      </div>
      {won && (
        <div className="p-3 rounded-xl gradient-gold text-center animate-bounce-in">
          <p className="font-bold text-gold-foreground text-sm">🎉 {lang === 'ar' ? 'أحسنت!' : 'Solved!'} +{size * 2} ⭐</p>
        </div>
      )}
      <div className="grid gap-1 mx-auto" style={{ gridTemplateColumns: `repeat(${size}, 1fr)`, maxWidth: `${size * 60}px` }}>
        {tiles.map((tile, idx) => (
          <button key={idx} onClick={() => handleClick(idx)} disabled={tile === 0}
            className={`aspect-square rounded-xl font-bold text-sm transition-all active:scale-95 ${
              tile === 0 ? 'bg-secondary/30' : 'text-primary-foreground shadow-md hover:scale-105'
            }`}
            style={tile !== 0 ? { backgroundColor: colors[tile % colors.length] } : {}}>
            {tile !== 0 && tile}
          </button>
        ))}
      </div>
      <button onClick={restart} className="w-full py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium">
        {lang === 'ar' ? 'إعادة' : 'Restart'}
      </button>
    </div>
  );
};

export default PuzzleSlider;
