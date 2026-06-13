import { useState, useEffect, useMemo } from 'react';
import { ChevronRight, ChevronLeft, RotateCcw, Trophy, Target } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';

interface CompareQuestion {
  a: number;
  b: number;
  question: { ar: string; en: string };
}

const LEVELS: CompareQuestion[][] = [
  // Level 1: Easy (below 10)
  [
    { a: 3, b: 7, question: { ar: 'أيهما أكبر؟', en: 'Which is greater?' } },
    { a: 2, b: 5, question: { ar: 'أيهما أكبر؟', en: 'Which is greater?' } },
    { a: 8, b: 4, question: { ar: 'أيهما أكبر؟', en: 'Which is greater?' } },
    { a: 1, b: 6, question: { ar: 'أيهما أكبر؟', en: 'Which is greater?' } },
    { a: 9, b: 5, question: { ar: 'أيهما أكبر؟', en: 'Which is greater?' } },
  ],
  // Level 2: 1-20
  [
    { a: 12, b: 18, question: { ar: 'أيهما أكبر؟', en: 'Which is greater?' } },
    { a: 15, b: 10, question: { ar: 'أيهما أكبر؟', en: 'Which is greater?' } },
    { a: 7, b: 19, question: { ar: 'أيهما أكبر؟', en: 'Which is greater?' } },
    { a: 20, b: 13, question: { ar: 'أيهما أكبر؟', en: 'Which is greater?' } },
    { a: 8, b: 14, question: { ar: 'أيهما أكبر؟', en: 'Which is greater?' } },
  ],
  // Level 3: 1-50
  [
    { a: 25, b: 40, question: { ar: 'أيهما أكبر؟', en: 'Which is greater?' } },
    { a: 35, b: 28, question: { ar: 'أيهما أكبر؟', en: 'Which is greater?' } },
    { a: 12, b: 47, question: { ar: 'أيهما أكبر؟', en: 'Which is greater?' } },
    { a: 50, b: 30, question: { ar: 'أيهما أكبر؟', en: 'Which is greater?' } },
    { a: 18, b: 42, question: { ar: 'أيهما أكبر؟', en: 'Which is greater?' } },
  ],
  // Level 4: 1-100
  [
    { a: 45, b: 78, question: { ar: 'أيهما أكبر؟', en: 'Which is greater?' } },
    { a: 92, b: 56, question: { ar: 'أيهما أكبر؟', en: 'Which is greater?' } },
    { a: 23, b: 88, question: { ar: 'أيهما أكبر؟', en: 'Which is greater?' } },
    { a: 100, b: 67, question: { ar: 'أيهما أكبر؟', en: 'Which is greater?' } },
    { a: 35, b: 81, question: { ar: 'أيهما أكبر؟', en: 'Which is greater?' } },
  ],
  // Level 5: 1-500
  [
    { a: 234, b: 389, question: { ar: 'أيهما أكبر؟', en: 'Which is greater?' } },
    { a: 456, b: 321, question: { ar: 'أيهما أكبر؟', en: 'Which is greater?' } },
    { a: 123, b: 478, question: { ar: 'أيهما أكبر؟', en: 'Which is greater?' } },
    { a: 500, b: 250, question: { ar: 'أيهما أكبر؟', en: 'Which is greater?' } },
    { a: 178, b: 412, question: { ar: 'أيهما أكبر؟', en: 'Which is greater?' } },
  ],
  // Level 6: 1-1000
  [
    { a: 567, b: 892, question: { ar: 'أيهما أكبر؟', en: 'Which is greater?' } },
    { a: 734, b: 456, question: { ar: 'أيهما أكبر؟', en: 'Which is greater?' } },
    { a: 312, b: 789, question: { ar: 'أيهما أكبر؟', en: 'Which is greater?' } },
    { a: 1000, b: 567, question: { ar: 'أيهما أكبر؟', en: 'Which is greater?' } },
    { a: 445, b: 823, question: { ar: 'أيهما أكبر؟', en: 'Which is greater?' } },
  ],
];

interface Props {
  onScore?: (points: number) => void;
}

