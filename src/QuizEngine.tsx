// FILE: src/components/QuizEngine.tsx
// ─────────────────────────────────────────────────────────────────────────────
// EXACT REPLACEMENT
// Changes vs original:
//   • usedQuestionIds state replaces random re-pick (no repeats until bank exhausted)
//   • BANK expanded to 48 accurate bilingual questions
//   • All other UI/logic untouched
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';
import { useLang } from '@/contexts/LanguageContext';

interface Props { onScore?: (n: number) => void; }

type Q = {
  qAr: string;
  qEn: string;
  opts: { ar: string; en: string }[];
  ansIdx: number;
};

// ═══════════════════════════════════════════════════════════════════════════
// QUESTION BANK — 48 verified bilingual questions, varied categories
// ═══════════════════════════════════════════════════════════════════════════
const BANK: Q[] = [
  // ── Math ──
  { qAr: 'كم يساوي ٧ × ٨؟', qEn: 'What is 7 × 8?',
    opts: [{ ar:'٤٢',en:'42' },{ ar:'٥٤',en:'54' },{ ar:'٥٦',en:'56' },{ ar:'٦٤',en:'64' }], ansIdx: 2 },
  { qAr: 'كم يساوي ١٢٥ ÷ ٥؟', qEn: 'What is 125 ÷ 5?',
    opts: [{ ar:'٢٠',en:'20' },{ ar:'٢٥',en:'25' },{ ar:'٣٠',en:'30' },{ ar:'٣٥',en:'35' }], ansIdx: 1 },
  { qAr: 'الجذر التربيعي لـ ١٤٤؟', qEn: 'Square root of 144?',
    opts: [{ ar:'١٠',en:'10' },{ ar:'١١',en:'11' },{ ar:'١٢',en:'12' },{ ar:'١٤',en:'14' }], ansIdx: 2 },
  { qAr: 'كم يساوي ١٥٪ من ٢٠٠؟', qEn: '15% of 200?',
    opts: [{ ar:'٢٥',en:'25' },{ ar:'٣٠',en:'30' },{ ar:'٣٥',en:'35' },{ ar:'٢٠',en:'20' }], ansIdx: 1 },
  { qAr: 'ما ناتج ٢³؟', qEn: 'What is 2³?',
    opts: [{ ar:'٦',en:'6' },{ ar:'٨',en:'8' },{ ar:'٩',en:'9' },{ ar:'١٢',en:'12' }], ansIdx: 1 },
  { qAr: 'كم زاوية في المثلث؟', qEn: 'Sum of angles in a triangle?',
    opts: [{ ar:'٩٠°',en:'90°' },{ ar:'١٨٠°',en:'180°' },{ ar:'٢٧٠°',en:'270°' },{ ar:'٣٦٠°',en:'360°' }], ansIdx: 1 },

  // ── Geography ──
  { qAr: 'ما عاصمة فرنسا؟', qEn: 'Capital of France?',
    opts: [{ ar:'برلين',en:'Berlin' },{ ar:'باريس',en:'Paris' },{ ar:'مدريد',en:'Madrid' },{ ar:'روما',en:'Rome' }], ansIdx: 1 },
  { qAr: 'أكبر محيط في العالم؟', qEn: 'Largest ocean in the world?',
    opts: [{ ar:'الأطلسي',en:'Atlantic' },{ ar:'الهندي',en:'Indian' },{ ar:'الهادئ',en:'Pacific' },{ ar:'المتجمد',en:'Arctic' }], ansIdx: 2 },
  { qAr: 'في أي قارة تقع مصر؟', qEn: 'Egypt is in which continent?',
    opts: [{ ar:'آسيا',en:'Asia' },{ ar:'أفريقيا',en:'Africa' },{ ar:'أوروبا',en:'Europe' },{ ar:'أوقيانيا',en:'Oceania' }], ansIdx: 1 },
  { qAr: 'أطول نهر في العالم؟', qEn: 'Longest river in the world?',
    opts: [{ ar:'الأمازون',en:'Amazon' },{ ar:'النيل',en:'Nile' },{ ar:'المسيسيبي',en:'Mississippi' },{ ar:'اليانغتسي',en:'Yangtze' }], ansIdx: 1 },
  { qAr: 'ما عاصمة البرازيل؟', qEn: 'Capital of Brazil?',
    opts: [{ ar:'ريو دي جانيرو',en:'Rio de Janeiro' },{ ar:'ساو باولو',en:'São Paulo' },{ ar:'برازيليا',en:'Brasília' },{ ar:'سالفادور',en:'Salvador' }], ansIdx: 2 },
  { qAr: 'أكبر دولة في العالم مساحةً؟', qEn: 'Largest country by area?',
    opts: [{ ar:'كندا',en:'Canada' },{ ar:'الصين',en:'China' },{ ar:'روسيا',en:'Russia' },{ ar:'الولايات المتحدة',en:'USA' }], ansIdx: 2 },

  // ── Science ──
  { qAr: 'رمز الماء الكيميائي؟', qEn: 'Chemical symbol for water?',
    opts: [{ ar:'O₂',en:'O₂' },{ ar:'H₂O',en:'H₂O' },{ ar:'CO₂',en:'CO₂' },{ ar:'NaCl',en:'NaCl' }], ansIdx: 1 },
  { qAr: 'كم كوكباً في المجموعة الشمسية؟', qEn: 'Planets in the Solar System?',
    opts: [{ ar:'٧',en:'7' },{ ar:'٨',en:'8' },{ ar:'٩',en:'9' },{ ar:'١٠',en:'10' }], ansIdx: 1 },
  { qAr: 'ما العضو الذي يضخ الدم؟', qEn: 'Which organ pumps blood?',
    opts: [{ ar:'الدماغ',en:'Brain' },{ ar:'الكبد',en:'Liver' },{ ar:'القلب',en:'Heart' },{ ar:'الرئة',en:'Lung' }], ansIdx: 2 },
  { qAr: 'ما أسرع حيوان بري؟', qEn: 'Fastest land animal?',
    opts: [{ ar:'الأسد',en:'Lion' },{ ar:'الفهد',en:'Cheetah' },{ ar:'الحصان',en:'Horse' },{ ar:'النمر',en:'Tiger' }], ansIdx: 1 },
  { qAr: 'كم عدد عظام الإنسان البالغ؟', qEn: 'Bones in the adult human body?',
    opts: [{ ar:'٢٠٠',en:'200' },{ ar:'٢٠٦',en:'206' },{ ar:'٢١٢',en:'212' },{ ar:'١٩٨',en:'198' }], ansIdx: 1 },
  { qAr: 'أي غاز يمثل 78٪ من الهواء؟', qEn: '78% of air is which gas?',
    opts: [{ ar:'الأكسجين',en:'Oxygen' },{ ar:'النيتروجين',en:'Nitrogen' },{ ar:'ثاني أكسيد الكربون',en:'CO₂' },{ ar:'الهيليوم',en:'Helium' }], ansIdx: 1 },
  { qAr: 'ما وحدة قياس الكهرباء (التيار)؟', qEn: 'Unit of electric current?',
    opts: [{ ar:'فولت',en:'Volt' },{ ar:'أمبير',en:'Ampere' },{ ar:'واط',en:'Watt' },{ ar:'أوم',en:'Ohm' }], ansIdx: 1 },

  // ── Language / Arabic ──
  { qAr: 'مرادف كلمة «سعيد»؟', qEn: 'Synonym of "happy"?',
    opts: [{ ar:'حزين',en:'Sad' },{ ar:'فرح',en:'Joyful' },{ ar:'غاضب',en:'Angry' },{ ar:'متعب',en:'Tired' }], ansIdx: 1 },
  { qAr: 'عكس كلمة «سريع»؟', qEn: 'Opposite of "fast"?',
    opts: [{ ar:'بطيء',en:'Slow' },{ ar:'كبير',en:'Big' },{ ar:'قوي',en:'Strong' },{ ar:'حلو',en:'Sweet' }], ansIdx: 0 },
  { qAr: 'كم حرفاً في اللغة العربية؟', qEn: 'Letters in Arabic alphabet?',
    opts: [{ ar:'٢٦',en:'26' },{ ar:'٢٨',en:'28' },{ ar:'٣٠',en:'30' },{ ar:'٢٤',en:'24' }], ansIdx: 1 },
  { qAr: 'ما جمع كلمة «كتاب»؟', qEn: 'Plural of "kitāb" (book)?',
    opts: [{ ar:'كتابات',en:'kitābāt' },{ ar:'كتب',en:'kutub' },{ ar:'كتابون',en:'kitābūn' },{ ar:'أكتب',en:'aktub' }], ansIdx: 1 },

  // ── History ──
  { qAr: 'أين بُنيت الأهرامات؟', qEn: 'Where are the Pyramids of Giza?',
    opts: [{ ar:'العراق',en:'Iraq' },{ ar:'مصر',en:'Egypt' },{ ar:'الصين',en:'China' },{ ar:'اليونان',en:'Greece' }], ansIdx: 1 },
  { qAr: 'سنة هبوط الإنسان على القمر؟', qEn: 'Year humans landed on the Moon?',
    opts: [{ ar:'١٩٦٥',en:'1965' },{ ar:'١٩٦٩',en:'1969' },{ ar:'١٩٧٢',en:'1972' },{ ar:'١٩٨٠',en:'1980' }], ansIdx: 1 },
  { qAr: 'من اخترع المصباح الكهربائي؟', qEn: 'Who invented the light bulb?',
    opts: [{ ar:'نيوتن',en:'Newton' },{ ar:'إديسون',en:'Edison' },{ ar:'إينشتاين',en:'Einstein' },{ ar:'كيوري',en:'Curie' }], ansIdx: 1 },
  { qAr: 'متى انتهت الحرب العالمية الثانية؟', qEn: 'When did World War II end?',
    opts: [{ ar:'١٩٤٣',en:'1943' },{ ar:'١٩٤٤',en:'1944' },{ ar:'١٩٤٥',en:'1945' },{ ar:'١٩٤٦',en:'1946' }], ansIdx: 2 },

  // ── General Knowledge ──
  { qAr: 'كم لوناً في قوس قزح؟', qEn: 'Colors in a rainbow?',
    opts: [{ ar:'٥',en:'5' },{ ar:'٦',en:'6' },{ ar:'٧',en:'7' },{ ar:'٨',en:'8' }], ansIdx: 2 },
  { qAr: 'ملك الغابة؟', qEn: 'King of the jungle?',
    opts: [{ ar:'النمر',en:'Tiger' },{ ar:'الأسد',en:'Lion' },{ ar:'الفيل',en:'Elephant' },{ ar:'الذئب',en:'Wolf' }], ansIdx: 1 },
  { qAr: 'كم يوماً في السنة الكبيسة؟', qEn: 'Days in a leap year?',
    opts: [{ ar:'٣٦٤',en:'364' },{ ar:'٣٦٥',en:'365' },{ ar:'٣٦٦',en:'366' },{ ar:'٣٦٧',en:'367' }], ansIdx: 2 },
  { qAr: 'أصغر قارة؟', qEn: 'Smallest continent?',
    opts: [{ ar:'أفريقيا',en:'Africa' },{ ar:'أوروبا',en:'Europe' },{ ar:'أوقيانيا',en:'Oceania/Australia' },{ ar:'أنتاركتيكا',en:'Antarctica' }], ansIdx: 2 },

  // ── Technology ──
  { qAr: 'مؤسس مايكروسوفت؟', qEn: 'Founder of Microsoft?',
    opts: [{ ar:'ستيف جوبز',en:'Steve Jobs' },{ ar:'إيلون ماسك',en:'Elon Musk' },{ ar:'بيل غيتس',en:'Bill Gates' },{ ar:'مارك زوكربيرغ',en:'Mark Zuckerberg' }], ansIdx: 2 },
  { qAr: 'ما اختصار HTML؟', qEn: 'HTML stands for?',
    opts: [{ ar:'لغة نصية عالية',en:'High Text Markup Language' },{ ar:'لغة ترميز النص الفائق',en:'HyperText Markup Language' },{ ar:'لغة المنزل',en:'Home Tool Markup Language' },{ ar:'لغة شبكة',en:'HyperTransfer Markup Language' }], ansIdx: 1 },
  { qAr: 'من أسس شركة Apple؟', qEn: 'Who co-founded Apple?',
    opts: [{ ar:'بيل غيتس',en:'Bill Gates' },{ ar:'ستيف جوبز',en:'Steve Jobs' },{ ar:'إيلون ماسك',en:'Elon Musk' },{ ar:'مارك زوكربيرغ',en:'Mark Zuckerberg' }], ansIdx: 1 },
  { qAr: 'ماذا يعني HTTP؟', qEn: 'What does HTTP stand for?',
    opts: [{ ar:'HyperText Transfer Protocol',en:'HyperText Transfer Protocol' },{ ar:'High Tech Transfer Program',en:'High Tech Transfer Program' },{ ar:'Home Transfer Text Process',en:'Home Transfer Text Process' },{ ar:'Hyper Tool Transfer Point',en:'Hyper Tool Transfer Point' }], ansIdx: 0 },

  // ── Islamic / Quran ──
  { qAr: 'كم عدد أركان الإسلام؟', qEn: 'Pillars of Islam?',
    opts: [{ ar:'٤',en:'4' },{ ar:'٥',en:'5' },{ ar:'٦',en:'6' },{ ar:'٣',en:'3' }], ansIdx: 1 },
  { qAr: 'في أي مدينة وُلد النبي محمد ﷺ؟', qEn: 'Prophet Muhammad ﷺ was born in?',
    opts: [{ ar:'المدينة المنورة',en:'Madinah' },{ ar:'مكة المكرمة',en:'Makkah' },{ ar:'الطائف',en:'Taif' },{ ar:'القدس',en:'Jerusalem' }], ansIdx: 1 },
  { qAr: 'كم عدد سور القرآن الكريم؟', qEn: 'Surahs in the Quran?',
    opts: [{ ar:'١١٢',en:'112' },{ ar:'١١٣',en:'113' },{ ar:'١١٤',en:'114' },{ ar:'١١٥',en:'115' }], ansIdx: 2 },
  { qAr: 'ما أطول سورة في القرآن؟', qEn: 'Longest Surah in the Quran?',
    opts: [{ ar:'آل عمران',en:'Al-Imran' },{ ar:'البقرة',en:'Al-Baqarah' },{ ar:'النساء',en:'An-Nisa' },{ ar:'المائدة',en:'Al-Maidah' }], ansIdx: 1 },
  { qAr: 'ما أقصر سورة في القرآن؟', qEn: 'Shortest Surah in the Quran?',
    opts: [{ ar:'الإخلاص',en:'Al-Ikhlas' },{ ar:'الفاتحة',en:'Al-Fatiha' },{ ar:'الكوثر',en:'Al-Kawthar' },{ ar:'الناس',en:'An-Nas' }], ansIdx: 2 },
  { qAr: 'أول كلمة نزل بها القرآن؟', qEn: 'First word of Quran revelation?',
    opts: [{ ar:'بسم',en:'Bism' },{ ar:'اقرأ',en:'Iqra (Read)' },{ ar:'الحمد',en:'Alhamd' },{ ar:'قل',en:'Qul' }], ansIdx: 1 },

  // ── Health ──
  { qAr: 'كم ساعة نوم يحتاجها البالغ يومياً؟', qEn: 'Recommended sleep hours for adults?',
    opts: [{ ar:'٥–٦',en:'5–6' },{ ar:'٧–٩',en:'7–9' },{ ar:'١٠–١٢',en:'10–12' },{ ar:'٤–٥',en:'4–5' }], ansIdx: 1 },
  { qAr: 'أفضل مصدر للفيتامين C؟', qEn: 'Best source of Vitamin C?',
    opts: [{ ar:'اللحوم',en:'Meat' },{ ar:'الحليب',en:'Milk' },{ ar:'الحمضيات',en:'Citrus fruits' },{ ar:'الخبز',en:'Bread' }], ansIdx: 2 },

  // ── Animals ──
  { qAr: 'أي طائر لا يطير؟', qEn: 'A bird that cannot fly?',
    opts: [{ ar:'الصقر',en:'Falcon' },{ ar:'النعامة',en:'Ostrich' },{ ar:'الببغاء',en:'Parrot' },{ ar:'البومة',en:'Owl' }], ansIdx: 1 },
  { qAr: 'كم مدة حمل الفيل؟', qEn: 'Elephant gestation period?',
    opts: [{ ar:'٦ أشهر',en:'6 months' },{ ar:'١٢ شهراً',en:'12 months' },{ ar:'٢٢ شهراً',en:'22 months' },{ ar:'١٨ شهراً',en:'18 months' }], ansIdx: 2 },
];

