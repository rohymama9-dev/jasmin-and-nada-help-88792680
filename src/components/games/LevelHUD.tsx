import { useLang } from '@/contexts/LanguageContext';

interface LevelHUDProps {
  level: number;
  maxLevel?: number;
  score: number;
  extra?: React.ReactNode;
}

const LevelHUD = ({ level, maxLevel = 15, score, extra }: LevelHUDProps) => {
  const { lang } = useLang();
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {lang === 'ar' ? 'مستوى' : 'Lv'} {level}/{maxLevel}
      </span>
      <div className="flex-1 h-1.5 rounded-full bg-secondary">
        <div className="h-full rounded-full gradient-primary transition-all"
          style={{ width: `${Math.min(100, (level / maxLevel) * 100)}%` }} />
      </div>
      <span className="text-xs font-bold text-primary whitespace-nowrap">⭐ {score}</span>
      {extra}
    </div>
  );
};

export default LevelHUD;
