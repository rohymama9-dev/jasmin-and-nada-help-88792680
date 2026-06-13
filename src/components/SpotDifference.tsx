import { useState, useMemo, useEffect } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import GameInstructions from './GameInstructions';

interface SpotDifferenceProps {
  onScore: (pts: number) => void;
  difficulty?: string;
}

const MAX_LEVEL = 15;

// Massively expanded emoji databases for variety
const EMOJI_THEMES = [
  ['🌸','🌺','🌻','🌷','🌹','💐','🌼','🪻','🌿','🍀'],
  ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯'],
  ['🍎','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍒','🍑'],
  ['⚽','🏀','🏈','⚾','🎾','🏐','🏉','🎱','🏓','🏸'],
  ['🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐'],
  ['⭐','🌟','✨','💫','🌙','☀️','🌈','🔥','💎','🎯'],
  ['🍕','🍔','🍟','🌭','🌮','🌯','🥗','🍿','🍣','🍩'],
  ['😀','😎','🤩','🥳','😇','🤗','😍','🤔','😴','🤓'],
];

const ALT_BANK = ['🎈','🎁','🎀','🪄','🎊','💝','🎂','🍭','🦄','🐝','🌟','💖','🍀','🎵','🎲','🪅'];

const SpotDifference = ({ onScore }: SpotDifferenceProps) => {
  const { lang } = useLang();
  const [level, setLevel] = useState(1);
  const [seed, setSeed] = useState(0);

  // Difficulty scaling
  const gridSize = Math.min(4 + Math.floor((level - 1) / 2), 8);
  const numDiffs = Math.min(2 + Math.floor((level - 1) / 2), 7);
  const timeLimit = Math.max(15, 60 - level * 3);

  const { grid, diffPositions, alts } = useMemo(() => {
    const theme = EMOJI_THEMES[Math.floor(Math.random() * EMOJI_THEMES.length)];
    const g = Array.from({ length: gridSize * gridSize }, () => theme[Math.floor(Math.random() * theme.length)]);
    const positions = new Set<number>();
    while (positions.size < numDiffs) {
      positions.add(Math.floor(Math.random() * g.length));
    }
    const altPicks = [...ALT_BANK].sort(() => Math.random() - 0.5).slice(0, numDiffs);
    return { grid: g, diffPositions: [...positions], alts: altPicks };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, seed]);

  const [found, setFound] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [failed, setFailed] = useState(false);

  useEffect(() => { setFound([]); setTimeLeft(timeLimit); setFailed(false); }, [grid, timeLimit]);

  useEffect(() => {
    if (failed || found.length === numDiffs) return;
    if (timeLeft <= 0) { setFailed(true); return; }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, found.length, numDiffs, failed]);

  const handleClick = (idx: number) => {
    if (found.includes(idx) || failed) return;
    if (diffPositions.includes(idx)) {
      const next = [...found, idx];
      setFound(next);
    } else {
      setWrong(idx);
      setTimeout(() => setWrong(null), 400);
    }
  };

  const allFound = found.length === numDiffs && !failed;

  useEffect(() => {
    if (allFound) onScore(numDiffs * 3 + level);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allFound]);

  const nextLevel = () => {
    if (level < MAX_LEVEL) setLevel(l => l + 1);
    else setSeed(s => s + 1);
  };
  const retry = () => setSeed(s => s + 1);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-foreground">
          🔍 {lang === 'ar' ? 'اكتشف الاختلاف' : 'Spot Difference'} — {lang === 'ar' ? 'مستوى' : 'Lv'} {level}/{MAX_LEVEL}
        </span>
        <GameInstructions titleAr="كيف تلعب" titleEn="How to Play"
          stepsAr={['ابحث عن العناصر المختلفة في الشبكة اليمنى','اضغط على كل عنصر مختلف','جد كل الاختلافات قبل انتهاء الوقت']}
          stepsEn={['Find different items on the right grid','Tap each different one','Find all before time runs out']} />
      </div>

      <div className="flex items-center justify-center gap-2 text-[10px]">
        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
          ⏱️ {timeLeft}s
        </span>
        <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
          {lang === 'ar' ? `${numDiffs - found.length} اختلاف` : `${numDiffs - found.length} left`}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] text-muted-foreground text-center mb-1">{lang === 'ar' ? 'الأصلي' : 'Original'}</p>
          <div className="grid gap-0.5 p-2 rounded-xl bg-secondary/30" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
            {grid.map((emoji, i) => (
              <div key={i} className="aspect-square flex items-center justify-center text-sm">{emoji}</div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] text-muted-foreground text-center mb-1">{lang === 'ar' ? 'ابحث هنا' : 'Find here'}</p>
          <div className="grid gap-0.5 p-2 rounded-xl bg-secondary/30" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
            {grid.map((emoji, i) => {
              const diffIdx = diffPositions.indexOf(i);
              const isDiff = diffIdx >= 0;
              const isFound = found.includes(i);
              const isWrong = wrong === i;
              return (
                <button key={i} onClick={() => handleClick(i)}
                  disabled={failed}
                  className={`aspect-square flex items-center justify-center text-sm rounded transition-all ${
                    isFound ? 'bg-success/20 ring-1 ring-success' :
                    isWrong ? 'bg-destructive/20' : 'active:scale-90'
                  }`}>
                  {isDiff ? alts[diffIdx % alts.length] : emoji}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {failed && (
        <div className="text-center p-3 rounded-xl bg-destructive/10 animate-bounce-in space-y-2">
          <p className="font-bold text-destructive">⌛ {lang === 'ar' ? 'انتهى الوقت!' : 'Time up!'}</p>
          <button onClick={retry} className="px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-sm">
            {lang === 'ar' ? 'حاول مرة أخرى' : 'Try Again'}
          </button>
        </div>
      )}

      {allFound && (
        <div className="text-center p-3 rounded-xl bg-success/10 animate-bounce-in space-y-2">
          <p className="font-bold text-success">🎉 {lang === 'ar' ? 'وجدت كل الاختلافات!' : 'Found all differences!'}</p>
          <button onClick={nextLevel} className="px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold">
            {level < MAX_LEVEL
              ? (lang === 'ar' ? `المستوى التالي ▶` : `Next Level ▶`)
              : (lang === 'ar' ? 'جولة جديدة 🔄' : 'New Round 🔄')}
          </button>
        </div>
      )}
    </div>
  );
};

export default SpotDifference;
