import { useEffect, useState } from 'react';
import { RotateCw, BookOpen } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';

interface QuestionOption {
  id: string;
  textAr: string;
  textEn: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  titleAr: string;
  titleEn: string;
  options: QuestionOption[];
}

// Hardcoded Islamic questions (at least 15)
const ISLAMIC_QUESTIONS: Question[] = [
  {
    id: 'q1',
    titleAr: 'في أي سورة توجد آية الكرسي؟',
    titleEn: 'In which Surah is the Throne Verse (Ayat al-Kursi) located?',
    options: [
      { id: 'q1-a', textAr: 'سورة البقرة', textEn: 'Surah Al-Baqarah', isCorrect: true },
      { id: 'q1-b', textAr: 'سورة آل عمران', textEn: 'Surah Ali-Imran', isCorrect: false },
      { id: 'q1-c', textAr: 'سورة النساء', textEn: 'Surah An-Nisa', isCorrect: false },
      { id: 'q1-d', textAr: 'سورة المائدة', textEn: 'Surah Al-Maidah', isCorrect: false },
    ],
  },
  {
    id: 'q2',
    titleAr: 'كم عدد أركان الإسلام؟',
    titleEn: 'How many are the Pillars of Islam?',
    options: [
      { id: 'q2-a', textAr: 'ثلاثة', textEn: 'Three', isCorrect: false },
      { id: 'q2-b', textAr: 'أربعة', textEn: 'Four', isCorrect: false },
      { id: 'q2-c', textAr: 'خمسة', textEn: 'Five', isCorrect: true },
      { id: 'q2-d', textAr: 'ستة', textEn: 'Six', isCorrect: false },
    ],
  },
  {
    id: 'q3',
    titleAr: 'كم عدد أنبياء الله المذكورين في القرآن؟',
    titleEn: 'How many Prophets are mentioned in the Quran?',
    options: [
      { id: 'q3-a', textAr: '20 نبياً', textEn: '20 Prophets', isCorrect: false },
      { id: 'q3-b', textAr: '25 نبياً', textEn: '25 Prophets', isCorrect: true },
      { id: 'q3-c', textAr: '30 نبياً', textEn: '30 Prophets', isCorrect: false },
      { id: 'q3-d', textAr: '35 نبياً', textEn: '35 Prophets', isCorrect: false },
    ],
  },
  {
    id: 'q4',
    titleAr: 'كم عدد سور القرآن الكريم؟',
    titleEn: 'How many Surahs are in the Quran?',
    options: [
      { id: 'q4-a', textAr: '100 سورة', textEn: '100 Surahs', isCorrect: false },
      { id: 'q4-b', textAr: '110 سور', textEn: '110 Surahs', isCorrect: false },
      { id: 'q4-c', textAr: '114 سورة', textEn: '114 Surahs', isCorrect: true },
      { id: 'q4-d', textAr: '120 سورة', textEn: '120 Surahs', isCorrect: false },
    ],
  },
  {
    id: 'q5',
    titleAr: 'من هو أول نبي بعث إلى الأرض؟',
    titleEn: 'Who was the first Prophet sent to Earth?',
    options: [
      { id: 'q5-a', textAr: 'محمد صلى الله عليه وسلم', textEn: 'Muhammad (PBUH)', isCorrect: false },
      { id: 'q5-b', textAr: 'آدم عليه السلام', textEn: 'Adam (PBUH)', isCorrect: true },
      { id: 'q5-c', textAr: 'نوح عليه السلام', textEn: 'Noah (PBUH)', isCorrect: false },
      { id: 'q5-d', textAr: 'إبراهيم عليه السلام', textEn: 'Abraham (PBUH)', isCorrect: false },
    ],
  },
  {
    id: 'q6',
    titleAr: 'كم عدد آيات سورة الفاتحة؟',
    titleEn: 'How many verses are in Surah Al-Fatihah?',
    options: [
      { id: 'q6-a', textAr: '5 آيات', textEn: '5 verses', isCorrect: false },
      { id: 'q6-b', textAr: '7 آيات', textEn: '7 verses', isCorrect: true },
      { id: 'q6-c', textAr: '9 آيات', textEn: '9 verses', isCorrect: false },
      { id: 'q6-d', textAr: '11 آية', textEn: '11 verses', isCorrect: false },
    ],
  },
  {
    id: 'q7',
    titleAr: 'من أطول الأنبياء قاما؟',
    titleEn: 'Who is the tallest among the Prophets?',
    options: [
      { id: 'q7-a', textAr: 'آدم عليه السلام', textEn: 'Adam (PBUH)', isCorrect: true },
      { id: 'q7-b', textAr: 'نوح عليه السلام', textEn: 'Noah (PBUH)', isCorrect: false },
      { id: 'q7-c', textAr: 'إبراهيم عليه السلام', textEn: 'Abraham (PBUH)', isCorrect: false },
      { id: 'q7-d', textAr: 'محمد صلى الله عليه وسلم', textEn: 'Muhammad (PBUH)', isCorrect: false },
    ],
  },
  {
    id: 'q8',
    titleAr: 'في أي شهر يكون شهر الصيام؟',
    titleEn: 'In which month is the month of fasting?',
    options: [
      { id: 'q8-a', textAr: 'شهر محرم', textEn: 'Muharram', isCorrect: false },
      { id: 'q8-b', textAr: 'شهر رمضان', textEn: 'Ramadan', isCorrect: true },
      { id: 'q8-c', textAr: 'شهر شوال', textEn: 'Shawwal', isCorrect: false },
      { id: 'q8-d', textAr: 'شهر ذو القعدة', textEn: 'Dhu al-Qidah', isCorrect: false },
    ],
  },
  {
    id: 'q9',
    titleAr: 'كم عدد أركان الحج؟',
    titleEn: 'How many are the pillars of Hajj?',
    options: [
      { id: 'q9-a', textAr: 'اثنين', textEn: 'Two', isCorrect: false },
      { id: 'q9-b', textAr: 'ثلاثة', textEn: 'Three', isCorrect: false },
      { id: 'q9-c', textAr: 'أربعة', textEn: 'Four', isCorrect: true },
      { id: 'q9-d', textAr: 'خمسة', textEn: 'Five', isCorrect: false },
    ],
  },
  {
    id: 'q10',
    titleAr: 'من هم أولو العزم من الرسل؟',
    titleEn: 'Who are the five best known Prophets?',
    options: [
      { id: 'q10-a', textAr: 'محمد وأحمد وعيسى', textEn: 'Muhammad, Ahmad, and Jesus', isCorrect: false },
      { id: 'q10-b', textAr: 'نوح وإبراهيم وموسى وعيسى ومحمد', textEn: 'Noah, Abraham, Moses, Jesus, Muhammad', isCorrect: true },
      { id: 'q10-c', textAr: 'إبراهيم وموسى ومحمد', textEn: 'Abraham, Moses, Muhammad', isCorrect: false },
      { id: 'q10-d', textAr: 'يونس وأيوب وذا الكفل', textEn: 'Jonah, Job, and Dhul-Kifl', isCorrect: false },
    ],
  },
  {
    id: 'q11',
    titleAr: 'كم عدد سجدات القرآن؟',
    titleEn: 'How many prostrations (Sajdahs) are in the Quran?',
    options: [
      { id: 'q11-a', textAr: '12 سجدة', textEn: '12 prostrations', isCorrect: false },
      { id: 'q11-b', textAr: '14 سجدة', textEn: '14 prostrations', isCorrect: true },
      { id: 'q11-c', textAr: '16 سجدة', textEn: '16 prostrations', isCorrect: false },
      { id: 'q11-d', textAr: '18 سجدة', textEn: '18 prostrations', isCorrect: false },
    ],
  },
  {
    id: 'q12',
    titleAr: 'من هو خليل الله؟',
    titleEn: 'Who is the Intimate Friend of Allah?',
    options: [
      { id: 'q12-a', textAr: 'موسى عليه السلام', textEn: 'Moses (PBUH)', isCorrect: false },
      { id: 'q12-b', textAr: 'إبراهيم عليه السلام', textEn: 'Abraham (PBUH)', isCorrect: true },
      { id: 'q12-c', textAr: 'محمد صلى الله عليه وسلم', textEn: 'Muhammad (PBUH)', isCorrect: false },
      { id: 'q12-d', textAr: 'عيسى عليه السلام', textEn: 'Jesus (PBUH)', isCorrect: false },
    ],
  },
  {
    id: 'q13',
    titleAr: 'كم عدد أيام التشريق في الحج؟',
    titleEn: 'How many days are the days of Tashreeq in Hajj?',
    options: [
      { id: 'q13-a', textAr: 'يوم واحد', textEn: 'One day', isCorrect: false },
      { id: 'q13-b', textAr: 'يومان', textEn: 'Two days', isCorrect: false },
      { id: 'q13-c', textAr: 'ثلاثة أيام', textEn: 'Three days', isCorrect: true },
      { id: 'q13-d', textAr: 'أربعة أيام', textEn: 'Four days', isCorrect: false },
    ],
  },
  {
    id: 'q14',
    titleAr: 'من هو الكليم؟',
    titleEn: 'Who is the one who spoke to Allah?',
    options: [
      { id: 'q14-a', textAr: 'إبراهيم عليه السلام', textEn: 'Abraham (PBUH)', isCorrect: false },
      { id: 'q14-b', textAr: 'موسى عليه السلام', textEn: 'Moses (PBUH)', isCorrect: true },
      { id: 'q14-c', textAr: 'محمد صلى الله عليه وسلم', textEn: 'Muhammad (PBUH)', isCorrect: false },
      { id: 'q14-d', textAr: 'عيسى عليه السلام', textEn: 'Jesus (PBUH)', isCorrect: false },
    ],
  },
  {
    id: 'q15',
    titleAr: 'ما هو الحيوان الذي كلم موسى عليه السلام؟',
    titleEn: 'What animal spoke to Moses (PBUH)?',
    options: [
      { id: 'q15-a', textAr: 'حمار', textEn: 'Donkey', isCorrect: false },
      { id: 'q15-b', textAr: 'ثعبان', textEn: 'Snake', isCorrect: false },
      { id: 'q15-c', textAr: 'بقرة', textEn: 'Cow', isCorrect: true },
      { id: 'q15-d', textAr: 'عقاب', textEn: 'Eagle', isCorrect: false },
    ],
  },
];

