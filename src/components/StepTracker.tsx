import { useState, useEffect, useRef, useCallback } from 'react';
import { Footprints, Play, Pause, RotateCcw, Trophy } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { initializeBackgroundTracking, pauseBackgroundTracking, resumeBackgroundTracking } from '@/lib/stepTrackerService';

const STEPS_KEY = 'app-steps';
const MILESTONE_KEY = 'app-steps-milestone';
const CALORIES_KEY = 'app-calories';
const LAST_SYNC_KEY = 'app-last-sync';

interface StepTrackerProps {
  onMilestone: () => void;
}

/**
 * Realistic calorie calculation based on:
 * - Average adult weight: 70kg
 * - Walking METs (Metabolic Equivalent): 3.5 for normal pace
 * - Formula: Calories = (METs × Weight × Time in hours)
 * - Per step: ~70kg person burns ~0.04-0.05 calories per step
 */
const CALORIES_PER_STEP = 0.045;

const StepTracker = ({ onMilestone }: StepTrackerProps) => {
  const { t, lang } = useLang();
  const [steps, setSteps] = useState<number>(() => parseInt(localStorage.getItem(STEPS_KEY) || '0', 10));
  const [calories, setCalories] = useState<number>(() => parseFloat(localStorage.getItem(CALORIES_KEY) || '0'));
  const [lastMilestone, setLastMilestone] = useState<number>(() => parseInt(localStorage.getItem(MILESTONE_KEY) || '0', 10));
  const [tracking, setTracking] = useState(false);
  const [showMilestone, setShowMilestone] = useState(false);
  const [bgTracking, setBgTracking] = useState(false);

  // Simplified step detection refs
  const accelHistoryRef = useRef<number[]>([]);
  const lastStepTimeRef = useRef(0);

  const goal = Math.min(Math.max(500, Math.ceil(steps / 500) * 500 + 500), 10000);

  /**
   * Simplified step detection - works reliably across iOS/Android
   * Based on detecting peaks in acceleration magnitude
   */
  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    // Use accelerationIncludingGravity, fallback to acceleration
    let a = event.accelerationIncludingGravity || event.acceleration;
    
    if (!a || a.x === null || a.y === null || a.z === null) {
      console.log('[StepTracker] No acceleration data available');
      return;
    }

    // Calculate acceleration magnitude
    const mag = Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2);
    
    // Keep a rolling history of acceleration values (last 10)
    accelHistoryRef.current.push(mag);
    if (accelHistoryRef.current.length > 10) {
      accelHistoryRef.current.shift();
    }

    // Detect peaks: when current magnitude is higher than neighbors
    if (accelHistoryRef.current.length >= 3) {
      const idx = accelHistoryRef.current.length - 1;
      const prev = accelHistoryRef.current[idx - 1];
      const curr = accelHistoryRef.current[idx];
      const next = accelHistoryRef.current[idx - 2] || prev;

      // Peak detection with lenient threshold
      const PEAK_THRESHOLD = 12; // Threshold for step (each step creates peak ~10-15m/s²)
      const MIN_INTERVAL = 300; // Minimum ms between steps
      const now = Date.now();

      // Check if current value is a local peak and above threshold
      if (curr > prev && curr > next && curr > PEAK_THRESHOLD) {
        const dt = now - lastStepTimeRef.current;

        if (dt > MIN_INTERVAL) {
          lastStepTimeRef.current = now;
          
          setSteps(prev => {
            const next = prev + 1;
            const newCalories = Number((calories + CALORIES_PER_STEP).toFixed(2));
            localStorage.setItem(STEPS_KEY, String(next));
            localStorage.setItem(CALORIES_KEY, String(newCalories));
            setCalories(newCalories);

            // Check milestone every 500 steps
            const currentMilestone = Math.floor(next / 500) * 500;
            const lastM = parseInt(localStorage.getItem(MILESTONE_KEY) || '0', 10);
            if (currentMilestone > lastM && currentMilestone > 0) {
              localStorage.setItem(MILESTONE_KEY, String(currentMilestone));
              setLastMilestone(currentMilestone);
              setShowMilestone(true);
              onMilestone();
              setTimeout(() => setShowMilestone(false), 2500);
            }
            
            console.log(`[StepTracker] Step detected! Total: ${next}, Accel: ${curr.toFixed(2)}m/s²`);
            return next;
          });
        }
      }
    }
  }, [calories, onMilestone]);

  // Initialize and register Service Worker for background tracking
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && tracking) {
      navigator.serviceWorker.ready
        .then(reg => {
          if (reg.active) {
            reg.active.postMessage({
              type: 'START_STEP_TRACKING',
              stepsKey: STEPS_KEY,
              caloriesKey: CALORIES_KEY,
            });
            setBgTracking(true);
          }
        })
        .catch(() => {
          // Service Worker not available, fall back to foreground tracking
        });
    }
  }, [tracking]);

  // Page Visibility API: pause tracking when app goes to background
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && tracking) {
        // App is hidden, but service worker continues tracking
      } else if (!document.hidden && tracking) {
        // App is visible again, sync any background data
        const bgSteps = parseInt(localStorage.getItem(STEPS_KEY) || '0', 10);
        const bgCalories = parseFloat(localStorage.getItem(CALORIES_KEY) || '0');
        setSteps(bgSteps);
        setCalories(bgCalories);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [tracking]);

  useEffect(() => {
    if (tracking) {
      accelHistoryRef.current = [];
      lastStepTimeRef.current = Date.now();
      window.addEventListener('devicemotion', handleMotion);
      return () => window.removeEventListener('devicemotion', handleMotion);
    }
  }, [tracking, handleMotion]);

  const toggleTracking = async () => {
    if (!tracking) {
      // Request permission on iOS 13+
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        try {
          const perm = await (DeviceMotionEvent as any).requestPermission();
          if (perm !== 'granted') return;
        } catch {
          return;
        }
      }
      // Initialize background tracking
      await initializeBackgroundTracking();
      resumeBackgroundTracking();
    } else {
      pauseBackgroundTracking();
    }
    setTracking(!tracking);
  };

  const resetSteps = () => {
    setSteps(0);
    setCalories(0);
    setLastMilestone(0);
    localStorage.setItem(STEPS_KEY, '0');
    localStorage.setItem(CALORIES_KEY, '0');
    localStorage.setItem(MILESTONE_KEY, '0');
    setTracking(false);
  };

  const fillPercent = Math.min((steps / goal) * 100, 100);

  return (
    <div className="glass-card rounded-2xl p-5 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Footprints size={18} className="text-success" />
          {t('stepTracker')}
        </h3>
        <button onClick={resetSteps} className="text-muted-foreground hover:text-primary transition-colors p-1">
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Milestone popup */}
      {showMilestone && (
        <div className="mb-3 p-3 rounded-xl gradient-gold text-center animate-bounce-in">
          <Trophy size={20} className="mx-auto mb-1 text-gold-foreground" />
          <p className="font-bold text-gold-foreground text-sm">
            🎉 {t('milestone')} {lastMilestone} {t('steps')}! +2 ⭐
          </p>
        </div>
      )}

      {/* Background tracking indicator */}
      {bgTracking && (
        <div className="mb-3 p-2 rounded-lg bg-primary/10 text-center text-xs text-primary font-medium">
          ✓ {lang === 'ar' ? 'التتبع في الخلفية مفعل' : 'Background tracking active'}
        </div>
      )}

      <div className="flex items-center gap-4 mb-4">
        {/* Circular progress */}
        <div className="relative w-24 h-24 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="42" fill="none"
              stroke="hsl(var(--success))" strokeWidth="8"
              strokeDasharray={`${fillPercent * 2.64} 264`}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-lg font-bold text-foreground">{steps.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">{t('steps')}</p>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('stepsGoal')}</span>
            <span className="font-medium text-foreground">{goal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{lang === 'ar' ? 'السعرات' : 'Calories'}</span>
            <span className="font-medium text-orange-500">~{calories.toFixed(1)} kcal</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('points')}</span>
            <span className="font-medium text-gold">+{Math.floor(steps / 500) * 2} ⭐</span>
          </div>
        </div>
      </div>

      <button
        onClick={toggleTracking}
        className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
          tracking
            ? 'bg-destructive text-destructive-foreground'
            : 'gradient-success text-success-foreground shadow-lg'
        }`}
      >
        {tracking ? <Pause size={16} /> : <Play size={16} />}
        {tracking ? t('stopTracking') : t('startTracking')}
      </button>
    </div>
  );
};

export default StepTracker;
