import { useState } from 'react';
import { Thermometer, Check } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';

const CHECK_KEY = 'app-weather-check';

interface DetailedWeatherProps {
  onPoints: (n: number) => void;
}

const hourlyData = [
  { hour: '12 AM', temp: 22, icon: '🌙', condAr: 'صافٍ', condEn: 'Clear' },
  { hour: '2 AM', temp: 21, icon: '🌙', condAr: 'صافٍ', condEn: 'Clear' },
  { hour: '4 AM', temp: 20, icon: '🌙', condAr: 'صافٍ', condEn: 'Clear' },
  { hour: '6 AM', temp: 21, icon: '🌅', condAr: 'شروق', condEn: 'Sunrise' },
  { hour: '8 AM', temp: 24, icon: '☀️', condAr: 'مشمس', condEn: 'Sunny' },
  { hour: '10 AM', temp: 28, icon: '☀️', condAr: 'مشمس', condEn: 'Sunny' },
  { hour: '12 PM', temp: 32, icon: '🌤️', condAr: 'غائم جزئياً', condEn: 'Partly Cloudy' },
  { hour: '2 PM', temp: 35, icon: '🌤️', condAr: 'حار', condEn: 'Hot' },
  { hour: '4 PM', temp: 34, icon: '☀️', condAr: 'مشمس', condEn: 'Sunny' },
  { hour: '6 PM', temp: 30, icon: '🌇', condAr: 'غروب', condEn: 'Sunset' },
  { hour: '8 PM', temp: 26, icon: '🌙', condAr: 'صافٍ', condEn: 'Clear' },
  { hour: '10 PM', temp: 24, icon: '🌙', condAr: 'صافٍ', condEn: 'Clear' },
];

const getToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
};

const DetailedWeather = ({ onPoints }: DetailedWeatherProps) => {
  const { lang } = useLang();
  const [checked, setChecked] = useState(() => localStorage.getItem(CHECK_KEY) === getToday());

  const handleCheck = () => {
    if (!checked) {
      setChecked(true);
      localStorage.setItem(CHECK_KEY, getToday());
      onPoints(2);
    }
  };

  const maxTemp = Math.max(...hourlyData.map(h => h.temp));
  const minTemp = Math.min(...hourlyData.map(h => h.temp));

  return (
    <div className="glass-card rounded-2xl p-5 animate-slide-up space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Thermometer size={18} className="text-primary" />
          <h3 className="font-semibold text-foreground">{lang === 'ar' ? 'الطقس 24 ساعة' : '24h Weather'}</h3>
        </div>
        {!checked ? (
          <button onClick={handleCheck}
            className="text-[10px] px-2 py-1 rounded-full gradient-primary text-primary-foreground font-medium">
            +2⭐ {lang === 'ar' ? 'تحقق' : 'Check'}
          </button>
        ) : (
          <span className="text-[10px] text-success flex items-center gap-1"><Check size={10} /> {lang === 'ar' ? 'تم' : 'Done'}</span>
        )}
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4 p-3 rounded-xl bg-secondary/50">
        <span className="text-3xl">☀️</span>
        <div>
          <p className="text-lg font-bold text-foreground">{maxTemp}° / {minTemp}°</p>
          <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'مشمس مع غيوم خفيفة' : 'Sunny with light clouds'}</p>
        </div>
      </div>

      {/* Hourly scroll */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {hourlyData.map((h, i) => (
          <div key={i} className="flex flex-col items-center gap-1 min-w-[52px] p-2 rounded-xl bg-secondary/30">
            <p className="text-[9px] text-muted-foreground font-medium">{h.hour}</p>
            <span className="text-lg">{h.icon}</span>
            <p className="text-sm font-bold text-foreground">{h.temp}°</p>
            <p className="text-[8px] text-muted-foreground">{lang === 'ar' ? h.condAr : h.condEn}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DetailedWeather;
