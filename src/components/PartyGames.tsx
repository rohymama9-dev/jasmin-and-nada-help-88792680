import { useState, useEffect, useRef } from 'react';
import { 
  HelpCircle, ShieldAlert, Ghost, Shuffle, RefreshCw, 
  ArrowLeft, ArrowRight, Timer, Trophy, Check, X, SkipForward,
  Star, Heart, Zap, Smile, Brain, Globe, Music, Quote, User, Play
} from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

// ───────── Expanded Data ─────────

const WOULD_YOU_RATHER = [
  // Social & Romantic
  { ar: "تعيش وحيداً للأبد أم مع شخص تكرهه؟", en: "Live alone forever OR with someone you hate?" },
  { ar: "الحب أم المال؟", en: "Love OR Money?" },
  { ar: "تكون غنياً بلا حب أم فقيراً مع حب حقيقي؟", en: "Be rich without love OR poor with true love?" },
  { ar: "تتزوج عن حب أم زواج تقليدي؟", en: "Marry for love OR traditional marriage?" },
  { ar: "تفقد القدرة على الكلام أم تفقد القدرة على السماع؟", en: "Lose ability to speak OR lose ability to hear?" },
  { ar: "تعرف سر كل شخص تراه أم لا أحد يعرف سرك؟", en: "Know everyone's secret OR nobody knows yours?" },
  // Fantasy & Powers
  { ar: "تطير أم تختفي؟", en: "Fly OR become invisible?" },
  { ar: "ترى المستقبل أم تعود للماضي؟", en: "See the future OR return to the past?" },
  { ar: "قوة خارقة أم ذكاء خارق؟", en: "Super strength OR super intelligence?" },
  { ar: "تتحدث مع الحيوانات أم تتحدث كل لغات العالم؟", en: "Talk to animals OR speak all world languages?" },
  { ar: "تعيش في عالم هاري بوتر أم عالم مارفل؟", en: "Live in Harry Potter world OR Marvel world?" },
  { ar: "تكون بطلاً خارقاً سرياً أم مشهوراً جداً؟", en: "Be a secret superhero OR very famous?" },
  // Lifestyle & Future
  { ar: "تعيش في مدينة صاخبة أم ريف هادئ؟", en: "Live in a busy city OR a quiet countryside?" },
  { ar: "تعرف متى ستموت أم كيف ستموت؟", en: "Know when you will die OR how you will die?" },
  { ar: "تنسى من أنت أم تنسى كل من تحبهم؟", en: "Forget who you are OR forget everyone you love?" },
  { ar: "تعيش في قصر في الغابة أم شقة في ناطحة سحاب؟", en: "Live in a forest mansion OR a skyscraper apartment?" },
  { ar: "تكون أول شخص على المريخ أم آخر شخص على الأرض؟", en: "Be first person on Mars OR last person on Earth?" },
  // Fun & Weird
  { ar: "تغني كل ما تقوله أم ترقص كلما مشيت؟", en: "Sing everything you say OR dance whenever you walk?" },
  { ar: "يكون لديك أنف طويل أم أذنان عملاقتان؟", en: "Have a long nose OR giant ears?" },
  { ar: "دائماً تتأخر ١٠ دقائق أم دائماً تصل مبكراً ٢٠ دقيقة؟", en: "Always be 10 mins late OR always be 20 mins early?" },
  { ar: "تأكل بيتزا فقط للأبد أم برجر فقط للأبد؟", en: "Eat only pizza forever OR only burgers forever?" },
  { ar: "تكون صرصوراً ذكياً أم بشرياً غبياً؟", en: "Be a smart cockroach OR a stupid human?" },
  { ar: "تلبس ملابس شتوية في الصيف أم صيفية في الشتاء؟", en: "Wear winter clothes in summer OR summer in winter?" },
  // Deep & Social
  { ar: "تكون مشهوراً ومكروهاً أم مجهولاً ومحبوباً؟", en: "Be famous and hated OR unknown and loved?" },
  { ar: "تعيش بدون إنترنت للأبد أم بدون أصدقاء للأبد؟", en: "Live without internet OR without friends?" },
  { ar: "تقرأ أفكار الآخرين أم تتحكم في أحلامك؟", en: "Read others' minds OR control your dreams?" },
  { ar: "تكون دائماً سعيداً وحدك أم حزيناً مع الآخرين؟", en: "Always happy alone OR sad with others?" },
  { ar: "تغير ماضيك أم تضمن مستقبلك؟", en: "Change your past OR guarantee your future?" },
  // Food & Travel
  { ar: "سفر مجاني للأبد أم طعام مجاني للأبد؟", en: "Free travel forever OR free food forever?" },
  { ar: "تطبخ كل وجباتك أم تأكل في المطاعم فقط؟", en: "Cook all your meals OR eat only at restaurants?" },
  { ar: "تعيش في الفضاء أم تحت المحيط؟", en: "Live in space OR under the ocean?" },
  { ar: "تشرب قهوة باردة للأبد أم شاي ساخن للأبد؟", en: "Drink cold coffee forever OR hot tea forever?" }
];

