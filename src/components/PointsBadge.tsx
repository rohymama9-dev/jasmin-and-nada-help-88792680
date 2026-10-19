import { Star } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';

const PointsBadge = ({ points }: { points: number }) => {
  const { t } = useLang();
  
  // Calculate progress towards next 100 point tier
  const nextGoal = Math.ceil((points + 1) / 100) * 100;
  const progressPercent = Math.min(100, Math.max(0, (points / nextGoal) * 100));

  return (
    <div className="flex flex-col gap-1 w-full max-w-[120px]">
      <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full gradient-gold text-gold-foreground text-sm font-semibold shadow-[0_0_10px_rgba(250,204,21,0.3)] border border-yellow-300/50">
        <Star size={14} className="fill-current" />
        <span>{points}</span>
        <span className="text-xs opacity-80">{t('points')}</span>
      </div>
      {/* Visual Progress Bar */}
      <div className="h-1.5 w-full bg-black/20 dark:bg-white/10 rounded-full overflow-hidden">
        <div 
          className="h-full bg-green-400 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};

export default PointsBadge;
