import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { usePoints } from '@/hooks/usePoints';

export type DailyComboTaskId = 'water' | 'fasting' | 'habit' | 'medication' | 'education' | 'diet';

type PersistedState = {
  date: string;
  completed: DailyComboTaskId[];
  pointsAwarded?: boolean;
};

type DailyComboChallengeContextType = {
  date: string;
  completed: Set<DailyComboTaskId>;
  pointsAwarded: boolean;
  updateChallenge: (taskId: DailyComboTaskId, done?: boolean) => void;
};

const DailyComboChallengeContext = createContext<DailyComboChallengeContextType | undefined>(undefined);

const STATE_KEY = 'dailyComboChallengeState';

const todayDateString = () => new Date().toDateString();

function countWaterToday(): number {
  const today = todayDateString();
  const keys = ['waterLog', 'waterTrackerData', 'water-log'];
  try {
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const count = parsed.filter((it: any) => {
          if (!it) return false;
          if (typeof it === 'string' || typeof it === 'number') {
            try {
              return new Date(it).toDateString() === today;
            } catch {
              return false;
            }
          }
          if (it.date) return it.date === today || new Date(it.date).toDateString() === today;
          if (it.time) return new Date(it.time).toDateString() === today;
          return false;
        }).length;
        if (count) return count;
      }
      if (parsed && typeof parsed === 'object') {
        if (parsed[today] !== undefined) {
          const v = parsed[today];
          if (Array.isArray(v)) return v.length;
          return Number(v) || 0;
        }
        if (parsed.count && Number(parsed.count) > 0) return Number(parsed.count);
      }
    }
  } catch {
    // ignore
  }
  return 0;
}

function fastingExistsToday(): boolean {
  const today = todayDateString();
  try {
    const raw = localStorage.getItem('fastingLog');
    if (!raw) return false;
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return false;
    return arr.some((it: any) => {
      try {
        if (it.date) return it.date === today || new Date(it.date).toDateString() === today;
        if (it.startTime) return new Date(it.startTime).toDateString() === today;
      } catch {
        // ignore
      }
      return false;
    });
  } catch {
    // ignore
  }
  return false;
}

function dietLoggedToday(): boolean {
  const today = todayDateString();
  try {
    const keys = ['nutritionLog', 'DietLog', 'dietLog'];
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        if (parsed.some((m: any) => m?.date && (m.date === today || new Date(m.date).toDateString() === today))) return true;
      } else if (parsed && typeof parsed === 'object') {
        if (parsed.date && (parsed.date === today || new Date(parsed.date).toDateString() === today)) return true;
        if (parsed.meals && Array.isArray(parsed.meals) && parsed.meals.some((m: any) => m?.date && (m.date === today || new Date(m.date).toDateString() === today))) {
          return true;
        }
      }
    }
  } catch {
    // ignore
  }
  return false;
}

const setDailyFlag = (key: string, today: string, eventName: string) => {
  try {
    localStorage.setItem(key, today);
  } catch {
    // ignore
  }
  try {
    window.dispatchEvent(new CustomEvent(eventName));
  } catch {
    // ignore
  }
  try {
    window.dispatchEvent(new StorageEvent('storage', { key } as any));
  } catch {
    // ignore
  }
};

export const DailyComboChallengeProvider = ({ children }: { children: React.ReactNode }) => {
  const { addPoints } = usePoints();
  const [date, setDate] = useState(() => todayDateString());
  const [completedIds, setCompletedIds] = useState<DailyComboTaskId[]>([]);
  const [pointsAwarded, setPointsAwarded] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const today = todayDateString();
    setDate(today);
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (!raw) return;
      const parsed: PersistedState = JSON.parse(raw);
      if (parsed.date !== today) {
        localStorage.removeItem(STATE_KEY);
        setCompletedIds([]);
        setPointsAwarded(false);
        return;
      }
      setCompletedIds(Array.isArray(parsed.completed) ? parsed.completed : []);
      setPointsAwarded(!!parsed.pointsAwarded);
    } catch {
      // ignore
    }
  }, []);

  const persist = useCallback((nextCompleted: DailyComboTaskId[], nextAwarded: boolean) => {
    const payload: PersistedState = { date: todayDateString(), completed: nextCompleted, pointsAwarded: nextAwarded };
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, []);

  const completed = useMemo(() => new Set(completedIds), [completedIds]);

  const mergeCompleted = useCallback((idsToAdd: DailyComboTaskId[]) => {
    setCompletedIds((prev) => {
      const merged = new Set(prev);
      idsToAdd.forEach((id) => merged.add(id));
      const next = Array.from(merged);
      persist(next, pointsAwarded);
      return next;
    });
  }, [persist, pointsAwarded]);

  const evaluateFromStorage = useCallback(() => {
    const today = todayDateString();
    const next: DailyComboTaskId[] = [];
    if (countWaterToday() >= 6) next.push('water');
    if (fastingExistsToday()) next.push('fasting');
    if (dietLoggedToday()) next.push('diet');
    try {
      if (localStorage.getItem('combo-habit-today') === today) next.push('habit');
      if (localStorage.getItem('combo-med-today') === today) next.push('medication');
      if (localStorage.getItem('combo-edu-today') === today) next.push('education');
    } catch {
      // ignore
    }
    if (next.length) mergeCompleted(next);
  }, [mergeCompleted]);

  useEffect(() => {
    evaluateFromStorage();
    intervalRef.current = window.setInterval(evaluateFromStorage, 2000);

    const onStorage = (e: StorageEvent) => {
      const watched = [
        'waterLog',
        'waterTrackerData',
        'water-log',
        'fastingLog',
        'nutritionLog',
        'DietLog',
        'dietLog',
        'combo-habit-today',
        'combo-med-today',
        'combo-edu-today',
      ];
      if (!e.key || watched.includes(e.key)) evaluateFromStorage();
    };

    window.addEventListener('storage', onStorage);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener('storage', onStorage);
    };
  }, [evaluateFromStorage]);

  useEffect(() => {
    if (completedIds.length === 6 && !pointsAwarded) {
      try {
        addPoints(60);
      } catch {
        // ignore
      }
      setPointsAwarded(true);
      persist(completedIds, true);
    }
  }, [addPoints, completedIds, persist, pointsAwarded]);

  const updateChallenge = useCallback((taskId: DailyComboTaskId, done: boolean = true) => {
    if (!done) return;
    const today = todayDateString();

    if (taskId === 'habit') setDailyFlag('combo-habit-today', today, 'combo-habit-checked');
    if (taskId === 'medication') setDailyFlag('combo-med-today', today, 'combo-medication-taken');
    if (taskId === 'education') setDailyFlag('combo-edu-today', today, 'combo-education-access');

    mergeCompleted([taskId]);
  }, [mergeCompleted]);

  const value = useMemo<DailyComboChallengeContextType>(() => ({
    date,
    completed,
    pointsAwarded,
    updateChallenge,
  }), [completed, date, pointsAwarded, updateChallenge]);

  return (
    <DailyComboChallengeContext.Provider value={value}>
      {children}
    </DailyComboChallengeContext.Provider>
  );
};

export const useDailyComboChallenge = () => {
  const ctx = useContext(DailyComboChallengeContext);
  if (!ctx) throw new Error('useDailyComboChallenge must be used within DailyComboChallengeProvider');
  return ctx;
};

