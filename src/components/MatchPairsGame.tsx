import { useState, useMemo } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import GameInstructions from './GameInstructions';

interface MatchPairsGameProps {
  onScore: (pts: number) => void;
  difficulty: string;
}

const MatchPairsGame = ({ onScore, difficulty }: MatchPairsGameProps) => {
  const { lang } = useLang();
  
  const pairs = useMemo(() => {
    const allPairs = [
      { ar: '🍎', en: 'Apple', arText: 'تفاحة' },
      { ar: '🐱', en: 'Cat', arText: 'قطة' },
      { ar: '🌞', en: 'Sun', arText: 'شمس' },
      { ar: '📚', en: 'Book', arText: 'كتاب' },
      { ar: '🏠', en: 'House', arText: 'بيت' },
      { ar: '🌺', en: 'Flower', arText: 'زهرة' },
      { ar: '🐟', en: 'Fish', arText: 'سمكة' },
      { ar: '🌙', en: 'Moon', arText: 'قمر' },
      { ar: '⭐', en: 'Star', arText: 'نجمة' },
      { ar: '🎨', en: 'Art', arText: 'فن' },
      { ar: '🎵', en: 'Music', arText: 'موسيقى' },
      { ar: '💧', en: 'Water', arText: 'ماء' },
    ];
    const count = difficulty === 'beginner' ? 4 : difficulty === 'intermediate' ? 6 : 8;
    return allPairs.sort(() => Math.random() - 0.5).slice(0, count);
  }, [difficulty]);

  const items = useMemo(() => {
    const left = pairs.map((p, i) => ({ id: `l${i}`, text: p.ar, pairId: i, side: 'left' as const }));
    const right = pairs.map((p, i) => ({ id: `r${i}`, text: lang === 'ar' ? p.arText : p.en, pairId: i, side: 'right' as const }));
    return { left, right: right.sort(() => Math.random() - 0.5) };
  }, [pairs, lang]);

  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matched, setMatched] = useState<number[]>([]);
  const [wrong, setWrong] = useState(false);

  const handleRightClick = (pairId: number) => {
    if (selectedLeft === null) return;
    if (selectedLeft === pairId) {
      const next = [...matched, pairId];
      setMatched(next);
      setSelectedLeft(null);
      if (next.length === pairs.length) onScore(pairs.length * 3);
    } else {
      setWrong(true);
      setTimeout(() => { setWrong(false); setSelectedLeft(null); }, 500);
    }
  };

  const allDone = matched.length === pairs.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-foreground">🔗 {lang === 'ar' ? 'طابق الأزواج' : 'Match Pairs'}</span>
        <GameInstructions titleAr="كيف تلعب" titleEn="How to Play"
          stepsAr={['اختر رمزاً من اليسار','ثم اختر الاسم المطابق من اليمين','طابق كل الأزواج للفوز']}
          stepsEn={['Select an emoji from the left','Then select matching name from right','Match all pairs to win']} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {items.left.map(item => (
            <button key={item.id} onClick={() => !matched.includes(item.pairId) && setSelectedLeft(item.pairId)}
              className={`w-full p-3 rounded-xl text-xl transition-all ${
                matched.includes(item.pairId) ? 'bg-success/20 opacity-50' :
                selectedLeft === item.pairId ? 'ring-2 ring-primary bg-primary/10' :
                'bg-secondary/50 hover:bg-secondary active:scale-95'
              }`}>
              {item.text}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {items.right.map(item => (
            <button key={item.id} onClick={() => !matched.includes(item.pairId) && handleRightClick(item.pairId)}
              className={`w-full p-3 rounded-xl text-sm font-medium transition-all ${
                matched.includes(item.pairId) ? 'bg-success/20 opacity-50' :
                'bg-secondary/50 hover:bg-secondary active:scale-95'
              } ${wrong && selectedLeft !== null ? 'animate-shake' : ''}`}>
              {item.text}
            </button>
          ))}
        </div>
      </div>

      {allDone && (
        <div className="text-center p-3 rounded-xl bg-success/10 animate-bounce-in">
          <p className="font-bold text-success">🎉 {lang === 'ar' ? 'طابقت الكل!' : 'All matched!'}</p>
        </div>
      )}
    </div>
  );
};

export default MatchPairsGame;
