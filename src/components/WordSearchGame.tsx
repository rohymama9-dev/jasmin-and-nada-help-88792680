import { useState, useMemo, useEffect } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import GameInstructions from './GameInstructions';

interface WordSearchGameProps {
  onScore: (pts: number) => void;
  difficulty?: string;
}

const MAX_LEVEL = 15;

// Massive expanded word DB grouped by length
const WORD_DB: Record<number, string[]> = {
  3: ['CAT','DOG','SUN','CAR','BAT','HAT','RAT','MAP','PEN','RED','BIG','OLD','NEW','TOY','ANT','BEE','OWL','FOX','PIG','COW','EGG','ICE','OIL','TEA','EAR','EYE','TOE','LEG','ARM','BOY','GIRL'.slice(0,3)],
  4: ['MOON','STAR','BIRD','FISH','TREE','BLUE','PINK','GOLD','LION','BEAR','DUCK','FROG','CAKE','MILK','BOOK','LAMP','DESK','RAIN','SNOW','WIND','FIRE','SAND','ROCK','LEAF','BIKE','SHIP','BOAT','HERO','CAVE','MOSS','DEEP','WAVE'],
  5: ['APPLE','OCEAN','CLOUD','EARTH','LIGHT','HOUSE','HORSE','TIGER','PANDA','SHEEP','MOUSE','EAGLE','RIVER','BEACH','PLANT','GREEN','BLACK','WHITE','HAPPY','MUSIC','PARTY','DANCE','SMILE','BREAD','GRAPE','LEMON','MANGO','PEACH','PIZZA','MAGIC','NIGHT','LUCKY','BRAVE','SUNNY','SWEET'],
  6: ['FLOWER','GARDEN','ORANGE','PURPLE','SILVER','YELLOW','MONKEY','RABBIT','TURTLE','SPIDER','PLANET','ROCKET','FOREST','CANDLE','BUTTER','COOKIE','SUMMER','WINTER','SPRING','DESERT','ISLAND','CASTLE','BRIDGE','MARKET','MEMORY','FRIEND','FAMILY','HEALTH','SCHOOL','TRAVEL'],
  7: ['DOLPHIN','PENGUIN','GIRAFFE','RAINBOW','SUNRISE','SUNSET','HOLIDAY','LIBRARY','HARMONY','PROJECT','JOURNEY','ROMANCE','MUSEUM'.padEnd(7,'S'),'CAPTAIN','MORNING','NETWORK','PROGRAM','VICTORY','THUNDER','MAGICAL','PERFECT','FREEDOM'],
};

function pickWords(level: number): string[] {
  // Determine word lengths and counts based on level
  const buckets: number[] =
    level <= 3 ? [3, 3, 4]
    : level <= 6 ? [3, 4, 4, 5]
    : level <= 9 ? [4, 5, 5, 6]
    : level <= 12 ? [4, 5, 6, 6, 7]
    : [5, 6, 6, 7, 7];
  const used = new Set<string>();
  const out: string[] = [];
  for (const len of buckets) {
    const pool = (WORD_DB[len] || WORD_DB[5]).filter(w => !used.has(w) && w.length === len);
    if (!pool.length) continue;
    const w = pool[Math.floor(Math.random() * pool.length)];
    used.add(w);
    out.push(w);
  }
  return out;
}

function gridSizeForLevel(level: number) {
  return Math.min(8 + Math.floor((level - 1) / 2), 14);
}

interface Placement { word: string; cells: [number, number][] }

function generateGrid(words: string[], size: number): { grid: string[][]; placements: Placement[] } {
  const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(''));
  const placements: Placement[] = [];
  const dirs: [number, number][] = [[0, 1], [1, 0], [1, 1], [-1, 1]];

  for (const word of words) {
    let placed = false;
    for (let attempt = 0; attempt < 200 && !placed; attempt++) {
      const [dy, dx] = dirs[Math.floor(Math.random() * dirs.length)];
      const minR = dy === -1 ? word.length - 1 : 0;
      const maxR = dy === 1 ? size - word.length : size - 1;
      const minC = 0;
      const maxC = dx === 1 ? size - word.length : size - 1;
      const r = minR + Math.floor(Math.random() * Math.max(1, maxR - minR + 1));
      const c = minC + Math.floor(Math.random() * Math.max(1, maxC - minC + 1));
      let fits = true;
      const cells: [number, number][] = [];
      for (let i = 0; i < word.length; i++) {
        const nr = r + i * dy, nc = c + i * dx;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) { fits = false; break; }
        if (grid[nr][nc] !== '' && grid[nr][nc] !== word[i]) { fits = false; break; }
        cells.push([nr, nc]);
      }
      if (fits) {
        cells.forEach(([cr, cc], i) => { grid[cr][cc] = word[i]; });
        placements.push({ word, cells });
        placed = true;
      }
    }
  }
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (!grid[r][c]) grid[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return { grid, placements };
}

