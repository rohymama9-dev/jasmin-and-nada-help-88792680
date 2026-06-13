import { useState, useEffect, useCallback } from 'react';
import { Brain, Trophy, Timer, Zap } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';

interface MathChallengeProps {
  onScore: (points: number) => void;
  difficulty: 'beginner' | 'intermediate' | 'pro';
}

type Operator = '+' | '-' | '×';

const generateProblem = (difficulty: string): { a: number; b: number; op: Operator; answer: number } => {
  const ops: Operator[] = difficulty === 'beginner' ? ['+'] : difficulty === 'intermediate' ? ['+', '-'] : ['+', '-', '×'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  const max = difficulty === 'beginner' ? 20 : difficulty === 'intermediate' ? 50 : 100;
  let a: number, b: number, answer: number;

  switch (op) {
    case '+': a = Math.floor(Math.random() * max) + 1; b = Math.floor(Math.random() * max) + 1; answer = a + b; break;
    case '-': a = Math.floor(Math.random() * max) + 2; b = Math.floor(Math.random() * a) + 1; answer = a - b; break;
    case '×': a = Math.floor(Math.random() * 12) + 1; b = Math.floor(Math.random() * 12) + 1; answer = a * b; break;
    default: a = 1; b = 1; answer = 2;
  }
  return { a, b, op, answer };
};

const generateChoices = (answer: number): number[] => {
  const choices = new Set<number>([answer]);
  while (choices.size < 4) {
    const offset = Math.floor(Math.random() * 10) - 5;
    const wrong = answer + (offset === 0 ? 1 : offset);
    if (wrong >= 0) choices.add(wrong);
  }
  return Array.from(choices).sort(() => Math.random() - 0.5);
};

const MathChallenge = ({ onScore, difficulty }: MathChallengeProps) => {
  const { t } = useLang();
  const [playing, setPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const timeLimit = difficulty === 'beginner' ? 45 : difficulty === 'intermediate' ? 30 : 20;
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [problem, setProblem] = useState(() => generateProblem(difficulty));
  const [choices, setChoices] = useState(() => generateChoices(problem.answer));
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [gameOver, setGameOver] = useState(false);

  const newProblem = useCallback(() => {
    const p = generateProblem(difficulty);
    setProblem(p);
    setChoices(generateChoices(p.answer));
    setFeedback(null);
  }, [difficulty]);

  const startGame = () => { setPlaying(true); setGameOver(false); setScore(0); setTimeLeft(timeLimit); newProblem(); };

  useEffect(() => {
    if (!playing || gameOver) return;
    if (timeLeft <= 0) {
      setGameOver(true); setPlaying(false);
      onScore(0);
      return;
    }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, playing, gameOver, score, onScore]);

  const handleAnswer = (choice: number) => {
    if (feedback) return;
    setFeedback(choice === problem.answer ? 'correct' : 'wrong');
    if (choice === problem.answer) {
      setScore(s => s + 1);
      onScore(1);
    } else {
      onScore(0);
    }
    setTimeout(newProblem, 600);
  };

  if (!playing || gameOver) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center">
        <div className="w-16 h-16 rounded-2xl gradient-gaming flex items-center justify-center mx-auto mb-4">
          <Brain size={32} className="text-gaming-foreground" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">{t('mathChallenge')}</h3>
        {gameOver && (
          <div className="mb-4 animate-bounce-in">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy size={24} className="text-gold" />
              <span className="text-3xl font-bold text-foreground">{score}</span>
            </div>
            <p className="text-sm text-muted-foreground">{t('gameOver')}</p>
            <p className="text-sm text-success font-medium mt-1">+1 / +2 {t('points')} ⭐</p>
          </div>
        )}
        <button onClick={startGame} className="px-6 py-3 rounded-xl gradient-gaming text-gaming-foreground font-semibold shadow-lg hover:scale-105 active:scale-95 transition-all">
          {gameOver ? t('playAgain') : '🚀 ' + t('mathChallenge')}
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2"><Trophy size={16} className="text-gold" /><span className="font-bold text-foreground">{score}</span></div>
        <div className="flex items-center gap-1.5 text-sm"><Zap size={14} className="text-gaming" /></div>
        <div className={`flex items-center gap-1.5 text-sm font-medium ${timeLeft <= 10 ? 'text-destructive animate-pulse-soft' : 'text-muted-foreground'}`}>
          <Timer size={14} /><span>{timeLeft}s</span>
        </div>
      </div>
      <div className="text-center mb-6">
        <p className="text-4xl font-bold text-foreground mb-1">{problem.a} {problem.op} {problem.b} = ?</p>
        {feedback && (
          <p className={`text-sm font-semibold animate-bounce-in ${feedback === 'correct' ? 'text-success' : 'text-destructive'}`}>
            {feedback === 'correct' ? '✓ ' + t('correct') : '✗ ' + t('wrong')}
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {choices.map((choice, i) => (
          <button key={i} onClick={() => handleAnswer(choice)} disabled={!!feedback}
            className={`py-4 rounded-xl text-xl font-bold transition-all duration-300 active:scale-95 ${
              feedback && choice === problem.answer ? 'bg-success text-success-foreground scale-105'
              : feedback ? 'bg-muted text-muted-foreground opacity-50'
              : 'bg-secondary text-secondary-foreground hover:bg-gaming hover:text-gaming-foreground'
            }`}
          >{choice}</button>
        ))}
      </div>
    </div>
  );
};

export default MathChallenge;
