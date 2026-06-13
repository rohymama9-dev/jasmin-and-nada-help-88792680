// Physical Therapy & Exercises database
// Targeted 10-file structure completed in Part 2

export type ExerciseType = 'static' | 'dynamic';
export type WorkoutPhase = 'warmup' | 'main' | 'stretch';

export interface Exercise {
  id: string;
  titleAr: string;
  titleEn: string;
  duration: number; // for static hold or reps
  reps: number;
  image: string;
  gallery?: string[];
  instructionsAr: string;
  instructionsEn: string;
  type: ExerciseType;
  phase: WorkoutPhase;
}

export interface ExerciseCategory {
  id: string;
  titleAr: string;
  titleEn: string;
  image: string;
  coverImage?: string;
  exercises: Exercise[];
}

export const EXERCISE_FILES: ExerciseCategory[] = [
  {
    id: 'warmup',
    titleAr: 'الإحماء (١)',
    titleEn: 'Warm-up (1)',
    image: '',
    coverImage: '',
    exercises: [
      { id: 'w1', titleAr: 'دوران الرقبة', titleEn: 'Neck Rotations', duration: 10, reps: 10, image: '', instructionsAr: 'حرك رقبتك بلطف في دوائر.', instructionsEn: 'Move your neck gently in circles.', type: 'dynamic', phase: 'warmup' },
      { id: 'w2', titleAr: 'دوران الأكتاف', titleEn: 'Shoulder Rolls', duration: 10, reps: 10, image: '', instructionsAr: 'ارفع أكتافك ودورها للخلف.', instructionsEn: 'Lift your shoulders and roll them back.', type: 'dynamic', phase: 'warmup' }
    ]
  },
  {
    id: 'posture',
    titleAr: 'تحسين القوام (٢)',
    titleEn: 'Posture (2)',
    image: '',
    coverImage: '',
    exercises: [
      { id: 'p1', titleAr: 'تمدد الصدر', titleEn: 'Chest Stretch', duration: 20, reps: 10, image: '', instructionsAr: 'افتح ذراعيك للخلف لتوسيع الصدر.', instructionsEn: 'Open your arms back to expand the chest.', type: 'static', phase: 'main' }
    ]
  },
  {
    id: 'sciatica',
    titleAr: 'عرق النسا (٣)',
    titleEn: 'Sciatica (3)',
    image: '',
    coverImage: '',
    exercises: [
      { id: 's1', titleAr: 'تمدد العصب الوركي', titleEn: 'Sciatic Stretch', duration: 20, reps: 10, image: '', instructionsAr: 'اسحب ركبتك نحو صدرك بلطف.', instructionsEn: 'Gently pull your knee towards your chest.', type: 'static', phase: 'main' }
    ]
  },
  {
    id: 'spine',
    titleAr: 'عمود فقري (٤)',
    titleEn: 'Spine (4)',
    image: '',
    coverImage: '',
    exercises: [
      { id: 'sp1', titleAr: 'وضعية القطة والكلب', titleEn: 'Cat-Cow', duration: 10, reps: 10, image: '', instructionsAr: 'قوس ظهرك ثم ارفعه للأعلى.', instructionsEn: 'Arch your back then lift it upwards.', type: 'dynamic', phase: 'main' }
    ]
  },
  {
    id: 'core',
    titleAr: 'تقوية البطن (٥)',
    titleEn: 'Core (5)',
    image: '',
    coverImage: '',
    exercises: [
      { id: 'c1', titleAr: 'البلانك', titleEn: 'Plank', duration: 20, reps: 10, image: '', instructionsAr: 'حافظ على استقامة جسمك.', instructionsEn: 'Keep your body straight.', type: 'static', phase: 'main' }
    ]
  },
  {
    id: 'ages',
    titleAr: 'لكل الأعمار (٦)',
    titleEn: 'All Ages (6)',
    image: '',
    coverImage: '',
    exercises: [
      { id: 'a1', titleAr: 'المشي في المكان', titleEn: 'March in Place', duration: 10, reps: 10, image: '', instructionsAr: 'ارفع ركبتيك أثناء المشي.', instructionsEn: 'Lift your knees while walking.', type: 'dynamic', phase: 'main' }
    ]
  },
  {
    id: 'levels',
    titleAr: 'مستويات (٧)',
    titleEn: 'Levels (7)',
    image: '',
    coverImage: '',
    exercises: [
      { id: 'l1', titleAr: 'ضغط المبتدئين', titleEn: 'Knee Push-ups', duration: 10, reps: 10, image: '', instructionsAr: 'قم بعمل تمرين الضغط على ركبتيك.', instructionsEn: 'Perform push-ups on your knees.', type: 'dynamic', phase: 'main' }
    ]
  },
  {
    id: 'fullbody',
    titleAr: 'جسم كامل (٨)',
    titleEn: 'Full Body (8)',
    image: '',
    coverImage: '',
    exercises: [
      { id: 'fb1', titleAr: 'بيربيز', titleEn: 'Burpees', duration: 10, reps: 10, image: '', instructionsAr: 'تمرين شامل للجسم.', instructionsEn: 'Full body explosive exercise.', type: 'dynamic', phase: 'main' }
    ]
  },
  {
    id: 'gym',
    titleAr: 'تمارين جيم (٩)',
    titleEn: 'Gym (9)',
    image: '',
    coverImage: '',
    exercises: [
      { id: 'g1', titleAr: 'رفع الأثقال', titleEn: 'Dumbbell Press', duration: 10, reps: 10, image: '', instructionsAr: 'ارفع الأثقال للأعلى ببطء.', instructionsEn: 'Lift weights upwards slowly.', type: 'dynamic', phase: 'main' }
    ]
  },
  {
    id: 'stretching',
    titleAr: 'إطالة (١٠)',
    titleEn: 'Stretching (10)',
    image: '',
    coverImage: '',
    exercises: [
      { id: 'st1', titleAr: 'تمدد كامل', titleEn: 'Full Stretch', duration: 20, reps: 10, image: '', instructionsAr: 'افرد جسمك بالكامل.', instructionsEn: 'Stretch your entire body.', type: 'static', phase: 'stretch' }
    ]
  }
];

