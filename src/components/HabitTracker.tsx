import { useState } from 'react';
import { Plus, Check, Clock, X } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { usePoints } from '@/hooks/usePoints';
import { toast } from 'sonner';

const HABITS_KEY = 'app-habits';
const CHECKED_KEY = 'app-habits-checked';

interface Habit {
  id: string;
  name: string;
  time: string;
}

interface HabitTrackerProps {
  onComplete?: () => void;
}

const HabitTracker = ({ onComplete }: HabitTrackerProps) => {
  const { lang, t } = useLang();
  const { addPoints } = usePoints();
  const [habits, setHabits] = useState<Habit[]>(() => {
    try { return JSON.parse(localStorage.getItem(HABITS_KEY) || '[]'); } catch { return []; }
  });
  const [checked, setChecked] = useState<string[]>(() => {
    try {
      const data = JSON.parse(localStorage.getItem(CHECKED_KEY) || '{}');
      const today = new Date().toDateString();
      return data.date === today ? data.ids : [];
    } catch { return []; }
  });
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTime, setNewTime] = useState('08:00');

  const saveHabits = (h: Habit[]) => { setHabits(h); localStorage.setItem(HABITS_KEY, JSON.stringify(h)); };
  const saveChecked = (ids: string[]) => { setChecked(ids); localStorage.setItem(CHECKED_KEY, JSON.stringify({ date: new Date().toDateString(), ids })); };

  const addHabit = () => {
    if (!newName.trim()) return;
    saveHabits([...habits, { id: Date.now().toString(), name: newName.trim(), time: newTime }]);
    setNewName(''); setNewTime('08:00'); setShowAdd(false);
  };

  const toggleCheck = (id: string) => {
    if (checked.includes(id)) {
      saveChecked(checked.filter(c => c !== id));
    } else {
      saveChecked([...checked, id]);
      addPoints(3); // Award 3 points per habit completion
      toast.success(lang === 'ar' ? 'أحسنتِ! +٣ نقاط 🌟' : 'Great job! +3 points 🌟');
      try {
        const today = new Date().toDateString();
        localStorage.setItem('combo-habit-today', today);
      } catch {}
      try { window.dispatchEvent(new CustomEvent('combo-habit-checked')); } catch {}
      try { window.dispatchEvent(new StorageEvent('storage', { key: 'combo-habit-today' } as any)); } catch {}
      onComplete?.();
    }
  };

  return (
    <div className="glass-card rounded-2xl p-5 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">{t('habits')}</h3>
        <button onClick={() => setShowAdd(!showAdd)} className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1 text-sm">
          <Plus size={16} /> {t('addHabit')}
        </button>
      </div>

      {showAdd && (
        <div className="mb-4 p-3 rounded-xl bg-secondary/50 space-y-3 animate-bounce-in">
          <input type="text" placeholder={t('habitName')} value={newName} onChange={e => setNewName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-muted-foreground" />
            <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)}
              className="px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div className="flex gap-2">
            <button onClick={addHabit} className="flex-1 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-medium">{t('save')}</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl bg-muted text-muted-foreground text-sm">{t('cancel')}</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {habits.map(habit => (
          <div key={habit.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${checked.includes(habit.id) ? 'bg-success/10' : 'bg-secondary/30'}`}>
            <button onClick={() => toggleCheck(habit.id)}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                checked.includes(habit.id) ? 'border-success bg-success text-success-foreground scale-110' : 'border-border hover:border-primary'
              }`}
            >
              {checked.includes(habit.id) && <Check size={12} />}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${checked.includes(habit.id) ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{habit.name}</p>
              <p className="text-xs text-muted-foreground truncate">{habit.time}</p>
            </div>
            <button onClick={() => saveHabits(habits.filter(h => h.id !== habit.id))} className="text-muted-foreground hover:text-destructive transition-colors">
              <X size={14} />
            </button>
          </div>
        ))}
        {habits.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">{t('addHabit')}...</p>}
      </div>
    </div>
  );
};

export default HabitTracker;
