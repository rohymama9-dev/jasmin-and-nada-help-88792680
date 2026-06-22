import { useState, useEffect } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { X, Lock, CheckCircle2, Paintbrush } from 'lucide-react';
import { getLevel, ensureLevelThemes, THEME_UNLOCK_LEVELS } from '@/lib/appStore';

export const applyThemeClass = (themeClass: string) => {
  document.documentElement.classList.remove(
    'theme-90s', 'theme-space', 'theme-nature',
    'theme-sakura', 'theme-galaxy', 'theme-ocean', 'theme-forest', 'theme-gold',
  );
  if (themeClass) {
    document.documentElement.classList.add(themeClass);
  }
};

interface ThemesShopProps {
  onClose: () => void;
  points: number;
  addPoints: (n: number) => void;
}

const THEMES = [
  {
    id: 'default',
    nameAr: 'الثيم الافتراضي',
    nameEn: 'Default Theme',
    price: 0,
    className: '',
  },
  {
    id: '90s',
    nameAr: 'ثيم النوستالجيا التسعيناتي',
    nameEn: '90s Nostalgia',
    price: 600,
    className: 'theme-90s',
  },
  {
    id: 'space',
    nameAr: 'ثيم الفضاء المظلم',
    nameEn: 'Dark Space',
    price: 0,
    className: 'theme-space',
    isSecret: true,
    secretCondition: () => localStorage.getItem('secret_quest_pomodoro') === 'true',
  },
  {
    id: 'nature',
    nameAr: 'ثيم الطبيعة الهادئة',
    nameEn: 'Calm Nature',
    price: 0,
    className: 'theme-nature',
    isSecret: true,
    secretCondition: () => localStorage.getItem('secret_quest_nature') === 'true',
  },
  // Real themes — unlock by level
  { id: 'sakura',  nameAr: 'ثيم الساكورا 🌸',  nameEn: 'Sakura 🌸',  price: 0, className: 'theme-sakura', levelGate: 2 },
  { id: 'ocean',   nameAr: 'ثيم المحيط 🌊',    nameEn: 'Ocean 🌊',   price: 0, className: 'theme-ocean',  levelGate: 3 },
  { id: 'forest',  nameAr: 'ثيم الغابة 🌳',    nameEn: 'Forest 🌳',  price: 0, className: 'theme-forest', levelGate: 4 },
  { id: 'galaxy',  nameAr: 'ثيم المجرّة 🌌',   nameEn: 'Galaxy 🌌',  price: 0, className: 'theme-galaxy', levelGate: 6 },
  { id: 'gold',    nameAr: 'ثيم الذهب 👑',     nameEn: 'Gold 👑',    price: 0, className: 'theme-gold',   levelGate: 8 },
] as Array<{
  id: string; nameAr: string; nameEn: string; price: number; className: string;
  isSecret?: boolean; secretCondition?: () => boolean; levelGate?: number;
}>;

const ThemesShop = ({ onClose, points, addPoints }: ThemesShopProps) => {
  const { lang } = useLang();
  
  const [unlockedThemes, setUnlockedThemes] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('unlocked_themes');
      if (stored) return JSON.parse(stored);
    } catch {}
    return ['default'];
  });

  const [selectedTheme, setSelectedTheme] = useState<string>(() => {
    return localStorage.getItem('selected_theme') || 'default';
  });

  useEffect(() => {
    ensureLevelThemes();
    const newlyUnlocked = [...unlockedThemes];
    let changed = false;

    THEMES.forEach(t => {
      if (t.isSecret && t.secretCondition && t.secretCondition()) {
        if (!newlyUnlocked.includes(t.id)) {
          newlyUnlocked.push(t.id);
          changed = true;
        }
      }
      if (t.levelGate && getLevel() >= t.levelGate && !newlyUnlocked.includes(t.id)) {
        newlyUnlocked.push(t.id);
        changed = true;
      }
    });

    if (changed) {
      setUnlockedThemes(newlyUnlocked);
      localStorage.setItem('unlocked_themes', JSON.stringify(newlyUnlocked));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (themeId: string, className: string) => {
    setSelectedTheme(themeId);
    localStorage.setItem('selected_theme', themeId);
    applyThemeClass(className);
    toast.success(lang === 'ar' ? 'تم تطبيق الثيم بنجاح! 🎨' : 'Theme applied successfully! 🎨');
  };

  const handleBuy = (themeId: string, price: number) => {
    if (points >= price) {
      addPoints(-price);
      const newUnlocked = [...unlockedThemes, themeId];
      setUnlockedThemes(newUnlocked);
      localStorage.setItem('unlocked_themes', JSON.stringify(newUnlocked));
      toast.success(lang === 'ar' ? 'تم شراء الثيم! يمكنك الآن استخدامه 🎉' : 'Theme purchased! You can now use it 🎉');
    } else {
      toast.error(lang === 'ar' ? 'نقاطك غير كافية 😢' : 'Not enough points 😢');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-white/20">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 transition-colors"
        >
          <X size={16} className="text-slate-500" />
        </button>

        <div className="flex items-center justify-center gap-2 mb-2">
          <Paintbrush className="text-purple-500" size={24} />
          <h2 className="text-xl font-black text-center text-slate-800 dark:text-white">
            {lang === 'ar' ? 'متجر الثيمات' : 'Themes Shop'}
          </h2>
        </div>
        <p className="text-xs text-center text-slate-500 dark:text-slate-400 mb-6">
          {lang === 'ar' ? 'خصّص تجربة استخدامك' : 'Customize your experience'}
        </p>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {THEMES.map(t => {
            if (t.isSecret && !unlockedThemes.includes(t.id)) {
              return null;
            }

            const isUnlocked = unlockedThemes.includes(t.id);
            const isSelected = selectedTheme === t.id;
            const levelLocked = !!t.levelGate && !isUnlocked;

            return (
              <div 
                key={t.id} 
                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                  isSelected 
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                    : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-purple-200'
                }`}
              >
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-white">
                    {lang === 'ar' ? t.nameAr : t.nameEn}
                  </h3>
                  {!isUnlocked && !t.levelGate && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1">
                      {t.price} {lang === 'ar' ? 'نقطة' : 'pts'}
                    </p>
                  )}
                  {levelLocked && (
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
                      {lang === 'ar' ? `🔒 افتح بالمستوى ${t.levelGate}` : `🔒 Unlocks at Level ${t.levelGate}`}
                    </p>
                  )}
                  {t.isSecret && (
                    <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-1">
                      {lang === 'ar' ? '✨ ثيم سري مفتوح' : '✨ Secret Theme Unlocked'}
                    </p>
                  )}
                </div>

                <div>
                  {isSelected ? (
                    <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-bold text-xs bg-purple-100 dark:bg-purple-900/50 px-3 py-1.5 rounded-full">
                      <CheckCircle2 size={14} />
                      {lang === 'ar' ? 'محدد' : 'Selected'}
                    </div>
                  ) : isUnlocked ? (
                    <button
                      onClick={() => handleSelect(t.id, t.className)}
                      className="px-4 py-1.5 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
                    >
                      {lang === 'ar' ? 'اختيار' : 'Select'}
                    </button>
                  ) : levelLocked ? (
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 text-xs font-bold">
                      <Lock size={12} /> {lang === 'ar' ? 'مقفل' : 'Locked'}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleBuy(t.id, t.price)}
                      className="flex items-center gap-1 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white text-xs font-bold transition-all shadow-md active:scale-95"
                    >
                      <Lock size={12} />
                      {lang === 'ar' ? 'شراء' : 'Buy'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ThemesShop;
