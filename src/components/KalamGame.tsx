import { useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface Props { onScore?: (n: number) => void; }

/**
 * El Kalam 3la Eh — Charades-style word guessing for 2 teams.
 * One player describes/acts the word without saying it; team guesses. Tap correct or skip.
 */
const WORDS = {
  ar: ['الأهرامات', 'النيل', 'كرة القدم', 'الفلافل', 'البحر', 'القمر', 'الكتاب', 'المدرسة', 'القطار', 'الطبيب',
       'العصفور', 'الموز', 'المطر', 'الشمس', 'الجبل', 'السيارة', 'الهاتف', 'الحاسوب', 'الموسيقى', 'الفيل',
       'الأسد', 'الفراشة', 'الزهرة', 'النجمة', 'الساعة'],
  en: ['Pyramid', 'Nile', 'Football', 'Falafel', 'Sea', 'Moon', 'Book', 'School', 'Train', 'Doctor',
       'Bird', 'Banana', 'Rain', 'Sun', 'Mountain', 'Car', 'Phone', 'Computer', 'Music', 'Elephant',
       'Lion', 'Butterfly', 'Flower', 'Star', 'Clock'],
};

const ROUND_TIME = 60;

const KalamGame = ({ onScore }: Props) => {
  const { lang } = useLang();
  const [phase, setPhase] = useState<'setup' | 'play' | 'done'>('setup');
  const [team, setTeam] = useState<0 | 1>(0);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [round, setRound] = useState(1);
  const [time, setTime] = useState(ROUND_TIME);
  const [word, setWord] = useState('');
  const [used, setUsed] = useState<Set<string>>(new Set());

  const pickWord = (excl: Set<string>): string => {
    const pool = WORDS[lang].filter(w => !excl.has(w));
    if (pool.length === 0) return WORDS[lang][0];
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const startRound = () => {
    const w = pickWord(used);
    setWord(w);
    setUsed(new Set([...used, w]));
    setTime(ROUND_TIME);
    setPhase('play');
    const id = window.setInterval(() => {
      setTime(t => {
        if (t <= 1) {
          clearInterval(id);
          endRound();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const endRound = () => {
    if (round >= 4) {
      setPhase('done');
      const winner = scores[0] > scores[1] ? 0 : scores[1] > scores[0] ? 1 : -1;
      if (winner !== -1) onScore?.(15);
    } else {
      setRound(r => r + 1);
      setTeam(t => (t === 0 ? 1 : 0));
      setPhase('setup');
    }
  };

  const correct = () => {
    setScores(s => { const ns: [number, number] = [...s] as [number, number]; ns[team] += 1; return ns; });
    const w = pickWord(used);
    setWord(w);
    setUsed(new Set([...used, w]));
  };

  const skip = () => {
    const w = pickWord(used);
    setWord(w);
    setUsed(new Set([...used, w]));
  };

  const reset = () => { setScores([0, 0]); setRound(1); setTeam(0); setUsed(new Set()); setPhase('setup'); };

  return (
    <div className="space-y-4 text-center">
      <h2 className="text-lg font-extrabold">🗣️ {lang === 'ar' ? 'الكلام على إيه؟' : "What's the Word?"}</h2>
      <div className="flex justify-center gap-3 text-sm font-bold">
        <span className={`px-3 py-1 rounded-full ${team === 0 && phase === 'play' ? 'bg-rose-500 text-white' : 'bg-secondary'}`}>
          {lang === 'ar' ? 'فريق ١' : 'Team 1'}: {scores[0]}
        </span>
        <span className={`px-3 py-1 rounded-full ${team === 1 && phase === 'play' ? 'bg-blue-500 text-white' : 'bg-secondary'}`}>
          {lang === 'ar' ? 'فريق ٢' : 'Team 2'}: {scores[1]}
        </span>
        <span className="px-3 py-1 rounded-full bg-primary/20">{lang === 'ar' ? 'جولة' : 'Round'} {round}/4</span>
      </div>

      {phase === 'setup' && (
        <div className="p-6 rounded-2xl gradient-primary text-primary-foreground space-y-3">
          <p className="text-xl font-bold">{lang === 'ar' ? `دور ${team === 0 ? 'فريق ١' : 'فريق ٢'}` : `${team === 0 ? 'Team 1' : 'Team 2'}'s turn`}</p>
          <p className="text-sm opacity-90">{lang === 'ar' ? 'اشرح الكلمة لفريقك بدون قولها!' : 'Describe the word without saying it!'}</p>
          <button onClick={startRound} className="px-6 py-3 rounded-xl bg-white text-foreground font-bold">
            ▶️ {lang === 'ar' ? 'ابدأ' : 'Start'}
          </button>
        </div>
      )}

      {phase === 'play' && (
        <div className="space-y-3">
          <div className="text-3xl font-extrabold">⏱️ {time}s</div>
          <div className="p-8 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-200 text-foreground">
            <p className="text-3xl font-extrabold">{word}</p>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={skip} className="flex-1 max-w-[140px] py-3 rounded-xl bg-amber-500 text-white font-bold">
              ⏭️ {lang === 'ar' ? 'تخطى' : 'Skip'}
            </button>
            <button onClick={correct} className="flex-1 max-w-[140px] py-3 rounded-xl bg-emerald-500 text-white font-bold">
              ✅ {lang === 'ar' ? 'صحيح' : 'Correct'}
            </button>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div className="p-6 rounded-2xl gradient-primary text-primary-foreground space-y-3">
          <p className="text-2xl font-extrabold">
            {scores[0] === scores[1]
              ? (lang === 'ar' ? '🤝 تعادل!' : '🤝 Tie!')
              : (lang === 'ar'
                  ? `🏆 فاز ${scores[0] > scores[1] ? 'فريق ١' : 'فريق ٢'}!`
                  : `🏆 ${scores[0] > scores[1] ? 'Team 1' : 'Team 2'} wins!`)}
          </p>
          <button onClick={reset} className="px-6 py-3 rounded-xl bg-white text-foreground font-bold">
            🔄 {lang === 'ar' ? 'مباراة جديدة' : 'New Match'}
          </button>
        </div>
      )}
    </div>
  );
};

export default KalamGame;