const ACTING_GAME = [
  // Movie Scenes & Titles
  { cat: 'movie', ar: "مشهد تيتانيك (أنا أطير)", en: "Titanic scene (I'm flying)" },
  { cat: 'movie', ar: "الأسد الملك (سيمبا على الصخرة)", en: "The Lion King (Simba on pride rock)" },
  { cat: 'movie', ar: "فيلم أفاتار", en: "Avatar movie" },
  { cat: 'movie', ar: "فيلم سبايدرمان (تسلق الجدران)", en: "Spider-Man movie (climbing walls)" },
  { cat: 'series', ar: "مسلسل صراع العروش", en: "Game of Thrones series" },
  { cat: 'series', ar: "مسلسل البروفيسور (لاكاسا دي بابيل)", en: "Money Heist (La Casa de Papel)" },
  { cat: 'series', ar: "مسلسل فريندز (الأصدقاء)", en: "Friends series" },
  
  // Actors & Actresses
  { cat: 'celeb', ar: "عادل إمام", en: "Adel Emam" },
  { cat: 'celeb', ar: "أحمد زكي", en: "Ahmed Zaki" },
  { cat: 'celeb', ar: "يسرا", en: "Youssra" },
  { cat: 'celeb', ar: "جاكي شان", en: "Jackie Chan" },
  { cat: 'celeb', ar: "توم كروز", en: "Tom Cruise" },
  { cat: 'celeb', ar: "أنجلينا جولي", en: "Angelina Jolie" },
  
  // Footballers
  { cat: 'sport', ar: "محمد صلاح (احتفال اليوجا)", en: "Mohamed Salah (yoga celebration)" },
  { cat: 'sport', ar: "كريستيانو رونالدو (Siuuu)", en: "Cristiano Ronaldo (Siuuu)" },
  { cat: 'sport', ar: "ليونيل ميسي", en: "Lionel Messi" },
  { cat: 'sport', ar: "نيمار (تمثيل الإصابة)", en: "Neymar (acting injured)" },
  
  // Singers
  { cat: 'singer', ar: "عمرو دياب", en: "Amr Diab" },
  { cat: 'singer', ar: "نانسي عجرم", en: "Nancy Ajram" },
  { cat: 'singer', ar: "أم كلثوم", en: "Umm Kulthum" },
  { cat: 'singer', ar: "مايكل جاكسون (مشية القمر)", en: "Michael Jackson (Moonwalk)" },
  { cat: 'singer', ar: "شاكيرا", en: "Shakira" },
];

