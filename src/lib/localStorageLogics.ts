export const getLocalDateKey = (input: Date | string | number = new Date()) => {
  const date = new Date(input);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const getWeekStartKey = (input: Date | string | number = new Date()) => {
  const date = new Date(input);
  const start = new Date(date);
  const day = start.getDay();
  const diff = (day + 6) % 7;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - diff);
  return getLocalDateKey(start);
};

const isSameWeek = (value: Date | string | number, reference: Date | string | number = new Date()) =>
  getWeekStartKey(value) === getWeekStartKey(reference);

export const pruneWeeklyArray = <T,>(
  items: T[],
  getDate: (item: T) => Date | string | number | null | undefined,
  reference: Date | string | number = new Date(),
) =>
  items.filter((item) => {
    const value = getDate(item);
    if (!value) return false;
    try {
      return isSameWeek(value, reference);
    } catch {
      return false;
    }
  });

export const pruneWeeklyObject = <T,>(
  record: Record<string, T>,
  reference: Date | string | number = new Date(),
) => {
  const next: Record<string, T> = {};
  for (const [key, value] of Object.entries(record)) {
    if (isSameWeek(key, reference)) {
      next[key] = value;
    }
  }
  return next;
};

export const readWeeklyArray = <T,>(
  key: string,
  getDate: (item: T) => Date | string | number | null | undefined,
) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return pruneWeeklyArray(Array.isArray(parsed) ? parsed : [], getDate);
  } catch {
    return [] as T[];
  }
};

export const readWeeklyObject = <T,>(key: string) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {} as Record<string, T>;
    }
    return pruneWeeklyObject(parsed as Record<string, T>);
  } catch {
    return {} as Record<string, T>;
  }
};
