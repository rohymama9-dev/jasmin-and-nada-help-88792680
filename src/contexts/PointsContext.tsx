import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { lsGet, lsSet } from '@/lib/userStorage';

type LeaderboardSection = 'games' | 'education';

interface PointsContextType {
  points: number;
  gamesPoints: number;
  educationPoints: number;
  addPoints: (amount: number, section?: LeaderboardSection | null) => void;
}

const PointsContext = createContext<PointsContextType | undefined>(undefined);

const POINTS_BASE = 'app-points';
const GAMES_POINTS_BASE = 'app-games-points';
const EDUCATION_POINTS_BASE = 'app-education-points';

export const PointsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [points, setPoints] = useState<number>(() =>
    parseInt(lsGet(POINTS_BASE, '0'), 10) || 0
  );
  const [gamesPoints, setGamesPoints] = useState<number>(() =>
    parseInt(lsGet(GAMES_POINTS_BASE, '0'), 10) || 0
  );
  const [educationPoints, setEducationPoints] = useState<number>(() =>
    parseInt(lsGet(EDUCATION_POINTS_BASE, '0'), 10) || 0
  );

  // Sync with storage and custom events
  useEffect(() => {
    const sync = () => {
      setPoints(parseInt(lsGet(POINTS_BASE, '0'), 10) || 0);
      setGamesPoints(parseInt(lsGet(GAMES_POINTS_BASE, '0'), 10) || 0);
      setEducationPoints(parseInt(lsGet(EDUCATION_POINTS_BASE, '0'), 10) || 0);
    };
    window.addEventListener('storage', sync);
    window.addEventListener('guest-name-changed', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('guest-name-changed', sync);
    };
  }, []);

  const addPoints = useCallback((amount: number, section?: LeaderboardSection | null) => {
    if (amount === 0) return;

    setPoints(prev => {
      const next = Math.max(0, prev + amount);
      lsSet(POINTS_BASE, String(next));
      return next;
    });

    if (section === 'games') {
      setGamesPoints(prev => {
        const next = Math.max(0, prev + amount);
        lsSet(GAMES_POINTS_BASE, String(next));
        return next;
      });
    }

    if (section === 'education') {
      setEducationPoints(prev => {
        const next = Math.max(0, prev + amount);
        lsSet(EDUCATION_POINTS_BASE, String(next));
        return next;
      });
    }
  }, []);

  return (
    <PointsContext.Provider value={{ points, gamesPoints, educationPoints, addPoints }}>
      {children}
    </PointsContext.Provider>
  );
};

export const usePoints = () => {
  const context = useContext(PointsContext);
  if (context === undefined) {
    throw new Error('usePoints must be used within a PointsProvider');
  }
  return context;
};
