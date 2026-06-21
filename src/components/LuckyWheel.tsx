import { useState, useEffect, useRef } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { usePoints } from '@/hooks/usePoints';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { triggerConfetti } from '@/lib/audio';

const SEGMENTS = [
  { label: '100 النقاط الكبرى', labelEn: '100 Pts', points: 100, color: '#f43f5e', type: 'win' },
  { label: '10 نقاط', labelEn: '10 Pts', points: 10, color: '#8b5cf6', type: 'win' },
  { label: 'حظ أوفر', labelEn: 'Try Again', points: 0, color: '#64748b', type: 'lose' },
  { label: 'ثيم مجاني ليوم', labelEn: 'Free Theme', points: 0, color: '#10b981', type: 'free_theme' },
  { label: '50 نقطة', labelEn: '50 Pts', points: 50, color: '#3b82f6', type: 'win' },
  { label: 'مخصوم 10 نقاط', labelEn: '-10 Pts', points: -10, color: '#ef4444', type: 'lose' },
  { label: '20 نقطة', labelEn: '20 Pts', points: 20, color: '#06b6d4', type: 'win' },
  { label: 'حظ أوفر', labelEn: 'Try Again', points: 0, color: '#84cc16', type: 'lose' },
];

const LAST_SPUN_KEY = 'lucky_wheel_last_spun';

interface LuckyWheelProps {
  onClose: () => void;
}

