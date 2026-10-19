import { useState, useEffect } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Trophy } from 'lucide-react';

interface MemoryGameProps {
  onScore: (points: number) => void;
  difficulty: 'beginner' | 'intermediate' | 'pro';
}

const emojis = ['🌟', '🎯', '🚀', '🌈', '🎨', '🎵', '🦋', '🌺', '🍎', '🐬', '🦁', '🎪'];

const MemoryGame = ({ onScore, difficulty }: MemoryGameProps) => {
  const { t, lang } = useLang();
  const pairCount = difficulty === 'beginner' ? 4 : difficulty === 'intermediate' ? 6 : 8;
  const [cards, setCards] = useState<{ id: number; emoji: string; flipped: boolean; matched: boolean }[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const initGame = () => {
    const picked = emojis.slice(0, pairCount);
    const deck = [...picked, ...picked]
      .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }))
      .sort(() => Math.random() - 0.5);
    setCards(deck);
    setSelected([]);
    setMoves(0);
    setGameOver(false);
  };

  useEffect(() => { initGame(); }, [difficulty]);

  useEffect(() => {
    if (selected.length === 2) {
      const [a, b] = selected;
      setMoves(m => m + 1);
      if (cards[a].emoji === cards[b].emoji) {
        onScore(1);
        const next = cards.map((c, i) => i === a || i === b ? { ...c, matched: true } : c);
        setCards(next);
        setSelected([]);
        if (next.every(c => c.matched)) {
          setGameOver(true);
        }
      } else {
        setTimeout(() => {
          setCards(prev => prev.map((c, i) => i === a || i === b ? { ...c, flipped: false } : c));
          setSelected([]);
        }, 800);
      }
    }
  }, [selected]);

  const handleClick = (index: number) => {
    if (selected.length >= 2 || cards[index].flipped || cards[index].matched) return;
    setCards(prev => prev.map((c, i) => i === index ? { ...c, flipped: true } : c));
    setSelected(prev => [...prev, index]);
  };

  if (gameOver) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center">
        <Trophy size={40} className="text-gold mx-auto mb-3" />
        <h3 className="text-xl font-bold text-foreground mb-2">{lang === 'ar' ? 'أحسنت! 🎉' : 'Well Done! 🎉'}</h3>
        <p className="text-sm text-muted-foreground mb-4">{moves} {lang === 'ar' ? 'محاولة' : 'moves'}</p>
        <button onClick={initGame} className="px-6 py-3 rounded-xl gradient-gaming text-gaming-foreground font-semibold">
          {t('playAgain')}
        </button>
      </div>
    );
  }

  const cols = pairCount <= 4 ? 4 : pairCount <= 6 ? 4 : 4;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-foreground">{lang === 'ar' ? 'لعبة الذاكرة' : 'Memory Match'} 🧠</h3>
        <span className="text-xs text-muted-foreground">{moves} {lang === 'ar' ? 'محاولة' : 'moves'}</span>
      </div>
      <div className={`grid grid-cols-${cols} gap-2`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {cards.map((card, i) => (
          <button
            key={card.id}
            onClick={() => handleClick(i)}
            className={`aspect-square rounded-xl text-2xl flex items-center justify-center transition-all duration-300 ${
              card.flipped || card.matched
                ? 'bg-gaming/10 scale-100'
                : 'bg-secondary hover:bg-secondary/80 active:scale-95'
            } ${card.matched ? 'opacity-50' : ''}`}
          >
            {card.flipped || card.matched ? card.emoji : '❓'}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MemoryGame;
