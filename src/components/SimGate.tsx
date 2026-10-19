import { useState, useEffect } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Lock } from 'lucide-react';

export type Gender = 'female' | 'male';

const GENDER_KEY = (id: string) => `sim-gender-${id}`;

interface Props {
  /** Stable id of the simulation (e.g. 'farm', 'fashion'). */
  simId: string;
  /** Display title. */
  titleAr: string;
  titleEn: string;
  /** Coins required to unlock. Default: 150. */
  required?: number;
  /** Current player coin balance. */
  points: number;
  /** Render the simulation once gender is chosen + lock is open. */
  children: (gender: Gender) => React.ReactNode;
}

/**
 * Pre-game wrapper for professional simulations.
 *  1. Locks the experience behind a coin milestone (default 150).
 *  2. Asks for gender (Male / Female) on first entry — persisted per sim.
 *
 * Choosing gender doesn't change the underlying game logic — it only affects
 * the player avatar emoji + greeting copy in the host simulation.
 */
const SimGate = ({ simId, titleAr, titleEn, required = 150, points, children }: Props) => {
  const { lang } = useLang();
  const [gender, setGender] = useState<Gender | null>(() => {
    try {
      const v = localStorage.getItem(GENDER_KEY(simId));
      return v === 'male' || v === 'female' ? v : null;
    } catch { return null; }
  });

  useEffect(() => {
    if (gender) {
      try { localStorage.setItem(GENDER_KEY(simId), gender); } catch { /* ignore */ }
    }
  }, [gender, simId]);

  // Coin-gated milestone
  if (points < required) {
    const remaining = required - points;
    const pct = Math.min(100, Math.round((points / required) * 100));
    return (
      <div className="pb-4 space-y-5 text-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-pink-500 via-fuchsia-500 to-indigo-600 flex items-center justify-center mx-auto shadow-2xl">
          <Lock className="text-white" size={32} />
        </div>
        <h2 className="text-xl font-extrabold text-foreground">
          {lang === 'ar' ? `${titleAr} مقفل` : `${titleEn} is Locked`}
        </h2>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          {lang === 'ar'
            ? `هذه محاكاة احترافية — تحتاج ${required} 🪙. تبقى ${remaining}.`
            : `This is a Pro simulation — needs ${required} 🪙. ${remaining} more to go.`}
        </p>
        <div className="glass-card rounded-2xl p-5 max-w-xs mx-auto">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-foreground">{points} / {required} 🪙</span>
            <span className="text-muted-foreground">{pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-indigo-600 transition-all"
                 style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    );
  }

  // Gender select
  if (!gender) {
    return (
      <div className="pb-4 space-y-6 text-center">
        <div>
          <h2 className="text-xl font-extrabold bg-gradient-to-r from-pink-500 to-indigo-600 bg-clip-text text-transparent">
            {lang === 'ar' ? `اختر شخصيتك — ${titleAr}` : `Choose your character — ${titleEn}`}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {lang === 'ar' ? 'يمكنك تغيير ذلك لاحقاً من الإعدادات' : 'You can change this later in settings'}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          <button onClick={() => setGender('female')}
            className="rounded-2xl p-6 bg-gradient-to-br from-pink-400 to-fuchsia-600 text-white font-extrabold shadow-xl active:scale-95 transition-transform">
            <div className="text-5xl mb-2">👧</div>
            <div className="text-base">{lang === 'ar' ? 'أنثى' : 'Female'}</div>
          </button>
          <button onClick={() => setGender('male')}
            className="rounded-2xl p-6 bg-gradient-to-br from-indigo-500 to-blue-700 text-white font-extrabold shadow-xl active:scale-95 transition-transform">
            <div className="text-5xl mb-2">👦</div>
            <div className="text-base">{lang === 'ar' ? 'ذكر' : 'Male'}</div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
        <span>{lang === 'ar' ? 'الشخصية:' : 'Character:'} {gender === 'female' ? '👧' : '👦'}</span>
        <button onClick={() => setGender(null)} className="underline hover:text-foreground">
          {lang === 'ar' ? 'تغيير' : 'change'}
        </button>
      </div>
      {children(gender)}
    </div>
  );
};

export default SimGate;
