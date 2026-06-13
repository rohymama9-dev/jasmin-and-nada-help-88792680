import { useState, useEffect, useMemo } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import GameInstructions from './GameInstructions';

interface ShapeSorterProps {
  onScore: (pts: number) => void;
  difficulty?: string;
}

const MAX_LEVEL = 15;

// Massively expanded shape DB — 24 distinct shapes
type Shape = string;
const SHAPE_DB: { id: Shape; emoji: string; nameAr: string; nameEn: string }[] = [
  { id: 'circle',     emoji: '🔴', nameAr: 'دائرة',    nameEn: 'Circle' },
  { id: 'square',     emoji: '🟦', nameAr: 'مربع',     nameEn: 'Square' },
  { id: 'triangle',   emoji: '🔺', nameAr: 'مثلث',     nameEn: 'Triangle' },
  { id: 'star',       emoji: '⭐', nameAr: 'نجمة',     nameEn: 'Star' },
  { id: 'diamond',    emoji: '💎', nameAr: 'ماسة',     nameEn: 'Diamond' },
  { id: 'heart',      emoji: '❤️', nameAr: 'قلب',      nameEn: 'Heart' },
  { id: 'orangeDiam', emoji: '🔶', nameAr: 'معين',     nameEn: 'Rhombus' },
  { id: 'redCircle',  emoji: '🔴', nameAr: 'كرة حمراء', nameEn: 'Red Ball' },
  { id: 'greenSq',    emoji: '🟩', nameAr: 'مربع أخضر', nameEn: 'Green Sq' },
  { id: 'purpleSq',   emoji: '🟪', nameAr: 'مربع بنفسجي', nameEn: 'Purple Sq' },
  { id: 'yellowSq',   emoji: '🟨', nameAr: 'مربع أصفر', nameEn: 'Yellow Sq' },
  { id: 'orangeSq',   emoji: '🟧', nameAr: 'مربع برتقالي', nameEn: 'Orange Sq' },
  { id: 'brownSq',    emoji: '🟫', nameAr: 'مربع بني', nameEn: 'Brown Sq' },
  { id: 'whiteSq',    emoji: '⬜', nameAr: 'مربع أبيض', nameEn: 'White Sq' },
  { id: 'blackSq',    emoji: '⬛', nameAr: 'مربع أسود', nameEn: 'Black Sq' },
  { id: 'redTri',     emoji: '🔻', nameAr: 'مثلث مقلوب', nameEn: 'Down Triangle' },
  { id: 'blueDiam',   emoji: '🔷', nameAr: 'ماسة زرقاء', nameEn: 'Blue Diamond' },
  { id: 'orangeOctG', emoji: '🔸', nameAr: 'ماسة صغيرة', nameEn: 'Small Diamond' },
  { id: 'blueOctG',   emoji: '🔹', nameAr: 'ماسة زرقاء صغيرة', nameEn: 'Small Blue' },
  { id: 'sparkle',    emoji: '✨', nameAr: 'بريق',     nameEn: 'Sparkle' },
  { id: 'snowflake',  emoji: '❄️', nameAr: 'ندفة',     nameEn: 'Snowflake' },
  { id: 'flower',     emoji: '🌸', nameAr: 'زهرة',     nameEn: 'Flower' },
  { id: 'sun',        emoji: '☀️', nameAr: 'شمس',      nameEn: 'Sun' },
  { id: 'moon',       emoji: '🌙', nameAr: 'قمر',      nameEn: 'Moon' },
];

