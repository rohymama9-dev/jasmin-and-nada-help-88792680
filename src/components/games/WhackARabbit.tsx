import { useEffect, useRef, useState, useCallback } from 'react';
import { useLang } from '@/contexts/LanguageContext';

interface Props { onScore?: (n: number) => void; }

interface Hole { id: number; kind: 'rabbit' | 'bomb' | null; until: number; hit: boolean; }
interface Particle { id: number; x: number; y: number; vx: number; vy: number; life: number; text: string; color: string; }

const HOLES = 9;

const WhackARabbit = ({ onScore }: Props) => {
  const { lang } = useLang();
  const [holes, setHoles] = useState<Hole[]>(() => Array.from({ length: HOLES }, (_, i) => ({ id: i, kind: null, until: 0, hit: false })));
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [level, setLevel] = useState(1);
  const [running, setRunning] = useState(false);
  const [time, setTime] = useState(45);
  const [particles, setParticles] = useState<Particle[]>([]);
  const pid = useRef(0);

  const popUp = useCallback(() => {
    const speed = Math.max(450, 1300 - level * 90);
    const lifetime = Math.max(550, 1100 - level * 70);
    const bombChance = Math.min(0.4, 0.08 + level * 0.03);
    setHoles(prev => {
      const empty = prev.filter(h => h.kind === null);
      if (!empty.length) return prev;
      const target = empty[Math.floor(Math.random() * empty.length)];
      const isBomb = Math.random() < bombChance;
      return prev.map(h => h.id === target.id ? { ...h, kind: isBomb ? 'bomb' : 'rabbit', until: Date.now() + lifetime, hit: false } : h);
    });
    return speed;
  }, [level]);

  // Spawn loop
  useEffect(() => {
    if (!running) return;
    let t: number;
    const tick = () => {
      const next = popUp();
      t = window.setTimeout(tick, next);
    };
    t = window.setTimeout(tick, 600);
    return () => window.clearTimeout(t);
  }, [running, popUp]);

  // Hide expired
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const now = Date.now();
      setHoles(prev => prev.map(h => (h.kind && now > h.until) ? { id: h.id, kind: null, until: 0, hit: false } : h));
    }, 100);
    return () => clearInterval(id);
  }, [running]);

  // Timer
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setTime(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  useEffect(() => { if (time <= 0 && running) { setRunning(false); onScore?.(Math.min(20, Math.floor(score / 5))); } }, [time, running, score, onScore]);

  // Level up every 10 hits
  useEffect(() => { setLevel(1 + Math.floor(score / 10)); }, [score]);

  // Particles tick
  useEffect(() => {
    if (!particles.length) return;
    const id = window.setInterval(() => {
      setParticles(prev => prev.map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.3, life: p.life - 1 })).filter(p => p.life > 0));
    }, 40);
    return () => clearInterval(id);
  }, [particles.length]);

  const spawnParticles = (idx: number, text: string, color: string) => {
    const burst: Particle[] = Array.from({ length: 8 }, () => ({
      id: ++pid.current, x: 50, y: 50,
      vx: (Math.random() - 0.5) * 6, vy: -Math.random() * 5 - 2,
      life: 18, text, color,
    }));
    setParticles(prev => [...prev, ...burst.map(b => ({ ...b, id: ++pid.current, x: (idx % 3) * 33 + 16, y: Math.floor(idx / 3) * 33 + 16 }))]);
  };

  const whack = (h: Hole) => {
    if (!running || !h.kind || h.hit) return;
    if (h.kind === 'rabbit') {
      setScore(s => s + 1);
      spawnParticles(h.id, 'POW!', 'text-yellow-300');
    } else {
      setMisses(m => m + 1);
      setScore(s => Math.max(0, s - 2));
      spawnParticles(h.id, '💥', 'text-red-400');
    }
    setHoles(prev => prev.map(x => x.id === h.id ? { ...x, hit: true, kind: null } : x));
  };

  const start = () => { setScore(0); setMisses(0); setLevel(1); setTime(45); setRunning(true); setHoles(prev => prev.map(h => ({ ...h, kind: null, hit: false }))); };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl p-3 bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-between">
        <div>
          <p className="text-[11px] opacity-90">{lang === 'ar' ? 'اضرب الأرنب' : 'Whack-A-Rabbit'}</p>
          <p className="text-2xl font-extrabold">🐰 {score}</p>
        </div>
        <div className="text-right text-xs space-y-0.5">
          <p>⏱ {time}s</p>
          <p>📈 Lv {level}</p>
          <p>💥 {misses}</p>
        </div>
      </div>

      <div dir="ltr" className="relative grid grid-cols-3 gap-2 max-w-sm mx-auto p-3 rounded-2xl bg-gradient-to-b from-emerald-700 to-emerald-900"
        style={{ transform: 'translate3d(0,0,0)' }}>
        {holes.map(h => (
          <button key={h.id} onClick={() => whack(h)}
            className="relative aspect-square rounded-full bg-amber-950/80 ring-2 ring-amber-900 overflow-hidden active:scale-95">
            {h.kind && (
              <span className="absolute inset-0 flex items-center justify-center text-4xl animate-[bounce_0.4s_ease-out]">
                {h.kind === 'rabbit' ? '🐰' : '💣'}
              </span>
            )}
          </button>
        ))}
        {/* Particles overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map(p => (
            <span key={p.id} className={`absolute font-extrabold text-sm ${p.color}`}
              style={{ left: `${p.x}%`, top: `${p.y}%`, opacity: p.life / 20 }}>
              {p.text}
            </span>
          ))}
        </div>
      </div>

      <div className="text-center">
        {!running ? (
          <button onClick={start}
            className="px-6 py-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white font-extrabold shadow-lg active:scale-95">
            {time <= 0 ? (lang === 'ar' ? '🔁 العب مجدداً' : '🔁 Play Again') : (lang === 'ar' ? '▶ ابدأ' : '▶ Start')}
          </button>
        ) : (
          <p className="text-xs text-muted-foreground">
            {lang === 'ar' ? 'اضربي الأرانب فقط — تجنبي القنابل!' : 'Whack rabbits only — avoid bombs!'}
          </p>
        )}
      </div>
    </div>
  );
};

export default WhackARabbit;
