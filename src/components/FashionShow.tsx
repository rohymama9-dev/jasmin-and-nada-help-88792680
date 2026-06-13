import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import modelFemale from '@/assets/fashion-model-female.png';
import modelMale from '@/assets/fashion-model-male.png';
import runwayBg from '@/assets/fashion-runway.jpg';

interface Props { onScore?: (n: number) => void; gender?: 'female' | 'male'; }

/**
 * Open-world Fashion Show.
 *
 * The user walks a girl character around a small studio map (closet, mirror,
 * runway, judges' table). The original styling + runway-walk + 5-star judging
 * loop is preserved verbatim — the only change is that the player must walk
 * to each zone and press ACTION to engage with it:
 *   - Closet  → open the styling pickers
 *   - Mirror  → preview your avatar full-size
 *   - Runway  → start the show (walks the runway with 2 rivals, judges score)
 *   - Theme   → see / cycle the current theme card
 */

// ───────── Style catalog (unchanged from the original game) ─────────

type Item = { id: string; emoji: string; nameAr: string; nameEn: string; tags: string[] };

const FACES: Item[] = [
  { id: 'happy', emoji: '😊', nameAr: 'سعيدة', nameEn: 'Happy',  tags: ['cute','glam'] },
  { id: 'wink',  emoji: '😉', nameAr: 'غمزة',  nameEn: 'Wink',   tags: ['cute','street'] },
  { id: 'kiss',  emoji: '😘', nameAr: 'قبلة',  nameEn: 'Kiss',   tags: ['glam','royal'] },
  { id: 'cool',  emoji: '😎', nameAr: 'عصرية', nameEn: 'Cool',   tags: ['street','sport'] },
];
const HAIRS: Item[] = [
  { id: 'blonde',  emoji: '👱‍♀️', nameAr: 'شقراء', nameEn: 'Blonde',  tags: ['glam','cute'] },
  { id: 'brunette',emoji: '👩',   nameAr: 'بنية',  nameEn: 'Brunette',tags: ['classic','cozy'] },
  { id: 'red',     emoji: '👩‍🦰', nameAr: 'حمراء', nameEn: 'Red',     tags: ['glam','royal'] },
  { id: 'black',   emoji: '👩‍🦱', nameAr: 'سوداء', nameEn: 'Black',   tags: ['street','classic'] },
];
const HATS: Item[] = [
  { id: 'none',  emoji: '✨', nameAr: 'بلا',    nameEn: 'None',    tags: ['cute','glam'] },
  { id: 'crown', emoji: '👑', nameAr: 'تاج',    nameEn: 'Crown',   tags: ['royal','glam'] },
  { id: 'cap',   emoji: '🧢', nameAr: 'كاب',    nameEn: 'Cap',     tags: ['street','sport'] },
  { id: 'beret', emoji: '🎩', nameAr: 'سيلندر', nameEn: 'Top hat', tags: ['classic','formal'] },
];
const TOPS: Item[] = [
  { id: 'pink',  emoji: '👚', nameAr: 'وردي',    nameEn: 'Pink top',  tags: ['cute','glam'] },
  { id: 'shirt', emoji: '👕', nameAr: 'تي شيرت', nameEn: 'T-shirt',   tags: ['street','sport'] },
  { id: 'green', emoji: '🥗', nameAr: 'أخضر',    nameEn: 'Green knit',tags: ['cozy','classic'] },
  { id: 'red',   emoji: '🧥', nameAr: 'أحمر',    nameEn: 'Red top',   tags: ['royal','glam'] },
];
const BOTTOMS: Item[] = [
  { id: 'jeans', emoji: '👖', nameAr: 'جينز',  nameEn: 'Jeans', tags: ['street','classic'] },
  { id: 'skirt', emoji: '👗', nameAr: 'تنورة', nameEn: 'Skirt', tags: ['glam','cute'] },
  { id: 'shorts',emoji: '🩳', nameAr: 'شورت',  nameEn: 'Shorts',tags: ['sport','cute'] },
  { id: 'gown',  emoji: '🥻', nameAr: 'فستان', nameEn: 'Gown',  tags: ['royal','formal'] },
];
const SHOES: Item[] = [
  { id: 'heels',   emoji: '👠', nameAr: 'كعب',    nameEn: 'Heels',    tags: ['glam','royal'] },
  { id: 'sneakers',emoji: '👟', nameAr: 'سنيكرز', nameEn: 'Sneakers', tags: ['street','sport'] },
  { id: 'boots',   emoji: '🥾', nameAr: 'بوت',    nameEn: 'Boots',    tags: ['cozy','classic'] },
  { id: 'flats',   emoji: '🥿', nameAr: 'فلات',   nameEn: 'Flats',    tags: ['cute','classic'] },
];
const ACC: Item[] = [
  { id: 'bag',     emoji: '👜', nameAr: 'حقيبة',     nameEn: 'Bag',        tags: ['glam','classic'] },
  { id: 'glasses', emoji: '🕶️', nameAr: 'نظارة',     nameEn: 'Sunglasses', tags: ['street','cool'] },
  { id: 'rose',    emoji: '🌹', nameAr: 'وردة',      nameEn: 'Rose',       tags: ['glam','royal'] },
  { id: 'lipstick',emoji: '💄', nameAr: 'أحمر شفاه', nameEn: 'Lipstick',   tags: ['glam','cute'] },
];

