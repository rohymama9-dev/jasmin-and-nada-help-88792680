import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { addPoints, getSkills } from '@/lib/metaGame';
import { playRain, playFire, playCafe, playChime } from '@/lib/asmrAudio';

type SoundKey = 'rain' | 'fire' | 'cafe';

export default function DeepFocusRoom({ onExit }: { onExit: () => void }) {
  const [minutes, setMinutes] = useState(25 * 60);
  const [active, setActive] = useState<Record<SoundKey, boolean>>({ rain: false, fire: false, cafe: false });
  const stopsRef = useRef<Partial<Record<SoundKey, () => void>>>({});

  useEffect(() => {
    const id = setInterval(() => setMinutes(m => Math.max(0, m - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (minutes === 0) {
      const mult = getSkills().deepFocus ? 1.5 : 1;
      const reward = Math.round(25 * mult);
      addPoints(reward);
      try {
        const cur = parseInt(localStorage.getItem('total_focus_minutes') || '0', 10);
        localStorage.setItem('total_focus_minutes', String(cur + 25));
      } catch {}
      window.dispatchEvent(new CustomEvent('pomodoro-completed'));
      playChime();
      toast.success(`أتممت جلسة عميقة! +${reward} نقطة`);
      Object.values(stopsRef.current).forEach(fn => fn?.());
      onExit();
    }
  }, [minutes, onExit]);

  const toggle = (k: SoundKey) => {
    const isOn = active[k];
    if (isOn) {
      stopsRef.current[k]?.();
      stopsRef.current[k] = undefined;
    } else {
      const fn = k === 'rain' ? playRain : k === 'fire' ? playFire : playCafe;
      stopsRef.current[k] = fn();
    }
    setActive(a => ({ ...a, [k]: !isOn }));
  };

  const stopAll = () => {
    Object.values(stopsRef.current).forEach(fn => fn?.());
    onExit();
  };

  const mm = String(Math.floor(minutes / 60)).padStart(2, '0');
  const ss = String(minutes % 60).padStart(2, '0');

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#0f172a,#1e1b4b,#312e81,#1e1b4b,#0f172a)] bg-[length:400%_400%] animate-[deepgrad_18s_ease_infinite]" />
      <style>{`@keyframes deepgrad { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }`}</style>
      <div className="relative z-10 text-center">
        <div className="text-white/60 text-sm tracking-[0.4em] uppercase mb-2">Deep Focus</div>
        <div className="text-white font-mono text-8xl sm:text-9xl font-bold drop-shadow-2xl">{mm}:{ss}</div>
        <div className="flex gap-3 justify-center mt-8">
          {(['rain', 'fire', 'cafe'] as SoundKey[]).map(k => (
            <button
              key={k}
              onClick={() => toggle(k)}
              className={`w-14 h-14 rounded-full border-2 text-2xl transition-all ${active[k] ? 'bg-white/30 border-white scale-110' : 'bg-white/5 border-white/30 text-white/70'}`}
            >
              {k === 'rain' ? '🌧️' : k === 'fire' ? '🔥' : '☕'}
            </button>
          ))}
        </div>
        <button onClick={stopAll} className="mt-10 px-8 py-3 rounded-full bg-white/10 backdrop-blur border border-white/30 text-white font-bold hover:bg-white/20">
          إيقاف
        </button>
      </div>
    </div>
  );
}