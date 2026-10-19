import { useEffect, useMemo } from 'react';

interface Props {
  name: string;
  onDone: () => void;
  /** ms before onDone fires. Keep short — this is an entry burst, not a splash. */
  duration?: number;
}

/**
 * Fast vibrant pink/red flower burst shown right after auth, before the dashboard.
 * Pure CSS animations — no extra deps. Calls onDone after `duration` ms.
 */
const FLOWERS = ['🌸', '🌺', '🌹', '🏵️', '💮', '🌷', '🌻'];
const COLORS = [
  'hsl(340 85% 65%)', // pink
  'hsl(350 90% 60%)', // rose
  'hsl(0 80% 58%)',   // red
  'hsl(335 80% 70%)', // soft pink
  'hsl(10 85% 60%)',  // coral red
];

const FlowerEntryAnimation = ({ name, onDone, duration = 2200 }: Props) => {
  // Pre-compute petal positions once so render is stable.
  const petals = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        emoji: FLOWERS[i % FLOWERS.length],
        left: Math.random() * 100,
        delay: Math.random() * 600,
        duration: 1100 + Math.random() * 900,
        size: 22 + Math.floor(Math.random() * 28),
        color: COLORS[i % COLORS.length],
        rotate: Math.floor(Math.random() * 360),
      })),
    []
  );

  useEffect(() => {
    const id = window.setTimeout(onDone, duration);
    return () => window.clearTimeout(id);
  }, [onDone, duration]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at 50% 40%, hsl(340 80% 95%) 0%, hsl(0 70% 90%) 60%, hsl(340 60% 80%) 100%)',
      }}
      aria-hidden
    >
      {/* Falling / rising flowers */}
      {petals.map((p, i) => (
        <span
          key={i}
          className="absolute select-none"
          style={{
            left: `${p.left}%`,
            top: '-10%',
            fontSize: `${p.size}px`,
            color: p.color,
            filter: 'drop-shadow(0 2px 4px rgba(220, 40, 90, 0.35))',
            animation: `flowerFall ${p.duration}ms cubic-bezier(0.22, 0.61, 0.36, 1) ${p.delay}ms forwards`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        >
          {p.emoji}
        </span>
      ))}

      {/* Burst from center */}
      {Array.from({ length: 14 }).map((_, i) => {
        const angle = (i / 14) * Math.PI * 2;
        const dx = Math.cos(angle) * 220;
        const dy = Math.sin(angle) * 220;
        return (
          <span
            key={`b-${i}`}
            className="absolute text-3xl select-none"
            style={{
              left: '50%',
              top: '50%',
              animation: `flowerBurst 900ms cubic-bezier(0.16, 1, 0.3, 1) forwards`,
              ['--dx' as string]: `${dx}px`,
              ['--dy' as string]: `${dy}px`,
            }}
          >
            {FLOWERS[i % FLOWERS.length]}
          </span>
        );
      })}

      {/* Greeting */}
      <div className="relative z-10 text-center px-6 animate-flowerWelcomeIn">
        <div
          className="mx-auto mb-4 w-20 h-20 rounded-full flex items-center justify-center shadow-2xl"
          style={{ background: 'linear-gradient(135deg, hsl(340 90% 65%), hsl(0 85% 60%))' }}
        >
          <span className="text-4xl">🌸</span>
        </div>
        <h1
          className="text-3xl md:text-4xl font-extrabold drop-shadow-sm"
          style={{ color: 'hsl(340 70% 30%)' }}
        >
          {name ? `🌹 ${name}` : '🌹'}
        </h1>
        <p className="mt-1 text-sm font-semibold" style={{ color: 'hsl(0 60% 35%)' }}>
          welcome • أهلاً بكِ
        </p>
      </div>

      <style>{`
        @keyframes flowerFall {
          0%   { transform: translateY(-20vh) rotate(0deg) scale(0.6); opacity: 0; }
          10%  { opacity: 1; }
          100% { transform: translateY(120vh) rotate(540deg) scale(1); opacity: 0; }
        }
        @keyframes flowerBurst {
          0%   { transform: translate(-50%, -50%) scale(0.2); opacity: 0; }
          25%  { opacity: 1; }
          100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1) rotate(360deg); opacity: 0; }
        }
        @keyframes flowerWelcomeIn {
          0%   { transform: scale(0.6); opacity: 0; }
          60%  { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-flowerWelcomeIn { animation: flowerWelcomeIn 700ms cubic-bezier(0.16, 1, 0.3, 1) both; }
      `}</style>
    </div>
  );
};

export default FlowerEntryAnimation;
