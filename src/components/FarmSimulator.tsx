import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { lsGetJSON, lsSetJSON } from '@/lib/userStorage';

interface Props { onScore?: (n: number) => void; gender?: 'female' | 'male'; }

/**
 * Open-world farm simulator (pixel-art top-down).
 *
 * The world is a grid of tiles. The player walks freely with the on-screen
 * D-pad and presses ACTION on a tile to interact:
 *  - empty owned plot → plant the selected seed
 *  - growing crop → wait
 *  - ripe crop → harvest into inventory
 *  - flower bed → plant a flower (bees turn flowers into honey over time)
 *  - hive → collect honey
 *  - barn animals → collect eggs / milk / wool
 *  - egg incubator → hatch a random animal once you own an egg
 *  - market → open shop (buy seeds / eggs / land / sell everything)
 *
 * State persists to localStorage. All tiles are visible on a single map
 * with several zones the player walks between.
 */

// ───────── Catalog ─────────

const WORLD_ASSETS = {
  home: {
    seeds: [
      { id: 'crop', emoji: '🌾', growMs: 30000, sellPrice: 2, seedCost: 1, nameAr: 'محصول', nameEn: 'Crop' },
    ],
    flowers: [
      { id: 'honey_flower', emoji: '🌸', nameAr: 'زهرة العسل', nameEn: 'Honey Flower' },
    ],
    animals: [
      { id: 'chicken', emoji: '🐔', productEmoji: '🥚', productMs: 120000, productPrice: 30, nameAr: 'دجاجة', nameEn: 'Chicken' },
      { id: 'sheep',   emoji: '🐑', productEmoji: '🧶', productMs: 120000, productPrice: 40, nameAr: 'خروف', nameEn: 'Sheep' },
      { id: 'cow',     emoji: '🐄', productEmoji: '🥛', productMs: 120000, productPrice: 50, nameAr: 'بقرة',  nameEn: 'Cow' },
    ],
    trees: [
      { id: 'apple', emoji: '🌳', productEmoji: '🍎', productMs: 120000, productPrice: 15, nameAr: 'شجرة تفاح', nameEn: 'Apple Tree' },
      { id: 'orange', emoji: '🌳', productEmoji: '🍊', productMs: 120000, productPrice: 15, nameAr: 'شجرة برتقال', nameEn: 'Orange Tree' },
    ],
    eggCost: 50,
    honeyYield: 5,
  },
  premium: {
    seeds: [
      { id: 'magic_bean', emoji: '🫘', growMs: 45000, sellPrice: 5, seedCost: 3, nameAr: 'فاصوليا سحرية', nameEn: 'Magic Bean' },
      { id: 'strawberry', emoji: '🍓', growMs: 60000, sellPrice: 5, seedCost: 3, nameAr: 'فراولة', nameEn: 'Strawberry' },
    ],
    flowers: [
      { id: 'lotus', emoji: '🪷', nameAr: 'لوتس', nameEn: 'Lotus' },
      { id: 'sunflower', emoji: '🌻', nameAr: 'دوار الشمس', nameEn: 'Sunflower' },
    ],
    animals: [
      { id: 'unicorn', emoji: '🦄', productEmoji: '✨', productMs: 180000, productPrice: 150, nameAr: 'يونيكورن', nameEn: 'Unicorn' },
      { id: 'dragon',  emoji: '🐲', productEmoji: '🔥', productMs: 240000, productPrice: 200, nameAr: 'تنين', nameEn: 'Dragon' },
      { id: 'peacock', emoji: '🦚', productEmoji: '🪶', productMs: 150000, productPrice: 100, nameAr: 'طاووس', nameEn: 'Peacock' },
    ],
    trees: [
      { id: 'golden_apple', emoji: '🌳', productEmoji: '🌕', productMs: 180000, productPrice: 60, nameAr: 'شجرة ذهبية', nameEn: 'Golden Tree' },
      { id: 'crystal_tree', emoji: '🌳', productEmoji: '💎', productMs: 300000, productPrice: 120, nameAr: 'شجرة الكريستال', nameEn: 'Crystal Tree' },
    ],
    eggCost: 100,
    honeyYield: 7,
  },
  forest: {
    seeds: [
      { id: 'mushroom', emoji: '🍄', growMs: 20000, sellPrice: 8, seedCost: 5, nameAr: 'فطر', nameEn: 'Mushroom' },
      { id: 'berry',    emoji: '🫐', growMs: 40000, sellPrice: 8, seedCost: 5, nameAr: 'توت', nameEn: 'Berry' },
    ],
    flowers: [
      { id: 'bluebell', emoji: '🪻', nameAr: 'جرس أزرق', nameEn: 'Bluebell' },
    ],
    animals: [
      { id: 'fox',     emoji: '🦊', productEmoji: '🍂', productMs: 120000, productPrice: 40, nameAr: 'ثعلب', nameEn: 'Fox' },
      { id: 'bear',    emoji: '🐻', productEmoji: '🍯', productMs: 300000, productPrice: 100, nameAr: 'دب', nameEn: 'Bear' },
    ],
    trees: [
      { id: 'pine',   emoji: '🌲', productEmoji: '🌲', productMs: 120000, productPrice: 10, nameAr: 'صنوبر', nameEn: 'Pine' },
      { id: 'cherry', emoji: '🌳', productEmoji: '🍒', productMs: 180000, productPrice: 20, nameAr: 'كرز', nameEn: 'Cherry' },
    ],
    eggCost: 200,
    honeyYield: 10,
  }
};

const getSeeds = (w: World) => WORLD_ASSETS[w]?.seeds || [];
const getFlowers = (w: World) => WORLD_ASSETS[w]?.flowers || [];
type Seed = ReturnType<typeof getSeeds>[number];
type Flower = ReturnType<typeof getFlowers>[number];
const getAnimals = (w: World) => WORLD_ASSETS[w]?.animals || [];
const getTrees = (w: World) => WORLD_ASSETS[w]?.trees || [];

const FLOWER_COST = 5;
const FLOWER_BLOOM_MS = 120000; // 2 minutes
const HONEY_PRODUCE_MS = 120000; // 2 minutes
const TRAVEL_COST = 200; // coins needed to unlock a new world
// Honey yield per collection depends on world
const getHoneyYield = (w: World) => (WORLD_ASSETS[w] as any).honeyYield ?? 5;
const getEggCost   = (w: World) => (WORLD_ASSETS[w] as any).eggCost   ?? 60;
// Shared-wallet storage key (coins are global across all worlds)
const SHARED_COINS_KEY = 'farm-sim-shared-coins-v1';

interface Animal {
  id: string; emoji: string; productEmoji: string; productMs: number;
  productPrice: number; nameAr: string; nameEn: string;
}

interface Tree {
  id: string; emoji: string; productEmoji: string; productMs: number;
  productPrice: number; nameAr: string; nameEn: string;
}

const EGG_COST = 60; // kept for type-compat; runtime uses getEggCost(world)

