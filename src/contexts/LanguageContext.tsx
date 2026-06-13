import React, { createContext, useContext, useState, useCallback } from 'react';

type Lang = 'ar' | 'en';

interface Translations {
  [key: string]: { ar: string; en: string };
}

const translations: Translations = {
  home: { ar: 'الرئيسية', en: 'Home' },
  quran: { ar: 'تمارين', en: 'Therapy' },
  education: { ar: 'تعليم', en: 'Learn' },
  games: { ar: 'ألعاب', en: 'Games' },
  services: { ar: 'خدمات', en: 'Services' },
  points: { ar: 'النقاط', en: 'Points' },
  waterTracker: { ar: 'متتبع الماء', en: 'Water Tracker' },
  cups: { ar: 'أكواب', en: 'cups' },
  goal: { ar: 'الهدف', en: 'Goal' },
  habits: { ar: 'العادات', en: 'Habits' },
  addHabit: { ar: 'إضافة عادة', en: 'Add Habit' },
  habitName: { ar: 'اسم العادة', en: 'Habit name' },
  reminderTime: { ar: 'وقت التذكير', en: 'Reminder time' },
  save: { ar: 'حفظ', en: 'Save' },
  cancel: { ar: 'إلغاء', en: 'Cancel' },
  surahs: { ar: 'السور', en: 'Surahs' },
  recite: { ar: 'اقرأ', en: 'Recite' },
  startReciting: { ar: 'ابدأ التلاوة', en: 'Start Reciting' },
  stopReciting: { ar: 'إيقاف التلاوة', en: 'Stop Reciting' },
  recitationRoom: { ar: 'غرفة التلاوة', en: 'Recitation Room' },
  back: { ar: 'رجوع', en: 'Back' },
  welcome: { ar: 'مرحباً بكِ', en: 'Welcome' },
  dailyProgress: { ar: 'التقدم اليومي', en: 'Daily Progress' },
  comingSoon: { ar: 'قريباً', en: 'Coming Soon' },
  gamesDesc: { ar: 'ألعاب تعليمية ممتعة', en: 'Fun educational games' },
  servicesDesc: { ar: 'خدمات متنوعة', en: 'Various services' },
  reset: { ar: 'إعادة', en: 'Reset' },
  brainGym: { ar: 'تمارين ذهنية', en: 'Brain Gym' },
  mathChallenge: { ar: 'تحدي الرياضيات', en: 'Math Challenge' },
  score: { ar: 'النتيجة', en: 'Score' },
  correct: { ar: 'صحيح!', en: 'Correct!' },
  wrong: { ar: 'خطأ!', en: 'Wrong!' },
  next: { ar: 'التالي', en: 'Next' },
  timeLeft: { ar: 'الوقت المتبقي', en: 'Time Left' },
  gameOver: { ar: 'انتهت اللعبة', en: 'Game Over' },
  playAgain: { ar: 'العب مرة أخرى', en: 'Play Again' },
  stories: { ar: 'قصص الأطفال', en: 'Kids Stories' },
  locked: { ar: 'مقفل', en: 'Locked' },
  unlock: { ar: 'فتح', en: 'Unlock' },
  pointsNeeded: { ar: 'تحتاج 5 نقاط', en: 'Need 5 points' },
  readStory: { ar: 'اقرأ القصة', en: 'Read Story' },
  finishStory: { ar: 'أنهيت القصة', en: 'Finish Story' },
  bonusPoints: { ar: 'نقاط إضافية!', en: 'Bonus Points!' },
  notEnoughPoints: { ar: 'لا يوجد نقاط كافية', en: 'Not enough points' },
  coloringBook: { ar: 'كتاب التلوين', en: 'Coloring Book' },
  pickColor: { ar: 'اختر لوناً', en: 'Pick a color' },
  brushSize: { ar: 'حجم الفرشاة', en: 'Brush Size' },
  clearCanvas: { ar: 'مسح الرسمة', en: 'Clear' },
  undo: { ar: 'تراجع', en: 'Undo' },
  chooseDrawing: { ar: 'اختر رسمة', en: 'Choose Drawing' },
  eraser: { ar: 'ممحاة', en: 'Eraser' },
  stepTracker: { ar: 'عداد الخطوات', en: 'Step Tracker' },
  steps: { ar: 'خطوة', en: 'steps' },
  stepsGoal: { ar: 'الهدف', en: 'Goal' },
  startTracking: { ar: 'ابدأ التتبع', en: 'Start Tracking' },
  stopTracking: { ar: 'إيقاف التتبع', en: 'Stop Tracking' },
  milestone: { ar: 'إنجاز!', en: 'Milestone!' },
  quranProgress: { ar: 'تقدم القرآن', en: 'Quran Progress' },
  selectSurah: { ar: 'اختر السورة', en: 'Select Surah' },
  fromAyah: { ar: 'من الآية', en: 'From Ayah' },
  toAyah: { ar: 'إلى الآية', en: 'To Ayah' },
  startReading: { ar: 'ابدأ القراءة', en: 'Start Reading' },
  verseRange: { ar: 'نطاق الآيات', en: 'Verse Range' },
  age: { ar: 'العمر', en: 'Age' },
  difficulty: { ar: 'المستوى', en: 'Difficulty' },
  beginner: { ar: 'مبتدئ', en: 'Beginner' },
  intermediate: { ar: 'متوسط', en: 'Intermediate' },
  pro: { ar: 'محترف', en: 'Pro' },
  enterAge: { ar: 'أدخل عمرك', en: 'Enter your age' },
  startPlaying: { ar: 'ابدأ اللعب', en: 'Start Playing' },
  gamingCenter: { ar: 'مركز الألعاب', en: 'Gaming Center' },
  quotes: { ar: 'اقتباسات ملهمة', en: 'Inspirational Quotes' },
  bookSummaries: { ar: 'ملخصات الكتب', en: 'Book Summaries' },
  keyTakeaway: { ar: 'الدرس المستفاد', en: 'Key Takeaway' },
  moral: { ar: 'العبرة', en: 'The Moral' },
  ml: { ar: 'مل', en: 'ml' },
  liter: { ar: 'لتر', en: 'L' },
  cup: { ar: 'كوب', en: 'Cup' },
  bottle: { ar: 'زجاجة', en: 'Bottle' },
  customAmount: { ar: 'كمية مخصصة', en: 'Custom Amount' },
  dailyGoal: { ar: 'الهدف اليومي', en: 'Daily Goal' },
  category: { ar: 'الفئة', en: 'Category' },
  allStories: { ar: 'جميع القصص', en: 'All Stories' },
  prophets: { ar: 'قصص الأنبياء', en: 'Prophets' },
  morals: { ar: 'قصص أخلاقية', en: 'Moral Stories' },
  adventure: { ar: 'مغامرات', en: 'Adventure' },
};

interface LanguageContextType {
  lang: Lang;
  toggleLang: () => void;
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Lang>(() => {
    return (localStorage.getItem('app-lang') as Lang) || 'ar';
  });

  const toggleLang = useCallback(() => {
    setLang(prev => {
      const next = prev === 'ar' ? 'en' : 'ar';
      localStorage.setItem('app-lang', next);
      return next;
    });
  }, []);

  const t = useCallback((key: string) => {
    return translations[key]?.[lang] || key;
  }, [lang]);

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLang = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
};