const TRUTH_OR_DARE = {
  truths: [
    { ar: "ما هو أكثر موقف محرج تعرضت له؟", en: "What is your most embarrassing moment?" },
    { ar: "من هو الشخص الذي يعجبك حالياً؟", en: "Who is your current crush?" },
    { ar: "ما هي أكبر كذبة قلتها لوالديك؟", en: "What is the biggest lie you've ever told your parents?" },
    { ar: "ما هو الشيء الذي تخاف منه ولا يعرفه أحد؟", en: "What is something you're afraid of that nobody knows?" },
    { ar: "ما هي الصفة التي تكرهها في نفسك؟", en: "What trait do you hate about yourself?" },
    { ar: "من هو أقرب صديق لك ولماذا؟", en: "Who is your best friend and why?" },
    { ar: "هل سبق لك أن تظاهرت بالمرض للهروب من شيء؟", en: "Have you ever faked illness to escape something?" },
    { ar: "ما هو أغرب حلم حلمت به؟", en: "What is the weirdest dream you've ever had?" },
    { ar: "ما هو الشيء الذي تندم على فعله؟", en: "What is one thing you regret doing?" },
    { ar: "لو كان بإمكانك تغيير شيء واحد في حياتك، ماذا سيكون؟", en: "If you could change one thing in your life, what would it be?" },
    { ar: "ما هو أكثر شيء يجعلك تبكي؟", en: "What makes you cry the most?" },
    { ar: "هل سبق لك أن غششت في امتحان؟", en: "Have you ever cheated in an exam?" },
  ],
  dares: [
    { ar: "قم بتقليد صوت حيوان يختاره البقية.", en: "Mimic an animal sound chosen by others." },
    { ar: "اتصل بشخص عشوائي وقل له نكتة.", en: "Call a random person and tell them a joke." },
    { ar: "ارقص بدون موسيقى لمدة دقيقة.", en: "Dance without music for one minute." },
    { ar: "تحدث بلهجة مختلفة حتى نهاية اللعبة.", en: "Speak in a different accent until the end of the game." },
    { ar: "قم بعمل ١٠ تمارين ضغط.", en: "Do 10 push-ups." },
    { ar: "اغسل وجهك بالماء البارد الآن.", en: "Wash your face with cold water now." },
    { ar: "كل ملعقة كبيرة من الكاتشب أو الشطة.", en: "Eat a tablespoon of ketchup or hot sauce." },
    { ar: "حاول لمس أنفك بلسانك.", en: "Try to touch your nose with your tongue." },
    { ar: "قم بتمثيل دور عارض أزياء لمدة دقيقة.", en: "Act like a fashion model for one minute." },
    { ar: "أرسل إيموجي عشوائي لآخر شخص حادثته.", en: "Send a random emoji to the last person you texted." },
    { ar: "حاول أن تجعل شخصاً من الحضور يضحك في ٣٠ ثانية.", en: "Try to make someone laugh in 30 seconds." },
  ]
};

// ───────── Component ─────────

const shuffleItems = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5);

