import { useState, useMemo } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { Lightbulb, Play } from 'lucide-react';

interface Props { onScore?: (n: number) => void; }

interface Puzzle {
  ar: { statements: string[]; truth: string; hint: string };
  en: { statements: string[]; truth: string; hint: string };
  liar: number;
  image: string;
}

const PUZZLES: Puzzle[] = [
  {
    ar: { statements: ['أنا لم أكسر المزهرية', 'سامي كسر المزهرية', 'كريم لم يكسرها'], truth: 'كريم هو من كسرها فعلاً', hint: 'لاحظ من يتهم الآخر مباشرة بدون دليل' },
    en: { statements: ['I did not break the vase', 'Sami broke the vase', 'Karim did not break it'], truth: 'Karim actually broke it', hint: 'Watch who directly accuses another without proof' },
    liar: 1,
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&q=70',
  },
  {
    ar: { statements: ['كنت في المنزل', 'رأيت أحمد في الحديقة', 'لم أخرج اليوم'], truth: 'أحمد كان في المدرسة طوال اليوم', hint: 'تحقق من المكان المذكور — هل يتطابق مع الحقيقة؟' },
    en: { statements: ['I was at home', 'I saw Ahmed in the garden', 'I did not go out today'], truth: 'Ahmed was at school all day', hint: 'Check the location mentioned — does it match reality?' },
    liar: 1,
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=70',
  },
  {
    ar: { statements: ['أنا أكلت التفاحة', 'لم أرَ أحداً يأكلها', 'كانت التفاحة على الطاولة'], truth: 'الكاميرا أظهرت أن لا أحد لمس التفاحة', hint: 'الاعتراف الكاذب أيضاً كذب' },
    en: { statements: ['I ate the apple', 'I did not see anyone eat it', 'The apple was on the table'], truth: 'Camera showed no one touched the apple', hint: 'A false confession is also a lie' },
    liar: 0,
    image: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600&q=70',
  },
  {
    ar: { statements: ['نمت مبكراً أمس', 'كنت أدرس حتى منتصف الليل', 'لم أرَ التلفاز'], truth: 'كان يدرس بالفعل حتى الفجر', hint: 'انتبه للتعارض مع الحقيقة المعلنة' },
    en: { statements: ['I slept early yesterday', 'I was studying until midnight', 'I did not watch TV'], truth: 'He was actually studying until dawn', hint: 'Look for contradiction with the stated truth' },
    liar: 0,
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=70',
  },
  {
    ar: { statements: ['أنا أحب القطط', 'أكلت سمكاً اليوم', 'لدي كلب في المنزل'], truth: 'لديها قطة فقط، ولا كلاب', hint: 'تحقق من ادعاءات الملكية' },
    en: { statements: ['I love cats', 'I ate fish today', 'I have a dog at home'], truth: 'She only has a cat, no dogs', hint: 'Check ownership claims' },
    liar: 2,
    image: 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=600&q=70',
  },
  {
    ar: { statements: ['ذهبت إلى الشاطئ', 'الطقس كان ممطراً', 'لعبت في الرمال'], truth: 'كان يوماً مشمساً تماماً', hint: 'تحقق من حالة الطقس' },
    en: { statements: ['I went to the beach', 'The weather was rainy', 'I played in the sand'], truth: 'It was a fully sunny day', hint: 'Check the weather claim' },
    liar: 1,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=70',
  },
  {
    ar: { statements: ['أنا أعزف البيانو', 'تعلمت لمدة ٥ سنوات', 'أكره الموسيقى'], truth: 'لا يمكن أن يحب العزف ويكره الموسيقى', hint: 'ابحث عن التناقض الداخلي' },
    en: { statements: ['I play the piano', 'I learned for 5 years', 'I hate music'], truth: 'Cannot love playing and hate music', hint: 'Look for internal contradiction' },
    liar: 2,
    image: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=600&q=70',
  },
  {
    ar: { statements: ['ركبت الدراجة الجبلية', 'صعدت إلى القمة', 'لم أتعرق إطلاقاً'], truth: 'صعود القمة يستلزم مجهوداً كبيراً', hint: 'النتائج الجسدية تكشف الكذب' },
    en: { statements: ['I rode a mountain bike', 'I reached the summit', 'I did not sweat at all'], truth: 'Reaching a summit requires effort', hint: 'Physical outcomes reveal lies' },
    liar: 2,
    image: 'https://images.unsplash.com/photo-1544191696-102dbdaeeaa0?w=600&q=70',
  },
  {
    ar: { statements: ['طبخت الكعكة بنفسي', 'استخدمت الفرن', 'لم تسخن المطبخ أبداً'], truth: 'استخدام الفرن يسخن المطبخ', hint: 'ربط السبب بالنتيجة' },
    en: { statements: ['I baked the cake myself', 'I used the oven', 'The kitchen never warmed up'], truth: 'Using the oven warms the kitchen', hint: 'Cause-and-effect logic' },
    liar: 2,
    image: 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=600&q=70',
  },
  {
    ar: { statements: ['اشتريت حذاء جديداً', 'سعره ١٠٠٠ جنيه', 'دفعت بـ ٥٠ جنيه فقط'], truth: 'لا يمكن دفع ٥٠ مقابل ١٠٠٠', hint: 'الأرقام لا تكذب' },
    en: { statements: ['I bought new shoes', 'They cost 1000 EGP', 'I paid only 50 EGP'], truth: 'Cannot pay 50 for a 1000 item', hint: 'Numbers do not lie' },
    liar: 2,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=70',
  },
  {
    ar: { statements: ['درست طوال الليل', 'نمت ٨ ساعات', 'استيقظت متعباً'], truth: 'الدراسة طوال الليل تنفي النوم', hint: 'تعارض زمني واضح' },
    en: { statements: ['I studied all night', 'I slept 8 hours', 'I woke up tired'], truth: 'Studying all night excludes sleeping', hint: 'Clear time contradiction' },
    liar: 1,
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&q=70',
  },
  {
    ar: { statements: ['زرت ٣ دول الصيف', 'لم أركب طائرة', 'كنت في فرنسا واليابان وأستراليا'], truth: 'هذه الدول تتطلب طائرة', hint: 'الجغرافيا تكشف الحقيقة' },
    en: { statements: ['I visited 3 countries in summer', 'I never took a plane', 'I went to France, Japan, Australia'], truth: 'Those countries require a flight', hint: 'Geography reveals the truth' },
    liar: 1,
    image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=70',
  },
  {
    ar: { statements: ['لون قميصي أزرق', 'القميص جديد', 'لم أرتدِ شيئاً اليوم'], truth: 'إذا لم يرتدِ شيئاً فلا يوجد قميص', hint: 'الادعاء الثالث ينقض الأول' },
    en: { statements: ['My shirt is blue', 'It is new', 'I wore nothing today'], truth: 'No shirt if nothing was worn', hint: 'Third claim cancels the first' },
    liar: 2,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=70',
  },
];