// ───────── Map ─────────
//
// Tile codes:
//   .  grass (walkable, decorative)
//   ~  water/river (blocked, decorative)
//   T  tree   (blocked)
//   F  fence  (blocked)
//   P  plot   (interactive — plant/harvest)
//   B  flower bed (interactive — plant flower)
//   H  beehive   (interactive — collect honey)
//   N  barn pen  (interactive — collect from animals; player buys eggs to put here)
//   E  egg incubator (interactive — hatch egg into a random animal)
//   M  market (interactive — open shop)

const COLS = 13;
const ROWS = 11;

type TileCode = '.' | '~' | 'T' | 'F' | 'P' | 'B' | 'H' | 'N' | 'E' | 'M';

const RAW_MAP: string[] = [
  // 0123456789012
  'TT.........TT', // 0
  'T.....M.....T', // 1
  'T.PPP...BBB.T', // 2
  'T.PPP...BBB.T', // 3
  'T.PPP...BB H.', // 4
  'T...........T', // 5
  'T.NNN...EEE.T', // 6
  'T.NNN...EEE.T', // 7
  'T...........T', // 8
  '~~~~~~.~~~~~~', // 9 — bridge to premium zone
  '..PPPPPPPPP..', // 10 — Premium Field (locked, costlier plots)
];

// Sanitize: keep only known codes, default to '.'
const MAP: TileCode[][] = RAW_MAP.map(row =>
  row.padEnd(COLS, '.').slice(0, COLS).split('').map(ch => {
    const valid: Record<string, TileCode> = {
      '.': '.', '~': '~', 'T': 'T', 'F': 'F', 'P': 'P',
      'B': 'B', 'H': 'H', 'N': 'N', 'E': 'E', 'M': 'M',
    };
    return valid[ch] ?? '.';
  })
);

const isBlocked = (t: TileCode) => t === '~' || t === 'F'; // Trees (T) are no longer blocked to allow fruit collection
const isInteractive = (t: TileCode) =>
  t === 'P' || t === 'B' || t === 'H' || t === 'N' || t === 'E' || t === 'M' || t === 'T';

// ───────── Save state ─────────

interface PlotState { kind: string; plantedAt: number | null; }
interface FlowerState { kind: string; plantedAt: number | null; }
interface BarnState { animal: string | null; lastCollectedAt: number; }
interface TreeState { treeId: string; lastHarvestedAt: number; }

interface SaveState {
  v: number;
  coins: number;
  inventory: Record<string, number>;     // crop counts (seed id → n)
  flowers: number;                        // flowers in inventory not used
  honey: number;                          // honey in inventory ready to sell
  eggs: number;                           // unhatched eggs in inventory
  selectedSeed: string;
  selectedFlower: string;
  ownedPlots: Record<string, true>;       // "r,c" → true (crop plots the player has unlocked)
  plotStates: Record<string, PlotState>;
  flowerStates: Record<string, FlowerState>;
  barns: Record<string, BarnState>;
  treeStates: Record<string, TreeState>;
  hiveLastAt: number;
  px: number; py: number; facing: 'up'|'down'|'left'|'right';
}

type World = 'home' | 'premium' | 'forest';
const WORLD_ORDER: World[] = ['home', 'premium', 'forest'];
const STORAGE_KEY_FOR = (w: World) =>
  w === 'premium' ? 'farm-sim-premium-v2'
  : w === 'forest' ? 'farm-sim-forest-v2'
  : 'farm-sim-open-v2';
const WORLD_KEY = 'farm-sim-active-world';
const WORLD_LABEL: Record<World, { ar: string; en: string; emoji: string }> = {
  home:    { ar: 'مزرعتي',         en: 'My Open Farm',    emoji: '🌾' },
  premium: { ar: 'العالم المميّز',  en: 'Premium World',   emoji: '👑' },
  forest:  { ar: 'عالم الغابة',    en: 'Forest World',    emoji: '🌲' },
};

const defaultState = (): SaveState => {
  // Player owns the first row of the field by default (top-left 3 plots)
  const ownedPlots: Record<string, true> = {};
  ownedPlots['2,2'] = true; ownedPlots['2,3'] = true; ownedPlots['2,4'] = true;
  return {
    v: 2,
    coins: 30,
    inventory: {},
    flowers: 0,
    honey: 0,
    eggs: 0,
    selectedSeed: WORLD_ASSETS.home.seeds[0].id,
    selectedFlower: WORLD_ASSETS.home.flowers[0].id,
    ownedPlots,
    plotStates: {},
    flowerStates: {},
    barns: {},
    treeStates: {},
    hiveLastAt: Date.now(),
    px: 6, py: 5, facing: 'down',
  };
};

const PLOT_BUY_COST = 25;
// Premium zone (row 10) plots cost more but unlock additional farming area.
const PREMIUM_PLOT_BUY_COST = 100;
const plotCostFor = (y: number) => (y >= 10 ? PREMIUM_PLOT_BUY_COST : PLOT_BUY_COST);

// ───────── Component ─────────

