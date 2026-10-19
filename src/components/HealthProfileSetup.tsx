import { useState } from 'react';
import { Heart, User, Ruler, Weight, Target, Sparkles } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { saveUserProfile, type UserProfile } from './OnboardingScreen';

interface HealthProfileSetupProps {
  initialName?: string;
  onComplete: (p: UserProfile) => void;
}

const HealthProfileSetup = ({ initialName = '', onComplete }: HealthProfileSetupProps) => {
  const { lang } = useLang();
  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  const [step, setStep] = useState(0); // 0..4 form, 5 = welcome animation
  const [gender, setGender] = useState<'male' | 'female'>('female');
  const [age, setAge] = useState('25');
  const [height, setHeight] = useState('165');
  const [weight, setWeight] = useState('60');
  const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain'>('maintain');

  const finish = () => {
    const profile: UserProfile = {
      name: initialName,
      gender,
      age: parseInt(age) || 25,
      height: parseFloat(height) || 165,
      weight: parseFloat(weight) || 60,
      goal,
    };
    saveUserProfile(profile);
    try {
      const today = new Date().toDateString();
      localStorage.setItem('combo-health-today', today);
      window.dispatchEvent(new CustomEvent('combo-health-access'));
    } catch {
      /* ignore */
    }
    setStep(5);
    setTimeout(() => onComplete(profile), 2200);
  };

  // Welcome animation screen
  if (step === 5) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center space-y-4 animate-scale-in">
        <div className="text-6xl animate-bounce">🌸</div>
        <Sparkles className="mx-auto text-primary animate-pulse" size={32} />
        <h3 className="text-xl font-bold text-foreground animate-fade-in">
          {t(`أهلاً ${initialName || ''} 💖`, `Welcome ${initialName || ''} 💖`)}
        </h3>
        <p className="text-sm text-muted-foreground animate-fade-in">
          {t('بدأت رحلتك الصحية الآن!', 'Your health journey starts now!')}
        </p>
      </div>
    );
  }

  const steps = [
    {
      icon: User,
      title: t('الجنس', 'Gender'),
      content: (
        <div className="grid grid-cols-2 gap-3">
          {(['female', 'male'] as const).map(g => (
            <button key={g} onClick={() => setGender(g)}
              className={`p-4 rounded-xl border-2 transition-all ${gender === g ? 'border-primary bg-primary/10' : 'border-border bg-secondary/30'}`}>
              <div className="text-3xl mb-1">{g === 'female' ? '👩' : '👨'}</div>
              <p className="text-xs font-medium">{g === 'female' ? t('أنثى', 'Female') : t('ذكر', 'Male')}</p>
            </button>
          ))}
        </div>
      ),
    },
    {
      icon: User,
      title: t('العمر', 'Age'),
      content: (
        <input type="number" value={age} onChange={e => setAge(e.target.value)} min={5} max={100}
          className="w-full px-4 py-3 rounded-xl bg-background border border-border text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50" />
      ),
    },
    {
      icon: Ruler,
      title: t('الطول (سم)', 'Height (cm)'),
      content: (
        <input type="number" value={height} onChange={e => setHeight(e.target.value)} min={80} max={230}
          className="w-full px-4 py-3 rounded-xl bg-background border border-border text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50" />
      ),
    },
    {
      icon: Weight,
      title: t('الوزن (كجم)', 'Weight (kg)'),
      content: (
        <input type="number" value={weight} onChange={e => setWeight(e.target.value)} min={20} max={300}
          className="w-full px-4 py-3 rounded-xl bg-background border border-border text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50" />
      ),
    },
    {
      icon: Target,
      title: t('الهدف', 'Goal'),
      content: (
        <div className="space-y-2">
          {([
            { v: 'lose' as const, ar: 'إنقاص الوزن', en: 'Lose Weight', emoji: '📉' },
            { v: 'maintain' as const, ar: 'الحفاظ على الوزن', en: 'Maintain Weight', emoji: '⚖️' },
            { v: 'gain' as const, ar: 'زيادة الوزن', en: 'Gain Weight', emoji: '📈' },
          ]).map(o => (
            <button key={o.v} onClick={() => setGoal(o.v)}
              className={`w-full p-3 rounded-xl border-2 flex items-center gap-3 transition-all ${goal === o.v ? 'border-primary bg-primary/10' : 'border-border bg-secondary/30'}`}>
              <span className="text-2xl">{o.emoji}</span>
              <span className="text-sm font-medium text-foreground">{lang === 'ar' ? o.ar : o.en}</span>
            </button>
          ))}
        </div>
      ),
    },
  ];

  const cur = steps[step];
  const Icon = cur.icon;

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4 animate-slide-up">
      <div className="flex items-center gap-2">
        <Heart size={18} className="text-primary" />
        <h3 className="font-semibold text-foreground">{t('الملف الصحي', 'Health Profile')}</h3>
        <span className="ms-auto text-xs text-muted-foreground">{step + 1}/5</span>
      </div>

      {/* progress bar */}
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className="h-full gradient-primary transition-all duration-500" style={{ width: `${((step + 1) / 5) * 100}%` }} />
      </div>

      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 text-primary">
          <Icon size={18} />
          <label className="font-semibold text-foreground text-sm">{cur.title}</label>
        </div>
        {cur.content}
      </div>

      <div className="flex gap-2 pt-2">
        {step > 0 && (
          <button onClick={() => setStep(step - 1)}
            className="flex-1 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium">
            {t('السابق', 'Back')}
          </button>
        )}
        <button onClick={() => (step < 4 ? setStep(step + 1) : finish())}
          className="flex-1 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold">
          {step < 4 ? t('التالي', 'Next') : t('ابدأ', 'Start')}
        </button>
      </div>
    </div>
  );
};

export default HealthProfileSetup;
