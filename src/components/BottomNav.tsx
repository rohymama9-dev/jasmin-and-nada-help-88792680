import { Home, GraduationCap, Gamepad2, Palette, BookMarked, Heart } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';

interface BottomNavProps {
  active: string;
  onNavigate: (page: string) => void;
}

const BottomNav = ({ active, onNavigate }: BottomNavProps) => {
  const { t, lang } = useLang();
  const items = [
    { key: 'home', icon: Home, label: t('home') },
    { key: 'education', icon: GraduationCap, label: t('education') },
    { key: 'quran', icon: BookMarked, label: lang === 'ar' ? 'القرآن' : 'Quran' },
    { key: 'health', icon: Heart, label: lang === 'ar' ? 'الصحة' : 'Health' },
    { key: 'games', icon: Gamepad2, label: t('games') },
    { key: 'services', icon: Palette, label: t('services') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border/50 pb-safe">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {items.map(({ key, icon: Icon, label }) => (
          <button key={key} onClick={() => onNavigate(key)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-300 ${
              active === key ? 'text-primary scale-110' : 'text-muted-foreground hover:text-primary/70'
            }`}>
            <Icon size={22} strokeWidth={active === key ? 2.5 : 1.8} />
            <span className="text-[10px] font-medium">{label}</span>
            {active === key && <div className="w-1 h-1 rounded-full gradient-primary mt-0.5" />}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