const Compare = ({ onScore }: Props) => {
  const { lang, dir } = useLang();
  const [levelIndex, setLevelIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const level = LEVELS[levelIndex];
  const question = level[questionIndex];
  
  const [shuffled] = useMemo(() => {
    const s = [...level].sort(() => Math.random() - 0.5);
    return [s];
  }, [levelIndex]);

  const currentQuestion = shuffled[questionIndex];
  const isCorrect = selectedAnswer === (currentQuestion.a > currentQuestion.b ? 1 : 2);

  const handleAnswer = (choice: number) => {
    if (answered) return;
    setSelectedAnswer(choice);
    setAnswered(true);
    
    const correct = choice === (currentQuestion.a > currentQuestion.b ? 1 : 2);
    if (correct) {
      setScore(prev => prev + 1);
      onScore?.(3); // 3 points for learning
      toast({ title: lang === 'ar' ? '✓ صحيح!' : '✓ Correct!' });
    } else {
      toast({ title: lang === 'ar' ? '✗ خطأ' : '✗ Wrong' });
    }
  };

  const nextQuestion = () => {
    if (questionIndex < shuffled.length - 1) {
      setQuestionIndex(questionIndex + 1);
      setAnswered(false);
      setSelectedAnswer(null);
    } else if (levelIndex < LEVELS.length - 1) {
      setLevelIndex(levelIndex + 1);
      setQuestionIndex(0);
      setAnswered(false);
      setSelectedAnswer(null);
    }
  };

  const reset = () => {
    setLevelIndex(0);
    setQuestionIndex(0);
    setScore(0);
    setAnswered(false);
    setSelectedAnswer(null);
  };

  return (
    <div className={`space-y-6 ${dir === 'rtl' ? 'direction-rtl' : ''}`} dir={dir}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-foreground">
            {lang === 'ar' ? 'المستوى' : 'Level'} {levelIndex + 1} / {LEVELS.length}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
            {lang === 'ar' ? `السؤال ${questionIndex + 1}/${shuffled.length}` : `Q${questionIndex + 1}/${shuffled.length}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-yellow-500" />
          <span className="text-sm font-bold text-foreground">{score}</span>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-8 space-y-8">
        <h3 className="text-sm font-black text-primary uppercase tracking-widest text-center">
          {lang === 'ar' ? currentQuestion.question.ar : currentQuestion.question.en}
        </h3>

        <div className="grid grid-cols-2 gap-4">
          {/* First number */}
          <button
            onClick={() => handleAnswer(1)}
            disabled={answered}
            className={`p-6 rounded-3xl text-center font-black text-4xl transition-all transform active:scale-95 ${
              !answered
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:scale-105 cursor-pointer'
                : selectedAnswer === 1
                ? isCorrect
                  ? 'bg-green-500 text-white scale-110'
                  : 'bg-red-500 text-white scale-95'
                : currentQuestion.a > currentQuestion.b
                ? 'bg-green-500 text-white'
                : 'bg-secondary text-secondary-foreground opacity-50'
            }`}
          >
            {currentQuestion.a}
          </button>

          {/* Second number */}
          <button
            onClick={() => handleAnswer(2)}
            disabled={answered}
            className={`p-6 rounded-3xl text-center font-black text-4xl transition-all transform active:scale-95 ${
              !answered
                ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:scale-105 cursor-pointer'
                : selectedAnswer === 2
                ? isCorrect
                  ? 'bg-green-500 text-white scale-110'
                  : 'bg-red-500 text-white scale-95'
                : currentQuestion.b > currentQuestion.a
                ? 'bg-green-500 text-white'
                : 'bg-secondary text-secondary-foreground opacity-50'
            }`}
          >
            {currentQuestion.b}
          </button>
        </div>

        {answered && (
          <button
            onClick={nextQuestion}
            className="w-full py-4 rounded-2xl gradient-primary text-white font-bold flex items-center justify-center gap-2 animate-bounce"
          >
            {lang === 'ar' ? 'السؤال التالي' : 'Next Question'} 
            {lang === 'ar' ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        )}
      </div>

      {levelIndex === LEVELS.length - 1 && questionIndex === shuffled.length - 1 && answered && (
        <div className="space-y-4 p-6 rounded-2xl bg-success/10 border-2 border-success">
          <p className="text-lg font-bold text-success text-center">
            🎉 {lang === 'ar' ? 'أنهيت جميع المستويات!' : 'All levels completed!'}
          </p>
          <p className="text-sm text-center text-foreground">
            {lang === 'ar' ? `حصلت على ${score} نقطة` : `You earned ${score} points`}
          </p>
          <button
            onClick={reset}
            className="w-full py-3 rounded-xl gradient-primary text-white font-bold flex items-center justify-center gap-2"
          >
            <RotateCcw size={18} />
            {lang === 'ar' ? 'إعادة' : 'Restart'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Compare;
