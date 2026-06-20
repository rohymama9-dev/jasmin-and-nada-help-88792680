import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import confetti from 'canvas-confetti';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface GamificationState {
  points: number;
  plantStage: number; // 0: Seed, 1: Sprout, 2: Small Plant, 3: Flower
  lastSpinDate: string | null;
  unlockedBadges: string[];
  mood: 'happy' | 'neutral' | 'stressed' | null;
}

interface GamificationContextType extends GamificationState {
  addPoints: (amount: number) => void;
  deductPoints: (amount: number) => boolean;
  waterPlant: () => boolean;
  spinWheel: () => { prize: string; points: number } | null;
  unlockBadge: (badgeId: string) => void;
  setMood: (mood: GamificationState['mood']) => void;
  playSuccessSound: () => void;
  triggerConfetti: () => void;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'jasmin_nada_gamification';

const DEFAULT_STATE: GamificationState = {
  points: 0,
  plantStage: 0,
  lastSpinDate: null,
  unlockedBadges: [],
  mood: null,
};

// Available badges definition
export const AVAILABLE_BADGES: Badge[] = [
  { id: 'first_task', name: 'Task Master', description: 'Completed your first task', icon: '✅' },
  { id: 'water_drop', name: 'Dew Drop', description: 'Watered the plant 3 times', icon: '💧' },
  { id: 'thinker', name: 'Thinker', description: 'Won a game', icon: '🧠' },
  { id: 'focus_king', name: 'Focus King', description: 'Completed a Pomodoro session', icon: '🍅' },
];

export const GamificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GamificationState>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_STATE;
    } catch {
      return DEFAULT_STATE;
    }
  });

  // Persist state changes
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Mood Theme Injection
  useEffect(() => {
    const root = document.documentElement;
    if (state.mood === 'happy') {
      root.style.setProperty('--background', '45 100% 95%'); // Soft yellow
      root.style.setProperty('--primary', '35 100% 50%'); // Bright orange
    } else if (state.mood === 'stressed') {
      root.style.setProperty('--background', '220 50% 15%'); // Deep blue
      root.style.setProperty('--primary', '210 100% 60%'); // Calming blue
    } else {
      // Revert to default
      root.style.removeProperty('--background');
      root.style.removeProperty('--primary');
    }
  }, [state.mood]);

  const addPoints = (amount: number) => {
    setState(prev => ({ ...prev, points: prev.points + amount }));
  };

  const deductPoints = (amount: number) => {
    if (state.points >= amount) {
      setState(prev => ({ ...prev, points: prev.points - amount }));
      return true;
    }
    return false;
  };

  const playSuccessSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
      oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      console.log('Audio disabled');
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    playSuccessSound();
  };

  const waterPlant = () => {
    if (deductPoints(5)) {
      setState(prev => {
        const nextStage = Math.min(prev.plantStage + 1, 3);
        if (nextStage === 3 && !prev.unlockedBadges.includes('water_drop')) {
          triggerConfetti();
        }
        return { ...prev, plantStage: nextStage };
      });
      playSuccessSound();
      return true;
    }
    return false;
  };

  const spinWheel = () => {
    const today = new Date().toISOString().split('T')[0];
    if (state.lastSpinDate === today) {
      return null;
    }

    const prizes = [
      { prize: '10 Free Points', points: 10 },
      { prize: '50 Free Points', points: 50 },
      { prize: 'Bad Luck!', points: 0 },
      { prize: 'Quote of the Day', points: 5 },
    ];
    
    const win = prizes[Math.floor(Math.random() * prizes.length)];
    
    setState(prev => ({
      ...prev,
      lastSpinDate: today,
      points: prev.points + win.points
    }));
    
    if (win.points > 0) {
      triggerConfetti();
    }
    
    return win;
  };

  const unlockBadge = (badgeId: string) => {
    setState(prev => {
      if (!prev.unlockedBadges.includes(badgeId)) {
        triggerConfetti();
        return { ...prev, unlockedBadges: [...prev.unlockedBadges, badgeId] };
      }
      return prev;
    });
  };

  const setMood = (mood: GamificationState['mood']) => {
    setState(prev => ({ ...prev, mood }));
  };

  return (
    <GamificationContext.Provider value={{
      ...state,
      addPoints,
      deductPoints,
      waterPlant,
      spinWheel,
      unlockBadge,
      setMood,
      playSuccessSound,
      triggerConfetti
    }}>
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};