const THEMES = [
  { tag: 'glam',    nameAr: '✨ غالا فاخرة',     nameEn: '✨ Gala Night' },
  { tag: 'classic', nameAr: '💼 أعمال',          nameEn: '💼 Business Pro' },
  { tag: 'street',  nameAr: '🛹 الشارع',         nameEn: '🛹 Streetwear' },
  { tag: 'cozy',    nameAr: '☕ شتاء دافئ',      nameEn: '☕ Cozy Winter' },
  { tag: 'royal',   nameAr: '👑 ملكي',           nameEn: '👑 Royal Runway' },
  { tag: 'sport',   nameAr: '🏃 رياضي',          nameEn: '🏃 Sporty Vibes' },
  { tag: 'cute',    nameAr: '🌸 لطيف',           nameEn: '🌸 Cutecore' },
];

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

// ───────── World map ─────────

const COLS = 13;
const ROWS = 9;

type TileCode = '.' | 'W' | 'C' | 'M' | 'R' | 'J' | 'T';
//  .  carpet (walkable)
//  W  wall  (blocked)
//  C  closet zone (interactive — opens style pickers)
//  M  mirror     (interactive — preview avatar)
//  R  runway tile (walkable; player stands here, ACTION starts the show)
//  J  judges' table (interactive — shows last score)
//  T  theme board (interactive — cycles theme)

const RAW_MAP: string[] = [
  'WWWWWWWWWWWWW',
  'W.....T.....W',
  'W.CCC...MMM.W',
  'W.CCC...MMM.W',
  'W...........W',
  'W...RRRRR...W',
  'W...RRRRR...W',
  'W.....J.....W',
  'WWWWWWWWWWWWW',
];

const MAP: TileCode[][] = RAW_MAP.map(row =>
  row.padEnd(COLS, 'W').slice(0, COLS).split('').map(ch => {
    const v: Record<string, TileCode> = {
      '.': '.', 'W': 'W', 'C': 'C', 'M': 'M', 'R': 'R', 'J': 'J', 'T': 'T',
    };
    return v[ch] ?? '.';
  })
);

const isBlocked = (t: TileCode) => t === 'W';
const isInteractive = (t: TileCode) => t === 'C' || t === 'M' || t === 'R' || t === 'J' || t === 'T';

// ───────── Component ─────────

type Phase = 'walk' | 'show' | 'vote';
type Modal = null | 'closet' | 'mirror' | 'judges';

