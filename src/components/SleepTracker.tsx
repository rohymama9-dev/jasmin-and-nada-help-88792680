import { useState, useEffect, useCallback } from 'react';
import { Moon, RotateCcw, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { useLang } from '@/contexts/LanguageContext';
import { getLocalDateKey, readWeeklyObject } from '@/lib/localStorageLogics';

const SLEEP_KEY = 'app-sleep-tracker';

interface SleepRecord {
  date: string;
  sleepTime: string; // HH:MM format
  wakeTime: string; // HH:MM format
  hours: number;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  pointsAwarded: number;
}

interface SleepTrackerProps {
  onPoints?: (n: number) => void;
}

const calculateSleepHours = (sleepTime: string, wakeTime: string): number => {
  if (!sleepTime || !wakeTime) return 0;

  const [sleepH, sleepM] = sleepTime.split(':').map(Number);
  const [wakeH, wakeM] = wakeTime.split(':').map(Number);

  let sleepMinutes = sleepH * 60 + sleepM;
  let wakeMinutes = wakeH * 60 + wakeM;

  if (wakeMinutes <= sleepMinutes) {
    wakeMinutes += 24 * 60;
  }

  return (wakeMinutes - sleepMinutes) / 60;
};

const getSleepQuality = (hours: number): 'poor' | 'fair' | 'good' | 'excellent' => {
  if (hours < 4) return 'poor';
  if (hours < 6) return 'fair';
  if (hours < 8) return 'good';
  return 'excellent';
};

const getSleepQualityColor = (quality: string): string => {
  switch (quality) {
    case 'poor': return 'text-destructive';
    case 'fair': return 'text-amber-500';
    case 'good': return 'text-blue-500';
    case 'excellent': return 'text-green-500';
    default: return 'text-muted-foreground';
  }
};

const SleepTracker = ({ onPoints = () => {} }: SleepTrackerProps) => {
  const { lang } = useLang();
  const today = getLocalDateKey();
  const POINTS_PER_RECORD = 3;
  const DAILY_LIMIT = 1;

  // الاحتفاظ بجميع سجلات الأسبوع في state لمزامنة الواجهة
  const [weeklyRecords, setWeeklyRecords] = useState<Record<string, SleepRecord>>(() => {
    return readWeeklyObject<SleepRecord>(SLEEP_KEY);
  });

  const record = weeklyRecords[today] || null;

  const [sleepTime, setSleepTime] = useState(record?.sleepTime || '23:00');
  const [wakeTime, setWakeTime] = useState(record?.wakeTime || '07:00');
  const [showMilestone, setShowMilestone] = useState(false);

  // تحديث الأوقات تلقائياً إذا تغيرت السجلات
  useEffect(() => {
    if (record) {
      setSleepTime(record.sleepTime);
      setWakeTime(record.wakeTime);
    }
  }, [record]);

  const saveRecord = useCallback((newRecord: SleepRecord) => {
    try {
      const all = readWeeklyObject<SleepRecord>(SLEEP_KEY);
      all[today] = newRecord;
      localStorage.setItem(SLEEP_KEY, JSON.stringify(all));
      setWeeklyRecords(all); // تحديث الـ state ليعمل الـ render فوراً
      
      try { window.dispatchEvent(new CustomEvent('combo-sleep-updated')); } catch {}
      try { window.dispatchEvent(new StorageEvent('storage', { key: SLEEP_KEY } as any)); } catch {}
    } catch {
      /* ignore */
    }
  }, [today]);

  const handleLogSleep = () => {
    const hours = calculateSleepHours(sleepTime, wakeTime);

    if (hours < 0.5) {
      toast.error(lang === 'ar' ? 'أدخل أوقات صحيحة' : 'Enter valid times');
      return;
    }

    const quality = getSleepQuality(hours);
    const shouldAwardPoints = !record || record.pointsAwarded < DAILY_LIMIT;
    const newPointsAwarded = shouldAwardPoints ? 1 : (record?.pointsAwarded || 0);

    const newRecord: SleepRecord = {
      date: today,
      sleepTime,
      wakeTime,
      hours: Number(hours.toFixed(1)),
      quality,
      pointsAwarded: newPointsAwarded,
    };

    saveRecord(newRecord);

    if (shouldAwardPoints) {
      onPoints(POINTS_PER_RECORD);
      setShowMilestone(true);
      setTimeout(() => setShowMilestone(false), 2500);
      toast.success(
        lang === 'ar'
          ? `✓ تم تسجيل النوم! +${POINTS_PER_RECORD} نقاط`
          : `✓ Sleep logged! +${POINTS_PER_RECORD} points`
      );
    } else {
      // تم تعديل toast.prompt إلى toast.success لحل مشكلة التايب سكريبت
      toast.success(
        lang === 'ar'
          ? 'تم تحديث سجل النوم'
          : 'Sleep record updated'
      );
    }
  };

  const resetToday = () => {
    toast(lang === 'ar' ? 'إعادة تعيين اليوم؟' : 'Reset today?', {
      action: {
        label: lang === 'ar' ? 'تأكيد' : 'Confirm',
        onClick: () => {
          setSleepTime('23:00');
          setWakeTime('07:00');
          try {
            const all = readWeeklyObject<SleepRecord>(SLEEP_KEY);
            delete all[today];
            localStorage.setItem(SLEEP_KEY, JSON.stringify(all));
            setWeeklyRecords(all);
          } catch {
            /* ignore */
          }
          toast.success(lang === 'ar' ? 'تم إعادة التعيين' : 'Reset complete');
        }
      },
      cancel: { label: lang === 'ar' ? 'إلغاء' : 'Cancel' }
    });
  };

  const hours = calculateSleepHours(sleepTime, wakeTime);
  const currentQuality = getSleepQuality(hours);
  const qualityColor = getSleepQualityColor(currentQuality);

  const qualityLabels = {
    poor: { ar: 'سيء', en: 'Poor' },
    fair: { ar: 'مقبول', en: 'Fair' },
    good: { ar: 'جيد', en: 'Good' },
    excellent: { ar: 'ممتاز', en: 'Excellent' },
  };

  const totalLoggedDays = Object.keys(weeklyRecords).length;

  return (
    <div className="glass-card rounded-2xl p-5 animate-slide-up space-y-4">
      <div className="flex items-center gap-2">
        <Moon size={18} className="text-blue-500" />
        <h3 className="font-semibold text-foreground">
          {lang === 'ar' ? 'متتبع النوم' : 'Sleep Tracker'}
        </h3>
        <button onClick={resetToday} className="ml-auto text-muted-foreground hover:text-primary transition-colors p-1" aria-label="Reset Today">
          <RotateCcw size={14} />
        </button>
      </div>

      {showMilestone && (
        <div className="p-3 rounded-xl gradient-gold text-center animate-bounce-in">
          <Trophy size={20} className="mx-auto mb-1 text-gold-foreground" />
          <p className="font-bold text-gold-foreground text-sm">
            🎉 +{POINTS_PER_RECORD} ⭐
          </p>
        </div>
      )}

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              {lang === 'ar' ? 'وقت النوم' : 'Sleep Time'}
            </label>
            <input
              type="time"
              value={sleepTime}
              onChange={e => setSleepTime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              {lang === 'ar' ? 'وقت الاستيقاظ' : 'Wake Time'}
            </label>
            <input
              type="time"
              value={wakeTime}
              onChange={e => setWakeTime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="text-center space-y-2">
          <div className="text-3xl font-bold text-primary">{hours.toFixed(1)}h</div>
          <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'ساعات النوم' : 'Hours of Sleep'}</p>
        </div>

        <div className="text-center space-y-1">
          <p className={`text-sm font-semibold ${qualityColor}`}>
            {lang === 'ar' ? qualityLabels[currentQuality].ar : qualityLabels[currentQuality].en}
          </p>
          <p className="text-xs text-muted-foreground">
            {currentQuality === 'excellent' && (lang === 'ar' ? 'ممتاز! النوم المثالي' : 'Excellent! Perfect sleep')}
            {currentQuality === 'good' && (lang === 'ar' ? 'جيد جداً' : 'Very good')}
            {currentQuality === 'fair' && (lang === 'ar' ? 'قد تحتاجين لمزيد من النوم' : 'Could use more sleep')}
            {currentQuality === 'poor' && (lang === 'ar' ? 'نوم قليل جداً' : 'Too little sleep')}
          </p>
        </div>

        <button
          onClick={handleLogSleep}
          className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-medium flex items-center justify-center gap-2 active:scale-95 transition"
        >
          <Trophy size={18} />
          {lang === 'ar' ? 'سجل النوم' : 'Log Sleep'}
        </button>
      </div>

      {/* السجل الأسبوعي بتصميم أفقي زي متتبع الوجبات */}
      {totalLoggedDays > 0 && (
        <div className="border-t border-border/50 pt-3 mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase">
              {lang === 'ar' ? 'السجل الأسبوعي' : 'Weekly Record'}
            </p>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {Object.entries(weeklyRecords)
              .sort(([dateA], [dateB]) => dateB.localeCompare(dateA)) // ترتيب من الأحدث للأقدم
              .map(([dateKey, rec]) => {
                const isToday = dateKey === today;
                const dateLabel = isToday ? (lang === 'ar' ? 'اليوم' : 'Today') : new Date(dateKey).toLocaleDateString();
                
                // تحديد إيموجي لكل حالة لتجميل الكارت
                const qualityIcon = 
                  rec.quality === 'excellent' ? '🌟' :
                  rec.quality === 'good' ? '👍' :
                  rec.quality === 'fair' ? '⚠️' : '🥱';

                return (
                  <div key={dateKey} className={`glass-card rounded-lg p-3 text-sm flex justify-between items-center ${isToday ? 'border border-primary/50 bg-primary/5' : ''}`}>
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground">{dateLabel}</span>
                      <span className="text-[10px] text-muted-foreground">{rec.hours} {lang === 'ar' ? 'ساعات' : 'hours'}</span>
                    </div>
                    <div className="text-right flex flex-col">
                      <span className="text-xs text-muted-foreground">{lang === 'ar' ? 'الجودة' : 'Quality'}</span>
                      <span className={`font-bold text-[11px] ${getSleepQualityColor(rec.quality)}`}>{qualityIcon} {lang === 'ar' ? qualityLabels[rec.quality].ar : qualityLabels[rec.quality].en}</span>
                    </div>
                  </div>
                );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SleepTracker;