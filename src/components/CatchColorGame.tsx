import { useEffect, useRef, useState, useCallback } from 'react';
import { useLang } from '@/contexts/LanguageContext';

interface Props { onScore?: (n: number) => void; }

/**
 * Catch the Right Color — bowl moves left/right (touch/drag),
 * fruits fall from sky. Catch the requested color, dodge others.
 */

const W = 340;
const H = 520;
const BOWL_W = 80;
const BOWL_H = 36;

type Color = 'red' | 'orange' | 'yellow' | 'green' | 'purple';

const FRUITS: Record<Color, { emoji: string; nameAr: string; nameEn: string; ring: string }> = {
  red:    { emoji: '🍎', nameAr: 'الأحمر',  nameEn: 'RED',    ring: 'ring-red-500 text-red-500' },
  orange: { emoji: '🍊', nameAr: 'البرتقالي', nameEn: 'ORANGE', ring: 'ring-orange-500 text-orange-500' },
  yellow: { emoji: '🍌', nameAr: 'الأصفر',  nameEn: 'YELLOW', ring: 'ring-yellow-500 text-yellow-500' },
  green:  { emoji: '🍏', nameAr: 'الأخضر',  nameEn: 'GREEN',  ring: 'ring-green-500 text-green-600' },
  purple: { emoji: '🍇', nameAr: 'البنفسجي', nameEn: 'PURPLE', ring: 'ring-purple-500 text-purple-600' },
};
const COLOR_KEYS = Object.keys(FRUITS) as Color[];

interface Drop { id: number; x: number; y: number; vy: number; color: Color }

let did = 0;

