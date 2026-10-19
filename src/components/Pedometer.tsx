import { useState, useEffect, useRef, useCallback } from 'react';
import { Footprints, Play, Pause, RotateCcw, Trophy, Check, MapPin, Flame } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { initializeBackgroundTracking, pauseBackgroundTracking, resumeBackgroundTracking } from '@/lib/stepTrackerService';

const STEPS_KEY = 'app-pedometer';

interface DayData {
  steps: number;
  calories: number;
  target: number;
  success: boolean;
  pointsAwarded: number;
}

interface PedometerProps {
  onPoints: (n: number) => void;
}

const STRIDE_LENGTH = 0.762; // meters
const CALORIES_PER_STEP = 0.045; // kcal (based on 70kg person walking)

const getDateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const loadAllData = (): Record<string, DayData> => {
  try { return JSON.parse(localStorage.getItem(STEPS_KEY) || '{}'); } catch { return {}; }
};

const saveAllData = (data: Record<string, DayData>) => {
  localStorage.setItem(STEPS_KEY, JSON.stringify(data));
};

const calcPoints = (steps: number): number => Math.floor(steps / 100) * 10;

const Pedometer = ({ onPoints }: PedometerProps) => {
  const { lang } = useLang();
  const today = getDateKey(new Date());

  const [allData, setAllData] = useState<Record<string, DayData>>(loadAllData);
  const [target, setTarget] = useState<number>(() => allData[today]?.target || 5000);
  const [tracking, setTracking] = useState(false);
  const [showMilestone, setShowMilestone] = useState(false);
  const [sensorMode, setSensorMode] = useState<'motion' | 'gps' | null>(null);
  const [bgTracking, setBgTracking] = useState(false);

  // GPS fallback refs
  const watchIdRef = useRef<number | null>(null);
  const lastPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const accumulatedDistRef = useRef(0);

  // Simplified motion (accelerometer) refs
  const accelHistoryRef = useRef<number[]>([]);
  const lastStepAtRef = useRef(0);

  const todayData = allData[today] || { steps: 0, calories: 0, target, success: false, pointsAwarded: 0 };
  const steps = todayData.steps;
  const calories = todayData.calories || 0;

  const updateTodayData = useCallback((updater: (prev: DayData) => DayData) => {
    setAllData(prev => {
      const current = prev[today] || { steps: 0, calories: 0, target, success: false, pointsAwarded: 0 };
      const updated = updater(current);
      if (updated.steps >= updated.target) updated.success = true;
      const earned = calcPoints(updated.steps);
      if (earned > updated.pointsAwarded) {
        const diff = earned - updated.pointsAwarded;
        updated.pointsAwarded = earned;
        onPoints(diff);
        setShowMilestone(true);
        setTimeout(() => setShowMilestone(false), 2500);
      }
      const next = { ...prev, [today]: updated };
      saveAllData(next);
      return next;
    });
  }, [today, target, onPoints]);

  /**
   * Simplified step detection - works reliably across iOS/Android
   * Based on detecting peaks in acceleration magnitude
   */
  const handleMotion = useCallback((e: DeviceMotionEvent) => {
    // Use accelerationIncludingGravity, fallback to acceleration
    let a = e.accelerationIncludingGravity || e.acceleration;
    if (!a || a.x == null || a.y == null || a.z == null) return;

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
        const dt = now - lastStepAtRef.current;

        if (dt > MIN_INTERVAL) {
          lastStepAtRef.current = now;
          updateTodayData(prev => ({
            ...prev,
            steps: prev.steps + 1,
            calories: Number((prev.calories + CALORIES_PER_STEP).toFixed(2)),
          }));
          console.log(`[Pedometer] Step detected! Total: ${steps + 1}, Accel: ${curr.toFixed(2)}m/s²`);
        }
      }
    }
  }, [updateTodayData, steps]);

  const startGPSFallback = useCallback(() => {
    if (!navigator.geolocation) return false;
    setSensorMode('gps');
    lastPosRef.current = null;
    accumulatedDistRef.current = 0;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (lastPosRef.current) {
          const dist = haversine(lastPosRef.current.lat, lastPosRef.current.lng, latitude, longitude);
          if (dist > 0.5 && dist < 50) {
            accumulatedDistRef.current += dist;
            const newSteps = Math.floor(accumulatedDistRef.current / STRIDE_LENGTH);
            if (newSteps > 0) {
              accumulatedDistRef.current -= newSteps * STRIDE_LENGTH;
              updateTodayData(prev => ({
                ...prev,
                steps: prev.steps + newSteps,
                calories: Number((prev.calories + newSteps * CALORIES_PER_STEP).toFixed(2)),
              }));
            }
          }
        }
        lastPosRef.current = { lat: latitude, lng: longitude };
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
    watchIdRef.current = id;
    return true;
  }, [updateTodayData]);

  // Initialize Service Worker for background tracking
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && tracking) {
      navigator.serviceWorker.ready
        .then(reg => {
          if (reg.active) {
            reg.active.postMessage({
              type: 'START_STEP_TRACKING',
              stepsKey: STEPS_KEY,
              caloriesKey: CALORIES_PER_STEP,
            });
            setBgTracking(true);
          }
        })
        .catch(() => {
          // Service Worker fallback
        });
    }
  }, [tracking]);

  // Page Visibility API: sync data when app returns from background
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && tracking) {
        // App is visible again, sync background data
        const updatedData = loadAllData();
        setAllData(updatedData);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [tracking]);

  const startTracking = useCallback(async () => {
    const hasMotion = typeof window !== 'undefined' && 'DeviceMotionEvent' in window;
    if (hasMotion) {
      try {
        const reqPerm = (DeviceMotionEvent as any).requestPermission;
        if (typeof reqPerm === 'function') {
          const perm = await reqPerm();
          if (perm !== 'granted') {
            startGPSFallback();
            // Initialize background tracking
            await initializeBackgroundTracking();
            resumeBackgroundTracking();
            setTracking(true);
            return;
          }
        }
        accelHistoryRef.current = [];
        lastStepAtRef.current = Date.now();
        window.addEventListener('devicemotion', handleMotion);
        setSensorMode('motion');
        // Initialize background tracking
        await initializeBackgroundTracking();
        resumeBackgroundTracking();
        setTracking(true);
        return;
      } catch {
        // Fall through to GPS
      }
    }
    if (startGPSFallback()) {
      await initializeBackgroundTracking();
      resumeBackgroundTracking();
      setTracking(true);
    }
  }, [handleMotion, startGPSFallback]);

  const stopTracking = useCallback(() => {
    if (sensorMode === 'motion') {
      window.removeEventListener('devicemotion', handleMotion);
    }
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    pauseBackgroundTracking();
    setSensorMode(null);
    setBgTracking(false);
    setTracking(false);
  }, [sensorMode, handleMotion]);

  useEffect(() => {
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [handleMotion]);

  const resetToday = () => {
    setAllData(prev => { const next = { ...prev }; delete next[today]; saveAllData(next); return next; });
    stopTracking();
  };

  const handleTargetChange = (val: number) => {
    setTarget(val);
    updateTodayData(prev => ({ ...prev, target: val }));
  };

  const fillPercent = Math.min((steps / target) * 100, 100);
  const distanceKm = ((steps * STRIDE_LENGTH) / 1000).toFixed(2);

  return (
    <div className="glass-card rounded-2xl p-5 animate-slide-up space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Footprints size={18} className="text-success" />
          {lang === 'ar' ? 'عداد الخطوات' : 'Step Counter'}
        </h3>
        <button onClick={resetToday} className="text-muted-foreground hover:text-primary transition-colors p-1">
          <RotateCcw size={14} />
        </button>
      </div>

      {showMilestone && (
        <div className="p-3 rounded-xl gradient-gold text-center animate-bounce-in">
          <Trophy size={20} className="mx-auto mb-1 text-gold-foreground" />
          <p className="font-bold text-gold-foreground text-sm">🎉 +{calcPoints(steps)} {lang === 'ar' ? 'نقطة' : 'points'}! ⭐</p>
        </div>
      )}

      {/* Background tracking indicator */}
      {bgTracking && (
        <div className="p-2 rounded-lg bg-primary/10 text-center text-xs text-primary font-medium">
          ✓ {lang === 'ar' ? 'التتبع في الخلفية مفعل' : 'Background tracking active'}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{lang === 'ar' ? 'الهدف اليومي' : 'Daily Goal'}</span>
          <span className="text-xs font-bold text-primary">{target.toLocaleString()} {lang === 'ar' ? 'خطوة' : 'steps'}</span>
        </div>
        <input type="range" min="500" max="20000" step="500" value={target}
          onChange={e => handleTargetChange(parseInt(e.target.value))}
          className="w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer accent-primary" />
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
            <circle cx="50" cy="50" r="42" fill="none"
              stroke={todayData.success ? "hsl(var(--success))" : "hsl(var(--primary))"}
              strokeWidth="8" strokeDasharray={`${fillPercent * 2.64} 264`}
              strokeLinecap="round" className="transition-all duration-700" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-lg font-bold text-foreground">{steps.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'خطوة' : 'steps'}</p>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground"><MapPin size={12} className="inline" /> {lang === 'ar' ? 'المسافة' : 'Distance'}</span>
            <span className="font-medium text-foreground">{distanceKm} km</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground"><Flame size={12} className="inline" /> {lang === 'ar' ? 'السعرات' : 'Calories'}</span>
            <span className="font-medium text-orange-500">~{calories.toFixed(1)} kcal</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{lang === 'ar' ? 'النقاط' : 'Points'}</span>
            <span className="font-medium text-primary">+{calcPoints(steps)} ⭐</span>
          </div>
          <p className="text-[9px] text-muted-foreground">
            {sensorMode === 'motion'
              ? (lang === 'ar' ? '📱 حساس الحركة (محسّن)' : '📱 Motion sensor (improved)')
              : sensorMode === 'gps'
                ? (lang === 'ar' ? '📍 GPS' : '📍 GPS')
                : (lang === 'ar' ? '10 نقاط لكل 100 خطوة' : '10 pts per 100 steps')}
          </p>
          {todayData.success && (
            <div className="flex items-center gap-1 text-success text-xs font-semibold">
              <Check size={14} /> {lang === 'ar' ? 'تم تحقيق الهدف!' : 'Goal reached!'}
            </div>
          )}
        </div>
      </div>

      <button onClick={tracking ? stopTracking : startTracking}
        className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
          tracking ? 'bg-destructive text-destructive-foreground' : 'gradient-success text-success-foreground shadow-lg'
        }`}>
        {tracking ? <Pause size={16} /> : <Play size={16} />}
        {tracking ? (lang === 'ar' ? 'إيقاف' : 'Stop') : (lang === 'ar' ? 'ابدأ التتبع' : 'Start Tracking')}
      </button>
    </div>
  );
};

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default Pedometer;
