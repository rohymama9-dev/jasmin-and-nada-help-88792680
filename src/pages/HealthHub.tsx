import { useState, useEffect } from 'react';
import { Apple, Clock, Footprints, Dumbbell, Moon, ArrowLeft } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import DietTracker from '@/components/DietTracker';
import FastingTimer from '@/components/FastingTimer';
import WalkingTimer from '@/components/WalkingTimer';
import SleepTracker from '@/components/SleepTracker';
import WaterTracker from '@/components/WaterTracker';
import MedicationReminder from '@/components/MedicationReminder';
import floralBg from '@/assets/floral-bg.jpg';

interface HealthHubProps {
  addPoints?: (n: number) => void;
  onNavigateToExercises?: () => void;
}

const HealthHub = ({ addPoints = () => {}, onNavigateToExercises = () => {} }: HealthHubProps) => {
  const { lang } = useLang();
  const [selectedCard, setSelectedCard] = useState<'diet' | 'fasting' | 'walking' | 'sleep' | 'exercises' | null>(null);

  useEffect(() => {
    try {
      const today = new Date().toDateString();
      localStorage.setItem('combo-health-today', today);
      window.dispatchEvent(new CustomEvent('combo-health-access'));
    } catch {
      /* ignore */
    }
  }, []);

  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  const healthCards = [
    {
      id: 'diet',
      icon: Apple,
      labelAr: 'التغذية',
      labelEn: 'Diet',
      descAr: 'تتبع وجباتك اليومية',
      descEn: 'Track your daily meals',
      color: 'from-orange-400/10 to-orange-500/10 border-orange-300/30'
    },
    {
      id: 'fasting',
      icon: Clock,
      labelAr: 'الصيام',
      labelEn: 'Fasting',
      descAr: 'تتبع ساعات الصيام',
      descEn: 'Track fasting hours',
      color: 'from-blue-400/10 to-blue-500/10 border-blue-300/30'
    },
    {
      id: 'walking',
      icon: Footprints,
      labelAr: 'المشي',
      labelEn: 'Walking',
      descAr: 'قياس وقت المسيرة',
      descEn: 'Measure walking time',
      color: 'from-green-400/10 to-green-500/10 border-green-300/30'
    },
    {
      id: 'sleep',
      icon: Moon,
      labelAr: 'النوم',
      labelEn: 'Sleep',
      descAr: 'تتبع ساعات النوم',
      descEn: 'Track your sleep hours',
      color: 'from-indigo-400/10 to-indigo-500/10 border-indigo-300/30'
    },
    {
      id: 'exercises',
      icon: Dumbbell,
      labelAr: 'التمارين',
      labelEn: 'Exercises',
      descAr: 'برامج تمارين منظمة',
      descEn: 'Structured workout programs',
      color: 'from-purple-400/10 to-purple-500/10 border-purple-300/30'
    }
  ];

  if (selectedCard === 'diet') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedCard(null)}
          className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-3"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">{t('back', 'Back')}</span>
        </button>
        <DietTracker onPoints={addPoints} />
      </div>
    );
  }

  if (selectedCard === 'fasting') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedCard(null)}
          className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-3"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">{t('back', 'Back')}</span>
        </button>
        <FastingTimer />
      </div>
    );
  }

  if (selectedCard === 'walking') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedCard(null)}
          className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-3"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">{t('back', 'Back')}</span>
        </button>
        <WalkingTimer onPoints={addPoints} />
      </div>
    );
  }

  if (selectedCard === 'sleep') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedCard(null)}
          className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-3"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">{t('back', 'Back')}</span>
        </button>
        <SleepTracker onPoints={addPoints} />
      </div>
    );
  }

  if (selectedCard === 'exercises') {
    onNavigateToExercises();
    return null;
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="relative -mx-5 -mt-5 rounded-b-3xl overflow-hidden mb-4 bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg px-5 pt-8 pb-6 text-center">
        <img src={floralBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-2xl font-extrabold text-white mb-2">
            {lang === 'ar' ? 'الصحة واللياقة' : 'Health & Fitness'}
          </h2>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3">
        <WaterTracker onDrink={() => { addPoints && addPoints(1); try { window.dispatchEvent(new CustomEvent('combo-water-logged')); } catch {} }} />
        <MedicationReminder />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {healthCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              onClick={() => {
                if (card.id === 'exercises') {
                  onNavigateToExercises();
                } else {
                  setSelectedCard(card.id as any);
                }
              }}
              className={`glass-card border p-4 rounded-2xl flex flex-col items-center justify-center gap-3 hover:shadow-lg transition-all active:scale-95 bg-gradient-to-br ${card.color}`}
            >
              <Icon size={32} className="text-primary" />
              <div className="text-center">
                <p className="font-bold text-sm text-foreground">
                  {lang === 'ar' ? card.labelAr : card.labelEn}
                </p>
                <p className="text-xs text-muted-foreground">
                  {lang === 'ar' ? card.descAr : card.descEn}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default HealthHub;