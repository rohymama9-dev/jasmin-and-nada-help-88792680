import { useEffect, useRef, useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';

interface Props { onScore?: (n: number) => void; }

const W = 380, H = 560;
const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7'];
const R = 11;
const STEP = R * 2; // strict adjacency — touching marbles
const FROG_Y = H - 50;
const FROG_CLEAR = 90; // empty zone above frog so marbles never touch it
const SAFE_BOTTOM = FROG_Y - FROG_CLEAR;
const SAFE_TOP = 40;
const SAFE_LEFT = 30;
const SAFE_RIGHT = W - 30;

/** Build a smooth path by sampling. The number of maps grows with level. */
function buildPath(map: number, samples = 1400): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < samples; i++) {
    const t = i / samples;
    let x = 0, y = 0;
    switch (map % 6) {
      case 0: { // Aztec spiral
        const a = t * Math.PI * 6;
        const r = 30 + (1 - t) * 170;
        x = W / 2 + Math.cos(a) * r;
        y = H / 2 + Math.sin(a) * r;
        break;
      }
      case 1: { // S-curve
        x = 30 + t * (W - 60);
        y = 60 + Math.sin(t * Math.PI * 3) * 140 + t * 60;
        break;
      }
      case 2: { // Loop
        const a = t * Math.PI * 2;
        x = W / 2 + Math.cos(a) * (160 - t * 40);
        y = 100 + Math.sin(a) * (160 - t * 40) + t * 100;
        break;
      }
      case 3: { // Snake rows
        const row = Math.floor(t * 5);
        const tt = (t * 5) - row;
        const dir = row % 2 === 0 ? tt : 1 - tt;
        x = 30 + dir * (W - 60);
        y = 80 + row * 70;
        break;
      }
      case 4: { // Figure-8
        const a = t * Math.PI * 2;
        x = W / 2 + Math.sin(a * 2) * 140;
        y = 80 + (1 - Math.cos(a)) * 180;
        break;
      }
      case 5: { // Heart-ish double-arc
        const a = t * Math.PI * 2;
        x = W / 2 + Math.sin(a) * 150;
        y = 90 + (Math.cos(a * 2) * -80 + 160) * (0.6 + t * 0.4);
        break;
      }
    }
    pts.push({ x, y });
  }
  // Fit path inside the safe rectangle so marbles never crowd the frog.
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
  }
  const sx = (SAFE_RIGHT - SAFE_LEFT) / Math.max(1, maxX - minX);
  const sy = (SAFE_BOTTOM - SAFE_TOP) / Math.max(1, maxY - minY);
  const s = Math.min(sx, sy);
  const offX = SAFE_LEFT + ((SAFE_RIGHT - SAFE_LEFT) - (maxX - minX) * s) / 2;
  const offY = SAFE_TOP + ((SAFE_BOTTOM - SAFE_TOP) - (maxY - minY) * s) / 2;
  return pts.map(p => ({ x: offX + (p.x - minX) * s, y: offY + (p.y - minY) * s }));
}

type Marble = { idx: number; color: string; bomb?: boolean };
type Shot = { x: number; y: number; vx: number; vy: number; color: string; bomb?: boolean };

const THEMES = [
  { name: 'Dark Space', bg: '#0f172a', path: '#1e293b', skin: 'frog' },
  { name: 'Jungle', bg: '#064e3b', path: '#14532d', skin: 'monkey' },
  { name: 'Desert', bg: '#451a03', path: '#78350f', skin: 'camel' },
  { name: 'Ocean', bg: '#1e3a8a', path: '#1e40af', skin: 'dolphin' },
  { name: 'Volcano', bg: '#450a0a', path: '#7f1d1d', skin: 'dragon' },
];

