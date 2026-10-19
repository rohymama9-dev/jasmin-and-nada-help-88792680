import { useState, useEffect } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Trophy, RotateCcw } from 'lucide-react';

interface WordScrambleProps {
  onScore: (points: number) => void;
  difficulty: 'beginner' | 'intermediate' | 'pro';
}

const wordSets = {
  beginner: [
    { en: 'CAT', ar: 'قطة' }, { en: 'SUN', ar: 'شمس' }, { en: 'DOG', ar: 'كلب' },
    { en: 'BOOK', ar: 'كتاب' }, { en: 'STAR', ar: 'نجمة' }, { en: 'MOON', ar: 'قمر' },
  ],
  intermediate: [
    { en: 'APPLE', ar: 'تفاحة' }, { en: 'OCEAN', ar: 'محيط' }, { en: 'LIGHT', ar: 'ضوء' },
    { en: 'PEACE', ar: 'سلام' }, { en: 'HEART', ar: 'قلب' }, { en: 'SMILE', ar: 'ابتسامة' },
  ],
  pro: [
    { en: 'JOURNEY', ar: 'رحلة' }, { en: 'COURAGE', ar: 'شجاعة' }, { en: 'WISDOM', ar: 'حكمة' },
    { en: 'FREEDOM', ar: 'حرية' }, { en: 'NATURE', ar: 'طبيعة' }, { en: 'WONDER', ar: 'عجب' },
  ],
};

const scramble = (word: string) => word.split('').sort(() => Math.random() - 0.5).join('');

const WordScramble = ({ onScore, difficulty }: WordScrambleProps) => {
  const { t, lang } = useLang();
  const words = wordSets[difficulty];
  const [index, setIndex] = useState(0);
  const [guess, setGuess] = useState('');
  const [scrambled, setScrambled] = useState('');
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    setScrambled(scramble(words[index].en));
  }, [index]);

  const checkAnswer = () => {
    if (guess.toUpperCase() === words[index].en) {
      setFeedback('correct');
      setScore(s => s + 1);
    } else {
      setFeedback('wrong');
    }
    setTimeout(() => {
      setFeedback(null);
      setGuess('');
      if (index + 1 >= words.length) {
        setGameOver(true);
        onScore(2); // Set to 2 points per game as requested
      } else {
        setIndex(i => i + 1);
      }
    }, 1000);
  };

  const restart = () => {
    setIndex(0); setScore(0); setGuess(''); setGameOver(false); setFeedback(null);
  };

  if (gameOver) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center">
        <Trophy size={40} className="text-gold mx-auto mb-3" />
        <h3 className="text-xl font-bold text-foreground mb-2">{score}/{words.length}</h3>
        <p className="text-sm text-success font-medium mb-4">+2 {t('points')} ⭐</p>
        <p className="text-sm text-muted-foreground mb-4">{t('gameOver')}</p>
        <button onClick={restart} className="px-6 py-3 rounded-xl gradient-gaming text-gaming-foreground font-semibold">
          {t('playAgain')}
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-foreground">{lang === 'ar' ? 'ترتيب الكلمات' : 'Word Scramble'} 🔤</h3>
        <span className="text-xs text-muted-foreground">{index + 1}/{words.length}</span>
      </div>

      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground mb-1">{lang === 'ar' ? 'المعنى:' : 'Meaning:'} {words[index].ar}</p>
        <p className="text-3xl font-bold text-gaming tracking-widest">{scrambled}</p>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder={lang === 'ar' ? 'اكتب الكلمة...' : 'Type the word...'}
          className="flex-1 px-4 py-3 rounded-xl bg-background border border-border text-sm uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-gaming/50"
          onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
        />
        <button onClick={checkAnswer} className="px-4 py-3 rounded-xl gradient-gaming text-gaming-foreground font-medium text-sm">
          ✓
        </button>
      </div>

      {feedback && (
        <p className={`text-center font-semibold animate-bounce-in ${feedback === 'correct' ? 'text-success' : 'text-destructive'}`}>
          {feedback === 'correct' ? '✓ ' + t('correct') : `✗ ${t('wrong')} — ${words[index].en}`}
        </p>
      )}
    </div>
  );
};

export default WordScramble;
