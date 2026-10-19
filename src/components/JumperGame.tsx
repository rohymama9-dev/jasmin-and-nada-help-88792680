import { useState, useEffect, useRef, useCallback } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import LevelHUD from './games/LevelHUD';

interface Props { onScore: (pts: number) => void; }

/**
 * Icy Tower-style vertical platformer with a freezing-ice hazard.
 * - Player auto-bounces on platforms; move left/right to climb.
 * - Each platform shows its number (climb count from the ground).
 * - Rising ice starts very slowly and accelerates as the rabbit climbs higher.
 *   If the ice catches the rabbit, game over.
 * - Falling below the visible area also = game over.
 */

const W = 320;
const H = 480;
const PLAYER_W = 26;
const PLAYER_H = 30;
const PLAT_W = 70;
const PLAT_H = 14;
const GRAVITY = 0.55;       // FIXED — not scaled with level
const JUMP_VY = -11.5;      // FIXED — constant jump height ~120px always reachable
const MOVE_SPEED = 4.5;     // base; scaled by speedMult for horizontal challenge

// Ice tuning: starts at the very bottom of the world, rises in WORLD coords
// (up = negative y). Rising rate scales with how high the player has climbed.
const ICE_BASE_RISE = 0.18;      // px per frame at the start (1.5x base increase)
const ICE_ACCEL_PER_PX = 0.0006;  // extra rise per pixel climbed (slightly more acceleration)

interface Platform { x: number; y: number; index: number }