const SUSPECTS = ['👨', '👩', '🧒'];
const FREE_HINTS = 2;
const HINTS_USED_KEY = 'who-lying-hints-used';

const WhoIsLying = ({ onScore }: Props) => {
  const { lang } = useLang();
  const [order, setOrder] = useState<number[]>(() => [...PUZZLES.keys()].sort(() => Math.random() - 0.5));
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [hintShown, setHintShown] = useState(false);
  const [hintsUsed, setHintsUsed] = useState<number>(() => parseInt(localStorage.getItem(HINTS_USED_KEY) || '0', 10) || 0);
  const [adPlaying, setAdPlaying] = useState(false);
  const [adProgress, setAdProgress] = useState(0);

  const puzzle = useMemo(() => PUZZLES[order[idx % order.length]], [order, idx]);
  const txt = puzzle[lang];

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === puzzle.liar) {
      const reward = 5 + streak;
      onScore?.(reward);
      setStreak(s => s + 1);
      toast.success(lang === 'ar' ? `🎉 صحيح! +${reward}` : `🎉 Correct! +${reward}`);
    } else {
      setStreak(0);
      toast.error(lang === 'ar' ? '❌ خطأ!' : '❌ Wrong!');
    }
  };

  const useHint = () => {
    if (hintShown) return;
    if (hintsUsed < FREE_HINTS) {
      setHintShown(true);
      const nu = hintsUsed + 1;
      setHintsUsed(nu);
      localStorage.setItem(HINTS_USED_KEY, String(nu));
    } else {
      // Trigger "ad-to-unlock"
      setAdPlaying(true);
      setAdProgress(0);
      const id = setInterval(() => {
        setAdProgress(p => {
          if (p >= 100) {
            clearInterval(id);
            setAdPlaying(false);
            setHintShown(true);
            toast.success(lang === 'ar' ? '🎬 تم فتح التلميح!' : '🎬 Hint unlocked!');
            return 100;
          }
          return p + 5;
        });
      }, 150);
    }
  };

  const next = () => {
    setPicked(null); setHintShown(false);
    if ((idx + 1) % order.length === 0) setOrder([...PUZZLES.keys()].sort(() => Math.random() - 0.5));
    setIdx(i => i + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold">🕵️ {lang === 'ar' ? 'من الكاذب؟' : 'Who Is Lying?'}</h2>
        <span className="text-xs px-2 py-1 rounded-lg bg-amber-100 font-bold">🔥 {streak}</span>
      </div>
      <p className="text-sm text-center text-muted-foreground">
        {lang === 'ar' ? 'واحد فقط يكذب — اكتشف من!' : 'Only one is lying — find out who!'}
      </p>

      <img src={puzzle.image} alt="puzzle scene"
        loading="lazy"
        className="w-full h-40 object-cover rounded-2xl shadow-md ring-1 ring-border" />

      <div className="grid grid-cols-1 gap-2">
        {txt.statements.map((s, i) => (
          <button key={i} onClick={() => choose(i)} disabled={picked !== null}
            className={`p-3 rounded-xl text-start text-sm border-2 transition flex items-start gap-3 ${
              picked === null
                ? 'border-border bg-card hover:border-primary'
                : i === puzzle.liar
                  ? 'border-emerald-500 bg-emerald-50'
                  : picked === i
                    ? 'border-red-500 bg-red-50'
                    : 'border-border bg-card opacity-60'
            }`}>
            <span className="text-2xl">{SUSPECTS[i]}</span>
            <span className="flex-1 font-medium">"{s}"</span>
          </button>
        ))}
      </div>

      {picked === null && (
        <button onClick={useHint} disabled={hintShown || adPlaying}
          className="w-full py-2.5 rounded-xl bg-amber-400 text-amber-950 font-bold flex items-center justify-center gap-2 disabled:opacity-60">
          <Lightbulb size={16} />
          {hintsUsed < FREE_HINTS
            ? (lang === 'ar' ? `💡 تلميح (${FREE_HINTS - hintsUsed} مجاني)` : `💡 Hint (${FREE_HINTS - hintsUsed} free)`)
            : (lang === 'ar' ? '🎬 شاهدي إعلاناً للحصول على تلميح' : '🎬 Watch ad for hint')}
        </button>
      )}

      {adPlaying && (
        <div className="rounded-xl p-4 bg-slate-900 text-white text-center space-y-2">
          <Play className="mx-auto animate-pulse" />
          <p className="text-xs font-bold">{lang === 'ar' ? 'إعلان قيد التشغيل...' : 'Ad playing...'}</p>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-400 transition-all" style={{ width: `${adProgress}%` }} />
          </div>
        </div>
      )}

      {hintShown && (
        <div className="p-3 rounded-xl bg-amber-100 border border-amber-300 text-sm text-amber-900">
          <p className="font-bold">💡 {lang === 'ar' ? 'تلميح:' : 'Hint:'}</p>
          <p>{txt.hint}</p>
        </div>
      )}

      {picked !== null && (
        <div className="p-3 rounded-xl bg-primary/10 text-sm text-center">
          <p className="font-bold mb-1">{lang === 'ar' ? '💡 الحقيقة:' : '💡 Truth:'}</p>
          <p>{txt.truth}</p>
          <button onClick={next} className="mt-3 px-5 py-2 rounded-xl gradient-primary text-primary-foreground font-bold">
            ▶️ {lang === 'ar' ? 'التالي' : 'Next'}
          </button>
        </div>
      )}
    </div>
  );
};

export default WhoIsLying;