const ZumaMarble = ({ onScore }: Props) => {
  const { lang } = useLang();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [won, setWon] = useState(false);
  const [lost, setLost] = useState(false);

  const stateRef = useRef({
    path: [] as { x: number; y: number }[],
    chain: [] as Marble[],
    shots: [] as Shot[],
    cannon: { x: W / 2, y: FROG_Y, color: COLORS[0], next: COLORS[1], bombNext: false },
    aim: { x: W / 2, y: 100 },
    spawnTick: 0,
    spawned: 0,
    targetSpawn: 30,
    speed: 0.25,
    spawnEvery: 30,
    stopFrontUntilFuse: false, // physics flag
  });

  // Reconfigure on level change
  useEffect(() => {
    const s = stateRef.current;
    const themeIdx = Math.floor((level - 1) / 5) % THEMES.length;
    const mapIdx = Math.floor((level - 1) / 2); // Change path more often
    s.path = buildPath(mapIdx);
    s.chain = [];
    s.shots = [];
    s.spawned = 0;
    s.spawnTick = 0;
    s.targetSpawn = 25 + level * 3;
    s.speed = 0.3 + level * 0.02;
    s.spawnEvery = Math.max(8, 30 - Math.floor(level / 1.5));
    s.cannon.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    s.cannon.next = COLORS[Math.floor(Math.random() * COLORS.length)];
    s.cannon.bombNext = Math.random() < 0.08;
    s.stopFrontUntilFuse = false;
    setWon(false); setLost(false);
  }, [level]);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext('2d')!;
    let raf = 0;
    const loop = () => {
      const s = stateRef.current;
      const theme = THEMES[Math.floor((level - 1) / 5) % THEMES.length];

      if (!won && !lost) {
        // Spawn marbles
        if (s.spawned < s.targetSpawn) {
          if (s.spawnTick <= 0) {
            const isBomb = Math.random() < 0.05;
            s.chain.unshift({ idx: 0, color: COLORS[Math.floor(Math.random() * COLORS.length)], bomb: isBomb });
            s.spawnTick = s.spawnEvery;
            s.spawned++;
          } else s.spawnTick--;
        }

        // Physics Refactor: Segment Stop & Fuse
        if (s.chain.length > 0) {
          // Find the gap if any (caused by destruction)
          let gapIdx = -1;
          for (let i = s.chain.length - 2; i >= 0; i--) {
            if (s.chain[i + 1].idx - s.chain[i].idx > STEP + 0.1) {
              gapIdx = i;
              break;
            }
          }

          if (gapIdx !== -1) {
            s.stopFrontUntilFuse = true;
          }

          // Move the front section (after the gap)
          const head = s.chain[s.chain.length - 1];
          if (!s.stopFrontUntilFuse) {
            head.idx += s.speed;
          }

          // Move marbles and check for fusion
          for (let i = s.chain.length - 2; i >= 0; i--) {
            const ahead = s.chain[i + 1].idx;
            const desired = ahead - STEP;

            if (s.chain[i].idx < desired) {
              // Rear section or marble behind a gap always moves
              s.chain[i].idx += s.speed * 1.5;
              if (s.chain[i].idx >= desired) {
                s.chain[i].idx = desired;
                // If this was the gap closer, resume front movement
                if (i === gapIdx) s.stopFrontUntilFuse = false;
              }
            } else {
              s.chain[i].idx = desired;
            }
          }
        }

        // Lose condition
        if (s.chain.length && s.chain[s.chain.length - 1].idx >= s.path.length - 1) {
          setLives(l => {
            const nl = l - 1;
            if (nl <= 0) setLost(true);
            return nl;
          });
          s.chain = [];
          s.spawned = 0;
        }
        // Win condition
        if (s.spawned >= s.targetSpawn && s.chain.length === 0) {
          setWon(true);
          onScore?.(15 + level);
        }
      }

      // Move shots
      for (const sh of s.shots) { sh.x += sh.vx; sh.y += sh.vy; }
      s.shots = s.shots.filter(sh => sh.x > -20 && sh.x < W + 20 && sh.y > -20 && sh.y < H + 20);

      // Collisions
      for (let si = s.shots.length - 1; si >= 0; si--) {
        const sh = s.shots[si];
        for (let mi = 0; mi < s.chain.length; mi++) {
          const m = s.chain[mi];
          const p = s.path[Math.floor(m.idx)] || s.path[0];
          if (Math.hypot(p.x - sh.x, p.y - sh.y) < R * 2) {
            if (sh.bomb) {
              // Bomb: destroy a cluster of marbles around the impact point.
              const lo = Math.max(0, mi - 4);
              const hi = Math.min(s.chain.length - 1, mi + 4);
              const removed = hi - lo + 1;
              s.chain.splice(lo, removed);
              setScore(sc => sc + removed * 25);
            } else {
              const insert: Marble = { idx: m.idx - 0.01, color: sh.color };
              s.chain.splice(mi, 0, insert);
              for (let k = mi - 1; k >= 0; k--) {
                s.chain[k].idx = Math.min(s.chain[k].idx, s.chain[k + 1].idx - STEP);
              }
              checkMatch(s, mi);
            }
            s.shots.splice(si, 1);
            break;
          }
        }
      }

      // Draw background
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, W, H);

      // Path trail
      ctx.strokeStyle = theme.path;
      ctx.lineWidth = 26;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i < s.path.length; i += 6) {
        const p = s.path[i];
        if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      // Hole
      const end = s.path[s.path.length - 1];
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(end.x, end.y, 16, 0, Math.PI * 2); ctx.fill();

      // Marbles
      for (const m of s.chain) {
        const p = s.path[Math.max(0, Math.min(s.path.length - 1, Math.floor(m.idx)))];
        if (m.bomb) {
          // Rainbow gradient bomb
          const g = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, R);
          g.addColorStop(0, '#fff');
          g.addColorStop(0.5, '#a855f7');
          g.addColorStop(1, '#000');
          ctx.fillStyle = g;
        } else {
          ctx.fillStyle = m.color;
        }
        ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke();
        if (m.bomb) {
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('★', p.x, p.y);
        }
      }

      // Shots — clearly visible bullets with white outline + trail
      for (const sh of s.shots) {
        // Trail
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath(); ctx.arc(sh.x - sh.vx * 1.5, sh.y - sh.vy * 1.5, R * 0.7, 0, Math.PI * 2); ctx.fill();
        // Bullet
        ctx.fillStyle = sh.bomb ? '#fff' : sh.color;
        ctx.beginPath(); ctx.arc(sh.x, sh.y, R + 1, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        if (sh.bomb) {
          ctx.fillStyle = '#000';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('★', sh.x, sh.y);
        }
      }

      // Cannon
      const dx = s.aim.x - s.cannon.x, dy = s.aim.y - s.cannon.y;
      const a = Math.atan2(dy, dx);
      // Lily-pad base
      ctx.fillStyle = theme.skin === 'frog' ? '#15803d' : '#3f3f46';
      ctx.beginPath(); ctx.ellipse(s.cannon.x, s.cannon.y + 8, R * 3, R * 1.6, 0, 0, Math.PI * 2); ctx.fill();
      // Cannon barrel
      ctx.save();
      ctx.translate(s.cannon.x, s.cannon.y);
      ctx.rotate(a);
      ctx.fillStyle = '#475569'; ctx.fillRect(0, -7, 36, 14);
      // Loaded marble
      const loadedColor = s.cannon.bombNext ? '#fff' : s.cannon.color;
      ctx.fillStyle = loadedColor;
      ctx.beginPath(); ctx.arc(36, 0, R + 1, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
      // Body skin
      const skins: Record<string, string> = { frog: '🐸', monkey: '🐒', camel: '🐪', dolphin: '🐬', dragon: '🐲' };
      ctx.font = 'bold 34px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(skins[theme.skin] || '🐸', s.cannon.x, s.cannon.y);
      // Next preview chip (color circle to the side of the frog)
      ctx.fillStyle = s.cannon.next;
      ctx.beginPath(); ctx.arc(s.cannon.x - 36, s.cannon.y + 18, 8, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('NEXT', s.cannon.x - 36, s.cannon.y + 34);

      raf = requestAnimationFrame(loop);
    };

    const checkMatch = (s: typeof stateRef.current, idx: number) => {
      const color = s.chain[idx].color;
      let l = idx, r = idx;
      while (l > 0 && s.chain[l - 1].color === color && !s.chain[l - 1].bomb) l--;
      while (r < s.chain.length - 1 && s.chain[r + 1].color === color && !s.chain[r + 1].bomb) r++;
      const len = r - l + 1;
      if (len >= 3) {
        s.chain.splice(l, len);
        setScore(sc => sc + len * 15);
      }
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [won, lost, level, onScore]);

  const aim = (clientX: number, clientY: number) => {
    const r = canvasRef.current!.getBoundingClientRect();
    stateRef.current.aim.x = ((clientX - r.left) / r.width) * W;
    stateRef.current.aim.y = ((clientY - r.top) / r.height) * H;
  };
  const lastShotAt = useRef<number>(0);
  const shoot = () => {
    if (won || lost) return;
    const now = Date.now();
    if (now - lastShotAt.current < 120) return; // de-dupe touchEnd + click
    lastShotAt.current = now;
    const s = stateRef.current;
    const dx = s.aim.x - s.cannon.x, dy = s.aim.y - s.cannon.y;
    const len = Math.hypot(dx, dy) || 1;
    s.shots.push({
      x: s.cannon.x, y: s.cannon.y,
      vx: (dx / len) * 9, vy: (dy / len) * 9,
      color: s.cannon.color, bomb: s.cannon.bombNext,
    });
    s.cannon.color = s.cannon.next;
    s.cannon.next = COLORS[Math.floor(Math.random() * COLORS.length)];
    s.cannon.bombNext = Math.random() < 0.08;
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-extrabold text-center">🔮 {lang === 'ar' ? 'زوما' : 'Zuma Marble Popper'}</h2>
      <div className="flex items-center justify-between max-w-sm mx-auto px-2 text-sm font-bold">
        <span>❤ {lives}</span>
        <span>⭐ {score}</span>
        <span>🗺 {lang === 'ar' ? `مستوى ${level}` : `Lvl ${level}`}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="w-full max-w-sm mx-auto rounded-2xl border-2 border-foreground/20 cursor-crosshair select-none touch-none"
        style={{ transform: 'translate3d(0,0,0)' }}
        onPointerMove={(e) => aim(e.clientX, e.clientY)}
        onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); aim(e.clientX, e.clientY); shoot(); }}
      />
      {(won || lost) && (
        <div className="text-center space-y-2">
          <p className="font-bold">
            {won
              ? (lang === 'ar' ? `🏆 المستوى ${level} مكتمل!` : `🏆 Level ${level} complete!`)
              : (lang === 'ar' ? '😢 خسارة' : '😢 You lost')}
          </p>
          <div className="flex gap-2 justify-center">
            {won && (
              <button onClick={() => { setLevel(l => l + 1); setWon(false); }}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold text-sm">
                {lang === 'ar' ? '➡ التالي' : '➡ Next'}
              </button>
            )}
            <button onClick={() => { setLives(3); setScore(0); setLevel(1); }}
              className="px-4 py-2 rounded-xl gradient-primary text-primary-foreground font-bold text-sm">
              {lang === 'ar' ? 'إعادة' : 'Restart'}
            </button>
          </div>
        </div>
      )}
      <p className="text-[11px] text-center text-muted-foreground">
        {lang === 'ar' ? '★ كرة قنبلة قوس قزح تدمّر مجموعة' : '★ rainbow bomb destroys a cluster'}
      </p>
    </div>
  );
};

export default ZumaMarble;
