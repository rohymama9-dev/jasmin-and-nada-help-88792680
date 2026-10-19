import { useState, useEffect, useRef, useCallback } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import LevelHUD from './games/LevelHUD';

interface Props { onScore: (pts: number) => void; }

const MAX_LEVEL = 15;
const W = 280;
const H = 440;
const LANES = 3;
const LANE_W = W / LANES;
const CAR_W = 38;
const CAR_H = 56;

const RacingGame = ({ onScore }: Props) => {
  const { lang } = useLang();
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(false);
  const [, setTick] = useState(0);
  const [finished, setFinished] = useState(false);

  const laneRef = useRef(1);
  const enemiesRef = useRef<{ id: number; lane: number; y: number; emoji: string; passed?: boolean }[]>([]);
  const stripeRef = useRef(0);
  const distanceRef = useRef(0);
  const deadRef = useRef(false);
  const flippedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const enemyIdRef = useRef(0);

  // "Damage" = recent collisions. 3+ within ~1.5s ⇒ flip ⇒ lose.
  // Cooldown after each hit to avoid same-enemy double-counting.
  const damageEventsRef = useRef<number[]>([]);
  const hitCooldownRef = useRef(0);
  const spinRef = useRef(0); // visual-only rotation in degrees
  const slowUntilRef = useRef(0); // timestamp until which player drives slower

  const speed = 3 + level * 0.5;
  const goal = 1500 + level * 250;
  const enemyGap = Math.max(50, 130 - level * 5);

  const reset = useCallback(() => {
    laneRef.current = 1;
    enemiesRef.current = [];
    distanceRef.current = 0;
    stripeRef.current = 0;
    deadRef.current = false;
    flippedRef.current = false;
    damageEventsRef.current = [];
    hitCooldownRef.current = 0;
    spinRef.current = 0;
    slowUntilRef.current = 0;
    setFinished(false);
  }, []);

  const moveLane = (dir: -1 | 1) => {
    if (!running || flippedRef.current) return;
    laneRef.current = Math.max(0, Math.min(LANES - 1, laneRef.current + dir));
  };

  const snapToLane = (idx: number) => {
    if (!running || flippedRef.current) return;
    laneRef.current = idx;
  };

  useEffect(() => {
    if (!running) return;
    let lastSpawn = 0;
    const enemies = ['🚗', '🚙', '🚕', '🛻'];
    const loop = () => {
      const now = performance.now();
      // Effective speed (slower briefly after a hit)
      const effSpeed = now < slowUntilRef.current ? speed * 0.4 : speed;

      stripeRef.current = (stripeRef.current + effSpeed) % 40;
      enemiesRef.current = enemiesRef.current
        .map(e => ({ ...e, y: e.y + effSpeed }))
        .filter(e => e.y < H + 60);

      distanceRef.current += effSpeed;
      if (distanceRef.current - lastSpawn > enemyGap) {
        lastSpawn = distanceRef.current;
        const lane = Math.floor(Math.random() * LANES);
        enemiesRef.current.push({ id: ++enemyIdRef.current, lane, y: -CAR_H, emoji: enemies[Math.floor(Math.random() * enemies.length)] });
        if (level >= 5 && Math.random() < 0.25) {
          let l2 = Math.floor(Math.random() * LANES);
          if (l2 === lane) l2 = (l2 + 1) % LANES;
          enemiesRef.current.push({ id: ++enemyIdRef.current, lane: l2, y: -CAR_H - 30, emoji: enemies[Math.floor(Math.random() * enemies.length)] });
        }
      }

      // Score for passed enemies
      const py = H - CAR_H - 12;
      enemiesRef.current.forEach(e => {
        if (!e.passed && e.y > py + CAR_H) {
          e.passed = true;
          setScore(s => s + 1);
        }
      });

      // Collision detection — bump-not-die
      if (hitCooldownRef.current > 0) hitCooldownRef.current -= 1;
      const px = laneRef.current * LANE_W + (LANE_W - CAR_W) / 2;
      for (const e of enemiesRef.current) {
        const ex = e.lane * LANE_W + (LANE_W - CAR_W) / 2;
        if (e.lane === laneRef.current && e.y + CAR_H > py && e.y < py + CAR_H) {
          if (Math.abs(ex - px) < CAR_W && hitCooldownRef.current <= 0) {
            // Bump: spin, slow, log a damage event.
            hitCooldownRef.current = 30; // ~0.5s @ 60fps
            slowUntilRef.current = now + 700;
            spinRef.current += (Math.random() < 0.5 ? -1 : 1) * 25;
            damageEventsRef.current.push(now);
            // Drop old events
            damageEventsRef.current = damageEventsRef.current.filter(t => now - t < 1500);
            // Push the offending enemy down past the player so they don't re-hit instantly
            e.y = py + CAR_H + 8;
            // Flip if too many bumps in a short window
            if (damageEventsRef.current.length >= 3) {
              flippedRef.current = true;
              deadRef.current = true;
              spinRef.current = 180; // car is upside-down
              setRunning(false);
              break;
            }
          }
        }
      }

      // Decay spin back to upright when not flipped
      if (!flippedRef.current) {
        spinRef.current *= 0.92;
        if (Math.abs(spinRef.current) < 0.5) spinRef.current = 0;
      }

      if (distanceRef.current >= goal && !deadRef.current) {
        setRunning(false);
        setScore(s => s + level * 5);
        onScore(5);
        setFinished(true);
        if (level < MAX_LEVEL) setTimeout(() => { setLevel(l => l + 1); }, 50);
      }

      setTick(t => (t + 1) % 1000000);
      if (!deadRef.current) rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, level]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') { e.preventDefault(); moveLane(-1); }
      if (e.key === 'ArrowRight' || e.key === 'd') { e.preventDefault(); moveLane(1); }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });

  const start = () => { reset(); setRunning(true); };

  // Touch move mapping
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart.current || !running || flippedRef.current) return;
    const dx = e.touches[0].clientX - touchStart.current.x;
    if (Math.abs(dx) > 30) {
      moveLane(dx > 0 ? 1 : -1);
      touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const px = laneRef.current * LANE_W + (LANE_W - CAR_W) / 2;
  const progress = Math.min(100, (distanceRef.current / goal) * 100);
  const damageCount = damageEventsRef.current.length;

  return (
    <div className="space-y-3">
      <LevelHUD level={level} score={score} />
      <div className="flex justify-center items-center gap-2 text-[10px]">
        <span className="px-2 py-0.5 rounded-full bg-success/10 text-success font-medium">
          🏁 {Math.round(progress)}%
        </span>
        <span className={`px-2 py-0.5 rounded-full font-medium ${
          damageCount === 0 ? 'bg-secondary text-muted-foreground' :
          damageCount === 1 ? 'bg-amber-500/10 text-amber-600' :
          'bg-destructive/10 text-destructive'
        }`}>
          {lang === 'ar' ? 'صدمات' : 'Bumps'}: {damageCount}/3
        </span>
      </div>
      <div className="flex justify-center">
        <div className="relative rounded-2xl overflow-hidden bg-slate-700 shadow-xl touch-none"
          onTouchStart={onTouchStart} onTouchMove={onTouchMove}
          style={{ width: W, height: H, transform: 'translate3d(0,0,0)' }}>
          {/* lane stripes */}
          {Array.from({ length: LANES - 1 }).map((_, i) => (
            <div key={i} className="absolute top-0 bottom-0 w-0.5"
              style={{ left: (i + 1) * LANE_W - 1 }}>
              {Array.from({ length: 12 }).map((_, j) => (
                <div key={j} className="absolute w-0.5 h-5 bg-yellow-300"
                  style={{ top: ((j * 40 + stripeRef.current) % (H + 40)) - 20 }} />
              ))}
            </div>
          ))}

          {/* finish line near top when close */}
          {progress > 90 && (
            <div className="absolute left-0 right-0 h-3 flex"
              style={{ top: Math.max(0, ((100 - progress) / 10) * (H - 60)) }}>
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} className={`flex-1 ${i % 2 === 0 ? 'bg-white' : 'bg-black'}`} />
              ))}
            </div>
          )}

          {/* enemies */}
          {enemiesRef.current.map((e) => {
            const ex = e.lane * LANE_W + (LANE_W - CAR_W) / 2;
            return (
              <div key={e.id} className="absolute flex items-center justify-center text-3xl"
                style={{ left: ex, top: e.y, width: CAR_W, height: CAR_H, transform: 'rotate(180deg)' }}>
                {e.emoji}
              </div>
            );
          })}
          {/* player */}
          <div className="absolute flex items-center justify-center text-3xl transition-all duration-100"
            style={{
              left: px,
              top: H - CAR_H - 12,
              width: CAR_W,
              height: CAR_H,
              transform: `rotate(${spinRef.current.toFixed(1)}deg)`,
              filter: flippedRef.current ? 'grayscale(0.6)' : 'none',
            }}>
            🏎️
          </div>
          {/* progress */}
          <div className="absolute top-2 left-2 right-2 h-1.5 rounded-full bg-background/40">
            <div className="h-full rounded-full bg-success" style={{ width: `${progress}%` }} />
          </div>
          {!running && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 gap-2 text-center px-4">
              {flippedRef.current && (
                <p className="text-sm font-bold text-destructive">
                  {lang === 'ar' ? '💥 انقلبت السيارة!' : '💥 Car flipped!'}
                </p>
              )}
              {finished && !flippedRef.current && (
                <div className="space-y-1">
                  <p className="text-lg font-bold text-success">
                    {lang === 'ar' ? '🏁 وصلتي للنهاية!' : '🏁 Reached the finish!'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {lang === 'ar' ? `المستوى ${level} اكتمل` : `Level ${level} complete`}
                  </p>
                </div>
              )}
              <button onClick={start}
                className="px-6 py-3 rounded-xl gradient-primary text-primary-foreground font-bold shadow-lg active:scale-95">
                {finished || flippedRef.current ? (lang === 'ar' ? '🔄 إعادة' : '🔄 Restart') : (lang === 'ar' ? '▶ ابدئي' : '▶ Start')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2D Racing touch controls: explicit buttons for better mobile feel */}
      <div className="flex justify-center gap-4 py-2" dir="ltr">
        <button
          onTouchStart={(e) => { e.preventDefault(); moveLane(-1); }}
          onMouseDown={(e) => { e.preventDefault(); moveLane(-1); }}
          className="w-16 h-14 rounded-2xl bg-secondary/80 border-b-4 border-secondary text-2xl font-bold active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center shadow-lg"
        >
          ←
        </button>
        <button
          onTouchStart={(e) => { e.preventDefault(); snapToLane(1); }}
          onMouseDown={(e) => { e.preventDefault(); snapToLane(1); }}
          className="w-20 h-14 rounded-2xl bg-primary text-white border-b-4 border-primary-foreground/30 text-xs font-black active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center shadow-lg uppercase"
        >
          {lang === 'ar' ? 'الوسط' : 'Center'}
        </button>
        <button
          onTouchStart={(e) => { e.preventDefault(); moveLane(1); }}
          onMouseDown={(e) => { e.preventDefault(); moveLane(1); }}
          className="w-16 h-14 rounded-2xl bg-secondary/80 border-b-4 border-secondary text-2xl font-bold active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center shadow-lg"
        >
          →
        </button>
      </div>

      <p className="text-center text-[10px] text-muted-foreground">
        {lang === 'ar'
          ? 'تجنبي السيارات الأخرى! 3 صدمات قوية ستؤدي لانقلاب السيارة.'
          : 'Avoid other cars! 3 heavy bumps will flip your car.'}
      </p>
    </div>
  );
};

export default RacingGame;