export const ACTIVITY_LEVELS = [
  { id: 'sedentary', nameAr: 'خامل / غير نشط', nameEn: 'Sedentary / Inactive', daysPerWeek: 2 },
  { id: 'moderate', nameAr: 'نشط باعتدال', nameEn: 'Moderately Active', daysPerWeek: 4 },
  { id: 'highly', nameAr: 'نشط جداً', nameEn: 'Highly Active', daysPerWeek: 6 },
];

export interface WorkoutStats {
  sets: number;
  reps: number;
  isoHold: number;
  restBetweenSets: number;
  restBetweenExercises: number;
  holdTime?: number;
}

export const getWorkoutConfig = (phase: WorkoutPhase, level: number): WorkoutStats => {
  const baseStats = {
    sets: 2,
    reps: 10,
    isoHold: 2,
    restBetweenSets: 10,
    restBetweenExercises: 10,
  };

  // Phase specific logic
  if (phase === 'warmup') {
    // Phase A: Warm-Up
    // Duration: Under 5 minutes total (handled by exercise count)
    // Transition: No resting interval (max 1s or manual)
    return { ...baseStats, sets: 1, restBetweenSets: 0, restBetweenExercises: 1 };
  }

  if (phase === 'stretch') {
    // Phase C: Static Stretching
    // Configuration: 2 sets, 20s static hold per stretch, 10s rest
    return { 
      ...baseStats, 
      sets: 2,
      holdTime: 20 + (level - 1) * 5, // Scaling hold time per level
      restBetweenSets: 10,
      restBetweenExercises: 10
    };
  }

  // Phase B: Main Workout Routine
  // Configuration: 2 sets, 10 reps, 2s iso-hold, 10s rest
  return {
    ...baseStats,
    sets: 2,
    reps: 10 + (level - 1) * 2, // Reps increase by 2 per level
    isoHold: 2,
    restBetweenSets: 10,
    restBetweenExercises: 10,
  };
};
