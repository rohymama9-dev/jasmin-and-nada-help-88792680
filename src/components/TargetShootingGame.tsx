import { useRef, useState, useEffect, useCallback } from 'react';
import { useLang } from '@/contexts/LanguageContext';

interface TargetShootingGameProps {
  onScore: (pts: number) => void;
  difficulty: 'beginner' | 'intermediate' | 'pro';
}

interface TargetObj {
  x: number; y: number; r: number; speed: number; dx: number; dy: number; color: string; points: number;
}

const TargetShootingGame = ({ onScore, difficulty }: TargetShootingGameProps) => {
  const { lang } = useLang();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const targetsRef = useRef<TargetObj[]>([]);
  const animRef = useRef<number>(0);

  const targetCount = difficulty === 'beginner' ? 3 : difficulty === 'intermediate' ? 5 : 8;
  const speedMult = difficulty === 'beginner' ? 0.5 : difficulty === 'intermediate' ? 1 : 2;

  const spawnTargets = useCallback(() => {
    const colors = ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#E91E63', '#00BCD4', '#FF5722'];
    const targets: TargetObj[] = [];
    for (let i = 0; i < targetCount; i++) {
      targets.push({
        x: 40 + Math.random() * 280,
        y: 40 + Math.random() * 360,
        r: 15 + Math.random() * 15,
        speed: (1 + Math.random() * 2) * speedMult,
        dx: (Math.random() - 0.5) * 2,
        dy: (Math.random() - 0.5) * 2,
        color: colors[i % colors.length],
        points: Math.ceil(30 / (15 + Math.random() * 15) * 10),
      });
    }
    targetsRef.current = targets;
  }, [targetCount, speedMult]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setGameOver(false);
    setGameStarted(true);
    spawnTargets();
  };

  useEffect(() => {
    if (!gameStarted || gameOver) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { setGameOver(true); clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameStarted, gameOver]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Background
      ctx.fillStyle = '#FFF5F7';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Grid
      ctx.strokeStyle = '#F0E0E4';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < canvas.width; i += 30) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
      for (let i = 0; i < canvas.height; i += 30) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke(); }

      targetsRef.current.forEach(t => {
        t.x += t.dx * t.speed;
        t.y += t.dy * t.speed;
        if (t.x < t.r || t.x > canvas.width - t.r) t.dx *= -1;
        if (t.y < t.r || t.y > canvas.height - t.r) t.dy *= -1;
        // Draw target
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
        ctx.fillStyle = t.color;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.r * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = '#FFF';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.r * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = t.color;
        ctx.fill();
      });

      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [gameStarted, gameOver]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || gameOver) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    for (let i = targetsRef.current.length - 1; i >= 0; i--) {
      const t = targetsRef.current[i];
      const dist = Math.sqrt((x - t.x) ** 2 + (y - t.y) ** 2);
      if (dist < t.r) {
        setScore(prev => prev + t.points);
        targetsRef.current[i] = {
          ...t, x: 40 + Math.random() * 280, y: 40 + Math.random() * 360,
          dx: (Math.random() - 0.5) * 2, dy: (Math.random() - 0.5) * 2,
        };
        break;
      }
    }
  };

  useEffect(() => {
    if (gameOver && score > 0) onScore(Math.floor(score / 10));
  }, [gameOver]);

  if (!gameStarted || gameOver) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center space-y-4">
        <span className="text-5xl">🎯</span>
        <h3 className="text-lg font-bold text-foreground">
          {gameOver ? (lang === 'ar' ? 'انتهت اللعبة!' : 'Game Over!') : (lang === 'ar' ? 'إصابة الأهداف' : 'Target Shooting')}
        </h3>
        {gameOver && <p className="text-2xl font-bold text-primary">{score} {lang === 'ar' ? 'نقطة' : 'pts'}</p>}
        <button onClick={startGame} className="px-6 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold">
          {gameOver ? (lang === 'ar' ? 'العب مرة أخرى' : 'Play Again') : (lang === 'ar' ? 'ابدأ' : 'Start')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm font-bold text-foreground">🎯 {score}</span>
        <span className="text-sm font-bold text-destructive">⏱ {timeLeft}s</span>
      </div>
      <canvas ref={canvasRef} width={360} height={440} onClick={handleClick}
        className="w-full rounded-2xl border border-border cursor-crosshair touch-none" />
    </div>
  );
};

export default TargetShootingGame;
