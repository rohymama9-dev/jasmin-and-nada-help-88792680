import { useLang } from '@/contexts/LanguageContext';
import { Sun, Cloud, Moon, Thermometer } from 'lucide-react';

const mockForecast = [
  { periodAr: 'الصباح', periodEn: 'Morning', temp: 28, icon: Sun, condition: { ar: 'مشمس', en: 'Sunny' }, emoji: '☀️' },
  { periodAr: 'الظهيرة', periodEn: 'Afternoon', temp: 34, icon: Cloud, condition: { ar: 'غائم جزئياً', en: 'Partly Cloudy' }, emoji: '⛅' },
  { periodAr: 'الليل', periodEn: 'Night', temp: 22, icon: Moon, condition: { ar: 'صافٍ', en: 'Clear' }, emoji: '🌙' },
];

const WeatherWidget = () => {
  const { lang } = useLang();

  return (
    <div className="glass-card rounded-2xl p-5 animate-slide-up">
      <div className="flex items-center gap-2 mb-3">
        <Thermometer size={18} className="text-primary" />
        <h3 className="font-semibold text-foreground">{lang === 'ar' ? 'حالة الطقس' : 'Weather'}</h3>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {mockForecast.map((f, i) => {
          const Icon = f.icon;
          return (
            <div key={i} className="bg-secondary/50 rounded-xl p-3 text-center">
              <p className="text-[10px] text-muted-foreground font-medium mb-1">{lang === 'ar' ? f.periodAr : f.periodEn}</p>
              <span className="text-2xl block">{f.emoji}</span>
              <p className="text-lg font-bold text-foreground mt-1">{f.temp}°</p>
              <p className="text-[10px] text-muted-foreground">{lang === 'ar' ? f.condition.ar : f.condition.en}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeatherWidget;
