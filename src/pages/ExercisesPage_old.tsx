import { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Activity, Dumbbell, Timer as TimerIcon, 
  Play, X, Calendar as CalendarIcon, Check, AlertCircle, 
  ChevronRight, ChevronLeft, Bell, Settings, Pause, Plus, Upload, Image as ImageIcon
} from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { 
  EXERCISE_FILES, ACTIVITY_LEVELS, getWorkoutConfig, 
  type Exercise, type ExerciseCategory, type WorkoutStats 
} from '@/data/exercises';
import { toast } from 'sonner';

const PHOTO_STORAGE_KEY = 'user-exercise-photos';

interface Props { addPoints?: (n: number) => void }

// ───────── Isolated State Timer Overlay ─────────
const ExerciseTimerOverlay = ({
  exercise,
  stats,
  level,
  currentDay,
  onClose,
  onFinishSet,
  onNext,
  lang
}: {
  exercise: Exercise,
  stats: WorkoutStats,
  level: number,
  currentDay: number,
  onClose: () => void,
  onFinishSet: () => void,
  onNext: () => void,
  lang: 'ar' | 'en'
}) => {
  const [currentSet, setCurrentSet] = useState(1);
  const [phase, setPhase] = useState<'work' | 'rest'>('work');
  const [currentRep, setCurrentRep] = useState(0);
  const [isoHoldActive, setIsoHoldActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  // Initialize time based on exercise type and phase
  useEffect(() => {
    if (phase === 'rest') {
      setTimeLeft(stats.restBetweenSets);
    } else if (exercise.type === 'static') {
      setTimeLeft(stats.holdTime || 20);
    } else {
      // Dynamic: we count reps
      setCurrentRep(1);
      setIsoHoldActive(false);
      setTimeLeft(stats.isoHold || 2);
    }
  }, [phase, exercise.id, currentSet]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      if (phase === 'rest') {
        // Finished rest, start next set
        setPhase('work');
        setCurrentSet(prev => prev + 1);
        if (exercise.type === 'static') {
          setTimeLeft(stats.holdTime || 20);
        } else {
          setCurrentRep(1);
          setIsoHoldActive(false);
          setTimeLeft(stats.isoHold || 2);
        }
        toast.success(t(`المجموعة ${currentSet + 1}!`, `Set ${currentSet + 1}!`));
      } else if (exercise.type === 'static') {
        // Finished static hold
        if (currentSet < stats.sets) {
          setPhase('rest');
          setTimeLeft(stats.restBetweenSets);
          toast.info(t('وقت الراحة!', 'Rest time!'));
        } else {
          finishExercise();
        }
      } else {
        // Dynamic: Finished an iso-hold for a rep
        if (currentRep < stats.reps) {
          setCurrentRep(prev => prev + 1);
          setTimeLeft(stats.isoHold || 2); // Reset for next rep iso-hold
        } else {
          // Finished all reps in set
          if (currentSet < stats.sets) {
            setPhase('rest');
            setTimeLeft(stats.restBetweenSets);
            toast.info(t('وقت الراحة!', 'Rest time!'));
          } else {
            finishExercise();
          }
        }
      }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, timeLeft, phase, currentSet, currentRep, stats, exercise.type]);

  const finishExercise = () => {
    setIsActive(false);
    onFinishSet();
    toast.success(t('اكتمل التمرين! ننتقل للتالي...', 'Exercise complete! Next one...'));
    setTimeout(onNext, 1500);
  };

  const userPhoto = exercise.image;

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col animate-in fade-in duration-300">
      {/* 1. Top Section (Hero Image Area) */}
      <div className="relative flex-1 w-full bg-black overflow-hidden flex items-center justify-center">
        {userPhoto ? (
          <img 
            src={userPhoto} 
            alt="Workout Form" 
            className="max-w-full max-h-full object-contain shadow-2xl" 
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-white/20">
            <Dumbbell size={80} strokeWidth={1} />
            <p className="mt-4 font-black uppercase tracking-widest text-sm">No Image</p>
          </div>
        )}
        
        {/* Top Header Overlay */}
        <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/60 to-transparent flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-black text-white leading-tight">
              {exercise.phase === 'warmup' ? t('إحماء', 'Warm-up') : 
               exercise.phase === 'stretch' ? t('إطالة', 'Stretching') : 
               t('تمرين أساسي', 'Main Exercise')}
            </h2>
            <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-1">
              {lang === 'ar' ? exercise.titleAr : exercise.titleEn}
            </p>
          </div>
          <button onClick={onClose} className="p-3 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/20 transition-all active:scale-90">
            <X size={24} />
          </button>
        </div>

        {/* Phase Indicator Overlay */}
        <div className="absolute bottom-6 left-6">
          <div className={`px-4 py-2 rounded-full backdrop-blur-md border border-white/20 flex items-center gap-2 ${phase === 'work' ? 'bg-primary/80 text-white' : 'bg-emerald-500/80 text-white'}`}>
            <div className={`w-2 h-2 rounded-full bg-white animate-pulse`} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {phase === 'work' ? t('جاري التمرين', 'Active Phase') : t('وقت الراحة', 'Resting')}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Bottom Section (Control & Counter Bar) */}
      <div className="h-32 bg-background border-t border-border/50 px-8 flex items-center justify-between gap-8 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        
        {/* Set Counter */}
        <div className="flex flex-col items-start min-w-[80px]">
          <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">{t('المجموعة', 'Set')}</span>
          <div className="flex items-end gap-1">
            <span className="text-3xl font-black text-primary">{currentSet}</span>
            <span className="text-sm text-muted-foreground font-bold mb-1">/ {stats.sets}</span>
          </div>
        </div>

        {/* Active Counter (Timer/Reps) */}
        <button 
          onClick={() => setIsActive(!isActive)}
          className={`flex-1 max-w-md h-20 rounded-[2rem] flex items-center justify-center gap-6 transition-all active:scale-95 border-2 ${isActive ? 'bg-primary/5 border-primary/20' : 'bg-secondary border-transparent'}`}
        >
          <div className="flex flex-col items-center">
            <span className="text-4xl font-black text-foreground font-mono tabular-nums">
              {exercise.type === 'dynamic' && phase === 'work' ? (
                `${currentRep}/${stats.reps}`
              ) : (
                timeLeft < 10 ? `0${timeLeft}` : timeLeft
              )}
            </span>
            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">
              {exercise.type === 'dynamic' && phase === 'work' ? t('تكرار', 'Reps') : t('ثانية', 'Seconds')}
            </span>
          </div>
          
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
            {isActive ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
          </div>

          {exercise.type === 'dynamic' && phase === 'work' && (
            <div className="flex flex-col items-center border-l border-border/50 pl-6">
              <span className="text-xl font-black text-primary font-mono">{timeLeft}s</span>
              <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">{t('ثبات', 'Hold')}</span>
            </div>
          )}
        </button>

        {/* Stats / Info */}
        <div className="flex flex-col items-end min-w-[80px]">
          <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">{t('اليوم', 'Day')}</span>
          <span className="text-sm font-black text-foreground uppercase tracking-tight">{currentDay}</span>
        </div>

      </div>
    </div>
  );
};