const ShapeSorter = ({ onScore }: ShapeSorterProps) => {
  const { lang } = useLang();
  const [level, setLevel] = useState(1);
  const [seed, setSeed] = useState(0);

  // Difficulty per level
  const totalItems = Math.min(4 + level, 16);
  const distinctTypes = Math.min(3 + Math.floor(level / 2), SHAPE_DB.length);
  const timeLimit = Math.max(15, 35 - level * 1.5); // seconds, faster at higher levels

  // Generate puzzle
  const { items, target } = useMemo(() => {
    const shuffled = [...SHAPE_DB].sort(() => Math.random() - 0.5).slice(0, distinctTypes);
    const tgt = shuffled[Math.floor(Math.random() * shuffled.length)];
    // Ensure at least one target item exists
    const arr = Array.from({ length: totalItems }, (_, i) => ({
      id: i,
      shape: shuffled[Math.floor(Math.random() * shuffled.length)],
      sorted: false,
    }));
    if (!arr.some(a => a.shape.id === tgt.id)) arr[0].shape = tgt;
    return { items: arr, target: tgt };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, seed]);

  const [state, setState] = useState(items);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [failed, setFailed] = useState(false);

  // Reset on new puzzle
  useEffect(() => {
    setState(items);
    setScore(0);
    setTimeLeft(timeLimit);
    setFailed(false);
  }, [items, timeLimit]);

  // Countdown
  useEffect(() => {
    if (failed) return;
    const remaining = state.filter(i => !i.sorted && i.shape.id === target.id);
    if (remaining.length === 0) return;
    if (timeLeft <= 0) { setFailed(true); return; }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, state, target, failed]);

  const handleTap = (id: number) => {
    if (failed) return;
    const item = state.find(i => i.id === id);
    if (!item || item.sorted) return;
    if (item.shape.id === target.id) {
      setState(prev => prev.map(i => i.id === id ? { ...i, sorted: true } : i));
      setScore(s => s + 1);
      setWrong(false);
    } else {
      setWrong(true);
      setTimeout(() => setWrong(false), 400);
    }
  };

  const remaining = state.filter(i => !i.sorted && i.shape.id === target.id);
  const allDone = state.length > 0 && remaining.length === 0 && !failed;

  useEffect(() => {
    if (allDone && score > 0) onScore(score + level);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone]);

  const nextLevel = () => {
    if (level < MAX_LEVEL) setLevel(l => l + 1);
    else setSeed(s => s + 1);
  };
  const retry = () => setSeed(s => s + 1);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-foreground">
          🔷 {lang === 'ar' ? 'فرز الأشكال' : 'Shape Sorter'} — {lang === 'ar' ? 'مستوى' : 'Lv'} {level}/{MAX_LEVEL}
        </span>
        <GameInstructions titleAr="كيف تلعب الفرز" titleEn="How to Play Shape Sorter"
          stepsAr={['انظر للشكل المطلوب أعلاه','اضغط على كل الأشكال المطابقة قبل انتهاء الوقت','تجنب الأشكال الخاطئة','١٥ مستوى — كلما تقدمت زاد عدد الأشكال وقلَّ الوقت']}
          stepsEn={['Look at the target above','Tap all matching shapes before time runs out','Avoid wrong shapes','15 levels — more items, less time']} />
      </div>

      <div className="flex items-center justify-center gap-2 text-[10px]">
        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
          ⏱️ {Math.ceil(timeLeft)}s
        </span>
        <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
          ✓ {score}/{state.filter(i => i.shape.id === target.id).length}
        </span>
      </div>

      <div className={`text-center p-3 rounded-xl transition-all ${wrong ? 'bg-destructive/10 animate-shake' : 'bg-primary/10'}`}>
        <p className="text-sm text-muted-foreground mb-1">{lang === 'ar' ? 'اضغط على كل:' : 'Tap all:'}</p>
        <span className="text-4xl">{target.emoji}</span>
        <p className="text-xs text-foreground mt-1 font-medium">{lang === 'ar' ? target.nameAr : target.nameEn}</p>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {state.map(item => (
          <button key={item.id} onClick={() => handleTap(item.id)}
            disabled={item.sorted || failed}
            className={`h-16 rounded-xl text-2xl flex items-center justify-center transition-all active:scale-90 ${
              item.sorted ? 'bg-success/20 opacity-50' : 'bg-secondary/50 hover:bg-secondary'
            }`}>
            {item.shape.emoji}
          </button>
        ))}
      </div>

      {failed && (
        <div className="text-center p-3 rounded-xl bg-destructive/10 animate-bounce-in space-y-2">
          <p className="font-bold text-destructive">⌛ {lang === 'ar' ? 'انتهى الوقت!' : 'Time up!'}</p>
          <button onClick={retry} className="px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-sm">
            {lang === 'ar' ? 'حاول مرة أخرى' : 'Try Again'}
          </button>
        </div>
      )}

      {allDone && (
        <div className="text-center p-3 rounded-xl bg-success/10 animate-bounce-in space-y-2">
          <p className="font-bold text-success">🎉 {lang === 'ar' ? 'أحسنت!' : 'Well done!'} +{score + level}⭐</p>
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

export default ShapeSorter;