const CatchColorGame = ({ onScore }: Props) => {
  const { lang } = useLang();
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [target, setTarget] = useState<Color>('red');
  const [floaters, setFloaters] = useState<{ id: number; x: number; y: number; txt: string; ok: boolean }[]>([]);

  const bowlX = useRef(W / 2 - BOWL_W / 2);
  const dropsRef = useRef<Drop[]>([]);
  const rafRef = useRef<number | null>(null);
  const spawnTimer = useRef(0);
  const [, force] = useState(0);

  const reset = useCallback(() => {
    bowlX.current = W / 2 - BOWL_W / 2;
    dropsRef.current = [];
    spawnTimer.current = 0;
    setScore(0); setLives(3); setOver(false);
    setTarget(COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)]);
  }, []);

  useEffect(() => { reset(); }, [reset]);

  const start = () => { reset(); setRunning(true); };

  // Game loop
  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    const loop = (t: number) => {
      const dt = Math.min(40, t - last);
      last = t;
      const speedMult = 1 + Math.min(2, score / 25);

      // Spawn
      spawnTimer.current -= dt;
      if (spawnTimer.current <= 0) {
        const c = COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)];
        // Bias spawning so the target shows fairly often
        const finalC = Math.random() < 0.45 ? target : c;
        dropsRef.current.push({
          id: ++did,
          x: 20 + Math.random() * (W - 40),
          y: -20,
          vy: 1.2 + Math.random() * 1.5,
          color: finalC,
        });
        spawnTimer.current = 700 / speedMult;
      }

      // Move drops
      const bx = bowlX.current;
      const bowlTop = H - 70;
      const next: Drop[] = [];
      let scoreDelta = 0;
      let lifeDelta = 0;
      let toFloat: typeof floaters = [];
      for (const d of dropsRef.current) {
        d.y += d.vy * speedMult;
        // Catch?
        if (
          d.y + 20 >= bowlTop &&
          d.y <= bowlTop + BOWL_H &&
          d.x + 14 >= bx &&
          d.x - 14 <= bx + BOWL_W
        ) {
          if (d.color === target) {
            scoreDelta++;
            toFloat.push({ id: ++did, x: d.x, y: d.y, txt: '+1', ok: true });
          } else {
            lifeDelta--;
            toFloat.push({ id: ++did, x: d.x, y: d.y, txt: '✗', ok: false });
          }
          continue;
        }
        // Missed (target fell past)
        if (d.y > H + 20) {
          if (d.color === target) {
            lifeDelta--;
            toFloat.push({ id: ++did, x: d.x, y: H - 70, txt: '✗', ok: false });
          }
          continue;
        }
        next.push(d);
      }
      dropsRef.current = next;

      if (scoreDelta || lifeDelta) {
        if (scoreDelta) {
          setScore(s => {
            const ns = s + scoreDelta;
            // Switch target every 5 catches
            if (Math.floor(ns / 5) > Math.floor(s / 5)) {
              const remain = COLOR_KEYS.filter(k => k !== target);
              setTarget(remain[Math.floor(Math.random() * remain.length)]);
            }
            return ns;
          });
          onScore?.(scoreDelta);
        }
        if (lifeDelta) {
          setLives(l => {
            const nl = l + lifeDelta;
            if (nl <= 0) {
              setOver(true);
              setRunning(false);
            }
            return Math.max(0, nl);
          });
        }
        if (toFloat.length) {
          setFloaters(f => [...f, ...toFloat]);
          toFloat.forEach(ft => setTimeout(() => {
            setFloaters(curr => curr.filter(x => x.id !== ft.id));
          }, 700));
        }
      }

      force(t => (t + 1) % 1e6);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, target]);

  // Keyboard
  useEffect(() => {
    const dn = (e: KeyboardEvent) => {
      if (!running) return;
      if (e.code === 'ArrowLeft') bowlX.current = Math.max(0, bowlX.current - 22);
      if (e.code === 'ArrowRight') bowlX.current = Math.min(W - BOWL_W, bowlX.current + 22);
    };
    window.addEventListener('keydown', dn);
    return () => window.removeEventListener('keydown', dn);
  }, [running]);

  // Touch / drag
  const arenaRef = useRef<HTMLDivElement | null>(null);
  const moveTo = (clientX: number) => {
    const rect = arenaRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((clientX - rect.left) / rect.width) * W - BOWL_W / 2;
    bowlX.current = Math.max(0, Math.min(W - BOWL_W, x));
  };

  const targetMeta = FRUITS[target];

  return (
    <div className="space-y-3">
      <div className="text-center">
        <h2 className="text-lg font-bold">{lang === 'ar' ? '🍓 امسكي اللون الصحيح' : '🍓 Catch The Right Color'}</h2>
      </div>

      <div className="flex justify-center items-center gap-3 flex-wrap text-xs">
        <span className="px-2 py-1 rounded-full bg-secondary">⭐ {score}</span>
        <span className="px-2 py-1 rounded-full bg-secondary">❤️ {lives}</span>
        <span className={`px-3 py-1 rounded-full bg-background ring-2 font-bold ${targetMeta.ring}`}>
          {lang === 'ar' ? `اجمعي ${targetMeta.nameAr}` : `Collect ${targetMeta.nameEn}`} {targetMeta.emoji}
        </span>
      </div>

      <div className="flex justify-center">
        <div
          ref={arenaRef}
          onTouchMove={(e) => moveTo(e.touches[0].clientX)}
          onTouchStart={(e) => moveTo(e.touches[0].clientX)}
          onMouseMove={(e) => { if (e.buttons) moveTo(e.clientX); }}
          onMouseDown={(e) => moveTo(e.clientX)}
          className="relative rounded-2xl overflow-hidden select-none touch-none shadow-lg"
          style={{
            width: W, height: H,
            background: 'linear-gradient(180deg, #cfeaff 0%, #b6dffd 55%, #7fc89e 80%, #5fb37e 100%)',
          }}
        >
          {/* Clouds */}
          <div className="absolute top-4 left-3 text-2xl opacity-80">☁️</div>
          <div className="absolute top-10 right-6 text-xl opacity-70">☁️</div>
          {/* Drops */}
          {dropsRef.current.map(d => (
            <div key={d.id} className="absolute text-2xl pointer-events-none"
              style={{ left: d.x - 14, top: d.y - 14, transition: 'none' }}>
              {FRUITS[d.color].emoji}
            </div>
          ))}
          {/* Floaters */}
          {floaters.map(f => (
            <div key={f.id} className={`absolute text-sm font-bold pointer-events-none animate-bounce ${f.ok ? 'text-green-600' : 'text-red-600'}`}
              style={{ left: f.x - 8, top: f.y - 24 }}>
              {f.txt}
            </div>
          ))}
          {/* Bowl */}
          <div className="absolute text-5xl pointer-events-none drop-shadow-lg"
            style={{ left: bowlX.current, top: H - 70, width: BOWL_W, textAlign: 'center' }}>
            🥣
          </div>

          {!running && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm gap-3">
              {over && (
                <p className="text-lg font-bold">
                  {lang === 'ar' ? `انتهت اللعبة! النتيجة: ${score}` : `Game Over! Score: ${score}`}
                </p>
              )}
              <button onClick={start}
                className="px-6 py-3 rounded-xl gradient-primary text-primary-foreground font-bold shadow-lg">
                {over ? (lang === 'ar' ? '🔄 إعادة' : '🔄 Restart') : (lang === 'ar' ? '▶ ابدئي' : '▶ Start')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile arrows */}
      <div className="flex justify-center gap-3" dir="ltr">
        <button onTouchStart={() => bowlX.current = Math.max(0, bowlX.current - 30)}
          onMouseDown={() => bowlX.current = Math.max(0, bowlX.current - 30)}
          className="w-20 h-12 rounded-xl bg-secondary text-2xl font-bold active:scale-95">←</button>
        <button onTouchStart={() => bowlX.current = Math.min(W - BOWL_W, bowlX.current + 30)}
          onMouseDown={() => bowlX.current = Math.min(W - BOWL_W, bowlX.current + 30)}
          className="w-20 h-12 rounded-xl bg-secondary text-2xl font-bold active:scale-95">→</button>
      </div>

      <p className="text-center text-[10px] text-muted-foreground">
        {lang === 'ar'
          ? 'اسحبي الوعاء لإمساك الفاكهة المطلوبة فقط · تجنّبي الباقي!'
          : 'Drag the bowl to catch only the requested fruit · avoid the rest!'}
      </p>
    </div>
  );
};

export default CatchColorGame;
