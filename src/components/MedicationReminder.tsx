import { useState, useEffect } from 'react';
import { Pill, Plus, Trash2, Clock, Bell, HeartPulse, Droplets, ShieldCheck, Check } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { usePoints } from '@/hooks/usePoints';
import { toast } from 'sonner';

interface Medication {
  id: string;
  name: string;
  time: string;
}

interface LogEntry {
  date?: string;
  amount?: number;
  hours?: number;
  duration?: number;
  count?: number;
}

const MEDS_KEY = 'app-meds';
const MEDS_CHECKED_KEY = 'app-meds-checked';

// المكون المدمج للسجل الأسبوعي بدون أي استدعاءات خارجية
const LocalWeeklyLog = ({ logs, title, type }: { logs: LogEntry[]; title: string; type: string }) => {
  const last7Days = logs.slice(-7);
  return (
    <div className="border-t border-border/50 pt-4 mt-4">
      <p className="text-xs font-bold text-muted-foreground mb-3 uppercase">{title}</p>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
        {last7Days.map((log, i) => (
          <div key={i} className="min-w-[60px] flex-shrink-0 glass-card p-2 text-center rounded-lg snap-start border border-border/30">
            <p className="text-[10px] text-muted-foreground">{log.date?.slice(5) || ''}</p>
            <p className="text-sm font-bold text-foreground">
              {type === 'water' ? `${log.amount || 0}L` : type === 'sleep' ? `${log.hours || 0}h` : type === 'exercise' ? `${log.duration || 0}m` : `${log.count || 0}`}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const HEALTH_TIPS = [
  { ar: 'اشرب الكثير من الماء مع أدويتك لتسهيل امتصاصها.', en: 'Drink plenty of water with your medications for better absorption.' },
  { ar: 'حاول تناول الدواء في نفس الوقت يومياً لضمان فعاليته.', en: 'Try to take your medication at the same time every day for maximum efficacy.' },
  { ar: 'لا تضاعف الجرعة أبداً إذا نسيت إحداها؛ استشر طبيبك.', en: 'Never double your dose if you miss one; consult your doctor.' },
  { ar: 'تأكد من تخزين أدويتك في مكان بارد وجاف بعيداً عن أشعة الشمس.', en: 'Store your medications in a cool, dry place away from direct sunlight.' },
  { ar: 'شرب الماء بانتظام يحسن صحتك العامة ويقلل من الآثار الجانبية.', en: 'Regular hydration improves overall health and reduces side effects.' },
  { ar: 'التزم بالجدول الزمني للأدوية حتى لو شعرت بتحسن.', en: 'Stick to your medication schedule even if you start feeling better.' }
];

const MOTIVATIONAL_MESSAGES = [
  { ar: 'أحسنتِ بتناول دوائكِ! صحتكِ أولويتنا 🌸', en: 'Great job taking your medicine! Your health is our priority 🌸' },
  { ar: 'فخورة بالتزامكِ بمواعيد الدواء! ✨', en: 'Proud of your commitment to your medication! ✨' },
  { ar: 'الانتظام في الدواء خطوة رائعة نحو العافية 🌿', en: 'Taking your medicine on time is a great step towards wellness 🌿' },
  { ar: 'أحسنتِ صنعاً! الالتزام هو سر الشفاء 💪', en: 'Well done! Consistency is the secret to recovery 💪' }
];

const MedicationReminder = () => {
  const { lang } = useLang();
  const { addPoints } = usePoints();
  const [meds, setMeds] = useState<Medication[]>(() => {
    try {
      const stored = localStorage.getItem(MEDS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [checked, setChecked] = useState<string[]>(() => {
    try {
      const data = JSON.parse(localStorage.getItem(MEDS_CHECKED_KEY) || '{}');
      const today = new Date().toDateString();
      return data.date === today ? data.ids : [];
    } catch { return []; }
  });

  const [newName, setNewName] = useState('');
  const [newTime, setNewTime] = useState('08:00');
  const [currentTip, setCurrentTip] = useState(0);

  const saveMeds = (m: Medication[]) => {
    setMeds(m);
    localStorage.setItem(MEDS_KEY, JSON.stringify(m));
  };

  const saveChecked = (ids: string[]) => {
    setChecked(ids);
    const dateStr = new Date().toDateString();
    localStorage.setItem(MEDS_CHECKED_KEY, JSON.stringify({ date: dateStr, ids }));
    
    try {
      const rawWeekly = localStorage.getItem('MedsweeklyLog');
      let weekly = rawWeekly ? JSON.parse(rawWeekly) : [];
      const existingIdx = weekly.findIndex((w: LogEntry) => w.date === dateStr);
      if (existingIdx >= 0) {
        weekly[existingIdx].count = ids.length;
      } else {
        weekly.push({ date: dateStr, count: ids.length });
      }
      localStorage.setItem('MedsweeklyLog', JSON.stringify(weekly));
    } catch {}
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      meds.forEach(med => {
        if (med.time === currentTimeStr && !checked.includes(med.id)) {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(lang === 'ar' ? 'موعد الدواء! 💊' : 'Medication Time! 💊', {
              body: `${lang === 'ar' ? 'حان وقت تناول' : 'Time to take'} ${med.name}`,
              icon: '/pwa-192x192.png'
            });
          }
          toast.info(`${lang === 'ar' ? 'حان وقت' : 'Time for'} ${med.name}`, {
            description: med.time,
            icon: <Pill className="text-primary" />
          });
        }
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [meds, checked, lang]);

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % HEALTH_TIPS.length);
    }, 10000);
    return () => clearInterval(tipInterval);
  }, []);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const addMed = () => {
    if (!newName.trim()) return;
    const newMed: Medication = {
      id: Date.now().toString(),
      name: newName.trim(),
      time: newTime,
    };
    saveMeds([...meds, newMed]);
    setNewName('');
    setNewTime('08:00');
    toast.success(lang === 'ar' ? 'تمت إضافة الدواء' : 'Medication added');
  };

  const toggleCheck = (id: string) => {
    if (checked.includes(id)) {
      saveChecked(checked.filter(c => c !== id));
    } else {
      saveChecked([...checked, id]);
      addPoints(2); 
      const today = new Date().toDateString();
      try { localStorage.setItem('combo-med-today', today); } catch {}
      window.dispatchEvent(new CustomEvent('combo-medication-taken'));
      const msg = MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
      toast.success(lang === 'ar' ? msg.ar : msg.en);
    }
  };

  const removeMed = (id: string) => {
    if (confirm(lang === 'ar' ? 'هل تريد حذف هذا الدواء نهائياً؟' : 'Delete this medicine permanently?')) {
      saveMeds(meds.filter(m => m.id !== id));
      saveChecked(checked.filter(c => c !== id));
      toast.error(lang === 'ar' ? 'تم الحذف' : 'Removed');
    }
  };

  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  return (
    <div className="glass-card rounded-[2.5rem] p-6 border-2 border-primary/10 shadow-xl overflow-hidden relative animate-slide-up">
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
      
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
          <Pill size={24} />
        </div>
        <h3 className="text-xl font-black text-foreground">
          {t('مخطط الأدوية', 'Medication Tracker')}
        </h3>
      </div>

      <div className="mb-8 p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/10 flex items-center gap-4">
        <div className="p-2 rounded-full bg-primary/20 text-primary animate-pulse">
          {currentTip % 3 === 0 ? <Droplets size={20} /> : currentTip % 3 === 1 ? <HeartPulse size={20} /> : <ShieldCheck size={20} />}
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-black text-primary uppercase tracking-wider mb-1">
            {t('نصيحة طبية', 'Health Tip')}
          </p>
          <p className="text-xs font-bold text-foreground leading-tight">
            {t(HEALTH_TIPS[currentTip].ar, HEALTH_TIPS[currentTip].en)}
          </p>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-secondary/30 space-y-4 mb-6">
        <div className="space-y-3">
          <input
            type="text"
            placeholder={t('اسم الدواء (مثلاً: فيتامين سي)', 'Medicine Name')}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm font-bold focus:ring-2 focus:ring-primary/50 transition-all"
          />
          <div className="flex items-center gap-3 bg-background px-4 py-3 rounded-xl border border-border">
            <Clock size={18} className="text-muted-foreground" />
            <input
              type="time"
              value={newTime}
              onChange={e => setNewTime(e.target.value)}
              className="flex-1 bg-transparent border-none text-sm font-bold focus:outline-none"
            />
          </div>
        </div>
        <button
          onClick={addMed}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-black text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
        >
          <Plus size={18} />
          {t('إضافة دواء جديد', 'Add Medicine')}
        </button>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto pr-1 scrollbar-hide">
        {meds.length === 0 ? (
          <div className="text-center py-8 opacity-40">
            <Bell size={40} className="mx-auto mb-2 opacity-20" />
            <p className="text-xs font-bold">{t('ابدئي بإضافة أدويتك اليومية', 'Start adding your daily meds')}</p>
          </div>
        ) : (
          meds.sort((a, b) => a.time.localeCompare(b.time)).map(med => (
            <div
              key={med.id}
              className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                checked.includes(med.id) ? 'bg-primary/5 border-primary/20 opacity-60' : 'bg-background border-border hover:border-primary/30 shadow-sm'
              }`}
            >
              <button
                onClick={() => toggleCheck(med.id)}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                  checked.includes(med.id) ? 'border-primary bg-primary text-white scale-110 shadow-lg' : 'border-border hover:border-primary'
                }`}
              >
                {checked.includes(med.id) && <Check size={16} strokeWidth={3} />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm truncate ${checked.includes(med.id) ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {med.name}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold">
                  <Clock size={10} />
                  {med.time}
                </div>
              </div>
              <button
                onClick={() => removeMed(med.id)}
                className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>
      
      {(() => {
        try {
          const raw = localStorage.getItem('MedsweeklyLog');
          const logs = raw ? JSON.parse(raw) : [];
          if (logs.length === 0) return null;
          return (
            <LocalWeeklyLog 
              logs={logs} 
              title={lang === 'ar' ? 'سجل الأدوية الأسبوعي' : 'Weekly Medication Log'} 
              type="medication" 
            />
          );
        } catch {
          return null;
        }
      })()}
    </div>
  );
};

export default MedicationReminder;