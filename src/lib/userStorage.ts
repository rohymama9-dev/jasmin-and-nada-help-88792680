// Name-scoped local storage so each "saved name" keeps its own progress,
// points, news-read state, lesson completions, etc. Returning users who
// re-enter the same name restore everything; a new name starts fresh.

import { getGuestName } from '@/components/OnboardingScreen';

const slug = (s: string) =>
  s.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\p{L}\p{N}_-]+/gu, '') || 'guest';

export const userKey = (base: string, name?: string) => {
  const n = (name ?? getGuestName()) || 'guest';
  return `${base}::${slug(n)}`;
};

export const lsGet = (base: string, fallback = ''): string => {
  if (typeof window === 'undefined') return fallback;
  return localStorage.getItem(userKey(base)) ?? fallback;
};

export const lsSet = (base: string, value: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(userKey(base), value);
};

export const lsGetJSON = <T,>(base: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const v = localStorage.getItem(userKey(base));
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const lsSetJSON = (base: string, value: unknown) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(userKey(base), JSON.stringify(value));
};
