
export interface Exercise {
  id: string;
  name: string;
  imagePath: string;
  instructions: string[];
  progression_plan: string;
}

export interface ExerciseCategory {
  id: string;
  nameAr: string;
  nameEn: string;
  exercises: Exercise[];
}

export const exercisesData: ExerciseCategory[] = [
  {
    id: 'warm-up',
    nameAr: 'إحماء',
    nameEn: 'Warm-up',
    exercises: [
      {
        id: 'jumping-jacks',
        name: 'Jumping Jacks',
        imagePath: '/exercises/jumping-jacks.jpg',
        instructions: ['Stand with feet together', 'Jump and spread legs', 'Bring arms above head', 'Jump back to start'],
        progression_plan: '20x2, then 30x3'
      }
    ]
  },
  {
    id: 'core',
    nameAr: 'عضلات البطن والظهر',
    nameEn: 'Core',
    exercises: []
  },
  {
    id: 'spine',
    nameAr: 'العمود الفقري',
    nameEn: 'Spine',
    exercises: []
  },
  {
    id: 'sciatica',
    nameAr: 'عرق النسا',
    nameEn: 'Sciatica',
    exercises: []
  },
  {
    id: 'posture',
    nameAr: 'وضعية الجسم',
    nameEn: 'Posture',
    exercises: []
  },
  {
    id: 'full-body',
    nameAr: 'كامل الجسم',
    nameEn: 'Full Body',
    exercises: []
  },
  {
    id: 'gym',
    nameAr: 'جيم',
    nameEn: 'Gym',
    exercises: []
  },
  {
    id: 'stretching',
    nameAr: 'إطالة',
    nameEn: 'Stretching',
    exercises: []
  }
];