const FashionShow = ({ onScore, gender = 'female' }: Props) => {
  const { lang } = useLang();

  // Style state
  const [round, setRound] = useState(0);
  const theme = useMemo(() => THEMES[round % THEMES.length], [round]);
  const [face, setFace] = useState(FACES[0]);
  const [hair, setHair] = useState(HAIRS[0]);
  const [hat, setHat] = useState(HATS[0]);
  const [top, setTop] = useState(TOPS[0]);
  const [bottom, setBottom] = useState(BOTTOMS[0]);
  const [shoes, setShoes] = useState(SHOES[0]);
  const [acc, setAcc] = useState(ACC[0]);

  // Show state
  const [phase, setPhase] = useState<Phase>('walk');
  const [walk, setWalk] = useState(0);
  const [filledStars, setFilledStars] = useState(0);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // Player + map state
  const [px, setPx] = useState(6);
  const [py, setPy] = useState(4);
  const [facing, setFacing] = useState<'up'|'down'|'left'|'right'>('down');
  const [modal, setModal] = useState<Modal>(null);
  const [toastMsg, setToastMsg] = useState('');
  const toastTimer = useRef<number | null>(null);

  const rivals = useMemo(() => [
    { face: pick(FACES), hair: pick(HAIRS), hat: pick(HATS), top: pick(TOPS), bottom: pick(BOTTOMS) },
    { face: pick(FACES), hair: pick(HAIRS), hat: pick(HATS), top: pick(TOPS), bottom: pick(BOTTOMS) },
    { face: pick(FACES), hair: pick(HAIRS), hat: pick(HATS), top: pick(TOPS), bottom: pick(BOTTOMS) },
  ], [round]);

  const flash = useCallback((m: string) => {
    setToastMsg(m);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMsg(''), 1400);
  }, []);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const tryMove = (dx: number, dy: number, f: 'up'|'down'|'left'|'right') => {
    if (phase === 'show') return; // can't walk during the show
    setFacing(f);
    const nx = px + dx, ny = py + dy;
    if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) return;
    if (isBlocked(MAP[ny][nx])) return;
    setPx(nx); setPy(ny);
  };

  // Compute target tile (front of player, then standing tile)
  const targetTile = useMemo(() => {
    const dx = facing === 'left' ? -1 : facing === 'right' ? 1 : 0;
    const dy = facing === 'up' ? -1 : facing === 'down' ? 1 : 0;
    const tx = px + dx, ty = py + dy;
    if (tx < 0 || tx >= COLS || ty < 0 || ty >= ROWS) return null;
    return { x: tx, y: ty, code: MAP[ty][tx] };
  }, [px, py, facing]);
  const standingCode = MAP[py][px];

  const computeStars = (): number => {
    const picks = [face, hair, hat, top, bottom, shoes, acc];
    const hits = picks.filter(p => p.tags.includes(theme.tag)).length;
    const raw = (hits / 7) * 5 + (Math.random() - 0.3) * 0.6;
    return Math.max(1, Math.min(5, Math.round(raw)));
  };

  const startShow = () => {
    if (phase !== 'walk') return;
    setPhase('show');
    setWalk(0);
    setFilledStars(0);
    const t0 = performance.now();
    const dur = 4500;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      setWalk(p);
      if (p < 1) rafRef.current = requestAnimationFrame(tick) as unknown as number;
      else {
        const stars = computeStars();
        setLastScore(stars);
        setPhase('vote');
        for (let i = 0; i < stars; i++) {
          setTimeout(() => setFilledStars(i + 1), 400 + i * 350);
        }
        const award = stars * 2;
        setTimeout(() => onScore?.(award), 400 + stars * 350 + 400);
      }
    };
    rafRef.current = requestAnimationFrame(tick) as unknown as number;
  };

  const nextTheme = () => {
    setPhase('walk');
    setFilledStars(0);
    setRound(r => r + 1);
  };

  const interact = () => {
    if (phase === 'show') return;
    if (phase === 'vote') { nextTheme(); return; }
    const t = (targetTile && isInteractive(targetTile.code)) ? targetTile : (isInteractive(standingCode) ? { code: standingCode } : null);
    if (!t) { flash(lang === 'ar' ? 'اقتربي من منطقة' : 'Walk to a zone'); return; }
    switch (t.code) {
      case 'C': setModal('closet'); return;
      case 'M': setModal('mirror'); return;
      case 'J': setModal('judges'); return;
      case 'T': nextTheme(); return;
      case 'R': startShow(); return;
    }
  };

  // ───────── Avatar visual ─────────
  // Realistic 3D-style avatar: photo base + emoji outfit overlays positioned
  // over the model so swapping wardrobe items changes the look instantly.
  const Avatar = ({
    f, h, ht, t, b, s, a, highlighted = false, walkP = 0, delay = 0, scale = 1,
  }: {
    f: Item; h: Item; ht: Item; t: Item; b: Item; s?: Item; a?: Item;
    highlighted?: boolean; walkP?: number; delay?: number; scale?: number;
  }) => {
    const bob = Math.sin((walkP + delay) * Math.PI * 4) * 6;
    const slide = walkP === 0 ? 0 : (walkP * 30) - 15;
    const baseImg = gender === 'male' ? modelMale : modelFemale;
    return (
      <div className="flex flex-col items-center transition-transform"
        style={{ transform: `translate(${slide}%, ${-bob}px) scale(${scale})` }}>
        <div className={`relative ${highlighted ? '' : 'opacity-90'}`}
             style={{ width: 110, height: 200 }}>
          {/* Realistic photo base */}
          <img src={baseImg} alt="model"
               className="absolute inset-0 w-full h-full object-contain drop-shadow-xl"
               loading="lazy" />
          {/* Hat / hair on top of head */}
          {ht.id !== 'none' && (
            <div className="absolute left-1/2 -translate-x-1/2 text-3xl z-30" style={{ top: -2 }}>{ht.emoji}</div>
          )}
          <div className="absolute left-1/2 -translate-x-1/2 text-2xl z-20" style={{ top: 6 }}>{h.emoji}</div>
          <div className="absolute left-1/2 -translate-x-1/2 text-lg z-20" style={{ top: 22 }}>{f.emoji}</div>
          {/* Top: covers torso */}
          <div className="absolute left-1/2 -translate-x-1/2 text-4xl z-10" style={{ top: 56 }}>{t.emoji}</div>
          {/* Bottom: covers legs */}
          <div className="absolute left-1/2 -translate-x-1/2 text-3xl z-10" style={{ top: 110 }}>{b.emoji}</div>
          {/* Shoes at feet */}
          {s && <div className="absolute left-1/2 -translate-x-1/2 text-2xl z-10" style={{ top: 165 }}>{s.emoji}</div>}
          {/* Accessory floating beside */}
          {a && <div className="absolute text-xl z-30" style={{ top: 70, right: -2 }}>{a.emoji}</div>}
          {highlighted && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-pink-500 text-white text-[9px] font-bold whitespace-nowrap z-40">
              {lang === 'ar' ? 'أنتِ' : 'YOU'}
            </div>
          )}
        </div>
      </div>
    );
  };

  const Picker = ({ items, val, set, label }: { items: Item[]; val: Item; set: (i: Item) => void; label: string }) => (
    <div>
      <p className="text-[10px] font-semibold text-muted-foreground mb-1">{label}</p>
      <div className="flex gap-1 flex-wrap">
        {items.map(it => (
          <button key={it.id} onClick={() => set(it)}
            className={`text-xl w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              val.id === it.id ? 'bg-primary/30 ring-2 ring-primary scale-105' : 'bg-secondary/50 hover:bg-secondary'
            }`} title={lang === 'ar' ? it.nameAr : it.nameEn}>
            {it.emoji}
          </button>
        ))}
      </div>
    </div>
  );

  // ───────── Map render ─────────
  const TILE = 30;
  const tileBg = (t: TileCode): string => {
    switch (t) {
      case '.': return 'bg-rose-50/60';
      case 'W': return 'bg-gradient-to-b from-fuchsia-400 to-fuchsia-600';
      case 'C': return 'bg-violet-300/90';
      case 'M': return 'bg-sky-200/90';
      case 'R': return 'bg-gradient-to-b from-rose-200 to-rose-400'; // runway carpet
      case 'J': return 'bg-amber-200/90';
      case 'T': return 'bg-emerald-200/90';
    }
  };
  const tileGlyph = (t: TileCode): string => {
    if (t === 'W') return '';
    if (t === 'C') return '👗';
    if (t === 'M') return '🪞';
    if (t === 'R') return '';
    if (t === 'J') return '🎤';
    if (t === 'T') return '📋';
    return '';
  };

  // Audience seats: around the runway (rows 5-6, cols 3-7) — show on rows 4 and 7 inside walls.
  const AUDIENCE_TILES: { y: number; x: number; emoji: string }[] = [
    { y: 4, x: 3, emoji: '🧑' }, { y: 4, x: 5, emoji: '👩' }, { y: 4, x: 7, emoji: '🧑' },
    { y: 7, x: 3, emoji: '👩' }, { y: 7, x: 5, emoji: '🧑' }, { y: 7, x: 7, emoji: '👩' },
  ];

  const playerEmoji = gender === 'male'
    ? (facing === 'left' || facing === 'right' ? '🚶' : '🕺')
    : (facing === 'left' || facing === 'right' ? '🚶‍♀️' : '💃');

  const tileForHint = (targetTile && isInteractive(targetTile.code)) ? targetTile : (isInteractive(standingCode) ? { code: standingCode } : null);
  const actionHint = (() => {
    if (phase === 'show') return lang === 'ar' ? '✨ يجري العرض ...' : '✨ Show in progress ...';
    if (phase === 'vote') return lang === 'ar' ? '⭐ اضغطي تفاعل لموضوع جديد' : '⭐ Press ACTION for a new theme';
    if (!tileForHint) return lang === 'ar' ? '— تحرّكي على الخريطة —' : '— walk around —';
    switch (tileForHint.code) {
      case 'C': return lang === 'ar' ? '👗 افتحي خزانة الملابس' : '👗 Open closet';
      case 'M': return lang === 'ar' ? '🪞 معاينة' : '🪞 Preview look';
      case 'J': return lang === 'ar' ? '🎤 طاولة الحكام' : '🎤 Judges table';
      case 'T': return lang === 'ar' ? '📋 موضوع جديد' : '📋 New theme';
      case 'R': return lang === 'ar' ? '★ ابدئي العرض!' : '★ Start the show!';
      default: return '';
    }
  })();

  return (
    <div className="space-y-3">
      {/* Theme banner */}
      <div className="text-center">
        <h2 className="text-lg font-extrabold bg-gradient-to-r from-pink-500 to-fuchsia-600 bg-clip-text text-transparent">
          {lang === 'ar' ? '💃 فاشون شو' : '💃 Fashion Show'}
        </h2>
        <p className="text-xs text-muted-foreground">
          {lang === 'ar' ? 'الموضوع:' : 'Theme:'} <span className="font-bold text-foreground">{lang === 'ar' ? theme.nameAr : theme.nameEn}</span>
        </p>
      </div>

      {/* World map — styled studio: dark wood floor, runway carpet, spotlights, audience */}
      <div dir="ltr" className="relative rounded-2xl mx-auto overflow-hidden ring-2 ring-pink-400/60 shadow-2xl"
        style={{
          width: COLS * TILE, height: ROWS * TILE, maxWidth: '100%',
          background: 'radial-gradient(ellipse at top, #fff5fa 0%, #f7c8dc 55%, #b76b8c 100%)',
        }}>
        {/* Spotlights — two soft cones from top corners aimed at the runway */}
        <div className="absolute pointer-events-none" style={{
          left: 0, top: 0, width: '100%', height: '100%',
          background:
            'radial-gradient(circle at 30% 0%, rgba(255,255,200,0.55), transparent 35%),' +
            'radial-gradient(circle at 70% 0%, rgba(255,220,255,0.55), transparent 35%)',
          mixBlendMode: 'screen',
        }} />

        {MAP.map((row, y) => row.map((t, x) => {
          const isTarget = !!tileForHint && targetTile && targetTile.x === x && targetTile.y === y && isInteractive(targetTile.code);
          return (
            <div key={`${y},${x}`}
              className={`absolute flex items-center justify-center text-[15px] ${tileBg(t)} ${
                isTarget ? 'ring-2 ring-amber-400 z-10' : ''
              }`}
              style={{ left: x * TILE, top: y * TILE, width: TILE, height: TILE }}>
              <span className="select-none">{tileGlyph(t)}</span>
            </div>
          );
        }))}

        {/* Audience seated around the runway */}
        {AUDIENCE_TILES.map((a, i) => (
          <div key={i} className="absolute flex items-center justify-center text-[14px] pointer-events-none z-10"
            style={{ left: a.x * TILE, top: a.y * TILE, width: TILE, height: TILE,
              filter: 'drop-shadow(0 1px 1px rgba(0,0,0,.3))' }}>
            <span>{a.emoji}</span>
          </div>
        ))}

        {/* Zone signs */}
        <div className="absolute z-20 px-1.5 py-0.5 rounded-md bg-violet-600 text-white text-[9px] font-extrabold shadow"
          style={{ left: 1 * TILE, top: 2 * TILE - 10 }}>
          {lang === 'ar' ? 'الخزانة 👗' : 'CLOSET 👗'}
        </div>
        <div className="absolute z-20 px-1.5 py-0.5 rounded-md bg-sky-600 text-white text-[9px] font-extrabold shadow"
          style={{ left: 7 * TILE, top: 2 * TILE - 10 }}>
          {lang === 'ar' ? 'المرآة 🪞' : 'MIRROR 🪞'}
        </div>
        <div className="absolute z-20 px-1.5 py-0.5 rounded-md bg-pink-600 text-white text-[9px] font-extrabold shadow"
          style={{ left: 4 * TILE, top: 5 * TILE - 10 }}>
          {lang === 'ar' ? '★ المنصة' : 'RUNWAY ★'}
        </div>
        <div className="absolute z-20 px-1.5 py-0.5 rounded-md bg-amber-600 text-white text-[9px] font-extrabold shadow"
          style={{ left: 5 * TILE, top: 7 * TILE - 10 }}>
          {lang === 'ar' ? 'الحكام 🎤' : 'JUDGES 🎤'}
        </div>

        {/* During the show, render the runway with rivals over the runway tiles */}
        {phase !== 'walk' && (
          <>
            {/* Realistic runway backdrop covering the runway band */}
            <div className="absolute inset-x-0 z-10 overflow-hidden"
              style={{ top: 4 * TILE, height: 4 * TILE,
                       backgroundImage: `url(${runwayBg})`,
                       backgroundSize: 'cover', backgroundPosition: 'center' }} />
            <div className="absolute inset-x-0 flex justify-around items-end px-3 z-20"
              style={{ top: 5 * TILE - 8, height: 2 * TILE + 16 }}>
              <Avatar f={rivals[0].face} h={rivals[0].hair} ht={rivals[0].hat}
                t={rivals[0].top} b={rivals[0].bottom}
                walkP={phase === 'show' ? walk : 0} delay={0.2} scale={0.42} />
              <Avatar f={face} h={hair} ht={hat} t={top} b={bottom} s={shoes} a={acc}
                highlighted walkP={phase === 'show' ? walk : 0} delay={0} scale={0.62} />
              <Avatar f={rivals[1].face} h={rivals[1].hair} ht={rivals[1].hat}
                t={rivals[1].top} b={rivals[1].bottom}
                walkP={phase === 'show' ? walk : 0} delay={0.5} scale={0.5} />
              <Avatar f={rivals[2].face} h={rivals[2].hair} ht={rivals[2].hat}
                t={rivals[2].top} b={rivals[2].bottom}
                walkP={phase === 'show' ? walk : 0} delay={0.35} scale={0.38} />
            </div>
          </>
        )}

        {/* Player avatar — smooth tile transition */}
        {phase === 'walk' && (
          <div className="absolute flex items-center justify-center text-[20px] pointer-events-none z-30"
            style={{ left: px * TILE, top: py * TILE, width: TILE, height: TILE,
              transition: 'left 140ms cubic-bezier(.4,0,.2,1), top 140ms cubic-bezier(.4,0,.2,1)',
              filter: 'drop-shadow(0 2px 2px rgba(0,0,0,.5))' }}>
            <span>{playerEmoji}</span>
          </div>
        )}

        {/* Judge stars overlay during/after show */}
        {phase !== 'walk' && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-1 flex gap-1 z-30">
            {[0,1,2,3,4].map(i => (
              <span key={i} className={`text-xl drop-shadow ${i < filledStars ? 'opacity-100 animate-pulse' : 'opacity-30 grayscale'}`}>⭐</span>
            ))}
          </div>
        )}

        {toastMsg && (
          <div className="absolute left-1/2 -translate-x-1/2 top-1 px-3 py-1 rounded-full bg-black/70 text-white text-[11px] font-bold shadow z-40">
            {toastMsg}
          </div>
        )}
      </div>

      {/* Action hint */}
      <p className="text-center text-xs font-semibold text-foreground/80 min-h-[1em]">{actionHint}</p>

      {/* Controls — forced LTR so arrows always map to physical directions */}
      <div dir="ltr" className="flex items-center justify-between gap-3 max-w-md mx-auto">
        <div className="grid grid-cols-3 gap-1.5">
          <span />
          <button onClick={() => tryMove(0, -1, 'up')}
            className="w-11 h-11 rounded-xl bg-secondary hover:bg-secondary/70 active:scale-90 text-lg font-bold">↑</button>
          <span />
          <button onClick={() => tryMove(-1, 0, 'left')}
            className="w-11 h-11 rounded-xl bg-secondary hover:bg-secondary/70 active:scale-90 text-lg font-bold">←</button>
          <button className="w-11 h-11 rounded-xl bg-secondary/40 text-xs">·</button>
          <button onClick={() => tryMove(1, 0, 'right')}
            className="w-11 h-11 rounded-xl bg-secondary hover:bg-secondary/70 active:scale-90 text-lg font-bold">→</button>
          <span />
          <button onClick={() => tryMove(0, 1, 'down')}
            className="w-11 h-11 rounded-xl bg-secondary hover:bg-secondary/70 active:scale-90 text-lg font-bold">↓</button>
          <span />
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={interact} disabled={phase === 'show'}
            className="px-5 py-3 rounded-2xl bg-gradient-to-br from-pink-500 to-fuchsia-600 text-white font-extrabold shadow-lg active:scale-95 disabled:opacity-50">
            ✨ {lang === 'ar' ? 'تفاعل' : 'ACTION'}
          </button>
          {lastScore !== null && (
            <span className="text-center text-[10px] font-bold text-muted-foreground">
              {lang === 'ar' ? 'آخر:' : 'Last:'} {lastScore}/5⭐
            </span>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-1 text-[10px] text-muted-foreground max-w-md mx-auto px-2">
        <span>👗 {lang === 'ar' ? 'الخزانة' : 'Closet'}</span>
        <span>🪞 {lang === 'ar' ? 'المرآة' : 'Mirror'}</span>
        <span>★ {lang === 'ar' ? 'المنصة' : 'Runway'}</span>
        <span>🎤 {lang === 'ar' ? 'الحكام' : 'Judges'}</span>
        <span>📋 {lang === 'ar' ? 'الموضوع' : 'Theme'}</span>
      </div>

      {/* Vote summary banner (mirrors original game's behavior) */}
      {phase === 'vote' && (
        <div className="text-center p-3 rounded-2xl bg-pink-500/10 space-y-2">
          <p className="text-2xl font-bold">{filledStars}/5 ⭐</p>
          <p className="text-xs text-muted-foreground">
            {filledStars >= 5 ? (lang === 'ar' ? 'أداء أسطوري! 👑' : 'Legendary! 👑') :
             filledStars >= 4 ? (lang === 'ar' ? 'مذهلة! 👏' : 'Stunning! 👏') :
             filledStars >= 3 ? (lang === 'ar' ? 'جيد جداً' : 'Pretty good') :
             (lang === 'ar' ? 'ناسبي الموضوع أكثر' : 'Match the theme more')}
          </p>
          <button onClick={nextTheme}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white text-sm font-bold">
            {lang === 'ar' ? 'موضوع جديد ▶' : 'New Theme ▶'}
          </button>
        </div>
      )}

      {/* Closet modal */}
      {modal === 'closet' && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-3"
          onClick={() => setModal(null)}>
          <div className="w-full max-w-md rounded-2xl bg-background p-4 space-y-3 shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold">👗 {lang === 'ar' ? 'الخزانة' : 'Closet'}</h3>
              <button onClick={() => setModal(null)} className="text-xl leading-none px-2">×</button>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 max-h-[60vh] overflow-y-auto">
              <Picker items={FACES}   val={face}   set={setFace}   label={lang === 'ar' ? 'الوجه' : 'Face'} />
              <Picker items={HAIRS}   val={hair}   set={setHair}   label={lang === 'ar' ? 'الشعر' : 'Hair'} />
              <Picker items={HATS}    val={hat}    set={setHat}    label={lang === 'ar' ? 'القبعة' : 'Hat'} />
              <Picker items={TOPS}    val={top}    set={setTop}    label={lang === 'ar' ? 'القميص' : 'Top'} />
              <Picker items={BOTTOMS} val={bottom} set={setBottom} label={lang === 'ar' ? 'البنطال' : 'Bottom'} />
              <Picker items={SHOES}   val={shoes}  set={setShoes}  label={lang === 'ar' ? 'الحذاء' : 'Shoes'} />
              <Picker items={ACC}     val={acc}    set={setAcc}    label={lang === 'ar' ? 'إكسسوار' : 'Accessory'} />
            </div>
            <button onClick={() => setModal(null)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white font-bold">
              {lang === 'ar' ? 'تم' : 'Done'}
            </button>
          </div>
        </div>
      )}

      {/* Mirror modal */}
      {modal === 'mirror' && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3"
          onClick={() => setModal(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-gradient-to-br from-sky-100 to-pink-100 p-6 shadow-2xl text-center"
            onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-extrabold mb-3">🪞 {lang === 'ar' ? 'المرآة' : 'Mirror'}</h3>
            <div className="flex justify-center my-4">
              <Avatar f={face} h={hair} ht={hat} t={top} b={bottom} s={shoes} a={acc} highlighted scale={1.4} />
            </div>
            <p className="text-xs text-muted-foreground">
              {lang === 'ar' ? `الموضوع: ${theme.nameAr}` : `Theme: ${theme.nameEn}`}
            </p>
            <button onClick={() => setModal(null)}
              className="mt-3 w-full py-2.5 rounded-xl bg-pink-500 text-white font-bold">
              {lang === 'ar' ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* Judges modal */}
      {modal === 'judges' && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3"
          onClick={() => setModal(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-background p-5 shadow-2xl text-center space-y-3"
            onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-extrabold">🎤 {lang === 'ar' ? 'لجنة التحكيم' : 'Judges'}</h3>
            <p className="text-xs text-muted-foreground">
              {lang === 'ar'
                ? 'الحكام يقيّمون مدى مطابقة إطلالتك للموضوع. اقتربي من المنصة واضغطي تفاعل لبدء العرض.'
                : 'Judges score how well your outfit matches the theme. Walk to the runway and press ACTION to start the show.'}
            </p>
            {lastScore !== null && (
              <p className="text-2xl font-extrabold">{lastScore}/5 ⭐</p>
            )}
            <button onClick={() => setModal(null)}
              className="w-full py-2.5 rounded-xl bg-pink-500 text-white font-bold">
              {lang === 'ar' ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FashionShow;
