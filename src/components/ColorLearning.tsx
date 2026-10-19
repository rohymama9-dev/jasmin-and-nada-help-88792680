import { useState, useMemo, useEffect } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import LevelHUD from './games/LevelHUD';
import { speak, stopSpeaking } from '@/lib/tts';
import GlobalLeaderboard from './GlobalLeaderboard';

// تعديل الـ Props هنا علشان يستقبل points أو score أو أي حاجة تانية وميعلقش
interface Props { 
  onScore?: (pts: number) => void; 
  points?: number;
  score?: number;
  [key: string]: any; 
}

const PALETTE = [
  { hex: '#ef4444', ar: 'أحمر', en: 'Red' },
  { hex: '#f97316', ar: 'برتقالي', en: 'Orange' },
  { hex: '#eab308', ar: 'أصفر', en: 'Yellow' },
  { hex: '#22c55e', ar: 'أخضر', en: 'Green' },
  { hex: '#06b6d4', ar: 'سماوي', en: 'Cyan' },
  { hex: '#3b82f6', ar: 'أزرق', en: 'Blue' },
  { hex: '#a855f7', ar: 'بنفسجي', en: 'Purple' },
  { hex: '#ec4899', ar: 'وردي', en: 'Pink' },
  { hex: '#78350f', ar: 'بني', en: 'Brown' },
  { hex: '#000000', ar: 'أسود', en: 'Black' },
  { hex: '#ffffff', ar: 'أبيض', en: 'White' },
  { hex: '#9ca3af', ar: 'رمادي', en: 'Gray' },
];

const MAX_LEVEL = 15;

const shuffle = <T,>(a: T[]) => { const x = [...a]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };

const ColorLearning = ({ onScore }: Props) => {
  const { lang } = useLang();
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [seed, setSeed] = useState(0);
  const [feedback, setFeedback] = useState<'ok' | 'no' | null>(null);

  const round = useMemo(() => {
    const optionCount = Math.min(3 + Math.floor((level - 1) / 2), 8);
    const pool = shuffle(PALETTE).slice(0, optionCount);
    const target = pool[Math.floor(Math.random() * pool.length)];
    return { target, options: pool };
  }, [level, seed]);

  const pick = (c: any) => {
    if (feedback) return;
    if (c.hex === round.target.hex) {
      setFeedback('ok');
      setScore(s => s + level);
      if (onScore) onScore(2);
      setTimeout(() => {
        setFeedback(null);
        if (level < MAX_LEVEL) setLevel(l => l + 1); else setSeed(s => s + 1);
      }, 800);
    } else {
      setFeedback('no');
      setTimeout(() => setFeedback(null), 700);
    }
  };

  const targetName = lang === 'ar' ? round.target.ar : round.target.en;

  useEffect(() => {
    stopSpeaking();
    const t1 = setTimeout(() => speak(round.target.ar, { lang: 'ar' }), 250);
    const t2 = setTimeout(() => speak(round.target.en, { lang: 'en' }), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); stopSpeaking(); };
  }, [round.target.hex]);

  const replay = () => {
    stopSpeaking();
    speak(round.target.ar, { lang: 'ar' });
    setTimeout(() => speak(round.target.en, { lang: 'en' }), 950);
  };

  return (
    <div className="space-y-6">
      <LevelHUD level={level} score={score} />
      <div className="glass-card rounded-2xl p-5 text-center space-y-3">
        <p className="text-sm text-muted-foreground">{lang === 'ar' ? 'اضغط اللون الصحيح' : 'Tap the correct color'}</p>
        <div className="flex items-center justify-center gap-3">
          <p className="text-2xl font-bold text-foreground">{targetName}</p>
          <button onClick={replay}
            className="w-9 h-9 rounded-full bg-primary/10 text-primary text-sm">🔊</button>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          {round.options.map((c, i) => (
            <button key={i} onClick={() => pick(c)}
              className={`aspect-square rounded-2xl border-2 transition-all active:scale-95 ${
                feedback && c.hex === round.target.hex ? 'border-success ring-2 ring-success' : 'border-border hover:border-primary'
              }`}
              style={{ backgroundColor: c.hex }} />
          ))}
        </div>
        {feedback && (
          <p className={`text-sm font-bold ${feedback === 'ok' ? 'text-success' : 'text-destructive'}`}>
            {feedback === 'ok' ? (lang === 'ar' ? '✅ ممتاز!' : '✅ Great!') : (lang === 'ar' ? '❌ حاول مرة أخرى' : '❌ Try again')}
          </p>
        )}
      </div>

      <GlobalLeaderboard currentPoints={score} section="education" />
    </div>
  );
};

export default ColorLearning;