interface IslamicChallengeProps {
  points: number;
  onAddPoints: (n: number) => void;
}

const CHALLENGE_KEY = 'islamic-challenge-state';
const DAILY_TIMESTAMP_KEY = 'islamic-challenge-date';
const REWARD_POINTS = 100;
const QUESTIONS_PER_ROUND = 10;

interface ChallengeState {
  questions: Question[];
  currentIndex: number;
  score: number;
  answered: boolean;
  finished: boolean;
}

const REWARD_POINTS_FULL = 100;
const REWARD_POINTS_HIGH = 50;
const REWARD_POINTS_LOW = 2;

const calculateReward = (score: number) => {
  if (score === QUESTIONS_PER_ROUND) return REWARD_POINTS_FULL;
  if (score >= 7) return REWARD_POINTS_HIGH;
  return REWARD_POINTS_LOW;
};

const getRewardLabel = (score: number, lang: string) => {
  const reward = calculateReward(score);
  if (lang === 'ar') {
    if (reward === REWARD_POINTS_FULL) return `مكافأة ${REWARD_POINTS_FULL} نقطة للتسعيرة الكاملة`;
    if (reward === REWARD_POINTS_HIGH) return `مكافأة ${REWARD_POINTS_HIGH} نقطة للأداء الممتاز`;
    return `مكافأة ${REWARD_POINTS_LOW} نقطة`;
  }
  if (reward === REWARD_POINTS_FULL) return `${REWARD_POINTS_FULL} point reward for perfect score`;
  if (reward === REWARD_POINTS_HIGH) return `${REWARD_POINTS_HIGH} point reward for a strong result`;
  return `${REWARD_POINTS_LOW} point reward`;
};