const JumperGame = ({ onScore }: Props) => {
  const { lang } = useLang();
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [running, setRunning] = useState(false);
  const [, force] = useState(0);

  // World state in refs (avoid React re-render in loop)
  const px = useRef(W / 2);
  const py = useRef(H - 80);
  const vx = useRef(0);
  const vy = useRef(0);
  const cameraY = useRef(0);
  const platsRef = useRef<Platform[]>([]);
  const platCounterRef = useRef(0);
  const keysRef = useRef<{ l: boolean; r: boolean }>({ l: false, r: false });
  const jumpQueuedRef = useRef(false);
  const onGroundRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const deadRef = useRef(false);
  const maxClimbRef = useRef(0);
  const iceY = useRef(0); // world Y of the top of the ice (lower number = higher)
  const groundY = useRef(0);

  const reset = useCallback(() => {
    px.current = W / 2;
    py.current = H - 80;
    vx.current = 0;
    vy.current = 0;
    cameraY.current = 0;
    deadRef.current = false;
    maxClimbRef.current = 0;
    platCounterRef.current = 0;
    // Generate initial platforms; ground = index 0
    const ground: Platform = { x: W / 2 - PLAT_W / 2, y: H - 40, index: 0 };
    groundY.current = ground.y;
    iceY.current = ground.y + 40; // ice starts just below the ground
    const plats: Platform[] = [ground];
    let lastY = H - 40;
    for (let i = 0; i < 14; i++) {
      lastY -= 60 + Math.random() * 30;
      platCounterRef.current += 1;
      plats.push({ x: Math.random() * (W - PLAT_W), y: lastY, index: platCounterRef.current });
    }
    platsRef.current = plats;
    setScore(0);
  }, []);

  useEffect(() => { reset(); }, [reset]);

  const start = () => {
    reset();
    setRunning(true);
  };

  // Keyboard
  useEffect(() => {
    const dn = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); keysRef.current.l = true; }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); keysRef.current.r = true; }
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); jumpQueuedRef.current = true; }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keysRef.current.l = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keysRef.current.r = false;
    };
    window.addEventListener('keydown', dn);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up); };
  }, []);

  const press = (dir: 'l' | 'r', val: boolean) => { keysRef.current[dir] = val; };
  const pressJump = () => { jumpQueuedRef.current = true; };

  useEffect(() => {
    if (!running) return;
    let lastTime = performance.now();
    const loop = (time: number) => {
      const dt = Math.min(32, time - lastTime) / 16.666; // Normalized delta time
      lastTime = time;

      const lvl = 1 + Math.floor(score / 25);
      // Only horizontal speed scales with level — vertical physics is CONSTANT
      // so the rabbit always reaches the same height regardless of difficulty
      const speedMult = 1 + Math.min(3, (lvl - 1) * 0.25);
      const grav = GRAVITY * dt;  // constant gravity — no speedMult scaling

      if (keysRef.current.l) vx.current = -MOVE_SPEED * speedMult;
      else if (keysRef.current.r) vx.current = MOVE_SPEED * speedMult;
      else vx.current *= Math.pow(0.85, dt);

      vy.current += grav;
      const prevY = py.current;
      px.current += vx.current * dt;
      py.current += vy.current * dt;

      if (px.current < -PLAYER_W) px.current = W;
      if (px.current > W) px.current = -PLAYER_W;

      if (vy.current > 0) {
        for (const p of platsRef.current) {
          const onPlat =
            prevY + PLAYER_H <= p.y &&
            py.current + PLAYER_H >= p.y &&
            px.current + PLAYER_W > p.x &&
            px.current < p.x + PLAT_W;
          if (onPlat) {
            py.current = p.y - PLAYER_H;
            vy.current = 0;
            onGroundRef.current = true;
            const climbed = Math.max(0, maxClimbRef.current - py.current);
            if (climbed > 0) {
              maxClimbRef.current = py.current;
              const gained = Math.floor(climbed / 10);
              if (gained > 0) {
                setScore(s => {
                  const ns = s + gained;
                  if (ns > highScore) setHighScore(ns);
                  return ns;
                });
              }
            } else {
              maxClimbRef.current = py.current;
            }
            break;
          }
        }
      }

      if (jumpQueuedRef.current && onGroundRef.current) {
        // CONSTANT jump velocity — no speedMult — always reaches ~120px height
        vy.current = JUMP_VY;
        onGroundRef.current = false;
      }
      jumpQueuedRef.current = false;

      const target = py.current - H * 0.45;
      if (target < cameraY.current) cameraY.current = target;

      const screenBottom = cameraY.current + H + 100;
      platsRef.current = platsRef.current.filter(p => p.y < screenBottom);
      const topY = Math.min(...platsRef.current.map(p => p.y));
      if (platsRef.current.length < 14) {
        let y = topY;
        while (platsRef.current.length < 16) {
          // Max gap is always safely reachable with JUMP_VY=-11.5 (height≈120px)
          // Keep max gap at 65px so there's always 55px of headroom
          const maxGap = Math.max(20, Math.min(65, 70 - lvl * 2));
          y -= 25 + Math.random() * maxGap;
          platCounterRef.current += 1;
          platsRef.current.push({
            x: Math.random() * (W - PLAT_W),
            y,
            index: platCounterRef.current,
          });
        }
      }

      const climbedTotal = Math.max(0, groundY.current - py.current);
      const riseRate = (ICE_BASE_RISE + climbedTotal * ICE_ACCEL_PER_PX) * dt;
      iceY.current -= riseRate;

      const caughtByIce = py.current + PLAYER_H >= iceY.current;
      const fell = py.current > cameraY.current + H + 40;
      if (caughtByIce || fell) {
        deadRef.current = true;
        setRunning(false);
        onScore(0);
        setScore(0);
        return;
      }

      force(t => (t + 1) % 1000000);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [running, score, onScore, highScore]);

  // Award points to global pool whenever score crosses a threshold
  const lastAwardedRef = useRef(0);
  useEffect(() => {
    const milestones = Math.floor(score / 50);
    if (milestones > lastAwardedRef.current) {
      onScore(2 * (milestones - lastAwardedRef.current));
      lastAwardedRef.current = milestones;
    }
    if (score === 0) lastAwardedRef.current = 0;
  }, [score, onScore]);

  const drawY = (worldY: number) => worldY - cameraY.current;
  const currentLevel = 1 + Math.floor(score / 25);

  // Ice top in screen coords (where the visible ice surface is right now)
  const iceTopScreen = drawY(iceY.current);

  return (
    <div className="space-y-3">
      <LevelHUD level={currentLevel} maxLevel={20} score={score} />
      <div className="text-center text-xs text-muted-foreground">
        {lang === 'ar' ? `أعلى نقطة: ${highScore} · سرعة المستوى ×${(1 + Math.min(4, (currentLevel - 1) * 0.35)).toFixed(2)}` : `Best: ${highScore} · Lv speed ×${(1 + Math.min(4, (currentLevel - 1) * 0.35)).toFixed(2)}`}
      </div>
      <div className="flex justify-center">
        <div className="relative rounded-2xl bg-gradient-to-b from-sky-200 via-indigo-200 to-purple-300 dark:from-slate-800 dark:via-indigo-950 dark:to-purple-950 overflow-hidden select-none touch-none"
          style={{ width: W, height: H, transform: 'translate3d(0,0,0)' }}>
          {/* Platforms with numbered labels */}
          {platsRef.current.map((p) => {
            const y = drawY(p.y);
            if (y < -20 || y > H) return null;
            return (
              <div key={p.index} className="absolute rounded-md bg-emerald-500 shadow flex items-center justify-center text-[10px] font-extrabold text-white"
                style={{ left: p.x, top: y, width: PLAT_W, height: PLAT_H }}>
                {p.index}
              </div>
            );
          })}
          {/* Player */}
          <div className="absolute rounded-md bg-primary flex items-center justify-center text-base shadow-lg z-10"
            style={{ left: px.current, top: drawY(py.current), width: PLAYER_W, height: PLAYER_H }}>🐰</div>

          {/* Freezing ice — rises from bottom, accelerates with climb */}
          {iceTopScreen < H + 20 && (
            <div className="absolute left-0 right-0 pointer-events-none"
              style={{
                top: Math.max(-20, iceTopScreen),
                bottom: 0,
                background: 'linear-gradient(to bottom, rgba(186,230,253,0.95) 0%, rgba(125,211,252,0.95) 30%, rgba(56,189,248,0.95) 100%)',
                borderTop: '3px solid #e0f2fe',
                boxShadow: '0 -4px 12px rgba(125,211,252,0.6)',
              }}>
              {/* Frosty crystals along the ice surface */}
              <div className="absolute top-0 left-0 right-0 flex justify-between px-2 -translate-y-1 text-sm">
                <span>❄</span><span>❄</span><span>❄</span><span>❄</span><span>❄</span><span>❄</span><span>❄</span>
              </div>
            </div>
          )}

          <div className="absolute top-2 right-2 px-3 py-1 rounded-xl bg-gradient-to-br from-pink-500 to-fuchsia-600 text-white text-sm font-extrabold shadow-lg z-20">
            Lv {currentLevel}
          </div>
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-background/70 text-xs font-bold z-20">
            ⭐ {score}
          </div>
          {!running && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-30">
              {deadRef.current && (
                <p className="text-sm font-semibold text-foreground mb-3">
                  {lang === 'ar' ? '🧊 أمسك بكِ الجليد!' : '🧊 The ice caught you!'}
                </p>
              )}
              <button onClick={start}
                className="px-5 py-2.5 rounded-xl gradient-primary text-primary-foreground font-bold">
                {deadRef.current ? (lang === 'ar' ? '🔄 حاول مجدداً' : '🔄 Retry') : (lang === 'ar' ? '▶ ابدأ القفز' : '▶ Start Jumping')}
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Mobile controls */}
      <div className="flex justify-center gap-3" dir="ltr">
        <button
          onTouchStart={() => press('l', true)} onTouchEnd={() => press('l', false)}
          onMouseDown={() => press('l', true)} onMouseUp={() => press('l', false)} onMouseLeave={() => press('l', false)}
          className="w-20 h-14 rounded-xl bg-secondary text-foreground text-2xl font-bold active:scale-95">←</button>
        <button
          onTouchStart={pressJump} onMouseDown={pressJump}
          className="w-24 h-14 rounded-xl bg-primary text-primary-foreground text-base font-extrabold active:scale-95">
          ⤴ {lang === 'ar' ? 'قفز' : 'JUMP'}
        </button>
        <button
          onTouchStart={() => press('r', true)} onTouchEnd={() => press('r', false)}
          onMouseDown={() => press('r', true)} onMouseUp={() => press('r', false)} onMouseLeave={() => press('r', false)}
          className="w-20 h-14 rounded-xl bg-secondary text-foreground text-2xl font-bold active:scale-95">→</button>
      </div>
      <p className="text-center text-[10px] text-muted-foreground">
        {lang === 'ar'
          ? '🎮 تحكم يدوي: ← → للحركة، مسافة/سهم أعلى أو زر القفز. الجليد يصعد ببطء ثم يتسارع.'
          : '🎮 Manual control: ← → to move, Space / Up / JUMP button to leap. Ice rises slowly then accelerates.'}
      </p>
    </div>
  );
};

export default JumperGame;