const FarmSimulator = ({ onScore, gender = 'female' }: Props) => {
  const { lang } = useLang();

  const [world, setWorld] = useState<World>(() => (lsGetJSON<World>(WORLD_KEY, 'home') as World) || 'home');

  const [state, setState] = useState<SaveState>(() => {
    const loaded = lsGetJSON<SaveState>(STORAGE_KEY_FOR(world), defaultState());
    if (!loaded || (loaded as Partial<SaveState>).v !== 2) return defaultState();
    if (!loaded.treeStates) loaded.treeStates = {};
    return loaded;
  });

  // Travel cycles between Home → Premium → Forest → Home.
  // Costs 200 coins for first visit to a new world. Coins are SHARED across all worlds.
  const travel = useCallback(() => {
    const idx = WORLD_ORDER.indexOf(world);
    const next: World = WORLD_ORDER[(idx + 1) % WORLD_ORDER.length];

    // Check if destination world has been visited before
    const nextSaved = lsGetJSON<SaveState | null>(STORAGE_KEY_FOR(next), null);
    const isNewWorld = !nextSaved || (nextSaved as Partial<SaveState>).v !== 2;

    // Enforce travel cost for new worlds
    if (isNewWorld && state.coins < TRAVEL_COST) {
      flash(lang === 'ar' ? `تحتاجين 🪙 ${TRAVEL_COST} لفتح هذا العالم` : `Need 🪙 ${TRAVEL_COST} to unlock this world`);
      return;
    }

    // Persist current world state (with latest coins)
    const currentCoins = state.coins - (isNewWorld ? TRAVEL_COST : 0);
    lsSetJSON(STORAGE_KEY_FOR(world), { ...state, coins: currentCoins });
    lsSetJSON(WORLD_KEY, next);
    // Save shared coins
    lsSetJSON(SHARED_COINS_KEY, currentCoins);

    let loaded: SaveState;
    if (!isNewWorld) {
      loaded = nextSaved as SaveState;
      if (!loaded.treeStates) loaded.treeStates = {};
      // Always sync shared coins
      loaded = { ...loaded, coins: currentCoins };
    } else {
      // First visit: create fresh state, inherit coins after travel cost
      const baseState = next === 'premium'
        ? { ...defaultState(), selectedSeed: WORLD_ASSETS.premium.seeds[0].id, selectedFlower: WORLD_ASSETS.premium.flowers[0].id }
        : next === 'forest'
          ? { ...defaultState(), selectedSeed: WORLD_ASSETS.forest.seeds[0].id, selectedFlower: WORLD_ASSETS.forest.flowers[0].id }
          : defaultState();
      loaded = { ...baseState, coins: currentCoins };
    }
    setWorld(next);
    setState(loaded);
  }, [world, state, lang, flash]);

  const [shopOpen, setShopOpen] = useState<null | 'main' | 'seeds' | 'flowers' | 'eggs'>(null);
  const [toastMsg, setToastMsg] = useState<string>('');
  const toastTimer = useRef<number | null>(null);
  const [, force] = useState(0);
  const [walkFrame, setWalkFrame] = useState(0);
  const lastMoveAt = useRef<number>(0);
  useEffect(() => {
    const id = window.setInterval(() => {
      if (Date.now() - lastMoveAt.current < 500) setWalkFrame(f => (f + 1) % 2);
    }, 220);
    return () => clearInterval(id);
  }, []);

  // Persist active world's save whenever state changes.
  useEffect(() => { lsSetJSON(STORAGE_KEY_FOR(world), state); }, [world, state]);

  // Tick for plant growth + honey production
  useEffect(() => {
    const id = window.setInterval(() => force(t => (t + 1) % 1e6), 600);
    return () => clearInterval(id);
  }, []);

  // Honey production: hive produces 1 unit every HONEY_PRODUCE_MS (2 min),
  // flowers just need to be present & bloomed to enable production.
  // 1 unit = getHoneyYield(world) coins (5 / 7 / 10).
  useEffect(() => {
    const blooms = Object.values(state.flowerStates).filter(f => f.plantedAt && Date.now() - f.plantedAt >= FLOWER_BLOOM_MS).length;
    if (blooms <= 0) return;
    const elapsed = Date.now() - state.hiveLastAt;
    const cycles = Math.floor(elapsed / HONEY_PRODUCE_MS);
    // 1 honey per cycle regardless of flower count
    const produced = cycles;
    if (produced > 0) {
      setState(s => ({ ...s, honey: s.honey + produced, hiveLastAt: s.hiveLastAt + cycles * HONEY_PRODUCE_MS }));
    }
  }, [state.flowerStates, state.hiveLastAt]);

  const flash = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMsg(''), 1600);
  }, []);

  // ───────── "Ready" toasts: notify exactly once when crops/honey/animal products become collectable.
  const notifiedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const now = Date.now();
    const next = notifiedRef.current;
    // Crops
    Object.entries(state.plotStates).forEach(([k, ps]) => {
      if (!ps.kind || !ps.plantedAt) return;
      const seed = getSeeds(world).find(s => s.id === ps.kind);
      if (!seed) return;
      const tag = `crop:${k}:${ps.plantedAt}`;
      if (now - ps.plantedAt >= seed.growMs && !next.has(tag)) {
        next.add(tag);
        flash(`${seed.emoji} ${lang === 'ar' ? 'جاهز للحصاد!' : 'ready to harvest!'}`);
      }
    });
    // Honey (any honey waiting at hive)
    if (state.honey > 0) {
      const tag = `honey:${state.honey}`;
      if (!next.has(tag)) { next.add(tag); flash(`🍯 ${lang === 'ar' ? 'العسل جاهز!' : 'Honey ready!'}`); }
    }
    // Animal products
    Object.entries(state.barns).forEach(([k, b]) => {
      if (!b.animal) return;
      const a = getAnimals(world).find(x => x.id === b.animal);
      if (!a) return;
      const tag = `barn:${k}:${b.lastCollectedAt}`;
      if (now - b.lastCollectedAt >= a.productMs && !next.has(tag)) {
        next.add(tag);
        flash(`${a.productEmoji} ${lang === 'ar' ? 'جاهز للجمع!' : 'ready!'}`);
      }
    });
  }, [state.plotStates, state.honey, state.barns, lang, flash, world]);

  // ───────── Movement ─────────
  const tryMove = (dx: number, dy: number, facing: SaveState['facing']) => {
    setState(s => {
      const nx = s.px + dx, ny = s.py + dy;
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) return { ...s, facing };
      if (isBlocked(MAP[ny][nx])) return { ...s, facing };
      lastMoveAt.current = Date.now();
      return { ...s, px: nx, py: ny, facing };
    });
  };

  // ───────── Keyboard controls (WASD/Arrows + Space) ─────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (shopOpen) return;
      const tgt = e.target as HTMLElement | null;
      if (tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA' || tgt.isContentEditable)) return;
      const k = e.key;
      if (k === 'ArrowUp' || k === 'w' || k === 'W') { e.preventDefault(); tryMove(0, -1, 'up'); }
      else if (k === 'ArrowDown' || k === 's' || k === 'S') { e.preventDefault(); tryMove(0, 1, 'down'); }
      else if (k === 'ArrowLeft' || k === 'a' || k === 'A') { e.preventDefault(); tryMove(-1, 0, 'left'); }
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') { e.preventDefault(); tryMove(1, 0, 'right'); }
      else if (k === ' ' || k === 'Enter') { e.preventDefault(); interact(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopOpen, state]);

  // Tile in front of player (the tile the action button targets).
  const targetTile = useMemo(() => {
    const dx = state.facing === 'left' ? -1 : state.facing === 'right' ? 1 : 0;
    const dy = state.facing === 'up' ? -1 : state.facing === 'down' ? 1 : 0;
    const tx = state.px + dx, ty = state.py + dy;
    if (tx < 0 || tx >= COLS || ty < 0 || ty >= ROWS) return null;
    return { x: tx, y: ty, code: MAP[ty][tx] };
  }, [state.px, state.py, state.facing]);

  // Also allow acting on the tile the player stands on — useful on small map.
  const standingCode = MAP[state.py][state.px];

  const seedFor = (id: string) => getSeeds(world).find(s => s.id === id) ?? getSeeds(world)[0];
  const flowerFor = (id: string) => getFlowers(world).find(f => f.id === id) ?? getFlowers(world)[0];
  const animalFor = (id: string | undefined | null) => getAnimals(world).find(a => a.id === id);
  const treeFor = (id: string | undefined | null) => getTrees(world).find(t => t.id === id);

  // ───────── Interact ─────────
  const interact = () => {
    if (shopOpen) return;
    // STRICT: only act on the tile the player is currently standing on.
    if (!isInteractive(standingCode)) { flash(lang === 'ar' ? 'قف على البلاطة المطلوبة' : 'Stand on the target tile'); return; }
    const x = state.px, y = state.py, code = standingCode;
    const key = `${y},${x}`;

    if (code === 'M') { setShopOpen('main'); return; }

    if (code === 'P') {
      if (!state.ownedPlots[key]) {
        // Buy this plot — premium zone tiles cost more.
        const cost = plotCostFor(y);
        if (state.coins < cost) { flash(lang === 'ar' ? `تحتاج 🪙 ${cost}` : `Need 🪙 ${cost}`); return; }
        setState(s => ({ ...s, coins: s.coins - cost, ownedPlots: { ...s.ownedPlots, [key]: true } }));
        flash(lang === 'ar' ? '🌱 تم شراء قطعة الأرض' : '🌱 Plot purchased');
        onScore?.(1);
        return;
      }
      const ps = state.plotStates[key];
      if (!ps || !ps.kind) {
        const seed = seedFor(state.selectedSeed);
        if (state.coins < seed.seedCost) { flash(lang === 'ar' ? 'لا توجد عملات' : 'Not enough coins'); return; }
        setState(s => ({
          ...s,
          coins: s.coins - seed.seedCost,
          plotStates: { ...s.plotStates, [key]: { kind: seed.id, plantedAt: Date.now() } },
        }));
        flash(`${seed.emoji} ${lang === 'ar' ? 'تم الزرع' : 'Planted'}`);
        return;
      }
      const seed = seedFor(ps.kind);
      const ready = ps.plantedAt && Date.now() - ps.plantedAt >= seed.growMs;
      if (ready) {
        setState(s => {
          const np = { ...s.plotStates }; np[key] = { kind: '', plantedAt: null };
          return {
            ...s,
            plotStates: np,
            // Per spec: harvested crops sell for the seed's sellPrice (cheap by
            // default — 2c base) to keep the economy balanced. Premium zone
            // crops earn a small +1 bonus per harvest.
            coins: s.coins + seed.sellPrice + (y >= 10 ? 1 : 0),
          };
        });
        flash(`${seed.emoji} +🪙 ${seed.sellPrice + (y >= 10 ? 1 : 0)}`);
        onScore?.(2);
      } else {
        flash(lang === 'ar' ? '⏳ ما زال ينمو' : '⏳ Still growing');
      }
      return;
    }

    if (code === 'B') {
      const fs = state.flowerStates[key];
      if (!fs || !fs.kind) {
        if (state.coins < FLOWER_COST) { flash(lang === 'ar' ? 'لا توجد عملات' : 'Not enough coins'); return; }
        setState(s => ({
          ...s,
          coins: s.coins - FLOWER_COST,
          flowerStates: { ...s.flowerStates, [key]: { kind: state.selectedFlower, plantedAt: Date.now() } },
        }));
        flash(lang === 'ar' ? '🌷 زرعتِ زهرة' : '🌷 Flower planted');
        return;
      }
      const flower = flowerFor(fs.kind);
      const blooming = fs.plantedAt && Date.now() - fs.plantedAt >= FLOWER_BLOOM_MS;
      flash(blooming
        ? `${flower.emoji} ${lang === 'ar' ? 'تتغذى منها النحلة 🐝' : 'Bees love it 🐝'}`
        : `${flower.emoji} ${lang === 'ar' ? 'تنمو...' : 'Growing...'}`);
      return;
    }

    if (code === 'H') {
      if (state.honey <= 0) { flash(lang === 'ar' ? '🍯 لا يوجد عسل بعد — ازرعي زهور!' : '🍯 No honey yet — plant flowers!'); return; }
      const got = state.honey;
      const priceEach = getHoneyYield(world); // 5/7/10 per world
      const earned = got * priceEach;
      setState(s => {
        const clearedFlowers: Record<string, FlowerState> = {};
        Object.entries(s.flowerStates).forEach(([k, fs]) => {
          if (!(fs.plantedAt && Date.now() - fs.plantedAt >= FLOWER_BLOOM_MS)) {
            clearedFlowers[k] = fs;
          } else {
            clearedFlowers[k] = { kind: '', plantedAt: null };
          }
        });
        return { ...s, honey: 0, coins: s.coins + earned, flowerStates: clearedFlowers, hiveLastAt: Date.now() };
      });
      flash(`🍯 +${got} → 🪙 ${earned} (${priceEach} لكل عسل)`);
      onScore?.(Math.min(4, got));
      return;
    }

    if (code === 'N') {
      const barn = state.barns[key];
      if (!barn || !barn.animal) {
        if (state.eggs <= 0) {
          flash(lang === 'ar' ? '🥚 اشتري بيضة من المتجر ثم استخدمي حاضنة البيض' : '🥚 Buy an egg at the market, then use the incubator');
          return;
        }
        flash(lang === 'ar' ? '➡ اذهبي لحاضنة البيض لفقس بيضتك' : '➡ Visit the egg incubator to hatch your egg');
        return;
      }
      const animal = animalFor(barn.animal);
      if (!animal) { flash(lang === 'ar' ? '🐾 حيوان غير معروف' : '🐾 Unknown animal'); return; }
      const ready = Date.now() - barn.lastCollectedAt >= animal.productMs;
      if (!ready) {
        flash(`${animal.emoji} ${lang === 'ar' ? 'يستريح...' : 'resting...'}`);
        return;
      }
      setState(s => ({
        ...s,
        coins: s.coins + animal.productPrice,
        barns: { ...s.barns, [key]: { animal: barn.animal, lastCollectedAt: Date.now() } },
      }));
      flash(`${animal.productEmoji} +🪙 ${animal.productPrice}`);
      onScore?.(1);
      return;
    }

    if (code === 'E') {
      // Hatch one egg into a random animal in the nearest empty barn pen.
      if (state.eggs <= 0) { flash(lang === 'ar' ? '🥚 لا توجد بيض' : '🥚 No eggs'); return; }
      const emptyBarn = findEmptyBarn(state.barns);
      if (!emptyBarn) { flash(lang === 'ar' ? '🏚 الحظائر ممتلئة' : '🏚 All barns full'); return; }
      const worldAnimals = getAnimals(world);
      const animal = worldAnimals[Math.floor(Math.random() * worldAnimals.length)];
      setState(s => ({
        ...s,
        eggs: s.eggs - 1,
        barns: { ...s.barns, [emptyBarn]: { animal: animal.id, lastCollectedAt: Date.now() } },
      }));
      flash(`${animal.emoji} ${lang === 'ar' ? 'فقست!' : 'Hatched!'}`);
      onScore?.(2);
      return;
    }

    if (code === 'T') {
      const worldTrees = getTrees(world);
      const tree = state.treeStates[key] || { treeId: worldTrees[Math.floor(Math.random() * worldTrees.length)].id, lastHarvestedAt: 0 };
      const treeData = treeFor(tree.treeId) ?? worldTrees[0];
      const ready = Date.now() - tree.lastHarvestedAt >= treeData.productMs;
      if (!ready) {
        flash(lang === 'ar' ? '⏳ الفاكهة تنمو...' : '⏳ Fruit growing...');
        return;
      }
      setState(s => ({
        ...s,
        coins: s.coins + treeData.productPrice,
        treeStates: { ...s.treeStates, [key]: { treeId: tree.treeId, lastHarvestedAt: Date.now() } },
      }));
      flash(`${treeData.productEmoji} +🪙 ${treeData.productPrice}`);
      onScore?.(1);
      return;
    }
  };

  // Pick the first barn tile that's empty (in MAP order).
  const findEmptyBarn = (barns: Record<string, BarnState>): string | null => {
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      if (MAP[y][x] === 'N') {
        const k = `${y},${x}`;
        if (!barns[k] || !barns[k].animal) return k;
      }
    }
    return null;
  };

  // Sell everything in inventory (crops only — honey is sold at hive,
  // eggs are spent on hatching, animals' products auto-convert to coins).
  const sellAllCrops = () => {
    let total = 0;
    Object.entries(state.inventory).forEach(([id, n]) => { total += seedFor(id).sellPrice * n; });
    if (total === 0) { flash(lang === 'ar' ? 'لا يوجد محصول' : 'Nothing to sell'); return; }
    setState(s => ({ ...s, inventory: {}, coins: s.coins + total }));
    flash(`🪙 +${total}`);
    onScore?.(Math.min(8, Math.floor(total / 25)));
  };

  const buySeed = (s: Seed, qty = 5) => {
    const cost = s.seedCost * qty;
    if (state.coins < cost) { flash(lang === 'ar' ? 'لا توجد عملات' : 'Not enough coins'); return; }
    // Seeds are paid at planting time, so "buying" simply selects this seed
    // for future plantings — keep cost flow simple by not stockpiling.
    setState(prev => ({ ...prev, selectedSeed: s.id }));
    flash(`${s.emoji} ${lang === 'ar' ? 'محدد' : 'selected'}`);
  };

  const buyFlower = (f: Flower) => {
    setState(prev => ({ ...prev, selectedFlower: f.id }));
    flash(`${f.emoji} ${lang === 'ar' ? 'محدد' : 'selected'}`);
  };

  const buyEgg = () => {
    const cost = getEggCost(world);
    if (state.coins < cost) { flash(lang === 'ar' ? 'لا توجد عملات' : 'Not enough coins'); return; }
    setState(s => ({ ...s, coins: s.coins - cost, eggs: s.eggs + 1 }));
    flash(`🥚 +1`);
  };

  // ───────── Render ─────────

  const totalInv = Object.values(state.inventory).reduce((a, b) => a + b, 0);
  const blooms = Object.values(state.flowerStates).filter(f => f.plantedAt && Date.now() - f.plantedAt >= FLOWER_BLOOM_MS).length;

  // Tile rendering helpers
  const tileBg = (t: TileCode): string => {
    switch (t) {
      case '.': return 'bg-lime-300/70';
      case '~': return 'bg-sky-400/70';
      case 'T': return 'bg-emerald-700/80';
      case 'F': return 'bg-amber-800/70';
      case 'P': return 'bg-amber-900/40';
      case 'B': return 'bg-pink-200/70';
      case 'H': return 'bg-yellow-300/80';
      case 'N': return 'bg-orange-300/70';
      case 'E': return 'bg-orange-200/80';
      case 'M': return 'bg-purple-300/80';
    }
  };
  const tileGlyph = (t: TileCode, x: number, y: number): string => {
    if (t === 'T') {
      const k = `${y},${x}`;
      const ts = state.treeStates[k];
      if (!ts) return '🌳';
      const tree = treeFor(ts.treeId);
      if (!tree) return '🌳';
      const ready = Date.now() - ts.lastHarvestedAt >= tree.productMs;
      return ready ? tree.productEmoji : '🌳';
    }
    if (t === '~') return '〰';
    if (t === 'F') return '▦';
    if (t === 'M') return '🏪';
    if (t === 'H') return '🍯';
    if (t === 'E') return '🥚';
    if (t === 'P') {
      const k = `${y},${x}`;
      if (!state.ownedPlots[k]) return '🔒';
      const ps = state.plotStates[k];
      if (!ps || !ps.kind) return '·';
      const seed = seedFor(ps.kind);
      const elapsed = ps.plantedAt ? Date.now() - ps.plantedAt : 0;
      const r = Math.min(1, elapsed / seed.growMs);
      // 4 visible growth stages: seed → sprout → leafy → ready (with sparkle).
      if (r < 0.25) return '·';
      if (r < 0.5)  return '🌱';
      if (r < 0.85) return '🌿';
      return seed.emoji;
    }
    if (t === 'B') {
      const k = `${y},${x}`;
      const fs = state.flowerStates[k];
      if (!fs || !fs.kind) return '·';
      const flower = flowerFor(fs.kind);
      const elapsed = fs.plantedAt ? Date.now() - fs.plantedAt : 0;
      // Visible growth stages for flowers + clear "fully grown" mark.
      const r = Math.min(1, elapsed / FLOWER_BLOOM_MS);
      if (r < 0.34) return '🌱';
      if (r < 0.7)  return '🌿';
      return flower.emoji; // fully grown — sparkle ring drawn in overlay below
    }
    if (t === 'N') {
      const k = `${y},${x}`;
      const b = state.barns[k];
      if (!b || !b.animal) return '·';
      return animalFor(b.animal)?.emoji ?? '·';
    }
    return '';
  };

  // Player visual frame is computed below from the state declared at top.
  // Honors the player's chosen gender from the SimGate wrapper.
  const playerEmoji = (() => {
    const moving = Date.now() - lastMoveAt.current < 500;
    const F = ['👩‍🌾', '🧑‍🌾'];
    const M = ['👨‍🌾', '🧑‍🌾'];
    const set = gender === 'male' ? M : F;
    if (state.facing === 'left' || state.facing === 'right') {
      return moving && walkFrame ? (gender === 'male' ? '🏃' : '🏃‍♀️') : (gender === 'male' ? '🚶' : '🚶‍♀️');
    }
    return moving && walkFrame ? set[1] : set[0];
  })();

  // ───────── Missions ─────────
  // Lightweight mission ladder — uses existing save state, no new persistence.
  const ownedPlotsCount = Object.keys(state.ownedPlots).length;
  const animalsCount = Object.values(state.barns).filter(b => b.animal).length;
  const missions = [
    { id: 'm1', target: 50,  done: state.coins >= 50,  ar: 'اجمعي 50 🪙',          en: 'Earn 50 🪙' },
    { id: 'm2', target: 5,   done: ownedPlotsCount >= 5, ar: 'تملّكي 5 قطع أرض',     en: 'Own 5 plots' },
    { id: 'm3', target: 1,   done: blooms >= 1,        ar: 'ازرعي زهرة متفتحة 🌷',  en: 'Bloom 1 flower 🌷' },
    { id: 'm4', target: 1,   done: animalsCount >= 1,  ar: 'افقسي حيواناً واحداً 🐔', en: 'Hatch 1 animal 🐔' },
    { id: 'm5', target: 200, done: state.coins >= 200, ar: 'اجمعي 200 🪙 (سيد المزرعة)', en: 'Reach 200 🪙 (Farm Boss)' },
  ];
  const currentMission = missions.find(m => !m.done);

  // Header
  const Header = (
    <div className={`rounded-2xl p-3 text-white shadow-lg bg-gradient-to-br ${
      world === 'premium' ? 'from-violet-600 via-fuchsia-600 to-amber-500'
      : world === 'forest' ? 'from-emerald-800 via-green-700 to-teal-600'
      : 'from-emerald-500 to-lime-600'
    }`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-[11px] opacity-90 flex items-center gap-1">
            {WORLD_LABEL[world].emoji} {lang === 'ar' ? WORLD_LABEL[world].ar : WORLD_LABEL[world].en}
          </p>
          <p className="text-2xl font-extrabold leading-none">🪙 {state.coins}</p>
        </div>
        <div className="text-right text-[11px] space-y-0.5">
          <p>📦 {totalInv} · 🍯 {state.honey} · 🥚 {state.eggs}</p>
          <p>🌷 {lang === 'ar' ? 'أزهار متفتحة' : 'blooms'}: {blooms}</p>
          <p>🌱 {seedFor(state.selectedSeed).emoji} · 🌸 {flowerFor(state.selectedFlower).emoji}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={travel}
          className="flex-1 px-3 py-1.5 rounded-xl bg-white/25 hover:bg-white/35 backdrop-blur text-[12px] font-extrabold active:scale-95 transition flex items-center justify-center gap-1"
        >
          {(() => {
            const idx = WORLD_ORDER.indexOf(world);
            const nx = WORLD_ORDER[(idx + 1) % WORLD_ORDER.length];
            const lbl = WORLD_LABEL[nx];
            return `✈️ ${lang === 'ar' ? 'السفر إلى' : 'Travel to'} ${lbl.emoji} ${lang === 'ar' ? lbl.ar : lbl.en}`;
          })()}
        </button>
      </div>
      {currentMission && (
        <div className="mt-2 px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur text-[11px] font-semibold flex items-center justify-between gap-2">
          <span>🎯 {lang === 'ar' ? currentMission.ar : currentMission.en}</span>
          <span>{missions.filter(m => m.done).length}/{missions.length}</span>
        </div>
      )}
      {!currentMission && (
        <div className="mt-2 px-3 py-1.5 rounded-xl bg-yellow-300/90 text-yellow-900 text-[11px] font-extrabold text-center">
          🏆 {lang === 'ar' ? 'أكملتِ كل المهمات!' : 'All missions complete!'}
        </div>
      )}
      {world === 'premium' && (
        <div className="mt-2 px-3 py-1.5 rounded-xl bg-amber-300/90 text-amber-900 text-[11px] font-extrabold text-center">
          ✨ {lang === 'ar' ? 'مكافآت أعلى · بذور وحيوانات نادرة قريباً!' : 'Higher rewards · rare seeds & animals!'}
        </div>
      )}
    </div>
  );

  // Action label hint
  const tileForHint = (targetTile && isInteractive(targetTile.code)) ? targetTile : (isInteractive(standingCode) ? { x: state.px, y: state.py, code: standingCode } : null);
  const actionHint = (() => {
    if (!tileForHint) return lang === 'ar' ? '— تحرّكي على الخريطة —' : '— walk around the map —';
    const k = `${tileForHint.y},${tileForHint.x}`;
    switch (tileForHint.code) {
      case 'M': return lang === 'ar' ? '🏪 افتحي المتجر' : '🏪 Open shop';
      case 'P': {
        if (!state.ownedPlots[k]) {
          const cost = plotCostFor(tileForHint.y);
          return lang === 'ar' ? `🔒 شراء قطعة (🪙 ${cost})` : `🔒 Buy plot (🪙 ${cost})`;
        }
        const ps = state.plotStates[k];
        if (!ps?.kind) {
          const s = seedFor(state.selectedSeed);
          return lang === 'ar' ? `🌱 ازرع ${s.emoji} (🪙 ${s.seedCost})` : `🌱 Plant ${s.emoji} (🪙 ${s.seedCost})`;
        }
        const seed = seedFor(ps.kind);
        const ready = ps.plantedAt && Date.now() - ps.plantedAt >= seed.growMs;
        return ready
          ? `${seed.emoji} ${lang === 'ar' ? 'احصدي!' : 'Harvest!'}`
          : `⏳ ${seed.emoji} ${lang === 'ar' ? 'ينمو' : 'growing'}`;
      }
      case 'B': {
        const fs = state.flowerStates[k];
        if (!fs?.kind) {
          const f = flowerFor(state.selectedFlower);
          return lang === 'ar' ? `🌷 ازرع ${f.emoji} (🪙 ${FLOWER_COST})` : `🌷 Plant ${f.emoji} (🪙 ${FLOWER_COST})`;
        }
        return `🌷 ${lang === 'ar' ? 'فحص' : 'Inspect'}`;
      }
      case 'H': return lang === 'ar' ? `🍯 جمع العسل (${state.honey})` : `🍯 Collect honey (${state.honey})`;
      case 'N': {
        const b = state.barns[k];
        if (!b?.animal) return lang === 'ar' ? '🏚 حظيرة فارغة — افقسي بيضة' : '🏚 Empty pen — hatch an egg';
        const a = animalFor(b.animal);
        if (!a) return lang === 'ar' ? '🐾 ?' : '🐾 ?';
        const ready = Date.now() - b.lastCollectedAt >= a.productMs;
        return ready
          ? `${a.productEmoji} ${lang === 'ar' ? 'احصدي' : 'Collect'} (🪙 ${a.productPrice})`
          : `${a.emoji} ${lang === 'ar' ? 'يستريح' : 'resting'}`;
      }
      case 'E': return lang === 'ar' ? `🥚 افقسي (${state.eggs})` : `🥚 Hatch (${state.eggs})`;
      default: return '';
    }
  })();

  // Map render — pixel grid; bigger tiles for a more "Roblox"-ish feel.
  const TILE = 28;

  // Zone signs: a single label rendered per zone group.
  // Each sign positions over the top-left tile of the cluster.
  const ZONE_SIGNS: { y: number; x: number; label: string; color: string }[] = [
    { y: 1, x: 6, label: lang === 'ar' ? 'متجر 🏪' : 'SHOP 🏪',     color: 'bg-purple-600' },
    { y: 2, x: 2, label: lang === 'ar' ? 'بذور 🌱' : 'SEEDS 🌱',     color: 'bg-emerald-600' },
    { y: 2, x: 8, label: lang === 'ar' ? 'زهور 🌷' : 'GARDEN 🌷',    color: 'bg-pink-500' },
    { y: 4, x: 11, label: lang === 'ar' ? 'بيع العسل 🍯' : 'SELL HONEY 🍯', color: 'bg-amber-500' },
    { y: 6, x: 2, label: lang === 'ar' ? 'حظيرة 🐔' : 'BARN 🐔',     color: 'bg-orange-500' },
    { y: 6, x: 8, label: lang === 'ar' ? 'حضّانة 🥚' : 'INCUB 🥚',   color: 'bg-orange-400' },
    { y: 10, x: 3, label: lang === 'ar' ? 'حقل مميز ⭐' : 'PREMIUM ⭐', color: 'bg-indigo-600' },
  ];

  return (
    <div className="space-y-3">
      {Header}

      {/* World */}
      <div
        dir="ltr"
        className="relative rounded-2xl mx-auto overflow-hidden shadow-2xl ring-2 ring-emerald-700/40"
        style={{
          width: COLS * TILE,
          height: ROWS * TILE,
          background: 'linear-gradient(180deg,#bfe9a8 0%,#9bd57f 60%,#7bc35d 100%)',
          maxWidth: '100%',
        }}>
        {/* Tiles */}
        {MAP.map((row, y) => row.map((t, x) => {
          const isTarget = !!tileForHint && tileForHint.x === x && tileForHint.y === y;
          // Compute "ready" indicator for crops/flowers/animals.
          let ready = false;
          if (t === 'P') {
            const ps = state.plotStates[`${y},${x}`];
            if (ps?.kind && ps.plantedAt) {
              const seed = seedFor(ps.kind);
              ready = Date.now() - ps.plantedAt >= seed.growMs;
            }
          } else if (t === 'B') {
            const fs = state.flowerStates[`${y},${x}`];
            if (fs?.kind && fs.plantedAt) {
              ready = Date.now() - fs.plantedAt >= FLOWER_BLOOM_MS;
            }
          } else if (t === 'N') {
            const b = state.barns[`${y},${x}`];
            if (b?.animal) {
              const a = animalFor(b.animal);
              if (a) ready = Date.now() - b.lastCollectedAt >= a.productMs;
            }
          }
          return (
            <div key={`${y},${x}`}
              className={`absolute flex items-center justify-center text-[16px] leading-none ${tileBg(t)} ${
                isTarget ? 'ring-2 ring-amber-400 z-10' : ''
              } ${ready ? 'ring-2 ring-emerald-400 animate-pulse' : ''}`}
              style={{
                left: x * TILE, top: y * TILE,
                width: TILE, height: TILE,
                boxShadow: isInteractive(t) ? 'inset 0 0 0 1px rgba(0,0,0,0.08)' : undefined,
                transform: 'translate3d(0,0,0)', // hardware acceleration
              }}>
              <span className="select-none">{tileGlyph(t, x, y)}</span>
              {ready && (
                <span className="absolute -top-1 -right-0.5 text-[10px] drop-shadow">✨</span>
              )}
            </div>
          );
        }))}

        {/* Zone signs */}
        {ZONE_SIGNS.map((s, i) => (
          <div key={i}
            className={`absolute z-20 px-1.5 py-0.5 rounded-md text-white text-[9px] font-extrabold shadow-md whitespace-nowrap ${s.color}`}
            style={{ left: s.x * TILE - TILE, top: s.y * TILE - 10 }}>
            {s.label}
          </div>
        ))}

        {/* Player — smooth tween between tiles, tiny bob while walking */}
        <div
          className="absolute flex items-center justify-center text-[20px] pointer-events-none z-30"
          style={{
            left: state.px * TILE,
            top: state.py * TILE,
            width: TILE, height: TILE,
            transform: `translate3d(0, ${(Date.now() - lastMoveAt.current < 500 && walkFrame) ? -2 : 0}px, 0) scale(1.15)`,
            transition: 'left 140ms cubic-bezier(.4,0,.2,1), top 140ms cubic-bezier(.4,0,.2,1)',
            filter: 'drop-shadow(0 2px 2px rgba(0,0,0,.45))',
          }}>
          <span>{playerEmoji}</span>
        </div>
        {/* Toast */}
        {toastMsg && (
          <div className="absolute left-1/2 -translate-x-1/2 top-1 px-3 py-1 rounded-full bg-black/70 text-white text-[11px] font-bold shadow z-40">
            {toastMsg}
          </div>
        )}
      </div>

      {/* Action hint */}
      <p className="text-center text-xs font-semibold text-foreground/80 min-h-[1em]">{actionHint}</p>

      {/* Controls — forced LTR so arrow buttons map to physical directions */}
      <div dir="ltr" className="flex items-center justify-between gap-3 max-w-md mx-auto">
        <div className="grid grid-cols-3 gap-1.5">
          <span />
          <button onClick={() => tryMove(0, -1, 'up')}
            className="w-11 h-11 rounded-xl bg-secondary hover:bg-secondary/70 active:scale-90 text-lg font-bold">↑</button>
          <span />
          <button onClick={() => tryMove(-1, 0, 'left')}
            className="w-11 h-11 rounded-xl bg-secondary hover:bg-secondary/70 active:scale-90 text-lg font-bold">←</button>
          <button onClick={() => setState(s => ({ ...s }))}
            aria-label="center" className="w-11 h-11 rounded-xl bg-secondary/40 text-xs">·</button>
          <button onClick={() => tryMove(1, 0, 'right')}
            className="w-11 h-11 rounded-xl bg-secondary hover:bg-secondary/70 active:scale-90 text-lg font-bold">→</button>
          <span />
          <button onClick={() => tryMove(0, 1, 'down')}
            className="w-11 h-11 rounded-xl bg-secondary hover:bg-secondary/70 active:scale-90 text-lg font-bold">↓</button>
          <span />
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={interact}
            className="px-5 py-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white font-extrabold shadow-lg active:scale-95">
            ✨ {lang === 'ar' ? 'تفاعل' : 'ACTION'}
          </button>
          <button onClick={sellAllCrops}
            className="px-3 py-2 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white text-xs font-extrabold shadow active:scale-95">
            💰 {lang === 'ar' ? `بيع الكل (${totalInv})` : `Sell all (${totalInv})`}
          </button>
        </div>
      </div>

      {/* World Map — fast-travel between zones (premium farm style) */}
      <div className="max-w-md mx-auto">
        <p className="text-[11px] font-bold text-muted-foreground mb-1.5 px-1">
          🗺 {lang === 'ar' ? 'الخريطة — انتقلي للمنطقة' : 'Map — fast-travel'}
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { y: 1, x: 6, ar: 'متجر', en: 'Shop',     emoji: '🏪', cls: 'from-purple-500 to-fuchsia-600' },
            { y: 2, x: 3, ar: 'بذور', en: 'Seeds',    emoji: '🌱', cls: 'from-emerald-500 to-lime-600' },
            { y: 2, x: 9, ar: 'حديقة', en: 'Garden',  emoji: '🌷', cls: 'from-pink-500 to-rose-600' },
            { y: 4, x: 11, ar: 'العسل', en: 'Honey',  emoji: '🍯', cls: 'from-amber-500 to-orange-500' },
            { y: 6, x: 3, ar: 'الحظيرة', en: 'Barn',  emoji: '🐔', cls: 'from-orange-500 to-red-500' },
            { y: 6, x: 9, ar: 'البيض', en: 'Eggs',    emoji: '🥚', cls: 'from-yellow-500 to-amber-500' },
            { y: 10, x: 3, ar: 'مميز', en: 'Premium', emoji: '⭐', cls: 'from-indigo-500 to-violet-600' },
            { y: 10, x: 7, ar: 'حقل ٢', en: 'Field 2', emoji: '🌽', cls: 'from-teal-500 to-cyan-600' },
            { y: 10, x: 9, ar: 'حقل ٣', en: 'Field 3', emoji: '🍓', cls: 'from-rose-500 to-pink-600' },
          ].map(z => (
            <button
              key={`${z.y}-${z.x}`}
              onClick={() => setState(s => ({ ...s, px: z.x, py: z.y, facing: 'down' }))}
              className={`p-2 rounded-xl bg-gradient-to-br ${z.cls} text-white text-[10px] font-extrabold shadow-md active:scale-95 transition-transform flex flex-col items-center gap-0.5`}
            >
              <span className="text-xl leading-none">{z.emoji}</span>
              <span>{lang === 'ar' ? z.ar : z.en}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-1 text-[10px] text-muted-foreground max-w-md mx-auto px-2">
        <span>🏪 {lang === 'ar' ? 'متجر' : 'Market'}</span>
        <span>🌱 {lang === 'ar' ? 'مزرعة' : 'Field'}</span>
        <span>🌷 {lang === 'ar' ? 'حديقة الزهور' : 'Flower bed'}</span>
        <span>🍯 {lang === 'ar' ? 'خلية النحل' : 'Beehive'}</span>
        <span>🥚 {lang === 'ar' ? 'حاضنة' : 'Incubator'}</span>
        <span>🐔 {lang === 'ar' ? 'حظيرة' : 'Barn'}</span>
      </div>

      {/* Shop modal */}
      {shopOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-3"
          onClick={() => setShopOpen(null)}>
          <div className="w-full max-w-md rounded-2xl bg-background p-4 space-y-3 shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold">🏪 {lang === 'ar' ? 'المتجر' : 'Market'}</h3>
              <button onClick={() => setShopOpen(null)} className="text-xl leading-none px-2">×</button>
            </div>
            <p className="text-xs text-muted-foreground">🪙 {state.coins}</p>

            {shopOpen === 'main' && (
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setShopOpen('seeds')} className="p-3 rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-500/30 hover:bg-emerald-500/25 text-start">
                  <p className="text-2xl">🌱</p>
                  <p className="text-xs font-bold">{lang === 'ar' ? 'بذور' : 'Seeds'}</p>
                </button>
                <button onClick={() => setShopOpen('flowers')} className="p-3 rounded-2xl bg-pink-500/15 ring-1 ring-pink-500/30 hover:bg-pink-500/25 text-start">
                  <p className="text-2xl">🌷</p>
                  <p className="text-xs font-bold">{lang === 'ar' ? 'زهور' : 'Flowers'}</p>
                </button>
                <button onClick={() => setShopOpen('eggs')} className="p-3 rounded-2xl bg-orange-500/15 ring-1 ring-orange-500/30 hover:bg-orange-500/25 text-start">
                  <p className="text-2xl">🥚</p>
                  <p className="text-xs font-bold">{lang === 'ar' ? 'بيض غامض' : 'Mystery egg'}</p>
                  <p className="text-[10px] text-muted-foreground">🪙 {EGG_COST} · {lang === 'ar' ? 'حيوان عشوائي' : 'random animal'}</p>
                </button>
                <button onClick={sellAllCrops} className="p-3 rounded-2xl bg-rose-500/15 ring-1 ring-rose-500/30 hover:bg-rose-500/25 text-start">
                  <p className="text-2xl">💰</p>
                  <p className="text-xs font-bold">{lang === 'ar' ? 'بيع كل المحاصيل' : 'Sell all crops'}</p>
                  <p className="text-[10px] text-muted-foreground">📦 {totalInv}</p>
                </button>
              </div>
            )}

            {shopOpen === 'seeds' && (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {getSeeds(world).map(s => (
                  <button key={s.id} onClick={() => buySeed(s)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl ${
                      state.selectedSeed === s.id ? 'bg-primary/20 ring-2 ring-primary' : 'bg-secondary/40 hover:bg-secondary/60'
                    }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{s.emoji}</span>
                      <div className="text-start">
                        <p className="text-xs font-bold">{lang === 'ar' ? s.nameAr : s.nameEn}</p>
                        <p className="text-[10px] text-muted-foreground">⏱ {(s.growMs/1000).toFixed(0)}s · 💰 {s.sellPrice}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold">🪙 {s.seedCost}</span>
                  </button>
                ))}
                <button onClick={() => setShopOpen('main')} className="w-full text-xs text-primary py-2">
                  ← {lang === 'ar' ? 'رجوع' : 'Back'}
                </button>
              </div>
            )}

            {shopOpen === 'flowers' && (
              <div className="space-y-2">
                {getFlowers(world).map(f => (
                  <button key={f.id} onClick={() => buyFlower(f)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl ${
                      state.selectedFlower === f.id ? 'bg-primary/20 ring-2 ring-primary' : 'bg-secondary/40 hover:bg-secondary/60'
                    }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{f.emoji}</span>
                      <p className="text-xs font-bold">{lang === 'ar' ? f.nameAr : f.nameEn}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground">🪙 {FLOWER_COST}</span>
                  </button>
                ))}
                <p className="text-[10px] text-muted-foreground px-1">
                  {lang === 'ar'
                    ? 'الزهور المتفتحة تنتج عسلاً تلقائياً عند خلية النحل 🍯'
                    : 'Bloomed flowers passively produce honey at the beehive 🍯'}
                </p>
                <button onClick={() => setShopOpen('main')} className="w-full text-xs text-primary py-2">
                  ← {lang === 'ar' ? 'رجوع' : 'Back'}
                </button>
              </div>
            )}

            {shopOpen === 'eggs' && (
              <div className="space-y-3 text-center">
                <p className="text-5xl">🥚</p>
                <p className="text-xs">
                  {lang === 'ar'
                    ? 'اشتري بيضة (🪙 60) ثم اذهبي لحاضنة البيض لفقسها لحيوان عشوائي ينتج لكِ موارد للبيع.'
                    : 'Buy an egg (🪙 60), then visit the incubator to hatch a random animal that produces sellable goods.'}
                </p>
                <p className="text-[11px]">{lang === 'ar' ? `لديكِ` : 'You have'} 🥚 ×{state.eggs}</p>
                <button onClick={buyEgg}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-extrabold disabled:opacity-50"
                  disabled={state.coins < EGG_COST}>
                  {lang === 'ar' ? `شراء بيضة (🪙 ${EGG_COST})` : `Buy egg (🪙 ${EGG_COST})`}
                </button>
                <button onClick={() => setShopOpen('main')} className="w-full text-xs text-primary py-2">
                  ← {lang === 'ar' ? 'رجوع' : 'Back'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmSimulator;
