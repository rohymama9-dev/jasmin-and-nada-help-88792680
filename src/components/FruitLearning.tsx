import { useState, useMemo, useEffect } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import LevelHUD from './games/LevelHUD';
import { speak, stopSpeaking } from '@/lib/tts';
import { Volume2, Check, X } from 'lucide-react';

interface Props { onScore: (pts: number) => void; }

interface Fruit { emoji: string; ar: string; en: string; }

const FRUITS: Fruit[] = [
  { emoji: '🍎', ar: 'تفاحة', en: 'Apple' },
  { emoji: '🍌', ar: 'موزة', en: 'Banana' },
  { emoji: '🍇', ar: 'عنب', en: 'Grapes' },
  { emoji: '🍊', ar: 'برتقالة', en: 'Orange' },
  { emoji: '🍓', ar: 'فراولة', en: 'Strawberry' },
  { emoji: '🍉', ar: 'بطيخ', en: 'Watermelon' },
  { emoji: '🍒', ar: 'كرز', en: 'Cherries' },
  { emoji: '🥝', ar: 'كيوي', en: 'Kiwi' },
  { emoji: '🍍', ar: 'أناناس', en: 'Pineapple' },
  { emoji: '🥭', ar: 'مانجو', en: 'Mango' },
  { emoji: '🍑', ar: 'خوخ', en: 'Peach' },
  { emoji: '🍐', ar: 'إجاص', en: 'Pear' },
  { emoji: '🍋', ar: 'ليمون', en: 'Lemon' },
  { emoji: '🥥', ar: 'جوز الهند', en: 'Coconut' },
  { emoji: '🫐', ar: 'توت أزرق', en: 'Blueberry' },
];

const MAX_LEVEL = 15;

const shuffle = <T,>(a: T[]) => {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
};

type Mode = 'learn' | 'quiz';

