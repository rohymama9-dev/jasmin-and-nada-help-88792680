import { useState, useRef } from 'react';
import { Sparkles, UserCircle, Brain, Send, RotateCcw, Share2 } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';

interface Question {
  text: BiText;
  options: { text: BiText; score: Record<string, number> }[];
}

interface BiText { ar: string; en: string }

const QUIZZES = [
  {
    id: 'personality_type',
    title: { ar: 'ما هو نمط شخصيتك؟', en: 'What is your personality type?' },
    icon: Sparkles,
    questions: [
      {
        text: { ar: 'كيف تشحن طاقتك عادة؟', en: 'How do you usually recharge?' },
        options: [
          { text: { ar: 'بالجلوس وحدي أو القراءة', en: 'By being alone or reading' }, score: { introvert: 3, extrovert: 0 } },
          { text: { ar: 'بالخروج مع الأصدقاء', en: 'By going out with friends' }, score: { extrovert: 3, introvert: 0 } },
          { text: { ar: 'مزيج من الاثنين حسب المزاج', en: 'A mix of both' }, score: { introvert: 1, extrovert: 1 } },
        ]
      },
      {
        text: { ar: 'عندما تواجه مشكلة، ماذا تفعل؟', en: 'When facing a problem, what do you do?' },
        options: [
          { text: { ar: 'أفكر في الحل بهدوء ومنطق', en: 'Think logically and calmly' }, score: { logical: 3, emotional: 0 } },
          { text: { ar: 'أتبع حدسي وما أشعر به', en: 'Follow my intuition and feelings' }, score: { emotional: 3, logical: 0 } },
          { text: { ar: 'أستشير الآخرين وآخذ برأيهم', en: 'Consult others for advice' }, score: { emotional: 1, logical: 1 } },
        ]
      },
      {
        text: { ar: 'كيف تصف غرفتك أو مكتبك؟', en: 'How would you describe your room/desk?' },
        options: [
          { text: { ar: 'مرتب ومنظم جداً', en: 'Very tidy and organized' }, score: { logical: 2, introvert: 1 } },
          { text: { ar: 'فوضى إبداعية', en: 'Creative mess' }, score: { emotional: 2, extrovert: 1 } },
          { text: { ar: 'بسيط جداً وخالٍ من التفاصيل', en: 'Very simple and minimal' }, score: { logical: 1, introvert: 2 } },
        ]
      },
      {
        text: { ar: 'ما هو دورك في المجموعات؟', en: 'What is your role in groups?' },
        options: [
          { text: { ar: 'القائد الذي يوجه الجميع', en: 'The leader who guides everyone' }, score: { extrovert: 2, logical: 1 } },
          { text: { ar: 'المستمع الذي يدعم الآخرين', en: 'The listener who supports others' }, score: { introvert: 2, emotional: 1 } },
          { text: { ar: 'المبدع الذي يقترح أفكاراً جديدة', en: 'The creator with new ideas' }, score: { emotional: 2, extrovert: 1 } },
        ]
      },
      {
        text: { ar: 'ماذا تفضل في وقت فراغك؟', en: 'What do you prefer in your free time?' },
        options: [
          { text: { ar: 'التخطيط للمستقبل', en: 'Planning for the future' }, score: { logical: 3 } },
          { text: { ar: 'الاستمتاع باللحظة الحالية', en: 'Enjoying the present moment' }, score: { emotional: 3 } },
          { text: { ar: 'تعلم مهارة جديدة', en: 'Learning a new skill' }, score: { logical: 1, introvert: 2 } },
        ]
      }
    ],
    results: {
      introvert: { ar: 'المفكر الهادئ: أنت تفضل العمق على الاتساع، وتجد قوتك في السكون والتأمل.', en: 'The Quiet Thinker: You prefer depth over breadth and find strength in stillness.' },
      extrovert: { ar: 'المتفائل الاجتماعي: أنت تستمد طاقتك من الناس وتحب نشر البهجة من حولك.', en: 'The Social Optimist: You gain energy from people and love spreading joy.' },
      logical: { ar: 'المحلل المنطقي: عقلك هو أقوى سلاح لديك، أنت تحب الوضوح والنظام.', en: 'The Logical Analyst: Your mind is your greatest weapon; you love clarity and order.' },
      emotional: { ar: 'الفنان الحساس: قلبك هو بوصلتك، أنت تهتم بالمشاعر والارتباط الإنساني.', en: 'The Sensitive Artist: Your heart is your compass; you care about feelings and connection.' },
    }
  },
  {
    id: 'friend_type',
    title: { ar: 'أي نوع من الأصدقاء أنت؟', en: 'What kind of friend are you?' },
    icon: UserCircle,
    questions: [
      {
        text: { ar: 'صديقك في مشكلة في منتصف الليل، ماذا تفعل؟', en: 'Friend in trouble at midnight, what do you do?' },
        options: [
          { text: { ar: 'أذهب إليه فوراً مهما كان السبب', en: 'Go to them immediately' }, score: { loyal: 3 } },
          { text: { ar: 'أتصل به وأسمعه لساعات', en: 'Call and listen for hours' }, score: { listener: 3 } },
          { text: { ar: 'أفكر في حل عملي لمشكلته', en: 'Think of a practical solution' }, score: { wise: 3 } },
        ]
      },
      {
        text: { ar: 'ما هو دورك في التخطيط للخروجات؟', en: 'What is your role in planning outings?' },
        options: [
          { text: { ar: 'أنا من أنظم كل شيء وأحدد الموعد', en: 'I organize everything' }, score: { wise: 2, loyal: 1 } },
          { text: { ar: 'أوافق على أي شيء يختاره البقية', en: 'I agree with whatever they choose' }, score: { listener: 3 } },
          { text: { ar: 'أقترح أغرب وأمتع الأماكن', en: 'I suggest the fun/weird places' }, score: { fun: 3 } },
        ]
      },
      {
        text: { ar: 'كيف تعبر عن حبك لأصدقائك؟', en: 'How do you show love to friends?' },
        options: [
          { text: { ar: 'بالهدايا والمفاجآت', en: 'With gifts and surprises' }, score: { loyal: 2, fun: 1 } },
          { text: { ar: 'بالوقوف بجانبهم في الأزمات', en: 'By standing by them in crises' }, score: { loyal: 3 } },
          { text: { ar: 'بإعطائهم نصائح صادقة دائماً', en: 'By giving honest advice' }, score: { wise: 3 } },
        ]
      },
      {
        text: { ar: 'ماذا تفعل لو اختلف صديقان لك؟', en: 'What if two friends of yours argue?' },
        options: [
          { text: { ar: 'أحاول الإصلاح بينهما بحكمة', en: 'Try to reconcile them wisely' }, score: { wise: 3 } },
          { text: { ar: 'أبقى محايداً وأسمع الطرفين', en: 'Stay neutral and listen to both' }, score: { listener: 3 } },
          { text: { ar: 'أحاول تلطيف الجو بالنكت والمرح', en: 'Lighten the mood with jokes' }, score: { fun: 3 } },
        ]
      },
      {
        text: { ar: 'ما هي أهم صفة في الصداقة بالنسبة لك؟', en: 'Most important trait in friendship?' },
        options: [
          { text: { ar: 'الوفاء والإخلاص', en: 'Loyalty and sincerity' }, score: { loyal: 3 } },
          { text: { ar: 'المتعة والمغامرة', en: 'Fun and adventure' }, score: { fun: 3 } },
          { text: { ar: 'التفاهم الفكري', en: 'Intellectual understanding' }, score: { wise: 2, listener: 1 } },
        ]
      }
    ],
    results: {
      loyal: { ar: 'الصديق الوفي: أنت السند الذي يلجأ إليه الجميع في الصعاب.', en: 'The Loyal Friend: You are the rock everyone turns to in hard times.' },
      listener: { ar: 'المستمع الأمين: بئرك عميقة وأسرار أصدقائك في أمان معك.', en: 'The Faithful Listener: Your well is deep; your friends\' secrets are safe.' },
      wise: { ar: 'الصديق الحكيم: أنت صوت العقل والمنطق الذي ينير طريق أصدقائك.', en: 'The Wise Friend: You are the voice of reason that guides your friends.' },
      fun: { ar: 'روح المجموعة: أنت من تجعل لكل خروجة طعماً خاصاً وذكريات لا تنسى.', en: 'The Soul of the Group: You make every outing special and unforgettable.' },
    }
  },
  {
    id: 'career_match',
    title: { ar: 'ما هي المهنة التي تناسبك؟', en: 'Which career matches you?' },
    icon: Brain,
    questions: [
      {
        text: { ar: 'ماذا كنت تحب في المدرسة؟', en: 'What did you like in school?' },
        options: [
          { text: { ar: 'الرياضيات والعلوم', en: 'Math and Science' }, score: { tech: 3, medical: 1 } },
          { text: { ar: 'الرسم والموسيقى', en: 'Art and Music' }, score: { creative: 3 } },
          { text: { ar: 'اللغات والاجتماعيات', en: 'Languages and Social' }, score: { social: 3 } },
        ]
      },
      {
        text: { ar: 'كيف تفضل العمل؟', en: 'How do you prefer to work?' },
        options: [
          { text: { ar: 'خلف الشاشة أو في المكتب', en: 'Behind a screen or in office' }, score: { tech: 3, creative: 1 } },
          { text: { ar: 'في ميدان العمل ومع الناس', en: 'In the field with people' }, score: { social: 3, medical: 2 } },
          { text: { ar: 'بحرية كاملة كعمل حر', en: 'Freely as a freelancer' }, score: { creative: 3, tech: 1 } },
        ]
      },
      {
        text: { ar: 'ما هو هدفك الأكبر في العمل؟', en: 'What is your biggest career goal?' },
        options: [
          { text: { ar: 'ابتكار شيء جديد للعالم', en: 'Innovate something new' }, score: { tech: 3, creative: 2 } },
          { text: { ar: 'مساعدة الناس وتحسين حياتهم', en: 'Help people/improve lives' }, score: { medical: 3, social: 2 } },
          { text: { ar: 'تحقيق الثراء والاستقرار', en: 'Achieve wealth and stability' }, score: { tech: 1, social: 1 } },
        ]
      },
      {
        text: { ar: 'ما هي مهاراتك الأبرز؟', en: 'What is your strongest skill?' },
        options: [
          { text: { ar: 'حل المشكلات المعقدة', en: 'Solving complex problems' }, score: { tech: 3, medical: 2 } },
          { text: { ar: 'التواصل والإقناع', en: 'Communication/Persuasion' }, score: { social: 3 } },
          { text: { ar: 'التخيل والابتكار الفني', en: 'Imagination/Artistic innovation' }, score: { creative: 3 } },
        ]
      },
      {
        text: { ar: 'أي بيئة عمل تفضل؟', en: 'What work environment do you prefer?' },
        options: [
          { text: { ar: 'بيئة هادئة ومنظمة', en: 'Quiet and organized' }, score: { tech: 2, medical: 1 } },
          { text: { ar: 'بيئة مليئة بالحركة والتفاعل', en: 'Dynamic and social' }, score: { social: 3, creative: 1 } },
          { text: { ar: 'بيئة متغيرة ومليئة بالتحديات', en: 'Changing and challenging' }, score: { medical: 2, tech: 2 } },
        ]
      }
    ],
    results: {
      tech: { ar: 'عبقري التكنولوجيا: أنت تنتمي لعالم البرمجة والهندسة والابتكار الرقمي.', en: 'The Tech Genius: You belong in programming, engineering, and digital innovation.' },
      creative: { ar: 'المبدع الحر: مكانك هو التصميم، الكتابة، أو أي مجال يطلق خيالك.', en: 'The Creative Soul: You belong in design, writing, or any field that frees your imagination.' },
      social: { ar: 'القائد الاجتماعي: أنت رائع في التعليم، الإدارة، أو العمل الاجتماعي والإنساني.', en: 'The Social Leader: You are great at teaching, management, or social work.' },
      medical: { ar: 'الملاك الحارس: الطب أو التمريض أو العلوم الحيوية هي شغفك الحقيقي.', en: 'The Guardian Angel: Medicine, nursing, or bio-sciences is your true passion.' },
    }
  }
];