const WordSearchGame = ({ onScore }: WordSearchGameProps) => {
  const { lang } = useLang();
  const [level, setLevel] = useState(1);
  const [seed, setSeed] = useState(0);

  const size = gridSizeForLevel(level);
  const words = useMemo(() => pickWords(level), [level, seed]);
  const { grid, placements } = useMemo(() => generateGrid(words, size), [words, size]);

  const [found, setFound] = useState<string[]>([]);
  const [selected, setSelected] = useState<[number, number][]>([]);

  // Reset state per new puzzle
  useEffect(() => { setFound([]); setSelected([]); }, [grid]);

  const foundCells = new Set(
    placements.filter(p => found.includes(p.word)).flatMap(p => p.cells.map(([r, c]) => `${r}-${c}`))
  );

  const allFound = placements.length > 0 && found.length === placements.length;

  // Award & advance
  useEffect(() => {
    if (allFound) onScore(level * 2 + words.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allFound]);

  const toggleCell = (r: number, c: number) => {
    if (allFound) return;
    const exists = selected.find(s => s[0] === r && s[1] === c);
    const next: [number, number][] = exists
      ? selected.filter(s => !(s[0] === r && s[1] === c))
      : [...selected, [r, c]];
    setSelected(next);

    const fwd = next.map(([sr, sc]) => grid[sr][sc]).join('');
    const rev = fwd.split('').reverse().join('');
    for (const p of placements) {
      if (!found.includes(p.word) && (fwd === p.word || rev === p.word) && next.length === p.word.length) {
        setFound(f => [...f, p.word]);
        setSelected([]);
        break;
      }
    }
  };

  const nextLevel = () => {
    if (level < MAX_LEVEL) setLevel(l => l + 1);
    else setSeed(s => s + 1);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-foreground">
          🔍 {lang === 'ar' ? 'البحث عن الكلمات' : 'Word Search'} — {lang === 'ar' ? 'مستوى' : 'Lv'} {level}/{MAX_LEVEL}
        </span>
        <GameInstructions titleAr="كيف تلعب البحث" titleEn="How to Play Word Search"
          stepsAr={['اضغط على الحروف لتكوين الكلمة','الكلمات مخفية أفقياً وعمودياً وقطرياً','جد كل الكلمات لتنتقل للمستوى التالي']}
          stepsEn={['Tap letters to form a word','Words hide horizontally, vertically & diagonally','Find them all to advance']} />
      </div>

      <div className="flex flex-wrap gap-2 mb-1">
        {words.map(w => (
          <span key={w} className={`px-2 py-1 rounded-lg text-xs font-bold ${found.includes(w) ? 'bg-success/20 text-success line-through' : 'bg-secondary text-foreground'}`}>{w}</span>
        ))}
      </div>

      <div className="flex justify-center">
        <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
          {grid.map((row, r) => row.map((cell, c) => {
            const isSel = selected.some(s => s[0] === r && s[1] === c);
            const isFound = foundCells.has(`${r}-${c}`);
            const cellSize = size > 11 ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
            return (
              <button key={`${r}-${c}`} onClick={() => toggleCell(r, c)}
                className={`${cellSize} rounded-md font-bold transition-all active:scale-90 ${
                  isFound ? 'bg-success/20 text-success' : isSel ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-foreground hover:bg-secondary'
                }`}>{cell}</button>
            );
          }))}
        </div>
      </div>

      {selected.length > 0 && !allFound && (
        <div className="text-center">
          <button onClick={() => setSelected([])} className="text-xs text-primary">{lang === 'ar' ? 'مسح التحديد' : 'Clear'}</button>
        </div>
      )}

      {allFound && (
        <div className="text-center p-3 rounded-xl bg-success/10 animate-bounce-in space-y-2">
          <p className="font-bold text-success">🎉 {lang === 'ar' ? 'وجدت كل الكلمات!' : 'Found all words!'}</p>
          <button onClick={nextLevel} className="px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold">
            {level < MAX_LEVEL
              ? (lang === 'ar' ? `المستوى التالي ▶` : `Next Level ▶`)
              : (lang === 'ar' ? 'لعبة جديدة 🔄' : 'New Puzzle 🔄')}
          </button>
        </div>
      )}
    </div>
  );
};

export default WordSearchGame;
