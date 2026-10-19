import { useState, useMemo } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import GameInstructions from './GameInstructions';

interface LetterWarGameProps {
  onScore: (pts: number) => void;
  difficulty: string;
}

interface Challenge {
  prompt: string;
  answer: string;
  type: 'letter' | 'number';
}

const arabicLetters = 'أ ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن هـ و ي'.split(' ');
const englishLetters = 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z'.split(' ');

const generateChallenges = (difficulty: string, lang: string): Challenge[] => {
  const count = difficulty === 'beginner' ? 8 : difficulty === 'intermediate' ? 12 : 16;
  const challenges: Challenge[] = [];

  for (let i = 0; i < count; i++) {
    const isNumber = Math.random() > 0.5;
    if (isNumber) {
      const max = difficulty === 'beginner' ? 10 : difficulty === 'intermediate' ? 50 : 100;
      const a = Math.floor(Math.random() * max) + 1;
      const b = Math.floor(Math.random() * max) + 1;
      const ops = difficulty === 'beginner' ? ['+'] : difficulty === 'intermediate' ? ['+', '-'] : ['+', '-', '×'];
      const op = ops[Math.floor(Math.random() * ops.length)];
      let answer: number;
      switch (op) {
        case '+': answer = a + b; break;
        case '-': answer = Math.max(a, b) - Math.min(a, b); break;
        case '×': answer = a * b; break;
        default: answer = a + b;
      }
      challenges.push({ prompt: `${Math.max(a,b)} ${op} ${Math.min(a,b)} = ?`, answer: String(answer), type: 'number' });
    } else {
      const letters = lang === 'ar' ? arabicLetters : englishLetters;
      const idx = Math.floor(Math.random() * (letters.length - 1));
      const nextLetter = letters[idx + 1];
      challenges.push({
        prompt: lang === 'ar' ? `ما الحرف بعد "${letters[idx]}"؟` : `What letter comes after "${letters[idx]}"?`,
        answer: nextLetter,
        type: 'letter',
      });
    }
  }
  return challenges;
};

const LetterWarGame = ({ onScore, difficulty }: LetterWarGameProps) => {
  const { lang } = useLang();
  const challenges = useMemo(() => generateChallenges(difficulty, lang), [difficulty, lang]);
  const [current, setCurrent] = useState(0);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = () => {
    if (!input.trim()) return;
    const isCorrect = input.trim().toLowerCase() === challenges[current].answer.toLowerCase() ||
                      input.trim() === challenges[current].answer;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) setScore(s => s + 1);

    setTimeout(() => {
      if (current + 1 >= challenges.length) {
        setDone(true);
        onScore((isCorrect ? score + 1 : score) * 3);
      } else {
        setCurrent(c => c + 1);
        setInput('');
        setFeedback(null);
      }
    }, 1000);
  };

  if (done) {
    return (
      <div className="text-center space-y-3 p-6 animate-bounce-in">
        <span className="text-4xl">{score >= challenges.length * 0.7 ? '🏆' : '👏'}</span>
        <p className="text-lg font-bold text-foreground">{score}/{challenges.length}</p>
        <p className="text-sm text-muted-foreground">{lang === 'ar' ? 'أحسنت!' : 'Well done!'}</p>
        <button onClick={() => { setCurrent(0); setScore(0); setDone(false); setInput(''); setFeedback(null); }}
          className="px-6 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm">
          {lang === 'ar' ? 'العب مرة أخرى' : 'Play Again'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-foreground">⚔️ {lang === 'ar' ? 'حرب الحروف والأرقام' : 'Letter & Number War'}</span>
        <GameInstructions titleAr="كيف تلعب" titleEn="How to Play"
          stepsAr={['اقرأ السؤال بعناية','اكتب الإجابة الصحيحة','أسرع إجابة = أعلى نقاط']}
          stepsEn={['Read the question carefully','Type the correct answer','Faster answers = higher points']} />
      </div>

      <div className="flex items-center gap-2 text-xs">
        <span className="px-2 py-1 rounded-full bg-primary/10 text-primary">{current + 1}/{challenges.length}</span>
        <span className="px-2 py-1 rounded-full bg-success/10 text-success">✓ {score}</span>
      </div>

      <div className="glass-card rounded-2xl p-6 text-center space-y-4">
        <div className={`text-3xl mb-2 ${challenges[current].type === 'number' ? '' : ''}`}>
          {challenges[current].type === 'number' ? '🔢' : '🔤'}
        </div>
        <p className="text-lg font-bold text-foreground">{challenges[current].prompt}</p>
        
        <div className="flex gap-2">
          <input type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className={`flex-1 px-4 py-3 rounded-xl bg-background border text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
              feedback === 'correct' ? 'border-success bg-success/10' :
              feedback === 'wrong' ? 'border-destructive bg-destructive/10' : 'border-border'
            }`}
            placeholder={lang === 'ar' ? 'إجابتك' : 'Your answer'}
            autoFocus />
          <button onClick={handleSubmit} className="px-4 py-3 rounded-xl gradient-primary text-primary-foreground font-bold">
            →
          </button>
        </div>
        {feedback && (
          <p className={`text-sm font-semibold animate-slide-up ${feedback === 'correct' ? 'text-success' : 'text-destructive'}`}>
            {feedback === 'correct' ? (lang === 'ar' ? '✅ صحيح!' : '✅ Correct!') : 
              `❌ ${lang === 'ar' ? 'الإجابة:' : 'Answer:'} ${challenges[current].answer}`}
          </p>
        )}
      </div>
    </div>
  );
};

export default LetterWarGame;