const FruitLearning = ({ onScore }: Props) => {
  const { lang } = useLang();
  const [mode, setMode] = useState<Mode>('learn');
  const [learnIndex, setLearnIndex] = useState(0);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [seed, setSeed] = useState(0);
  const [feedback, setFeedback] = useState<'ok' | 'no' | null>(null);

  const current = FRUITS[learnIndex];

  // Auto-pronounce on learn change
  useEffect(() => {
    if (mode !== 'learn') return;
    stopSpeaking();
    const t1 = setTimeout(() => speak(current.ar, { lang: 'ar' }), 200);
    const t2 = setTimeout(() => speak(current.en, { lang: 'en' }), 1100);
    return () => { clearTimeout(t1); clearTimeout(t2); stopSpeaking(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learnIndex, mode]);

  const round = useMemo(() => {
    const optionCount = Math.min(3 + Math.floor((level - 1) / 2), 6);
    const pool = shuffle(FRUITS).slice(0, optionCount);
    const target = pool[Math.floor(Math.random() * pool.length)];
    return { target, options: pool };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, seed, mode]);

  // Auto-pronounce on quiz round change
  useEffect(() => {
    if (mode !== 'quiz') return;
    stopSpeaking();
    const t1 = setTimeout(() => speak(round.target.ar, { lang: 'ar' }), 250);
    const t2 = setTimeout(() => speak(round.target.en, { lang: 'en' }), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); stopSpeaking(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round.target.emoji, mode]);

  const replay = (f: Fruit) => {
    stopSpeaking();
    speak(f.ar, { lang: 'ar' });
    setTimeout(() => speak(f.en, { lang: 'en' }), 950);
  };

  const pick = (f: Fruit) => {
    if (feedback) return;
    if (f.emoji === round.target.emoji) {
      setFeedback('ok');
      setScore(s => s + level);
      onScore(2);
      speak(lang === 'ar' ? 'ممتاز' : 'Excellent', { lang });
      setTimeout(() => {
        setFeedback(null);
        if (level < MAX_LEVEL) setLevel(l => l + 1); else setSeed(s => s + 1);
      }, 900);
    } else {
      setFeedback('no');
      setTimeout(() => setFeedback(null), 700);
    }
  };

  if (mode === 'learn') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setMode('learn')}
            className="px-4 py-1.5 rounded-full text-xs font-bold gradient-primary text-primary-foreground">
            {lang === 'ar' ? 'تعلم' : 'Learn'}
          </button>
          <button
            onClick={() => setMode('quiz')}
            className="px-4 py-1.5 rounded-full text-xs font-bold bg-secondary text-foreground">
            {lang === 'ar' ? 'اختبار' : 'Quiz'}
          </button>
        </div>

        <div className="glass-card rounded-3xl p-6 text-center space-y-4 animate-bounce-in" key={current.emoji}>
          <div className="text-[140px] leading-none select-none">{current.emoji}</div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-foreground" dir="rtl">{current.ar}</p>
            <p className="text-xl text-primary">{current.en}</p>
          </div>
          <button
            onClick={() => replay(current)}
            className="mx-auto w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center active:scale-90 transition-all">
            <Volume2 size={22} />
          </button>
          <div className="flex items-center justify-between gap-2 pt-2">
            <button
              onClick={() => setLearnIndex(i => (i - 1 + FRUITS.length) % FRUITS.length)}
              className="flex-1 py-2.5 rounded-xl bg-secondary text-foreground font-semibold active:scale-95">
              ◀ {lang === 'ar' ? 'السابق' : 'Prev'}
            </button>
            <span className="text-xs text-muted-foreground px-3">{learnIndex + 1} / {FRUITS.length}</span>
            <button
              onClick={() => setLearnIndex(i => (i + 1) % FRUITS.length)}
              className="flex-1 py-2.5 rounded-xl gradient-primary text-primary-foreground font-semibold active:scale-95">
              {lang === 'ar' ? 'التالي' : 'Next'} ▶
            </button>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {FRUITS.map((f, i) => (
            <button
              key={f.emoji}
              onClick={() => { setLearnIndex(i); }}
              className={`aspect-square rounded-xl text-3xl flex items-center justify-center transition-all active:scale-90 ${
                i === learnIndex ? 'gradient-primary ring-2 ring-primary scale-105' : 'bg-secondary/60'
              }`}>
              {f.emoji}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Quiz mode
  return (
    <div className="space-y-4">
      <LevelHUD level={level} score={score} />
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setMode('learn')}
          className="px-4 py-1.5 rounded-full text-xs font-bold bg-secondary text-foreground">
          {lang === 'ar' ? 'تعلم' : 'Learn'}
        </button>
        <button
          onClick={() => setMode('quiz')}
          className="px-4 py-1.5 rounded-full text-xs font-bold gradient-primary text-primary-foreground">
          {lang === 'ar' ? 'اختبار' : 'Quiz'}
        </button>
      </div>

      <div className="glass-card rounded-2xl p-5 text-center space-y-3">
        <p className="text-sm text-muted-foreground">{lang === 'ar' ? 'استمع واختر الفاكهة الصحيحة' : 'Listen and pick the correct fruit'}</p>
        <div className="flex items-center justify-center gap-3">
          <p className="text-3xl font-bold text-foreground" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {lang === 'ar' ? round.target.ar : round.target.en}
          </p>
          <button
            onClick={() => replay(round.target)}
            className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center active:scale-90">
            <Volume2 size={18} />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          {round.options.map((f) => {
            const isCorrect = feedback && f.emoji === round.target.emoji;
            return (
              <button
                key={f.emoji}
                onClick={() => pick(f)}
                className={`aspect-square rounded-2xl text-5xl flex items-center justify-center bg-card border-2 transition-all active:scale-90 ${
                  isCorrect ? 'border-success ring-2 ring-success scale-105' : 'border-border hover:border-primary'
                }`}>
                {f.emoji}
              </button>
            );
          })}
        </div>
        {feedback && (
          <div className={`flex items-center justify-center gap-2 text-sm font-bold ${feedback === 'ok' ? 'text-success' : 'text-destructive'}`}>
            {feedback === 'ok' ? <Check size={18} /> : <X size={18} />}
            {feedback === 'ok'
              ? (lang === 'ar' ? 'ممتاز!' : 'Excellent!')
              : (lang === 'ar' ? 'حاول مرة أخرى' : 'Try again')}
          </div>
        )}
      </div>
    </div>
  );
};

export default FruitLearning;
