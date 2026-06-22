// Unified client-side state: points (mirrors `app-points`), XP, level, streak, dino XP, themes.
// Pure localStorage. Emits `app-store-updated` + `points-updated` so existing listeners react.

const K = {
  points: 'app-points',
  xp: 'global_xp',
  streak: 'userStreak',
  lastVisit: 'lastVisitDate',
  dinoXp: 'dino_xp',
  unlockedThemes: 'unlocked_themes',
  activeTheme: 'selected_theme',
} as const;

const num = (k: string, d = 0) => {
  try { return parseInt(localStorage.getItem(k) || String(d), 10) || d; } catch { return d; }
};
const setNum = (k: string, n: number) => {
  try { localStorage.setItem(k, String(Math.max(0, Math.floor(n)))); } catch {}
};
const emit = () => {
  try {
    window.dispatchEvent(new CustomEvent('app-store-updated'));
    window.dispatchEvent(new CustomEvent('points-updated'));
  } catch {}
};

// Level table: L1 0-100, L2 100-250, L3 250-500, L4 500-1000, then +500 per level.
const LEVEL_BREAKS = [0, 100, 250, 500, 1000];
export const getLevel = (xp = getXP()): number => {
  for (let i = LEVEL_BREAKS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_BREAKS[i]) {
      if (i < LEVEL_BREAKS.length - 1) return i + 1;
      const extra = Math.floor((xp - 1000) / 500);
      return 5 + extra;
    }
  }
  return 1;
};
export const getXPForLevel = (lvl: number): number => {
  if (lvl <= LEVEL_BREAKS.length) return LEVEL_BREAKS[lvl - 1];
  return 1000 + (lvl - 5) * 500;
};
export const getLevelProgress = (xp = getXP()) => {
  const lvl = getLevel(xp);
  const cur = getXPForLevel(lvl);
  const next = getXPForLevel(lvl + 1);
  return { level: lvl, current: xp - cur, needed: next - cur, pct: Math.min(100, ((xp - cur) / (next - cur)) * 100) };
};

export const getPoints = () => num(K.points);
export const getXP = () => num(K.xp);
export const getStreak = () => num(K.streak);
export const getDinoXP = () => num(K.dinoXp);

export const addXP = (amount: number) => {
  if (!amount) return;
  const before = getLevel();
  setNum(K.xp, getXP() + amount);
  const after = getLevel();
  emit();
  if (after > before) {
    try { window.dispatchEvent(new CustomEvent('level-up', { detail: { level: after } })); } catch {}
  }
};

export const addPoints = (amount: number) => {
  if (!amount) return;
  setNum(K.points, getPoints() + amount);
  // Every point gives 50% XP automatically (rounded).
  if (amount > 0) setNum(K.xp, getXP() + Math.ceil(amount * 0.5));
  emit();
};

export const addDinoXP = (amount: number) => {
  if (!amount) return;
  setNum(K.dinoXp, getDinoXP() + amount);
  emit();
};

// Streak: returns current streak after tick. Same semantics as previous HomePage block.
export const tickStreak = (): number => {
  try {
    const today = new Date().toDateString();
    const last = localStorage.getItem(K.lastVisit);
    let s = num(K.streak);
    if (last !== today) {
      if (last) {
        const y = new Date(); y.setDate(y.getDate() - 1);
        s = new Date(last).toDateString() === y.toDateString() ? s + 1 : 1;
      } else s = 1;
      localStorage.setItem(K.lastVisit, today);
      setNum(K.streak, s);
      emit();
    }
    return s;
  } catch { return 0; }
};

// Themes
export const THEME_UNLOCK_LEVELS: Record<string, number> = {
  sakura: 2, ocean: 3, forest: 4, galaxy: 6, gold: 8,
};
export const getUnlockedThemes = (): string[] => {
  try {
    const arr = JSON.parse(localStorage.getItem(K.unlockedThemes) || '["default"]');
    return Array.isArray(arr) ? arr : ['default'];
  } catch { return ['default']; }
};
export const ensureLevelThemes = (): string[] => {
  const lvl = getLevel();
  const set = new Set(getUnlockedThemes());
  let changed = false;
  for (const [id, need] of Object.entries(THEME_UNLOCK_LEVELS)) {
    if (lvl >= need && !set.has(id)) { set.add(id); changed = true; }
  }
  if (changed) {
    try { localStorage.setItem(K.unlockedThemes, JSON.stringify(Array.from(set))); } catch {}
    emit();
  }
  return Array.from(set);
};

import { useEffect, useState } from 'react';
export const useAppStore = () => {
  const [v, setV] = useState(0);
  useEffect(() => {
    const bump = () => setV(x => x + 1);
    window.addEventListener('app-store-updated', bump);
    window.addEventListener('points-updated', bump);
    window.addEventListener('storage', bump);
    return () => {
      window.removeEventListener('app-store-updated', bump);
      window.removeEventListener('points-updated', bump);
      window.removeEventListener('storage', bump);
    };
  }, []);
  const xp = getXP();
  const prog = getLevelProgress(xp);
  return {
    _tick: v,
    points: getPoints(),
    xp,
    level: prog.level,
    levelProgress: prog,
    streak: getStreak(),
    dinoXp: getDinoXP(),
    addPoints, addXP, addDinoXP, tickStreak,
  };
};