const PartyGames = ({ onScore }: { onScore?: (result: number) => void }) => {
  const { lang, dir } = useLang();
  const [activeTab, setActiveTab] = useState<'wyr' | 'acting' | 'tod'>('wyr');
  
  // Non-repeating randomization refs
  const shuffledWyr = useRef(shuffleItems(WOULD_YOU_RATHER));
  const [wyrIdx, setWyrIdx] = useState(0);
  
  const shuffledActing = useRef(shuffleItems(ACTING_GAME));
  const [actingIdx, setActingIdx] = useState(0);
  
  const shuffledTruths = useRef(shuffleItems(TRUTH_OR_DARE.truths));
  const [truthIdx, setTruthIdx] = useState(0);
  
  const shuffledDares = useRef(shuffleItems(TRUTH_OR_DARE.dares));
  const [dareIdx, setDareIdx] = useState(0);

  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [todType, setTodType] = useState<'truth' | 'dare' | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  // Timer Logic
  useEffect(() => {
    if (isTimerActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerActive(false);
      if (activeTab !== 'wyr') onScore?.(0);
      toast.error(t('انتهى الوقت!', 'Time is up!'));
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeTab, isTimerActive, onScore, timeLeft, lang]);

  const startTimer = () => {
    setTimeLeft(30);
    setIsTimerActive(true);
  };

  const startGame = () => {
    setGameStarted(true);
    setScore(0);
    startTimer();
  };

  const resetGame = () => {
    setGameStarted(false);
    setScore(0);
    setTimeLeft(30);
    setIsTimerActive(false);
    setTodType(null);
    setWyrIdx(0);
    setActingIdx(0);
    setTruthIdx(0);
    setDareIdx(0);
    shuffledWyr.current = shuffleItems(WOULD_YOU_RATHER);
    shuffledActing.current = shuffleItems(ACTING_GAME);
    shuffledTruths.current = shuffleItems(TRUTH_OR_DARE.truths);
    shuffledDares.current = shuffleItems(TRUTH_OR_DARE.dares);
  };

  const nextWyr = () => {
    let next = wyrIdx + 1;
    if (next >= shuffledWyr.current.length) {
      shuffledWyr.current = shuffleItems(WOULD_YOU_RATHER);
      next = 0;
    }
    setWyrIdx(next);
    // Award 2 points for requesting a random question (considered a completed/engagement action)
    onScore?.(1);
    startTimer();
  };

  const nextActing = (isCorrect: boolean) => {
    if (isCorrect) {
      setScore(prev => prev + 2);
      onScore?.(1);
      toast.success(t('+٢ نقاط!', '+2 Points!'));
    } else {
      onScore?.(0);
    }
    let next = actingIdx + 1;
    if (next >= shuffledActing.current.length) {
      shuffledActing.current = shuffleItems(ACTING_GAME);
      next = 0;
    }
    setActingIdx(next);
    startTimer();
  };

  const drawTod = (type: 'truth' | 'dare') => {
    setTodType(type);
    startTimer();
    if (type === 'truth') {
      let next = truthIdx + 1;
      if (next >= shuffledTruths.current.length) {
        shuffledTruths.current = shuffleItems(TRUTH_OR_DARE.truths);
        next = 0;
      }
      setTruthIdx(next);
    } else {
      let next = dareIdx + 1;
      if (next >= shuffledDares.current.length) {
        shuffledDares.current = shuffleItems(TRUTH_OR_DARE.dares);
        next = 0;
      }
      setDareIdx(next);
    }
  };

  const getActingIcon = (cat: string) => {
    switch(cat) {
      case 'movie': return <Ghost size={20} />;
      case 'series': return <Globe size={20} />;
      case 'sport': return <Zap size={20} />;
      case 'singer': return <Music size={20} />;
      case 'celeb': return <User size={20} />;
      default: return <Star size={20} />;
    }
  };

  return (
    <div className="space-y-6 pb-10" dir={dir}>
      {/* Top Navigation */}
      <div className="flex gap-2 p-1 bg-secondary/50 rounded-2xl border border-border/50">
        {[
          { id: 'wyr', ar: 'لو خيروك', en: 'WYR', icon: HelpCircle },
          { id: 'acting', ar: 'تمثيل', en: 'Acting', icon: Ghost },
          { id: 'tod', ar: 'صراحة', en: 'T or D', icon: ShieldAlert },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any); 
              setTodType(null);
              if (!gameStarted) {
                setIsTimerActive(false);
                setTimeLeft(30);
              }
            }}
            className={`flex-1 py-3 rounded-xl text-xs font-black transition-all flex flex-col items-center gap-1 ${activeTab === tab.id ? 'bg-white text-primary shadow-md scale-105' : 'text-muted-foreground opacity-70'}`}
          >
            <tab.icon size={18} />
            {t(tab.ar, tab.en)}
          </button>
        ))}
      </div>

      {!gameStarted ? (
        // Start Screen
        <div className="glass-card rounded-[3rem] p-8 space-y-6 border-2 border-primary/10 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
          {/* Game Icon */}
          <div className="flex justify-center">
            <div className={`w-32 h-32 rounded-[2rem] flex items-center justify-center text-white shadow-xl text-5xl ${
              activeTab === 'wyr' ? 'gradient-primary' :
              activeTab === 'acting' ? 'bg-purple-500' :
              'bg-orange-500'
            }`}>
              {activeTab === 'wyr' ? '❓' : activeTab === 'acting' ? '🎭' : '💬'}
            </div>
          </div>

          {/* Game Title */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-foreground">
              {activeTab === 'wyr' ? t('لو خيروك؟', 'Would You Rather?') :
               activeTab === 'acting' ? t('لعبة التمثيل', 'Acting Game') :
               t('صراحة أم جرأة', 'Truth or Dare')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('لعبة جماعية ممتعة', 'A fun party game for everyone')}
            </p>
          </div>

          {/* Rules */}
          <div className="space-y-3 bg-secondary/50 rounded-2xl p-4">
            <p className="text-xs font-black text-primary uppercase tracking-widest">{t('قوانين اللعبة', 'Game Rules')}</p>
            <ul className="space-y-2">
              {activeTab === 'wyr' && [
                { ar: '📋 أجب عن أسئلة "لو خيروك" بصراحة', en: '📋 Answer "Would You Rather" questions honestly' },
                { ar: '⏱️ لديك 30 ثانية لكل سؤال', en: '⏱️ You have 30 seconds per question' },
                { ar: '🎯 لا يوجد إجابات خاطئة - فقط اختيارات!', en: '🎯 No wrong answers - just choices!' },
                { ar: '🔄 اسحب لليمين للسؤال التالي', en: '🔄 Swipe for the next question' },
              ].map((rule, i) => (
                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                  <span className="mt-0.5">{rule[lang === 'ar' ? 'ar' : 'en'].split(' ')[0]}</span>
                  <span>{rule[lang === 'ar' ? 'ar' : 'en'].split(' ').slice(1).join(' ')}</span>
                </li>
              ))}
              {activeTab === 'acting' && [
                { ar: '🎭 مثل الكلمة/المشهد بدون استخدام كلمات', en: '🎭 Act out the word/scene silently' },
                { ar: '👥 فريقك يخمن ما تمثله في 30 ثانية', en: '👥 Your team guesses in 30 seconds' },
                { ar: '✅ اضغط "صحيح" للإجابة الصحيحة', en: '✅ Tap "Correct" for right answers' },
                { ar: '➕ كل إجابة صحيحة = +10 نقاط', en: '➕ Each correct answer = +10 points' },
              ].map((rule, i) => (
                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                  <span className="mt-0.5">{rule[lang === 'ar' ? 'ar' : 'en'].split(' ')[0]}</span>
                  <span>{rule[lang === 'ar' ? 'ar' : 'en'].split(' ').slice(1).join(' ')}</span>
                </li>
              ))}
              {activeTab === 'tod' && [
                { ar: '💬 اختر بين "صراحة" أو "جرأة"', en: '💬 Choose "Truth" or "Dare"' },
                { ar: '🤔 الصراحة: أجب على سؤال شخصي بصدق', en: '🤔 Truth: Answer a personal question honestly' },
                { ar: '🏃 الجرأة: أنجز تحدياً مجنوناً', en: '🏃 Dare: Complete a crazy challenge' },
                { ar: '⏰ لديك 30 ثانية لإكمال الجرأة', en: '⏰ 30 seconds to complete the dare' },
              ].map((rule, i) => (
                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                  <span className="mt-0.5">{rule[lang === 'ar' ? 'ar' : 'en'].split(' ')[0]}</span>
                  <span>{rule[lang === 'ar' ? 'ar' : 'en'].split(' ').slice(1).join(' ')}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Start Button */}
          <button
            onClick={startGame}
            className="w-full py-4 rounded-2xl gradient-primary text-primary-foreground font-black text-lg shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-3 hover:shadow-primary/30"
          >
            <Play size={24} fill="currentColor" />
            {t('ابدأ اللعب', 'Start Game')}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            {t('استمتعي بالوقت مع أصدقائك! 🎉', 'Have fun with your friends! 🎉')}
          </p>
        </div>
      ) : (
        // Main Game Card
        <div className="relative glass-card rounded-[3rem] p-8 min-h-[450px] flex flex-col items-center justify-center text-center space-y-8 overflow-hidden border-2 border-primary/10 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
          {/* Background Decorative Elements */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-accent/5 rounded-full blur-3xl" />

          {/* Stats Header */}
          <div className="absolute top-6 left-6 right-6 flex justify-between items-center w-[calc(100%-3rem)]">
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm border border-border/50">
              <Trophy size={16} className="text-yellow-500" />
              <span className="text-sm font-black text-foreground">{score}</span>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl shadow-sm border border-border/50 transition-colors ${timeLeft <= 5 ? 'bg-red-500 text-white animate-pulse' : 'bg-white/80 backdrop-blur-md text-foreground'}`}>
              <Timer size={16} />
              <span className="text-sm font-black font-mono">{timeLeft}s</span>
            </div>
            <button 
              onClick={resetGame}
              className="p-2 rounded-lg bg-white/80 backdrop-blur-md hover:bg-white transition-colors"
              title={t('إعادة تعيين', 'Reset')}
            >
              <RefreshCw size={16} className="text-foreground" />
            </button>
          </div>

          {/* Game Content */}
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 w-full max-w-sm">
          {activeTab === 'wyr' && (
            <>
              <div className="w-20 h-20 rounded-[2rem] gradient-primary flex items-center justify-center text-white shadow-xl rotate-3">
                <HelpCircle size={40} />
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">{t('لو خيروك بين...', 'WOULD YOU RATHER...')}</p>
                <h3 className="text-2xl font-black text-foreground leading-tight tracking-tight">
                  {t(shuffledWyr.current[wyrIdx].ar, shuffledWyr.current[wyrIdx].en)}
                </h3>
              </div>
              <button 
                onClick={nextWyr}
                className="w-full py-5 rounded-[1.5rem] gradient-primary text-white font-black text-lg shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <Shuffle size={24} />
                {t('سؤال عشوائي', 'Random Question')}
              </button>
            </>
          )}

          {activeTab === 'acting' && (
            <>
              <div className="w-20 h-20 rounded-[2rem] bg-purple-500 flex items-center justify-center text-white shadow-xl -rotate-3">
                <Ghost size={40} />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-purple-500 bg-purple-500/10 px-4 py-1.5 rounded-full mx-auto w-fit">
                  {getActingIcon(shuffledActing.current[actingIdx].cat)}
                  <span className="text-[10px] font-black uppercase tracking-widest">{t(shuffledActing.current[actingIdx].cat, shuffledActing.current[actingIdx].cat)}</span>
                </div>
                <h3 className="text-3xl font-black text-foreground leading-tight tracking-tight">
                  {t(shuffledActing.current[actingIdx].ar, shuffledActing.current[actingIdx].en)}
                </h3>
                <p className="text-xs font-bold text-muted-foreground">{t('مثل هذا بدون كلام!', 'Act this out without words!')}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3 w-full">
                <button 
                  onClick={() => nextActing(true)}
                  className="py-4 rounded-2xl bg-emerald-500 text-white font-black shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Check size={20} />
                  {t('إجابة صح', 'Correct')}
                </button>
                <button 
                  onClick={() => nextActing(false)}
                  className="py-4 rounded-2xl bg-red-500 text-white font-black shadow-lg shadow-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <X size={20} />
                  {t('خطأ / تخطي', 'Skip')}
                </button>
              </div>
            </>
          )}

          {activeTab === 'tod' && (
            <>
              <div className="w-20 h-20 rounded-[2rem] bg-orange-500 flex items-center justify-center text-white shadow-xl">
                <ShieldAlert size={40} />
              </div>
              {!todType ? (
                <div className="grid grid-cols-1 gap-4 w-full">
                  <button onClick={() => drawTod('truth')} className="group p-6 rounded-[2rem] bg-blue-500 hover:bg-blue-600 text-white shadow-xl active:scale-95 transition-all flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-xs font-black opacity-70 uppercase tracking-widest">{t('حقيقة', 'TRUTH')}</p>
                      <p className="text-2xl font-black">{t('صراحة', 'Truth')}</p>
                    </div>
                    <Brain size={32} className="opacity-40 group-hover:scale-110 transition-transform" />
                  </button>
                  <button onClick={() => drawTod('dare')} className="group p-6 rounded-[2rem] bg-rose-500 hover:bg-rose-600 text-white shadow-xl active:scale-95 transition-all flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-xs font-black opacity-70 uppercase tracking-widest">{t('تحدي', 'DARE')}</p>
                      <p className="text-2xl font-black">{t('جرأة', 'Dare')}</p>
                    </div>
                    <Zap size={32} className="opacity-40 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                  <div className={`px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest mx-auto w-fit ${todType === 'truth' ? 'bg-blue-500 text-white' : 'bg-rose-500 text-white'}`}>
                    {todType === 'truth' ? t('صراحة', 'Truth') : t('جرأة', 'Dare')}
                  </div>
                  <h3 className="text-2xl font-black text-foreground leading-tight">
                    {todType === 'truth' 
                      ? t(shuffledTruths.current[truthIdx].ar, shuffledTruths.current[truthIdx].en)
                      : t(shuffledDares.current[dareIdx].ar, shuffledDares.current[dareIdx].en)
                    }
                  </h3>
                  <div className="flex flex-col gap-3">
                                  <button 
                                    onClick={() => { setScore(prev => prev + 2); onScore?.(1); setTodType(null); }}
                                    className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-black shadow-lg active:scale-95 transition-all"
                                  >
                                    {t('تم الإنجاز (+٢)', 'Done (+2)')}
                                  </button>
                    <button onClick={() => setTodType(null)} className="w-full py-4 rounded-2xl bg-secondary text-foreground font-black active:scale-95 transition-all flex items-center justify-center gap-2">
                      <RefreshCw size={18} />
                      {t('رجوع', 'Back')}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Hint */}
        <p className="absolute bottom-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-50">
          {t('لعبة جماعية · صيف ٢٠٢٤', 'PARTY GAME · SUMMER 2024')}
        </p>
      </div>
      )}

      {/* Share Score Button */}
      <button className="w-full py-4 rounded-2xl bg-secondary/50 border border-border text-foreground font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all">
        <Globe size={18} />
        {t('تحدي أصدقائك', 'Challenge Friends')}
      </button>
    </div>
  );
};

export default PartyGames;