const LuckyWheel = ({ onClose }: LuckyWheelProps) => {
  const { lang } = useLang();
  const { addPoints } = usePoints();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<typeof SEGMENTS[0] | null>(null);
  const animRef = useRef<number | null>(null);

  const drawWheel = (rot: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const numSegments = SEGMENTS.length;
    const arc = (2 * Math.PI) / numSegments;
    const radius = canvas.width / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    SEGMENTS.forEach((seg, i) => {
      const startAngle = rot + i * arc;
      const endAngle = startAngle + arc;

      // Segment
      ctx.beginPath();
      ctx.moveTo(radius, radius);
      ctx.arc(radius, radius, radius - 4, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.save();
      ctx.translate(radius, radius);
      ctx.rotate(startAngle + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = 'white';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillText(lang === 'ar' ? seg.label : seg.labelEn, radius - 10, 4);
      ctx.restore();
    });

    // Center circle
    ctx.beginPath();
    ctx.arc(radius, radius, 20, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  useEffect(() => {
    drawWheel(rotation);
  }, [rotation, lang]);

  const spin = () => {
    if (spinning) return;

    setResult(null);
    setSpinning(true);

    const totalSpins = 5 + Math.random() * 5; // 5-10 full rotations
    const arc = (2 * Math.PI) / SEGMENTS.length;
    const winIndex = Math.floor(Math.random() * SEGMENTS.length);
    // We want segment winIndex to land under the needle (top = -Math.PI/2)
    // The needle points at angle -Math.PI/2 (top), so we need the segment center at -Math.PI/2
    const targetAngle = -(Math.PI / 2) - arc * winIndex - arc / 2;
    const finalAngle = targetAngle - totalSpins * 2 * Math.PI;

    let startTime: number | null = null;
    const duration = 4000;
    const startRot = rotation;

    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentRot = startRot + (finalAngle - startRot) * ease;

      setRotation(currentRot);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        const won = SEGMENTS[winIndex];
        setResult(won);
        
        if (won.type === 'win' || won.type === 'free_theme') {
          triggerConfetti();
        }

        if (won.type === 'free_theme') {
          localStorage.setItem('free_theme_day', Date.now().toString());
          toast.success(lang === 'ar' 
            ? '🎉 مبروك! حصلت على ثيم مجاني ليوم واحد!' 
            : '🎉 Congrats! You won a free theme for a day!');
        } else if (won.points > 0) {
          addPoints(won.points);
          toast.success(lang === 'ar'
            ? `🎰 مبروك! ربحتِ ${won.points} نقطة!`
            : `🎰 Congrats! You won ${won.points} points!`);
        } else if (won.points < 0) {
          addPoints(won.points);
          toast.error(lang === 'ar'
            ? `😢 أووه لا! تم خصم ${Math.abs(won.points)} نقطة!`
            : `😢 Oh no! You lost ${Math.abs(won.points)} points!`);
        } else {
          toast(lang === 'ar' ? '😅 حظ أوفر في المرة القادمة!' : '😅 Better luck next time!');
        }
      }
    };

    animRef.current = requestAnimationFrame(animate);
  };

  const hasSpunToday = () => {
    const last = localStorage.getItem(LAST_SPUN_KEY);
    if (!last) return false;
    const lastDate = new Date(parseInt(last, 10)).toDateString();
    return lastDate === new Date().toDateString();
  };

  const handleSpin = () => {
    if (hasSpunToday()) {
      toast.error(lang === 'ar'
        ? '⏰ نفّذت دورة عجلة الحظ اليوم! عودي غداً'
        : '⏰ Already spun today! Come back tomorrow');
      return;
    }
    localStorage.setItem(LAST_SPUN_KEY, Date.now().toString());
    spin();
  };

  const spunToday = hasSpunToday();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-white/20">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 transition-colors"
        >
          <X size={16} />
        </button>

        <h2 className="text-xl font-black text-center mb-1 text-slate-800 dark:text-white">
          {lang === 'ar' ? '🎰 عجلة الحظ اليومية' : '🎰 Daily Lucky Wheel'}
        </h2>
        <p className="text-xs text-center text-slate-500 dark:text-slate-400 mb-5">
          {lang === 'ar' ? 'دوّري مرة واحدة يومياً!' : 'Spin once per day!'}
        </p>

        {/* Needle */}
        <div className="relative flex justify-center mb-4">
          <div
            className="absolute top-0 z-10 w-0 h-0"
            style={{
              borderLeft: '10px solid transparent',
              borderRight: '10px solid transparent',
              borderTop: '24px solid #f43f5e',
              left: 'calc(50% - 10px)',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
            }}
          />
          <canvas
            ref={canvasRef}
            width={240}
            height={240}
            className="rounded-full shadow-lg"
          />
        </div>

        {result && (
          <div className={`text-center py-3 px-4 rounded-2xl mb-4 font-bold text-sm ${
            result.type === 'win' || result.type === 'free_theme'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}>
            {result.type === 'win'
              ? (lang === 'ar' ? `🎉 حصلتِ على ${result.points} نقطة!` : `🎉 You won ${result.points} points!`)
              : result.type === 'free_theme'
                ? (lang === 'ar' ? '🎉 حصلت على ثيم مجاني!' : '🎉 You won a free theme!')
                : result.points < 0
                  ? (lang === 'ar' ? `😢 تم خصم ${Math.abs(result.points)} نقطة!` : `😢 You lost ${Math.abs(result.points)} points!`)
                  : (lang === 'ar' ? '😅 حاولي مجدداً غداً' : '😅 Try again tomorrow')}
          </div>
        )}

        <button
          onClick={handleSpin}
          disabled={spinning || spunToday}
          className={`w-full py-3.5 rounded-2xl font-black text-white text-base transition-all active:scale-95 ${
            spinning || spunToday
              ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 shadow-lg shadow-rose-500/30 hover:-translate-y-0.5'
          }`}
        >
          {spinning
            ? (lang === 'ar' ? '⏳ جارٍ الدوران...' : '⏳ Spinning...')
            : spunToday
              ? (lang === 'ar' ? '✅ دورتِ اليوم! تعودي غداً' : '✅ Spun today! Come back tomorrow')
              : (lang === 'ar' ? '🎰 دوّري الآن!' : '🎰 Spin Now!')}
        </button>
      </div>
    </div>
  );
};

export default LuckyWheel;