const PersonalityQuizzes = () => {
  const { lang } = useLang();
  
  // Shuffled questions for the active quiz
  const shuffledQuestions = useRef<Question[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<typeof QUIZZES[0] | null>(null);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [result, setResult] = useState<string | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);

  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  const startQuiz = (quiz: typeof QUIZZES[0], index: number = 0) => {
    setActiveQuiz(quiz);
    setCurrentQuizIndex(index);
    shuffledQuestions.current = [...quiz.questions] as Question[];
    shuffledQuestions.current.sort(() => Math.random() - 0.5);
    setCurrentStep(0);
    setScores({});
    setResult(null);
    setQuizStarted(false);
  };

  const beginQuiz = () => {
    setQuizStarted(true);
  };

  const handleAnswer = (score: Record<string, number>) => {
    const newScores = { ...scores };
    Object.entries(score).forEach(([key, val]) => {
      newScores[key] = (newScores[key] || 0) + val;
    });
    setScores(newScores);

    if (activeQuiz && currentStep < shuffledQuestions.current.length - 1) {
      setCurrentStep(currentStep + 1);
    } else if (activeQuiz) {
      // Calculate final result
      let maxScore = -1;
      let winningKey = '';
      Object.entries(newScores).forEach(([key, val]) => {
        if (val > maxScore) {
          maxScore = val;
          winningKey = key;
        }
      });
      setResult(winningKey);
    }
  };

  if (result && activeQuiz) {
    const resData = activeQuiz.results[result as keyof typeof activeQuiz.results];
    const hasNextQuiz = currentQuizIndex < QUIZZES.length - 1;
    return (
      <div className="space-y-8 animate-in zoom-in-95 duration-500 text-center">
        <div className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center text-white mx-auto shadow-2xl">
          <Sparkles size={48} />
        </div>
        <div className="space-y-4">
          <h3 className="text-3xl font-black text-foreground leading-tight">{t('النتيجة هي...', 'The result is...')}</h3>
          <div className="p-8 rounded-[2.5rem] bg-secondary/30 border-2 border-primary/20 shadow-inner">
            <p className="text-2xl font-black text-primary leading-relaxed">{resData ? t(resData.ar, resData.en) : ''}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {hasNextQuiz && (
            <button onClick={() => { startQuiz(QUIZZES[currentQuizIndex + 1], currentQuizIndex + 1); }} className="w-full py-4 rounded-2xl gradient-primary text-white font-black shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2">
              {t('الاختبار التالي', 'Next Quiz')} ▶
            </button>
          )}
          <button onClick={() => startQuiz(activeQuiz, currentQuizIndex)} className="w-full py-4 rounded-2xl bg-secondary text-foreground font-black active:scale-95 transition-all flex items-center justify-center gap-2">
            <RotateCcw size={20} />
            {t('إعادة الاختبار', 'Retake Quiz')}
          </button>
          <button onClick={() => { setActiveQuiz(null); setQuizStarted(false); }} className="w-full py-4 rounded-2xl bg-secondary text-foreground font-black active:scale-95 transition-all flex items-center justify-center gap-2">
            <Share2 size={20} />
            {t('العودة للقائمة', 'Back to List')}
          </button>
        </div>
      </div>
    );
  }

  if (activeQuiz && !quizStarted && !result) {
    // Intro Screen
    const Icon = activeQuiz.icon;
    return (
      <div className="space-y-8 animate-in zoom-in-95 duration-500 text-center">
        <div className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center text-white mx-auto shadow-2xl">
          <Icon size={48} />
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-black text-foreground leading-tight">{t(activeQuiz.title.ar, activeQuiz.title.en)}</h2>
          <p className="text-base text-muted-foreground font-medium">
            {t('اختبار ممتع لاكتشاف نفسك بشكل أعمق', 'A fun test to discover yourself better')}
          </p>
        </div>
        
        <div className="space-y-4 bg-secondary/50 rounded-2xl p-6 text-left">
          <p className="text-xs font-black text-primary uppercase tracking-widest mb-4">{t('كيفية الاختبار', 'How It Works')}</p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-primary font-black">1️⃣</span>
              <span className="text-sm text-foreground">{t('سيتم طرح عليك عدة أسئلة', 'You will be asked several questions')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-black">2️⃣</span>
              <span className="text-sm text-foreground">{t('اختر الإجابة التي تعبر عن نفسك حقاً', 'Choose the answer that truly represents you')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-black">3️⃣</span>
              <span className="text-sm text-foreground">{t('ستحصل على نتيجة تعكس شخصيتك', 'You will get a result that reflects your personality')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-black">⏱️</span>
              <span className="text-sm text-foreground">{t('لا يوجد وقت محدد - أجب بحرية', 'No time limit - answer freely')}</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={beginQuiz}
            className="w-full py-4 rounded-2xl gradient-primary text-white font-black shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles size={20} />
            {t('ابدأ الآن', 'Start Now')}
          </button>
          <button 
            onClick={() => setActiveQuiz(null)}
            className="w-full py-4 rounded-2xl bg-secondary text-foreground font-black active:scale-95 transition-all"
          >
            {t('عودة', 'Go Back')}
          </button>
        </div>
      </div>
    );
  }

  if (activeQuiz && quizStarted && !result) {
    const q = shuffledQuestions.current[currentStep];
    const totalQ = shuffledQuestions.current.length;
    return (
      <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <p className="text-xs font-black text-primary uppercase tracking-widest">{t(`السؤال ${currentStep + 1} من ${totalQ}`, `Question ${currentStep + 1} of ${totalQ}`)}</p>
            <p className="text-[10px] text-muted-foreground font-bold">{Math.round(((currentStep + 1) / totalQ) * 100)}%</p>
          </div>
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full gradient-primary transition-all duration-300" style={{ width: `${((currentStep + 1) / totalQ) * 100}%` }} />
          </div>
        </div>

        <h3 className="text-2xl font-black text-foreground leading-tight text-center px-4">{t(q.text.ar, q.text.en)}</h3>

        <div className="grid grid-cols-1 gap-4">
          {q.options.map((opt, i) => (
            <button key={i} onClick={() => handleAnswer(opt.score)}
              className="p-6 rounded-3xl bg-background border-2 border-border hover:border-primary hover:bg-primary/5 text-center font-bold text-lg active:scale-95 transition-all shadow-sm">
              {t(opt.text.ar, opt.text.en)}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-2xl font-black text-foreground">{t('اختبارات الشخصية', 'Personality Quizzes')}</h2>
        <p className="text-sm text-muted-foreground font-medium">{t('اكتشف المزيد عن نفسك بطريقة ممتعة!', 'Discover more about yourself in a fun way!')}</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {QUIZZES.map((quiz, index) => {
          const Icon = quiz.icon;
          return (
            <button key={quiz.id} onClick={() => startQuiz(quiz, index)}
              className="glass-card rounded-[2rem] p-6 flex items-center gap-6 hover:scale-[1.02] active:scale-95 transition-all border border-border/50 hover:border-primary/30 group shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                <Icon size={32} />
              </div>
              <div className="text-left flex-1">
                <h3 className="text-xl font-black text-foreground mb-1">{t(quiz.title.ar, quiz.title.en)}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-widest">5 {t('أسئلة', 'Questions')}</span>
                  <span className="text-[10px] text-muted-foreground font-bold">{t('نتائج مذهلة', 'Amazing Results')}</span>
                </div>
              </div>
              <Send size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PersonalityQuizzes;
