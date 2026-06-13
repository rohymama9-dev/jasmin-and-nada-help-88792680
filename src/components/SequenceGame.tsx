import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import GameInstructions from './GameInstructions';

interface SequenceGameProps {
  onScore: (pts: number) => void;
  difficulty: string;
}

const SequenceGame = ({ onScore, difficulty }: SequenceGameProps) => {
  const { lang } = useLang();
  const colors = ['bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-yellow-400', 'bg-purple-400', 'bg-pink-400'];
  const startLen = difficulty === 'beginner' ? 3 : difficulty === 'intermediate' ? 4 : 5;
  
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [showing, setShowing] = useState(true);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  const gridSize = difficulty === 'beginner' ? 4 : 6;

  const generateSequence = useCallback((len: number) => {
    return Array.from({ length: len }, () => Math.floor(Math.random() * gridSize));
  }, [gridSize]);

  useEffect(() => {
    const seq = generateSequence(startLen);
    setSequence(seq);
    showSequence(seq);
  }, []);

  const showSequence = async (seq: number[]) => {
    setShowing(true);
    for (let i = 0; i < seq.length; i++) {
      await new Promise(r => setTimeout(r, 600));
      setActiveIdx(seq[i]);
      await new Promise(r => setTimeout(r, 400));
      setActiveIdx(null);
    }
    await new Promise(r => setTimeout(r, 300));
    setShowing(false);
  };

  const handleTap = (idx: number) => {
    if (showing || gameOver) return;
    const next = [...playerSequence, idx];
    setPlayerSequence(next);

    if (next[next.length - 1] !== sequence[next.length - 1]) {
      setGameOver(true);
      onScore(0);
      return;
    }

    if (next.length === sequence.length) {
      onScore(1);
      const newScore = score + 1;
      setScore(newScore);
      const newSeq = [...sequence, Math.floor(Math.random() * gridSize)];
      setSequence(newSeq);
      setPlayerSequence([]);
      setLevel(l => l + 1);
      setTimeout(() => showSequence(newSeq), 800);
    }
  };

  const restart = () => {
    const seq = generateSequence(startLen);
    setSequence(seq);
    setPlayerSequence([]);
    setLevel(1);
    setScore(0);
    setGameOver(false);
    showSequence(seq);
  };

  if (gameOver) {
    return (
      <div className="text-center space-y-3 p-6 animate-bounce-in">
        <span className="text-4xl">🧠</span>
        <p className="text-lg font-bold text-foreground">{lang === 'ar' ? `المستوى ${level}` : `Level ${level}`}</p>
        <p className="text-sm text-muted-foreground">{lang === 'ar' ? `تذكرت ${score} تسلسلات` : `Remembered ${score} sequences`}</p>
        <button onClick={restart} className="px-6 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm">
          {lang === 'ar' ? 'العب مرة أخرى' : 'Play Again'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-foreground">🧠 {lang === 'ar' ? 'تذكر التسلسل' : 'Sequence Memory'}</span>
        <GameInstructions titleAr="كيف تلعب" titleEn="How to Play"
          stepsAr={['شاهد التسلسل المضيء','أعد الضغط بنفس الترتيب','كل مستوى يزداد صعوبة']}
          stepsEn={['Watch the lit sequence','Repeat in the same order','Each level gets harder']} />
      </div>

      <div className="flex items-center gap-2 text-xs">
        <span className="px-2 py-1 rounded-full bg-primary/10 text-primary">{lang === 'ar' ? `المستوى ${level}` : `Level ${level}`}</span>
        <span className="px-2 py-1 rounded-full bg-success/10 text-success">{playerSequence.length}/{sequence.length}</span>
      </div>

      {showing && (
        <p className="text-center text-sm text-primary animate-pulse font-semibold">
          {lang === 'ar' ? '👀 شاهدي التسلسل...' : '👀 Watch the sequence...'}
        </p>
      )}

      <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
        {Array.from({ length: gridSize }).map((_, i) => (
          <button key={i} onClick={() => handleTap(i)}
            className={`aspect-square rounded-2xl transition-all duration-200 active:scale-90 ${
              activeIdx === i ? `${colors[i % colors.length]} scale-110 shadow-lg` : 'bg-secondary/60 hover:bg-secondary'
            }`} />
        ))}
      </div>
    </div>
  );
};

export default SequenceGame;
