import { Star } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';

const PointsBadge = ({ points }: { points: number }) => {
  const { t } = useLang();

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full gradient-gold text-gold-foreground text-sm font-semibold shadow-[0_0_15px_rgba(250,204,21,0.5)] border border-yellow-300/50 animate-pulse-soft">
      <Star size={14} className="fill-current" />
      <span>{points}</span>
      <span className="text-xs opacity-80">{t('points')}</span>
    </div>
  );
};

export default PointsBadge;