const IslamicChallenge = ({ points, onAddPoints }: IslamicChallengeProps) => {
  const { lang } = useLang();
  const [state, setState] = useState<ChallengeState | null>(null);

  // Initialize or restore daily challenge state
  useEffect(() => {
    try {
      const today = new Date().toDateString();
      const lastDate = localStorage.getItem(DAILY_TIMESTAMP_KEY);

      if (lastDate !== today) {
        localStorage.setItem(DAILY_TIMESTAMP_KEY, today);
        localStorage.removeItem(CHALLENGE_KEY);
      }

      const saved = localStorage.getItem(CHALLENGE_KEY);
      if (saved) {
        const parsed: ChallengeState = JSON.parse(saved);
        setState(parsed);
      } else {
        const shuffled = [...ISLAMIC_QUESTIONS].sort(() => Math.random() - 0.5);
        const questions = shuffled.slice(0, QUESTIONS_PER_ROUND);
        const newState: ChallengeState = {
          questions,
          currentIndex: 0,
          score: 0,
          answered: false,
          finished: false,
        };
        setState(newState);
        localStorage.setItem(CHALLENGE_KEY, JSON.stringify(newState));
      }
    } catch (e) {
      console.error('Failed to initialize challenge:', e);
    }
  }, []);

  const selectAnswer = (optionId: string) => {
    if (!state || state.answered || state.finished) return;

    const current = state.questions[state.currentIndex];
    const selected = current.options.find(o => o.id === optionId);
    if (!selected) return;

    const newScore = state.score + (selected.isCorrect ? 1 : 0);
    const newState = { ...state, score: newScore, answered: true };
    setState(newState);
    localStorage.setItem(CHALLENGE_KEY, JSON.stringify(newState));
  };

  const completeChallenge = () => {
    if (!state) return;

    const reward = calculateReward(state.score);
    onAddPoints(reward);
    const finishState = { ...state, finished: true };
    setState(finishState);
    localStorage.setItem(CHALLENGE_KEY, JSON.stringify(finishState));

    toast({
      title: lang === 'ar'
        ? `🎉 انتهى التحدي! حصلت على ${reward} نقطة` 
        : `🎉 Challenge complete! You earned ${reward} points`,
      description: getRewardLabel(state.score, lang),
    });
  };

  const nextQuestion = () => {
    if (!state || state.finished) return;

    if (state.currentIndex + 1 >= state.questions.length) {
      completeChallenge();
      return;
    }

    const newState = { ...state, currentIndex: state.currentIndex + 1, answered: false };
    setState(newState);
    localStorage.setItem(CHALLENGE_KEY, JSON.stringify(newState));
  };

  if (!state) {
    return (
      <div className="glass-card rounded-2xl p-5 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 text-center">
        <p className="text-sm text-muted-foreground">{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
      </div>
    );
  }

  if (state.finished) {
    const reward = calculateReward(state.score);
    return (
      <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 text-center space-y-4">
        <div className="text-4xl mb-2">🎉</div>
        <h3 className="font-bold text-lg text-foreground">
          {lang === 'ar' ? 'مبروك!' : 'Congratulations!'}
        </h3>
        <p className="text-base font-semibold text-foreground">
          {lang === 'ar'
            ? `حصلت على ${state.score}/${state.questions.length}`
            : `You scored ${state.score}/${state.questions.length}`}
        </p>
        <p className="text-sm text-muted-foreground">
          {lang === 'ar'
            ? `+${reward} نقطة تمت إضافتها!`
            : `+${reward} points added!`}
        </p>
        <p className="text-xs text-muted-foreground">
          {lang === 'ar' ? 'سيكون لديك تحدٍ جديد غداً' : 'You will have a new challenge tomorrow'}
        </p>
      </div>
    );
  }

  const current = state.questions[state.currentIndex];
  const progress = ((state.currentIndex + 1) / state.questions.length) * 100;

  return (
    <div className="glass-card rounded-2xl p-5 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2 mb-3">
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-amber-600" />
          <h3 className="font-bold text-foreground">
            {lang === 'ar' ? 'التحدي الإسلامي' : 'Islamic Challenge'}
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          {lang === 'ar'
            ? 'يجدد يومياً ولا يتكرر في نفس اليوم.'
            : 'Renews daily and does not repeat on the same day.'}
        </p>
      </div>
      <span className="text-xs font-semibold text-amber-700 bg-amber-200/50 px-2 py-1 rounded-full">
        {lang === 'ar' ? `${state.currentIndex + 1}/${state.questions.length}` : `${state.currentIndex + 1}/${state.questions.length}`}
      </span>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question */}
      <div className="bg-white/60 rounded-xl p-4 space-y-3">
        <h4 className="font-bold text-foreground text-base leading-relaxed">
          {lang === 'ar' ? current.titleAr : current.titleEn}
        </h4>

        {/* Options */}
        <div className="space-y-2">
          {current.options.map(option => {
            const isSelected = state.answered && option.isCorrect;
            const isWrong = state.answered && !option.isCorrect;

            return (
              <button
                key={option.id}
                onClick={() => selectAnswer(option.id)}
                disabled={state.answered}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                  state.answered
                    ? isSelected
                      ? 'bg-green-500/20 border-2 border-green-500 text-green-900'
                      : isWrong
                      ? 'bg-red-500/20 border-2 border-red-500 text-red-900'
                      : 'bg-secondary/50 border border-border text-foreground/70 cursor-default'
                    : 'bg-secondary/70 border border-border hover:bg-secondary active:scale-95 text-foreground'
                }`}
              >
                {lang === 'ar' ? option.textAr : option.textEn}
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        {state.answered && (
          <button
            onClick={nextQuestion}
            className="flex-1 px-4 py-2 rounded-lg gradient-primary text-primary-foreground font-semibold active:scale-95 transition-all"
          >
            {state.currentIndex + 1 >= state.questions.length
              ? lang === 'ar'
                ? 'إنهاء'
                : 'Finish'
              : lang === 'ar'
              ? 'التالي'
              : 'Next'}
          </button>
        )}
        {!state.answered && (
          <button
            onClick={() => selectAnswer(current.options[0].id)}
            className="flex-1 px-4 py-2 rounded-lg gradient-primary text-primary-foreground font-semibold active:scale-95 transition-all opacity-50 cursor-default"
          >
            {lang === 'ar' ? 'اختر إجابة' : 'Select answer'}
          </button>
        )}
      </div>

      {/* Score display */}
      <p className="text-xs text-center text-muted-foreground">
        {lang === 'ar'
          ? `النقاط الحالية: ${state.score}/${state.questions.length}`
          : `Current score: ${state.score}/${state.questions.length}`}
      </p>
    </div>
  );
};

export default IslamicChallenge;