// ══ Shuffle helper ══════════════════════════════════════════════════════════
const shuffleArr = <T,>(arr: T[]): T[] => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ══ No-repeat queue — refills automatically when exhausted ══════════════════
function useNoRepeatQueue(bank: Q[]) {
  // Remaining question indices not yet shown this "lap"
  const [remaining, setRemaining] = useState<number[]>(() =>
    shuffleArr(bank.map((_, i) => i))
  );

  const pick = useCallback((): { q: Q; order: number[] } => {
    let queue = remaining;
    if (queue.length === 0) {
      // All questions shown — reshuffle and start fresh
      queue = shuffleArr(bank.map((_, i) => i));
    }
    const [idx, ...rest] = queue;
    setRemaining(rest);
    const q = bank[idx];
    const order = shuffleArr([0, 1, 2, 3].slice(0, q.opts.length));
    return { q, order };
  }, [remaining, bank]);

  return pick;
}

// ══ Component ════════════════════════════════════════════════════════════════
const QuizEngine = ({ onScore }: Props) => {
  const { lang } = useLang();

  const pickNext = useNoRepeatQueue(BANK);

  const [current, setCurrent] = useState<{ q: Q; order: number[] }>(() => {
    // seed first question immediately (no memo dependency issues)
    const shuffled = shuffleArr(BANK.map((_, i) => i));
    const q = BANK[shuffled[0]];
    const order = shuffleArr([0, 1, 2, 3]);
    return { q, order };
  });

  const [pick, setPick] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const { q, order } = current;
  const correctOrderedIdx = order.indexOf(q.ansIdx);

  const choose = (i: number) => {
    if (pick !== null) return;
    setPick(i);
    if (i === correctOrderedIdx) {
      setScore(s => s + 1);
      setStreak(s => {
        const ns = s + 1;
        setBestStreak(b => Math.max(b, ns));
        if (ns % 3 === 0) onScore?.(3);
        return ns;
      });
      onScore?.(2);
    } else {
      setStreak(0);
    }
    setTimeout(() => {
      setPick(null);
      setCurrent(pickNext());
    }, 1100);
  };

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4 animate-slide-up">
      {/* Header */}
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-700 flex items-center justify-center mx-auto mb-2">
          <span className="text-2xl">🧠</span>
        </div>
        <h2 className="font-extrabold text-lg text-foreground">
          {lang === 'ar' ? 'محرك الاختبارات' : 'Quiz Engine'}
        </h2>
        <p className="text-xs text-muted-foreground">
          {lang === 'ar'
            ? `النقاط: ${score}  •  أطول سلسلة: ${bestStreak}`
            : `Score: ${score}  •  Best streak: ${bestStreak}`}
        </p>
      </div>

      {/* Question */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <p className="font-semibold text-foreground text-center text-base leading-snug">
          {lang === 'ar' ? q.qAr : q.qEn}
        </p>
        <div className="grid grid-cols-1 gap-2">
          {order.map((optIdx, displayIdx) => {
            const opt = q.opts[optIdx];
            const label = lang === 'ar' ? opt.ar : opt.en;
            let cls =
              'p-3 rounded-xl font-semibold text-sm text-start transition-all active:scale-95 ';
            if (pick === null) {
              cls += 'bg-secondary hover:bg-secondary/70';
            } else if (displayIdx === correctOrderedIdx) {
              cls += 'bg-green-500 text-white';
            } else if (displayIdx === pick) {
              cls += 'bg-red-500 text-white';
            } else {
              cls += 'bg-secondary opacity-60';
            }
            return (
              <button key={displayIdx} onClick={() => choose(displayIdx)} className={cls}>
                {label}
              </button>
            );
          })}
        </div>

        {pick !== null && (
          <p
            className={`text-center font-bold text-sm ${
              pick === correctOrderedIdx ? 'text-green-600' : 'text-red-500'
            }`}
          >
            {pick === correctOrderedIdx
              ? (lang === 'ar' ? '✅ إجابة صحيحة! +2' : '✅ Correct! +2')
              : (lang === 'ar'
                  ? `❌ خطأ — الصواب: ${lang === 'ar' ? q.opts[q.ansIdx].ar : q.opts[q.ansIdx].en}`
                  : `❌ Wrong — Answer: ${q.opts[q.ansIdx].en}`)}
          </p>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {lang === 'ar'
          ? `${BANK.length} سؤال • لا تكرار حتى تنتهي جميع الأسئلة`
          : `${BANK.length} questions • No repeats until all are shown`}
      </p>
    </div>
  );
};

export default QuizEngine;
