import { useState, useEffect, useCallback } from 'react';
import { useLang } from '@/contexts/LanguageContext';

interface PatternMatchProps {
  onScore: (pts: number) => void;
  difficulty: 'beginner' | 'intermediate' | 'pro';
}

const EMOJIS = ['🌸', '🌺', '🌻', '🌷', '🌹', '🍀', '🦋', '⭐', '🎀', '💎', '🍭', '🎈'];

const PatternMatch = ({ onScore, difficulty }: PatternMatchProps) => {
  const { lang } = useLang();
  const seqLen = difficulty === 'beginner' ? 3 : difficulty === 'intermediate' ? 5 : 7;
  const [pattern, setPattern] = useState<number[]>([]);
  const [userInput, setUserInput] = useState<number[]>([]);
  const [showing, setShowing] = useState(true);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [failed, setFailed] = useState(false);
  const gridSize = 6;

  const generatePattern = useCallback(() => {
    const p: number[] = [];
    for (let i = 0; i < seqLen + round - 1; i++) {
      p.push(Math.floor(Math.random() * gridSize));
    }
    return p;
  }, [seqLen, round]);

  const startRound = useCallback(() => {
    const p = generatePattern();
    setPattern(p);
    setUserInput([]);
    setShowing(true);
    setFailed(false);
    setTimeout(() => setShowing(false), 2000 + p.length * 400);
  }, [generatePattern]);

  useEffect(() => { startRound(); }, [round]);

  const handleSelect = (idx: number) => {
    if (showing || failed) return;
    const next = [...userInput, idx];
    setUserInput(next);
    if (next[next.length - 1] !== pattern[next.length - 1]) {
      setFailed(true);
      if (score > 0) onScore(Math.floor(score / 5));
      return;
    }
    if (next.length === pattern.length) {
      setScore(s => s + pattern.length * 2);
      setTimeout(() => setRound(r => r + 1), 800);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-foreground">🧠 {lang === 'ar' ? 'تطابق الأنماط' : 'Pattern Match'}</h3>
        <span className="text-xs text-muted-foreground">{lang === 'ar' ? 'الجولة' : 'Round'} {round} • {score} ⭐</span>
      </div>

      {showing && (
        <div className="text-center p-4 rounded-xl bg-primary/10 animate-pulse-soft">
          <p className="text-sm text-primary font-semibold mb-2">{lang === 'ar' ? 'تذكّر هذا النمط!' : 'Remember this pattern!'}</p>
          <div className="flex justify-center gap-2 flex-wrap">
            {pattern.map((p, i) => (
              <span key={i} className="text-2xl animate-bounce-in" style={{ animationDelay: `${i * 200}ms` }}>{EMOJIS[p]}</span>
            ))}
          </div>
        </div>
      )}

      {!showing && !failed && (
        <>
          <div className="flex justify-center gap-2 flex-wrap min-h-[40px]">
            {userInput.map((u, i) => <span key={i} className="text-2xl">{EMOJIS[u]}</span>)}
            {Array.from({ length: pattern.length - userInput.length }).map((_, i) => (
              <span key={`e${i}`} className="w-8 h-8 rounded-lg border-2 border-dashed border-border" />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {EMOJIS.slice(0, gridSize).map((emoji, idx) => (
              <button key={idx} onClick={() => handleSelect(idx)}
                className="p-3 rounded-xl bg-secondary hover:bg-primary/10 transition-all active:scale-95 text-2xl">
                {emoji}
              </button>
            ))}
          </div>
        </>
      )}

      {failed && (
        <div className="text-center space-y-3">
          <p className="text-lg font-bold text-destructive">{lang === 'ar' ? 'خطأ!' : 'Wrong!'}</p>
          <p className="text-sm text-muted-foreground">{lang === 'ar' ? 'النتيجة:' : 'Score:'} {score}</p>
          <button onClick={() => { setScore(0); setRound(1); }} className="px-6 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold">
            {lang === 'ar' ? 'حاول مرة أخرى' : 'Try Again'}
          </button>
        </div>
      )}
    </div>
  );
};

export default PatternMatch;
