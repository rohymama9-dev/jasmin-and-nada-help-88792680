import { useEffect, useState } from 'react';
import { Droplets, Flame, Check } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';

const getLocalDateKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const StoryRings = ({ todayPoints }: { todayPoints: number }) => {
  const { lang } = useLang();
  
  const [hydrationProgress, setHydrationProgress] = useState(0);
  const [activityProgress, setActivityProgress] = useState(0);

  useEffect(() => {
    // Activity Ring
    const actProg = Math.min(100, (todayPoints / 100) * 100);
    setActivityProgress(actProg);

    // Hydration Ring
    const syncHydration = () => {
      try {
        const goalStr = localStorage.getItem('app-water-goal');
        const goal = parseInt(goalStr || '8', 10);
        let cups = parseInt(localStorage.getItem('app-water-cups') || '0', 10);
        
        // Also check waterLog for today to be accurate
        const raw = localStorage.getItem('waterLog');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const today = getLocalDateKey();
            const todaysEntries = parsed.filter((item: any) => {
              const d = new Date(item.time || item.date);
              return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` === today;
            });
            if (todaysEntries.length > 0) cups = todaysEntries.length;
          }
        }
        
        const hydProg = goal > 0 ? Math.min(100, (cups / goal) * 100) : 0;
        setHydrationProgress(hydProg);
      } catch {
        // ignore
      }
    };

    syncHydration();
    window.addEventListener('combo-water-logged', syncHydration);
    window.addEventListener('storage', syncHydration);
    
    return () => {
      window.removeEventListener('combo-water-logged', syncHydration);
      window.removeEventListener('storage', syncHydration);
    };
  }, [todayPoints]);

  const StoryRing = ({ progress, icon: Icon, color, label }: any) => {
    const radius = 28;
    const stroke = 3;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <div className="flex flex-col items-center gap-1 cursor-pointer hover:scale-105 transition-transform">
        <div className="relative w-[60px] h-[60px] flex items-center justify-center">
          {/* Background Ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              stroke="rgba(255,255,255,0.2)"
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx="30"
              cy="30"
            />
            <circle
              stroke={color}
              fill="transparent"
              strokeWidth={stroke}
              strokeDasharray={circumference + ' ' + circumference}
              style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
              strokeLinecap="round"
              r={normalizedRadius}
              cx="30"
              cy="30"
            />
          </svg>
          <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-inner relative">
            <Icon size={20} style={{ color }} />
            {progress >= 100 && (
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-white text-white">
                <Check size={10} strokeWidth={4} />
              </div>
            )}
          </div>
        </div>
        <span className="text-[9px] font-bold text-white/90 truncate w-16 text-center shadow-sm">
          {label}
        </span>
      </div>
    );
  };

  return (
    <div className="flex items-center gap-3 py-2 overflow-x-auto no-scrollbar">
      <StoryRing 
        progress={hydrationProgress} 
        icon={Droplets} 
        color="#38bdf8" 
        label={lang === 'ar' ? 'الترطيب' : 'Hydration'} 
      />
      <StoryRing 
        progress={activityProgress} 
        icon={Flame} 
        color="#fb923c" 
        label={lang === 'ar' ? 'النشاط' : 'Activity'} 
      />
    </div>
  );
};

export default StoryRings;
