import { useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';

export interface QuizQuestion {
  questionAr: string;
  questionEn: string;
  optionsAr: string[];
  optionsEn: string[];
  correctIndex: number;
}

interface StoryQuizProps {
  questions: QuizQuestion[];
  onComplete: (score: number) => void;
}

const StoryQuiz = ({ questions, onComplete }: StoryQuizProps) => {
  const { lang } = useLang();
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const q = questions[current];

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    const correct = idx === q.correctIndex;
    if (correct) setScore(s => s + 1);

    setTimeout(() => {
      if (current + 1 < questions.length) {
        setCurrent(c => c + 1);
        setSelected(null);
      } else {
        setDone(true);
        onComplete(correct ? score + 1 : score);
      }
    }, 1200);
  };

  if (done) {
    return (
      <div className="text-center p-4 rounded-xl bg-primary/10 animate-bounce-in">
        <span className="text-4xl block mb-2">🎓</span>
        <p className="font-bold text-foreground text-lg">{score}/{questions.length}</p>
        <p className="text-sm text-muted-foreground">{lang === 'ar' ? 'أحسنت! أنهيت الاختبار' : 'Well done! Quiz complete'}</p>
      </div>
    );
  }

  const options = lang === 'ar' ? q.optionsAr : q.optionsEn;

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-primary">❓ {lang === 'ar' ? 'اختبار القصة' : 'Story Quiz'}</span>
        <span className="text-xs text-muted-foreground">{current + 1}/{questions.length}</span>
      </div>
      <p className="text-sm font-medium text-foreground">{lang === 'ar' ? q.questionAr : q.questionEn}</p>
      <div className="space-y-2">
        {options.map((opt, i) => (
          <button key={i} onClick={() => handleAnswer(i)}
            className={`w-full text-start p-3 rounded-xl text-sm transition-all ${
              selected === null ? 'bg-secondary/50 hover:bg-secondary active:scale-[0.98]' :
              i === q.correctIndex ? 'bg-success/20 text-success font-semibold' :
              i === selected ? 'bg-destructive/20 text-destructive' : 'bg-secondary/30 opacity-50'
            }`}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};

export default StoryQuiz;