const ExercisesPage = ({ addPoints }: Props = {}) => {
  const { lang, dir } = useLang();
  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  // ───────── Persistence Logic ─────────
  const [level, setLevel] = useState(() => Number(localStorage.getItem('ex_level') || 1));
  const [onboarded, setOnboarded] = useState(() => !!localStorage.getItem('ex_activity'));
  const [activity, setActivity] = useState(() => localStorage.getItem('ex_activity') || '');
  const [startDate, setStartDate] = useState(() => localStorage.getItem('ex_start_date') || new Date().toISOString());
  const [history, setHistory] = useState<Record<string, 'done' | 'skip'>>(() => JSON.parse(localStorage.getItem('ex_history_v2') || '{}'));
  const [reminderTime, setReminderTime] = useState(() => localStorage.getItem('ex_reminder') || '09:00');

  // Custom photos state
  const [userPhotos, setUserPhotos] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem(PHOTO_STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  });

  const [activeFile, setActiveFile] = useState<ExerciseCategory | null>(null);
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);

  useEffect(() => {
    localStorage.setItem('ex_level', level.toString());
    localStorage.setItem('ex_activity', activity);
    localStorage.setItem('ex_start_date', startDate);
    localStorage.setItem('ex_history_v2', JSON.stringify(history));
    localStorage.setItem('ex_reminder', reminderTime);
    localStorage.setItem(PHOTO_STORAGE_KEY, JSON.stringify(userPhotos));
  }, [level, activity, history, reminderTime, startDate, userPhotos]);

  const handlePhotoUpload = (id: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setUserPhotos(prev => ({ ...prev, [id]: base64 }));
      toast.success(lang === 'ar' ? 'تم حفظ الصورة بنجاح!' : 'Photo saved successfully!');
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = (id: string) => {
    setUserPhotos(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const PhotoPlaceholder = ({ id, label, className }: { id: string, label: string, className?: string }) => {
    const userPhoto = userPhotos[id];
    return (
      <div className={`relative group ${className}`}>
        {userPhoto ? (
          <>
            <img src={userPhoto} alt="" className="w-full h-full object-cover rounded-2xl" />
            <button 
              onClick={(e) => { e.stopPropagation(); removePhoto(id); }}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <label className="w-full h-full flex flex-col items-center justify-center bg-secondary/30 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:bg-secondary/50 transition-all">
            <Upload size={24} className="text-muted-foreground mb-2" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => e.target.files?.[0] && handlePhotoUpload(id, e.target.files[0])} 
            />
          </label>
        )}
      </div>
    );
  };

  // Calculate Current Day (1-60)
  const start = new Date(startDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - start.getTime());
  const currentDay = Math.min(60, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);

  // Check for 3-day progression prompt
  useEffect(() => {
    if (onboarded && currentDay > 1 && currentDay % 3 === 0) {
      const lastPromptDay = Number(localStorage.getItem('ex_last_prompt_day') || 0);
      if (lastPromptDay !== currentDay) {
        setShowLevelUp(true);
        localStorage.setItem('ex_last_prompt_day', currentDay.toString());
      }
    }
  }, [currentDay, onboarded]);

  const handleFinishSet = () => {
    const sessionType = new Date().getHours() < 12 ? 'morning' : 'evening';
    const historyKey = `${currentDay}-${sessionType}`;
    
    setHistory(prev => ({ ...prev, [historyKey]: 'done' }));
    // Award points
    if (addPoints) addPoints(5);
  };

  const handleNextExercise = () => {
    if (!activeFile) return;
    const currentIndex = activeFile.exercises.findIndex(ex => ex.id === activeExercise?.id);
    const nextExercise = activeFile.exercises[currentIndex + 1];
    
    if (nextExercise) {
      setActiveExercise(nextExercise);
    } else {
      setActiveExercise(null);
      toast.success(t('أحسنتِ! لقد أكملتِ جميع تمارين هذا الملف.', 'Well done! You have completed all exercises in this file.'));
    }
  };

  // Skip logic: if a scheduled day is skipped for 3 days
  useEffect(() => {
    if (!onboarded) return;
    
    const checkSkips = () => {
      const newHistory = { ...history };
      let changed = false;
      
      // Check days from 1 to currentDay - 1
      for (let d = 1; d < currentDay; d++) {
        // If day is scheduled but not marked done/skip
        if (!newHistory[d]) {
          // If it's been more than 3 days since that day was active
          if (currentDay - d >= 3) {
            newHistory[d] = 'skip';
            changed = true;
          }
        }
      }
      
      if (changed) setHistory(newHistory);
    };
    checkSkips();
  }, [currentDay, onboarded]);

  // Onboarding Screen
  if (!onboarded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center space-y-10 animate-in fade-in duration-700" dir={dir}>
        <div className="relative">
          <div className="w-24 h-24 rounded-[2rem] gradient-primary flex items-center justify-center text-white shadow-2xl animate-pulse">
            <Activity size={48} />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-background p-2 rounded-xl shadow-lg border border-border">
            <Check className="text-primary" size={20} />
          </div>
        </div>
        
        <div className="space-y-4 max-w-sm">
          <h2 className="text-4xl font-black text-foreground leading-tight tracking-tight">
            {t('اختر مستوى نشاطكِ', 'Select Activity Level')}
          </h2>
          <p className="text-base text-muted-foreground font-medium leading-relaxed">
            {t('سنقوم بتخصيص خطة الـ ٦٠ يوماً بناءً على اختياركِ. الجميع يبدأ من اليوم الأول!', 'We will customize your 60-day plan based on your choice. Everyone starts at Day 1!')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 w-full max-w-md">
          {ACTIVITY_LEVELS.map(lvl => (
            <button
              key={lvl.id}
              onClick={() => { 
                setActivity(lvl.id); 
                setStartDate(new Date().toISOString());
                setOnboarded(true); 
              }}
              className="group p-6 rounded-[2rem] bg-background border-2 border-border hover:border-primary hover:bg-primary/5 transition-all active:scale-95 shadow-sm hover:shadow-xl flex items-center justify-between text-right"
            >
              <div className="flex flex-col gap-1">
                <span className="text-xl font-black text-foreground group-hover:text-primary transition-colors">
                  {lang === 'ar' ? lvl.nameAr : lvl.nameEn}
                </span>
                <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                  {lvl.daysPerWeek} {t('أيام في الأسبوع', 'days / week')}
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-secondary group-hover:bg-primary/10 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-all">
                <ChevronLeft size={24} className={dir === 'ltr' ? 'rotate-180' : ''} />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Level Up Modal
  if (showLevelUp) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in" dir={dir}>
        <div className="bg-background w-full max-w-sm rounded-[2.5rem] p-8 text-center space-y-6 border border-primary/20 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
            <TimerIcon size={32} />
          </div>
          <h3 className="text-2xl font-black text-foreground">{t('ترقية المستوى؟', 'Increase Difficulty?')}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t(`لقد أتممتِ اليوم ${currentDay} بنجاح! هل ترغبين في زيادة التحدي ورفع مستوى التمارين؟`, `You have successfully completed Day ${currentDay}! Would you like to increase the challenge?`)}
          </p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => { 
                if (level < 6) setLevel(prev => prev + 1); 
                setShowLevelUp(false); 
                toast.success(t('تمت الترقية للمستوى التالي!', 'Upgraded to next level!'));
              }} 
              className="w-full py-4 rounded-2xl gradient-primary text-white font-black shadow-lg shadow-primary/20 active:scale-95 transition-all"
            >
              {t('نعم، أريد التحدي!', 'Yes, Level Up!')}
            </button>
            <button onClick={() => setShowLevelUp(false)} className="w-full py-4 rounded-2xl bg-secondary text-foreground font-bold active:scale-95 transition-all">
              {t('البقاء في المستوى الحالي', 'Keep Current Level')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // File Detail View
  if (activeFile) {
    return (
      <div className="space-y-6 pb-10 animate-in slide-in-from-bottom-4 duration-500" dir={dir}>
        <button onClick={() => setActiveFile(null)} className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs">
          <ArrowLeft size={16} className={dir === 'rtl' ? 'rotate-180' : ''} /> {t('رجوع', 'Back')}
        </button>

        <div className="relative rounded-[2.5rem] overflow-hidden border border-border shadow-xl h-[300px]">
          <PhotoPlaceholder id={`cover-${activeFile.id}`} label={t('صورة الغلاف', 'Cover Photo')} className="w-full h-full" />
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-8">
            <h2 className="text-3xl font-black text-white leading-tight">{activeFile.titleAr && lang === 'ar' ? activeFile.titleAr : activeFile.titleEn}</h2>
          </div>
        </div>

        {activeFile.exercises.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {activeFile.exercises.map(ex => {
              const stats = getWorkoutConfig(ex.phase, level);
              return (
                <div key={ex.id} className="glass-card rounded-[2rem] p-6 space-y-6 border border-border/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-black text-foreground">{lang === 'ar' ? ex.titleAr : ex.titleEn}</h3>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
                          {getWorkoutConfig(ex.phase, level).sets} {t('مجموعات', 'Sets')}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                          {ex.type === 'static' ? `${getWorkoutConfig(ex.phase, level).holdTime}s` : `${getWorkoutConfig(ex.phase, level).reps} reps`}
                        </span>
                        <span className="text-[10px] text-primary font-black uppercase tracking-widest">
                          2x / {t('يوم', 'day')}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => setActiveExercise(ex)} className="p-4 rounded-2xl gradient-primary text-white shadow-lg shadow-primary/20 active:scale-90 transition-all">
                      <Play size={24} fill="currentColor" />
                    </button>
                  </div>

                  {/* Exercise Image / Gallery */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <PhotoPlaceholder id={`ex-${ex.id}-main`} label={t('الصورة الرئيسية', 'Main Photo')} className="w-full h-48" />
                    {ex.gallery && ex.gallery.map((_, idx) => (
                      <PhotoPlaceholder key={idx} id={`ex-${ex.id}-gallery-${idx}`} label={t(`صورة ${idx + 1}`, `Photo ${idx + 1}`)} className="w-full h-48" />
                    ))}
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">{t('تعليمات الأداء', 'Execution Instructions')}</p>
                    <p className="text-sm text-foreground leading-relaxed">
                      {lang === 'ar' ? ex.instructionsAr : ex.instructionsEn}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card rounded-[2rem] p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-secondary flex items-center justify-center text-muted-foreground mx-auto">
              <Dumbbell size={32} />
            </div>
            <p className="text-sm font-bold text-muted-foreground">{t('هذا الملف فارغ حالياً. سيتم إضافته في الجزء الثاني.', 'This file is currently empty. It will be populated in Part 2.')}</p>
          </div>
        )}

        {activeExercise && (
          <ExerciseTimerOverlay
            exercise={activeExercise}
            stats={getWorkoutConfig(activeExercise.phase, level)}
            level={level}
            currentDay={currentDay}
            onClose={() => setActiveExercise(null)}
            onFinishSet={handleFinishSet}
            onNext={handleNextExercise}
            lang={lang}
          />
        )}
      </div>
    );
  }

  // Root View (10-File Grid + Calendar)
  return (
    <div className="space-y-10 pb-10" dir={dir}>
      {/* Header & Settings */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center text-white shadow-xl shadow-primary/30">
            <Activity size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">{t('مركز التمارين', 'Exercise Center')}</h1>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{t(`اليوم ${currentDay} · تتبع النشاط`, `Day ${currentDay} · Activity Tracking`)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative group">
            <input 
              type="time" 
              value={reminderTime} 
              onChange={(e) => setReminderTime(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <button className="p-3 rounded-2xl bg-secondary text-muted-foreground hover:text-primary transition-colors">
              <Bell size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* 10-File Chronological Grid */}
      <div className="grid grid-cols-2 gap-4">
        {EXERCISE_FILES.map((file, i) => (
          <button
            key={file.id}
            onClick={() => setActiveFile(file)}
            className="group relative aspect-[4/5] rounded-[2.5rem] overflow-hidden border border-border/50 shadow-sm hover:shadow-2xl transition-all active:scale-95"
          >
            {userPhotos[`cat-${file.id}`] ? (
              <img src={userPhotos[`cat-${file.id}`]} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            ) : (
              <div className="absolute inset-0 w-full h-full bg-secondary/30 flex items-center justify-center">
                <ImageIcon size={32} className="text-muted-foreground opacity-20" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-5 text-left">
              <span className="text-[10px] text-primary font-black mb-1 opacity-70">FILE {i + 1}</span>
              <p className="text-lg font-black text-white leading-tight">{lang === 'ar' ? file.titleAr : file.titleEn}</p>
            </div>
          </button>
        ))}
      </div>

      {/* 60-Day Fitness Tracker Calendar */}
      <div className="glass-card rounded-[2.5rem] p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarIcon size={20} className="text-primary" />
            <h3 className="text-lg font-black text-foreground">{t('خطة الـ ٦٠ يوماً', '60-Day Plan')}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
              <Check size={10} /> {Object.values(history).filter(v => v === 'done').length}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-full">
              <X size={10} /> {Object.values(history).filter(v => v === 'skip').length}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-2 sm:grid-cols-10">
          {Array.from({ length: 60 }).map((_, i) => {
            const dayNum = i + 1;
            const morningStatus = history[`${dayNum}-morning`];
            const eveningStatus = history[`${dayNum}-evening`];
            const isToday = dayNum === currentDay;
            const isPast = dayNum < currentDay;
            const isFuture = dayNum > currentDay;
            
            // Frequency logic: check if this day is a "workout day"
            const daysPerWeek = ACTIVITY_LEVELS.find(l => l.id === activity)?.daysPerWeek || 3;
            const isWorkoutDay = (dayNum % Math.round(7 / daysPerWeek)) === 1 || daysPerWeek === 6;

            const isDone = morningStatus === 'done' && eveningStatus === 'done';
            const isPartial = morningStatus === 'done' || eveningStatus === 'done';

            return (
              <div 
                key={i} 
                className={`
                  aspect-square rounded-xl flex items-center justify-center text-[10px] font-black border transition-all relative
                  ${isToday ? 'border-primary ring-2 ring-primary/20 bg-primary/5 text-primary scale-110 z-10' : 'border-border'}
                  ${isDone ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : ''}
                  ${!isDone && isPartial ? 'bg-amber-500 border-amber-500 text-white' : ''}
                  ${isFuture ? 'opacity-40 grayscale' : ''}
                  ${!isWorkoutDay && !morningStatus && !eveningStatus ? 'bg-secondary/30 text-muted-foreground border-transparent' : ''}
                `}
              >
                {isDone ? <Check size={14} /> : dayNum}
                {isToday && <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-ping" />}
                
                {/* Session Indicators */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                  <div className={`w-1 h-1 rounded-full ${morningStatus === 'done' ? 'bg-white' : 'bg-white/30'}`} />
                  <div className={`w-1 h-1 rounded-full ${eveningStatus === 'done' ? 'bg-white' : 'bg-white/30'}`} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-border/50 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase">{t('مكتمل', 'Done')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase">{t('فائت', 'Skipped')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExercisesPage;
