// Pure-localStorage gamification store with global event bus.
import { lsGet, lsSet, lsGetJSON, lsSetJSON } from '@/lib/userStorage';

const POINTS_BASE = 'app-points';

export const getPoints = (): number => parseInt(lsGet(POINTS_BASE, '0'), 10) || 0;
export const setPoints = (n: number) => {
  lsSet(POINTS_BASE, String(Math.max(0, n)));
  window.dispatchEvent(new CustomEvent('points-updated'));
};
export const addPoints = (delta: number) => setPoints(getPoints() + delta);
export const spendPoints = (cost: number): boolean => {
  const p = getPoints();
  if (p < cost) return false;
  setPoints(p - cost);
  return true;
};

// ---------- Skills ----------
export type SkillId = 'deepFocus' | 'expertTrader' | 'luckyAura';
export interface SkillsState {
  deepFocus: boolean;
  expertTrader: boolean;
  luckyAura: boolean;
}
const SKILLS_BASE = 'meta-skills';
export const SKILL_COSTS: Record<SkillId, number> = {
  deepFocus: 300,
  expertTrader: 200,
  luckyAura: 400,
};
export const getSkills = (): SkillsState =>
  lsGetJSON<SkillsState>(SKILLS_BASE, { deepFocus: false, expertTrader: false, luckyAura: false });
export const unlockSkill = (id: SkillId): boolean => {
  const s = getSkills();
  if (s[id]) return false;
  if (!spendPoints(SKILL_COSTS[id])) return false;
  s[id] = true;
  lsSetJSON(SKILLS_BASE, s);
  window.dispatchEvent(new CustomEvent('meta-updated'));
  return true;
};

// ---------- Raid Boss ----------
const BOSS_BASE = 'meta-boss';
export const BOSS_MAX_HP = 1000;
export interface BossState { week: string; hp: number; defeated: boolean; }
const weekKey = () => {
  const d = new Date();
  const day = d.getDay(); // 0 = Sunday
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - day);
  sunday.setHours(0, 0, 0, 0);
  return sunday.toISOString().slice(0, 10);
};
export const getBoss = (): BossState => {
  const wk = weekKey();
  const stored = lsGetJSON<BossState | null>(BOSS_BASE, null);
  if (!stored || stored.week !== wk) {
    const fresh = { week: wk, hp: BOSS_MAX_HP, defeated: false };
    lsSetJSON(BOSS_BASE, fresh);
    return fresh;
  }
  return stored;
};
export const damageBoss = (dmg: number): BossState => {
  const b = getBoss();
  if (b.defeated) return b;
  b.hp = Math.max(0, b.hp - dmg);
  if (b.hp === 0 && !b.defeated) {
    b.defeated = true;
    addPoints(500);
    window.dispatchEvent(new CustomEvent('boss-defeated'));
  }
  lsSetJSON(BOSS_BASE, b);
  window.dispatchEvent(new CustomEvent('meta-updated'));
  return b;
};

// ---------- Inventory (Gacha rewards) ----------
const INV_BASE = 'meta-inventory';
export interface Inventory {
  dinoFood: number;
  dinoColors: string[];
  uiBackgrounds: string[];
  crowns: string[];
  rareThemes: string[];
}
export const getInventory = (): Inventory =>
  lsGetJSON<Inventory>(INV_BASE, {
    dinoFood: 0, dinoColors: [], uiBackgrounds: [], crowns: [], rareThemes: [],
  });
export const saveInventory = (inv: Inventory) => {
  lsSetJSON(INV_BASE, inv);
  window.dispatchEvent(new CustomEvent('meta-updated'));
};

// ---------- Daily Quest (Magic Cards) ----------
const QUEST_BASE = 'meta-daily-quest';
export interface DailyQuest { date: string; text: string; reward: number; }
export const getDailyQuest = (): DailyQuest | null => {
  const q = lsGetJSON<DailyQuest | null>(QUEST_BASE, null);
  const today = new Date().toDateString();
  if (q && q.date === today) return q;
  return null;
};
export const setDailyQuest = (text: string, reward: number) => {
  const q = { date: new Date().toDateString(), text, reward };
  lsSetJSON(QUEST_BASE, q);
};
export const hasPickedTodayCard = (): boolean => getDailyQuest() !== null;

// ---------- Title computation ----------
export interface RPGTitle { id: string; label: string; emoji: string; }
export const getUnlockedTitles = (): RPGTitle[] => {
  const titles: RPGTitle[] = [];
  try {
    const focusMins = parseInt(localStorage.getItem('total_focus_minutes') || '0', 10);
    const streak = parseInt(localStorage.getItem('userStreak') || '0', 10);
    const careDays = parseInt(localStorage.getItem('dino_care_days') || '0', 10);
    const waterDays = parseInt(localStorage.getItem('water_logged_days') || '0', 10);
    const points = getPoints();
    if (focusMins > 600) titles.push({ id: 'focus', label: 'سيد التركيز', emoji: '🔮' });
    if (streak > 7) titles.push({ id: 'habit', label: 'مقاتل العادات', emoji: '⚔️' });
    if (careDays + waterDays > 5) titles.push({ id: 'nature', label: 'صديق الطبيعة', emoji: '🌿' });
    if (points >= 2000) titles.push({ id: 'legend', label: 'أسطورة الإنجاز', emoji: '👑' });
  } catch { /* ignore */ }
  if (titles.length === 0) titles.push({ id: 'rookie', label: 'مبتدئ', emoji: '🌱' });
  return titles;
};

// ---------- Hook for re-rendering on meta updates ----------
import { useEffect, useState } from 'react';
export const useMetaTick = () => {
  const [, setT] = useState(0);
  useEffect(() => {
    const bump = () => setT(t => t + 1);
    window.addEventListener('meta-updated', bump);
    window.addEventListener('points-updated', bump);
    window.addEventListener('storage', bump);
    return () => {
      window.removeEventListener('meta-updated', bump);
      window.removeEventListener('points-updated', bump);
      window.removeEventListener('storage', bump);
    };
  }, []);
};