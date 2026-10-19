import { useState } from 'react';
import { Sparkles, ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';

interface Quote {
  textAr: string;
  textEn: string;
  authorAr: string;
  authorEn: string;
  color: string;
}

const colors = [
  'from-rose-400 to-pink-500', 'from-emerald-400 to-green-500', 'from-amber-400 to-orange-500',
  'from-sky-400 to-blue-500', 'from-violet-400 to-purple-500', 'from-teal-400 to-cyan-500',
  'from-indigo-400 to-blue-500', 'from-pink-400 to-rose-500', 'from-fuchsia-400 to-purple-500',
  'from-red-400 to-rose-500',
];

const quotes: Quote[] = [
  { textAr: 'كن أنت التغيير الذي تريد أن تراه في العالم', textEn: 'Be the change you wish to see in the world', authorAr: 'غاندي', authorEn: 'Gandhi', color: colors[0] },
  { textAr: 'إن مع العسر يسراً', textEn: 'Indeed, with hardship comes ease', authorAr: 'القرآن الكريم', authorEn: 'The Holy Quran', color: colors[1] },
  { textAr: 'العلم نور والجهل ظلام', textEn: 'Knowledge is light and ignorance is darkness', authorAr: 'حكمة عربية', authorEn: 'Arabic Wisdom', color: colors[2] },
  { textAr: 'لا تؤجل عمل اليوم إلى الغد', textEn: "Don't put off today's work until tomorrow", authorAr: 'حكمة', authorEn: 'Proverb', color: colors[3] },
  { textAr: 'الصبر مفتاح الفرج', textEn: 'Patience is the key to relief', authorAr: 'حكمة إسلامية', authorEn: 'Islamic Wisdom', color: colors[4] },
  { textAr: 'من جد وجد ومن زرع حصد', textEn: 'He who works hard succeeds', authorAr: 'حكمة عربية', authorEn: 'Arabic Proverb', color: colors[5] },
  { textAr: 'التعليم سلاح يمكنك استخدامه لتغيير العالم', textEn: 'Education is the most powerful weapon to change the world', authorAr: 'نيلسون مانديلا', authorEn: 'Nelson Mandela', color: colors[6] },
  { textAr: 'ابدأ من حيث أنت. استخدم ما لديك. افعل ما تستطيع', textEn: 'Start where you are. Use what you have. Do what you can', authorAr: 'آرثر آش', authorEn: 'Arthur Ashe', color: colors[7] },
  { textAr: 'النجاح ليس نهائياً والفشل ليس قاتلاً', textEn: 'Success is not final, failure is not fatal', authorAr: 'ونستون تشرشل', authorEn: 'Winston Churchill', color: colors[8] },
  { textAr: 'كل إنجاز عظيم كان في البداية حلماً', textEn: 'Every great achievement was once a dream', authorAr: 'مجهول', authorEn: 'Unknown', color: colors[9] },
  { textAr: 'الحياة ليست إيجاد نفسك بل صنع نفسك', textEn: 'Life is not about finding yourself, it is about creating yourself', authorAr: 'جورج برنارد شو', authorEn: 'George Bernard Shaw', color: colors[0] },
  { textAr: 'لا تخف من التقدم ببطء بل خف من الوقوف', textEn: 'Do not fear going slowly, only fear standing still', authorAr: 'حكمة صينية', authorEn: 'Chinese Proverb', color: colors[1] },
  { textAr: 'الأمل هو الريشة التي تستقر في الروح', textEn: 'Hope is the thing with feathers that perches in the soul', authorAr: 'إميلي ديكنسون', authorEn: 'Emily Dickinson', color: colors[2] },
  { textAr: 'أنت أشجع مما تعتقد وأقوى مما تبدو', textEn: 'You are braver than you believe, stronger than you seem', authorAr: 'أ.أ. ميلن', authorEn: 'A.A. Milne', color: colors[3] },
  { textAr: 'المستحيل ما هو إلا رأي', textEn: 'Impossible is just an opinion', authorAr: 'باولو كويلو', authorEn: 'Paulo Coelho', color: colors[4] },
  { textAr: 'كن لطيفاً فكل شخص تقابله يخوض معركة صعبة', textEn: 'Be kind, for everyone you meet is fighting a hard battle', authorAr: 'أفلاطون', authorEn: 'Plato', color: colors[5] },
  { textAr: 'الوقت الذي تستمتع بإضاعته ليس وقتاً ضائعاً', textEn: 'Time you enjoy wasting is not wasted time', authorAr: 'جون لينون', authorEn: 'John Lennon', color: colors[6] },
  { textAr: 'إذا أردت شيئاً لم يسبق لك الحصول عليه فافعل شيئاً لم تفعله', textEn: 'If you want something you never had, do something you have never done', authorAr: 'توماس جيفرسون', authorEn: 'Thomas Jefferson', color: colors[7] },
  { textAr: 'ليس هناك طريق للسعادة — السعادة هي الطريق', textEn: 'There is no path to happiness — happiness is the path', authorAr: 'بوذا', authorEn: 'Buddha', color: colors[8] },
  { textAr: 'أعظم مجد ليس في عدم السقوط بل في النهوض بعد كل سقوط', textEn: 'The greatest glory is not in never falling but in rising every time we fall', authorAr: 'كونفوشيوس', authorEn: 'Confucius', color: colors[9] },
  { textAr: 'الطريقة الوحيدة للقيام بعمل عظيم هي أن تحب ما تفعله', textEn: 'The only way to do great work is to love what you do', authorAr: 'ستيف جوبز', authorEn: 'Steve Jobs', color: colors[0] },
  { textAr: 'لا تحكم على كل يوم بما حصدت بل بما زرعت', textEn: 'Don\'t judge each day by the harvest but by the seeds you plant', authorAr: 'ستيفنسون', authorEn: 'R.L. Stevenson', color: colors[1] },
  { textAr: 'في وسط الصعوبة تكمن الفرصة', textEn: 'In the middle of difficulty lies opportunity', authorAr: 'ألبرت أينشتاين', authorEn: 'Albert Einstein', color: colors[2] },
  { textAr: 'لا يوجد مصعد للنجاح — عليك أخذ الدرج', textEn: 'There is no elevator to success — you have to take the stairs', authorAr: 'زيغ زيغلار', authorEn: 'Zig Ziglar', color: colors[3] },
  { textAr: 'كن نفسك فالجميع غيرك موجود بالفعل', textEn: 'Be yourself; everyone else is already taken', authorAr: 'أوسكار وايلد', authorEn: 'Oscar Wilde', color: colors[4] },
  { textAr: 'الخيال أهم من المعرفة', textEn: 'Imagination is more important than knowledge', authorAr: 'أينشتاين', authorEn: 'Einstein', color: colors[5] },
  { textAr: 'ليس المهم أن تكون الأفضل بل أن تكون أفضل مما كنت بالأمس', textEn: 'It\'s not about being the best, but being better than yesterday', authorAr: 'حكمة', authorEn: 'Wisdom', color: colors[6] },
  { textAr: 'العقل مثل المظلة لا يعمل إلا إذا فُتح', textEn: 'The mind is like a parachute — it works only when open', authorAr: 'فرانك زابا', authorEn: 'Frank Zappa', color: colors[7] },
  { textAr: 'أنا لا أفشل أنا أتعلم', textEn: 'I don\'t fail, I learn', authorAr: 'حكمة', authorEn: 'Wisdom', color: colors[8] },
  { textAr: 'القراءة للعقل كالرياضة للجسم', textEn: 'Reading is to the mind what exercise is to the body', authorAr: 'جوزيف أديسون', authorEn: 'Joseph Addison', color: colors[9] },
  { textAr: 'أحسن إلى الناس تستعبد قلوبهم', textEn: 'Be good to people and you will win their hearts', authorAr: 'علي بن أبي طالب', authorEn: 'Ali ibn Abi Talib', color: colors[0] },
  { textAr: 'اطلبوا العلم من المهد إلى اللحد', textEn: 'Seek knowledge from the cradle to the grave', authorAr: 'حكمة إسلامية', authorEn: 'Islamic Wisdom', color: colors[1] },
  { textAr: 'رحلة الألف ميل تبدأ بخطوة واحدة', textEn: 'A journey of a thousand miles begins with a single step', authorAr: 'لاو تزو', authorEn: 'Lao Tzu', color: colors[2] },
  { textAr: 'كل عمل عظيم بدأ بفكرة بسيطة', textEn: 'Every great work started with a simple idea', authorAr: 'حكمة', authorEn: 'Wisdom', color: colors[3] },
  { textAr: 'لا تنتظر الفرصة بل اصنعها', textEn: 'Don\'t wait for opportunity, create it', authorAr: 'جورج برنارد شو', authorEn: 'George Bernard Shaw', color: colors[4] },
  { textAr: 'الابتسامة صدقة', textEn: 'Smiling is charity', authorAr: 'حديث شريف', authorEn: 'Prophet Muhammad ﷺ', color: colors[5] },
  { textAr: 'من ترك شيئاً لله عوّضه الله خيراً منه', textEn: 'Whoever leaves something for Allah, Allah will replace it with something better', authorAr: 'حديث شريف', authorEn: 'Prophet Muhammad ﷺ', color: colors[6] },
  { textAr: 'خير الناس أنفعهم للناس', textEn: 'The best of people are those most beneficial to others', authorAr: 'حديث شريف', authorEn: 'Prophet Muhammad ﷺ', color: colors[7] },
  { textAr: 'إنما الأعمال بالنيات', textEn: 'Actions are judged by intentions', authorAr: 'حديث شريف', authorEn: 'Prophet Muhammad ﷺ', color: colors[8] },
  { textAr: 'لا يكلف الله نفساً إلا وسعها', textEn: 'Allah does not burden a soul beyond its capacity', authorAr: 'القرآن الكريم', authorEn: 'The Holy Quran', color: colors[9] },
  { textAr: 'وقل ربي زدني علماً', textEn: 'And say: My Lord, increase me in knowledge', authorAr: 'القرآن الكريم', authorEn: 'The Holy Quran', color: colors[0] },
  { textAr: 'ومن يتق الله يجعل له مخرجاً', textEn: 'Whoever fears Allah, He will make a way out for them', authorAr: 'القرآن الكريم', authorEn: 'The Holy Quran', color: colors[1] },
  { textAr: 'إذا عزمت فتوكل على الله', textEn: 'When you have decided, put your trust in Allah', authorAr: 'القرآن الكريم', authorEn: 'The Holy Quran', color: colors[2] },
  { textAr: 'الحمد لله الذي بنعمته تتم الصالحات', textEn: 'All praise to Allah by whose grace good deeds are completed', authorAr: 'دعاء', authorEn: 'Dua', color: colors[3] },
  { textAr: 'الشكر يزيد النعم', textEn: 'Gratitude increases blessings', authorAr: 'حكمة إسلامية', authorEn: 'Islamic Wisdom', color: colors[4] },
  { textAr: 'من صبر ظفر', textEn: 'He who is patient attains victory', authorAr: 'حكمة عربية', authorEn: 'Arabic Proverb', color: colors[5] },
  { textAr: 'إن الله لا يضيع أجر المحسنين', textEn: 'Indeed Allah does not waste the reward of those who do good', authorAr: 'القرآن الكريم', authorEn: 'The Holy Quran', color: colors[6] },
  { textAr: 'لا يُكلَّف الإنسان إلا بما يَقدِر عليه', textEn: 'A person is only tasked with what they can handle', authorAr: 'حكمة', authorEn: 'Wisdom', color: colors[7] },
  { textAr: 'العمل الجاد يتفوق على الموهبة عندما لا تعمل الموهبة بجد', textEn: 'Hard work beats talent when talent doesn\'t work hard', authorAr: 'تيم نوتكي', authorEn: 'Tim Notke', color: colors[8] },
  { textAr: 'ليس الشديد بالصرعة إنما الشديد الذي يملك نفسه عند الغضب', textEn: 'The strong person is not the one who can overpower others, but the one who controls themselves when angry', authorAr: 'حديث شريف', authorEn: 'Prophet Muhammad ﷺ', color: colors[9] },
  { textAr: 'أفضل وقت لزراعة شجرة كان قبل 20 سنة والوقت الثاني الأفضل هو الآن', textEn: 'The best time to plant a tree was 20 years ago. The second best time is now', authorAr: 'حكمة صينية', authorEn: 'Chinese Proverb', color: colors[0] },
  { textAr: 'لا تقارن نفسك بالآخرين قارن نفسك بمن كنت بالأمس', textEn: 'Don\'t compare yourself with others. Compare yourself to who you were yesterday', authorAr: 'جوردان بيترسون', authorEn: 'Jordan Peterson', color: colors[1] },
];

const InspirationalQuotes = () => {
  const { lang, dir } = useLang();
  const [index, setIndex] = useState(0);
  const BackArrow = dir === 'rtl' ? ArrowRight : ArrowLeft;

  const nextQuote = () => setIndex((i) => (i + 1) % quotes.length);
  const prevQuote = () => setIndex((i) => (i - 1 + quotes.length) % quotes.length);
  const randomQuote = () => setIndex(Math.floor(Math.random() * quotes.length));

  const quote = quotes[index];

  return (
    <div className="pb-4 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-primary" />
          <h2 className="text-lg font-bold text-foreground">
            {lang === 'ar' ? 'اقتباسات ملهمة' : 'Inspirational Quotes'}
          </h2>
        </div>
        <span className="text-xs text-muted-foreground">{index + 1}/{quotes.length}</span>
      </div>

      <div className={`rounded-2xl bg-gradient-to-br ${quote.color} p-6 shadow-lg transition-all duration-500`}>
        <div className="text-center text-primary-foreground space-y-3">
          <Sparkles size={28} className="mx-auto opacity-80" />
          <p className="text-lg font-bold leading-relaxed" style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
            "{lang === 'ar' ? quote.textAr : quote.textEn}"
          </p>
          <p className="text-sm opacity-80">— {lang === 'ar' ? quote.authorAr : quote.authorEn}</p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button onClick={prevQuote} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
          <BackArrow size={16} className="text-foreground" />
        </button>
        <button onClick={randomQuote} className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center hover:scale-105 transition-all">
          <RefreshCw size={16} className="text-primary-foreground" />
        </button>
        <button onClick={nextQuote} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
          <BackArrow size={16} className="text-foreground rotate-180" />
        </button>
      </div>
    </div>
  );
};

export default InspirationalQuotes;
