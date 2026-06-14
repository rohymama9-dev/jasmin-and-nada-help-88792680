import { useState, useMemo, useEffect, type ElementType } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { usePoints } from '@/hooks/usePoints';
import { Calculator, Plus, Minus, X as XIcon, Divide, ArrowLeftRight, Grid3x3, ArrowLeft, Volume2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props { onScore?: (n: number) => void; }

type Mode = null | 'add' | 'sub' | 'mul' | 'div' | 'compare' | 'tables';
type Stage = { count: number; min: number; max: number; labelAr: string; labelEn: string };

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const STAGES: Stage[] = [
  { count: 5, min: 1, max: 10, labelAr: 'أرقام أقل من ١٠', labelEn: 'Numbers < 10' },
  { count: 5, min: 11, max: 99, labelAr: 'أرقام بين ١٠ و١٠٠', labelEn: 'Numbers 10-100' },
  { count: 10, min: 1, max: 99, labelAr: 'أرقام أقل من ١٠٠', labelEn: 'Numbers < 100' },
  { count: 10, min: 1, max: 499, labelAr: 'أرقام أقل من ٥٠٠', labelEn: 'Numbers < 500' },
  { count: 10, min: 1, max: 999, labelAr: 'أرقام أقل من ١٠٠٠', labelEn: 'Numbers < 1000' },
  { count: 10, min: 1000, max: 1000000, labelAr: 'أرقام بين ١٠٠٠ ومليون', labelEn: 'Numbers 1000-1M' },
];

const speakMath = (text: string, lang: 'ar' | 'en') => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'ar' ? 'ar-EG' : 'en-US';
    const voice = window.speechSynthesis.getVoices().find((item) =>
      item.lang.toLowerCase().startsWith(lang === 'ar' ? 'ar' : 'en'),
    );
    if (voice) utterance.voice = voice;
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  } catch {
    /* ignore */
  }
};

const opWord = (op: string, lang: 'ar' | 'en') => {
  const map: Record<string, [string, string]> = {
    '+': ['زائد', 'plus'],
    '−': ['ناقص', 'minus'],
    '-': ['ناقص', 'minus'],
    '×': ['في', 'times'],
    '÷': ['على', 'divided by'],
    '>': ['أكبر من', 'greater than'],
    '<': ['أصغر من', 'less than'],
    '=': ['يساوي', 'equals'],
  };
  const value = map[op];
  return value ? (lang === 'ar' ? value[0] : value[1]) : op;
};

const fmtNum = (value: number | string, lang: 'ar' | 'en') => {
  const text = String(value);
  if (lang !== 'ar') return text;
  return text.replace(/[0-9]/g, (digit) => ARABIC_DIGITS[Number(digit)]);
};

const parseLocalizedNumber = (value: string, lang: 'ar' | 'en') => {
  if (!value.trim()) return NaN;
  if (lang !== 'ar') return Number(value);
  const normalized = value.replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)));
  return Number(normalized);
};

const appendLocalizedDigit = (current: string, digit: number, lang: 'ar' | 'en') =>
  `${current}${lang === 'ar' ? ARABIC_DIGITS[digit] : String(digit)}`;

const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const genOp = (mode: Exclude<Mode, null | 'compare' | 'tables'>, min: number, max: number) => {
  const lo = Math.max(1, min);
  const hi = Math.max(lo + 1, max);
  if (mode === 'div') {
    const divisorMax = Math.min(12, Math.max(2, Math.floor(Math.sqrt(hi))));
    const b = rnd(2, divisorMax);
    const qMin = Math.max(1, Math.ceil(lo / b));
    const qMax = Math.max(qMin, Math.floor(hi / b));
    const q = rnd(qMin, qMax);
    const a = b * q;
    return { a, b, op: '÷', answer: a / b };
  }
  if (mode === 'mul') {
    const factorMax = Math.min(12, Math.max(2, Math.floor(Math.sqrt(hi))));
    const a = rnd(1, factorMax);
    const b = rnd(1, factorMax);
    return { a, b, op: '×', answer: a * b };
  }
  if (mode === 'sub') {
    const a = rnd(lo, hi);
    const b = rnd(1, a);
    return { a, b, op: '−', answer: a - b };
  }
  const a = rnd(lo, hi);
  const b = rnd(lo, hi);
  return { a, b, op: '+', answer: a + b };
};

const NumericKeypad = ({
  lang,
  onDigit,
  onBackspace,
  onSkip,
}: {
  lang: 'ar' | 'en';
  onDigit: (digit: number) => void;
  onBackspace: () => void;
  onSkip: () => void;
}) => (
  <div className="grid grid-cols-3 gap-2">
    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
      <button
        key={digit}
        onPointerDown={(event) => event.preventDefault()}
        onClick={() => onDigit(digit)}
        className="py-3 rounded-2xl bg-secondary text-2xl font-bold active:scale-95 transition"
      >
        {lang === 'ar' ? ARABIC_DIGITS[digit] : String(digit)}
      </button>
    ))}
    <button
      onPointerDown={(event) => event.preventDefault()}
      onClick={onBackspace}
      className="py-3 rounded-2xl bg-rose-500 text-white font-bold active:scale-95 transition"
    >
      ⌫
    </button>
    <button
      onPointerDown={(event) => event.preventDefault()}
      onClick={() => onDigit(0)}
      className="py-3 rounded-2xl bg-secondary text-2xl font-bold active:scale-95 transition"
    >
      {lang === 'ar' ? ARABIC_DIGITS[0] : '0'}
    </button>
    <button
      onPointerDown={(event) => event.preventDefault()}
      onClick={onSkip}
      className="py-3 rounded-2xl bg-amber-500 text-white font-bold active:scale-95 transition"
    >
      {lang === 'ar' ? 'تخطي' : 'Skip'}
    </button>
  </div>
);

const MathLab = ({ onScore }: Props) => {
  const { lang } = useLang();
  const { addPoints } = usePoints();
  const scoreHandler = onScore ?? ((amount: number) => addPoints(amount, 'education'));
  const [mode, setMode] = useState<Mode>(null);

  if (!mode) {
    const tiles: { key: Mode; ar: string; en: string; icon: ElementType; color: string }[] = [
      { key: 'add', ar: 'الجمع', en: 'Addition', icon: Plus, color: 'from-emerald-400 to-green-600' },
      { key: 'sub', ar: 'الطرح', en: 'Subtraction', icon: Minus, color: 'from-rose-400 to-red-600' },
      { key: 'mul', ar: 'الضرب', en: 'Multiplication', icon: XIcon, color: 'from-violet-400 to-purple-600' },
      { key: 'div', ar: 'القسمة', en: 'Division', icon: Divide, color: 'from-sky-400 to-blue-600' },
      { key: 'compare', ar: 'المقارنة (>, <, =)', en: 'Compare (>, <, =)', icon: ArrowLeftRight, color: 'from-amber-400 to-orange-600' },
      { key: 'tables', ar: 'جداول الضرب', en: 'Multiplication Tables', icon: Grid3x3, color: 'from-fuchsia-400 to-pink-600' },
    ];
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl gradient-primary flex items-center justify-center mb-2">
            <Calculator className="text-primary-foreground" />
          </div>
          <h2 className="text-lg font-extrabold">{lang === 'ar' ? 'مختبر الرياضيات' : 'Mathematics Lab'}</h2>
          <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'تمارين دقيقة بدون أخطاء' : 'Precise, error-free practice'}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {tiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <button
                key={tile.key}
                onClick={() => setMode(tile.key)}
                className="glass-card rounded-2xl p-4 flex flex-col items-center gap-2 active:scale-95 transition"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tile.color} flex items-center justify-center`}>
                  <Icon className="text-white" />
                </div>
                <span className="text-sm font-bold text-foreground text-center">{lang === 'ar' ? tile.ar : tile.en}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button onClick={() => setMode(null)} className="flex items-center gap-1 text-primary text-sm font-medium">
        <ArrowLeft size={16} /> {lang === 'ar' ? 'رجوع' : 'Back'}
      </button>
      {mode === 'tables' ? <Tables onScore={scoreHandler} /> : mode === 'compare' ? <CompareGame onScore={scoreHandler} /> : <OpsGame mode={mode} onScore={scoreHandler} />}
    </div>
  );
};

const OpsGame = ({ mode, onScore }: { mode: Exclude<Mode, null | 'compare' | 'tables'>; onScore?: (n: number) => void }) => {
  const { lang } = useLang();
  const [stageIdx, setStageIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [finished, setFinished] = useState(false);
  const stage = STAGES[stageIdx];
  const [question, setQuestion] = useState(() => genOp(mode, stage.min, stage.max));
  const [value, setValue] = useState('');
  const [streak, setStreak] = useState(0);

  const submit = () => {
    const numericValue = parseLocalizedNumber(value, lang);
    if (Number.isNaN(numericValue) || !value.trim()) return;
    if (numericValue === question.answer) {
      setStreak((current) => current + 1);
      onScore?.(3);
      toast.success(lang === 'ar' ? '✅ صحيح! +3' : '✅ Correct! +3');
      const nextProgress = progress + 1;
      if (nextProgress >= stage.count) {
        const nextStageIdx = stageIdx + 1;
        if (nextStageIdx >= STAGES.length) {
          setFinished(true);
          setValue('');
          toast.success(lang === 'ar' ? '🏆 أكملت كل المراحل!' : '🏆 All stages complete!');
          return;
        }
        setStageIdx(nextStageIdx);
        setProgress(0);
        setQuestion(genOp(mode, STAGES[nextStageIdx].min, STAGES[nextStageIdx].max));
        toast.success(lang === 'ar' ? `🚀 مرحلة ${nextStageIdx + 1}` : `🚀 Stage ${nextStageIdx + 1}`);
      } else {
        setProgress(nextProgress);
        setQuestion(genOp(mode, stage.min, stage.max));
      }
      setValue('');
      return;
    }
    setStreak(0);
    toast.error(lang === 'ar' ? `❌ الصواب: ${fmtNum(question.answer, lang)}` : `❌ Answer: ${question.answer}`);
  };

  const skip = () => {
    setStreak(0);
    setValue('');
    setQuestion(genOp(mode, stage.min, stage.max));
  };

  const restart = () => {
    setStageIdx(0);
    setProgress(0);
    setFinished(false);
    setStreak(0);
    setValue('');
    setQuestion(genOp(mode, STAGES[0].min, STAGES[0].max));
  };

  if (finished) {
    return (
      <div className="rounded-3xl p-8 bg-gradient-to-br from-emerald-100 to-teal-100 text-center space-y-3">
        <p className="text-5xl">🏆</p>
        <p className="text-lg font-extrabold text-foreground">{lang === 'ar' ? 'أحسنت! أكملت كل المراحل' : 'Great! All stages complete'}</p>
        <button onClick={restart} className="px-4 py-2 rounded-xl gradient-primary text-primary-foreground font-bold text-sm">
          {lang === 'ar' ? 'إعادة' : 'Restart'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-xs font-bold text-foreground">
          {lang === 'ar' ? `المرحلة ${stageIdx + 1}/6` : `Stage ${stageIdx + 1}/6`} · {lang === 'ar' ? stage.labelAr : stage.labelEn}
        </p>
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <div className="h-full gradient-primary transition-all" style={{ width: `${(progress / stage.count) * 100}%` }} />
        </div>
        <p className="text-[10px] text-muted-foreground">{progress}/{stage.count} {lang === 'ar' ? 'صحيحة' : 'correct'}</p>
      </div>
      <div className="flex justify-between text-xs">
        <span className="px-2 py-1 rounded-lg bg-secondary font-bold">🔥 {streak}</span>
        <button
          onClick={() => speakMath(`${question.a} ${opWord(question.op, lang)} ${question.b}`, lang)}
          className="px-2 py-1 rounded-lg bg-primary/10 text-primary font-bold inline-flex items-center gap-1"
        >
          <Volume2 size={14} /> {lang === 'ar' ? 'استمع' : 'Listen'}
        </button>
      </div>
      <div className="rounded-3xl p-8 bg-gradient-to-br from-primary/10 to-primary/5 text-center" dir="ltr">
        <p className="text-5xl font-extrabold text-foreground tabular-nums">{fmtNum(question.a, lang)} {question.op} {fmtNum(question.b, lang)} = ?</p>
      </div>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => event.key === 'Enter' && submit()}
        autoFocus
        className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border text-2xl font-bold text-center focus:outline-none focus:border-primary"
        placeholder="?"
      />
      <NumericKeypad
        lang={lang}
        onDigit={(digit) => setValue((current) => appendLocalizedDigit(current, digit, lang))}
        onBackspace={() => setValue((current) => current.slice(0, -1))}
        onSkip={skip}
      />
      <button onClick={submit} className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-bold">
        {lang === 'ar' ? 'تحقق' : 'Check'}
      </button>
    </div>
  );
};

const newPair = (min: number, max: number, seen: Set<string>) => {
  for (let index = 0; index < 200; index += 1) {
    const a = rnd(min, max);
    const b = rnd(min, max);
    const key = a < b ? `${a}|${b}` : `${b}|${a}`;
    if (!seen.has(key)) {
      seen.add(key);
      return { a, b };
    }
  }
  return { a: min, b: max };
};

const SymbolKeyboard = ({ onSymbolSelect }: { onSymbolSelect: (symbol: string) => void }) => (
  <div className="grid grid-cols-3 gap-2">
    {['<', '=', '>'].map((symbol) => (
      <button
        key={symbol}
        onClick={() => onSymbolSelect(symbol)}
        className="py-4 rounded-2xl bg-secondary hover:bg-secondary/80 active:scale-95 text-4xl font-extrabold transition text-foreground"
      >
        {symbol}
      </button>
    ))}
  </div>
);

const CompareGame = ({ onScore }: { onScore?: (n: number) => void }) => {
  const { lang } = useLang();
  const [stageIdx, setStageIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [seen] = useState<Set<string>>(() => new Set());
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [finished, setFinished] = useState(false);
  const stage = STAGES[stageIdx];
  const [pair, setPair] = useState(() => newPair(stage.min, stage.max, seen));

  const correct = (() => {
    if (lang === 'en') {
      if (pair.a > pair.b) return '>';
      if (pair.a < pair.b) return '<';
      return '=';
    }
    if (pair.a > pair.b) return '<';
    if (pair.a < pair.b) return '>';
    return '=';
  })();

  const advanceQuestion = (nextStageIdx: number) => {
    const nextStage = STAGES[nextStageIdx];
    setPair(newPair(nextStage.min, nextStage.max, seen));
    setSelectedSymbol('');
  };

  const submit = () => {
    if (!selectedSymbol) {
      toast.warning(lang === 'ar' ? '⚠️ اختر رمزاً' : '⚠️ Select a symbol');
      return;
    }
    if (selectedSymbol !== correct) {
      toast.error(lang === 'ar' ? `❌ الصواب: ${correct}` : `❌ Answer: ${correct}`);
      setSelectedSymbol('');
      return;
    }
    onScore?.(3);
    toast.success(lang === 'ar' ? '✅ صحيح! +3' : '✅ Correct! +3');
    const nextProgress = progress + 1;
    if (nextProgress >= stage.count) {
      const nextStageIdx = stageIdx + 1;
      if (nextStageIdx >= STAGES.length) {
        setFinished(true);
        toast.success(lang === 'ar' ? '🏆 أكملت كل المراحل!' : '🏆 All stages complete!');
        return;
      }
      setStageIdx(nextStageIdx);
      setProgress(0);
      advanceQuestion(nextStageIdx);
      toast.success(lang === 'ar' ? `🚀 مرحلة ${nextStageIdx + 1}` : `🚀 Stage ${nextStageIdx + 1}`);
      return;
    }
    setProgress(nextProgress);
    advanceQuestion(stageIdx);
  };

  const restart = () => {
    seen.clear();
    setStageIdx(0);
    setProgress(0);
    setFinished(false);
    setSelectedSymbol('');
    setPair(newPair(STAGES[0].min, STAGES[0].max, seen));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1">
          <p className="text-xs font-bold text-foreground">
            {lang === 'ar' ? `المرحلة ${stageIdx + 1}/6` : `Stage ${stageIdx + 1}/6`} · {lang === 'ar' ? stage.labelAr : stage.labelEn}
          </p>
          <div className="h-1.5 rounded-full bg-secondary mt-1 overflow-hidden">
            <div className="h-full gradient-primary transition-all" style={{ width: `${(progress / stage.count) * 100}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">{progress}/{stage.count} {lang === 'ar' ? 'صحيحة' : 'correct'}</p>
        </div>
        <button
          onClick={() => speakMath(`${pair.a} ${opWord(correct, lang)} ${pair.b}`, lang)}
          className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold inline-flex items-center gap-1"
        >
          <Volume2 size={14} />
        </button>
      </div>

      {finished ? (
        <div className="rounded-3xl p-8 bg-gradient-to-br from-emerald-100 to-teal-100 text-center space-y-3">
          <p className="text-5xl">🏆</p>
          <p className="text-lg font-extrabold text-foreground">{lang === 'ar' ? 'أحسنت! أكملت كل المراحل' : 'Great! All stages complete'}</p>
          <button onClick={restart} className="px-4 py-2 rounded-xl gradient-primary text-primary-foreground font-bold text-sm">
            {lang === 'ar' ? 'إعادة' : 'Restart'}
          </button>
        </div>
      ) : (
        <>
          <div className="rounded-3xl p-8 bg-gradient-to-br from-amber-100 to-orange-100 text-center flex items-center justify-center">
            <div className="flex flex-row items-center justify-center gap-3" dir="ltr">
              <span className="text-4xl sm:text-5xl font-extrabold text-foreground tabular-nums">{fmtNum(pair.a, lang)}</span>
              <span className="text-4xl sm:text-5xl font-extrabold text-foreground">?</span>
              <span className="text-4xl sm:text-5xl font-extrabold text-foreground tabular-nums">{fmtNum(pair.b, lang)}</span>
            </div>
          </div>
          {selectedSymbol && (
            <div className="rounded-2xl p-4 bg-primary/10 text-center">
              <p className="text-sm text-muted-foreground mb-2">{lang === 'ar' ? 'اختيارك:' : 'Your choice:'}</p>
              <p className="text-5xl font-extrabold text-primary">{selectedSymbol}</p>
            </div>
          )}
          <SymbolKeyboard onSymbolSelect={setSelectedSymbol} />
          <button onClick={submit} className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-bold active:scale-95 transition">
            {lang === 'ar' ? '✓ تحقق' : '✓ Check'}
          </button>
        </>
      )}
    </div>
  );
};

const Tables = ({ onScore }: { onScore?: (n: number) => void }) => {
  const { lang } = useLang();
  const [tableNumber, setTableNumber] = useState(2);
  const [drill, setDrill] = useState<{ b: number; answer: string } | null>(null);
  const rows = useMemo(() => Array.from({ length: 12 }, (_, index) => index + 1), []);

  const startDrill = () => setDrill({ b: rnd(1, 12), answer: '' });

  useEffect(() => {
    setDrill(null);
  }, [tableNumber]);

  const submitDrill = () => {
    if (!drill) return;
    const numericValue = parseLocalizedNumber(drill.answer, lang);
    const correctAnswer = tableNumber * drill.b;
    if (numericValue === correctAnswer) {
      onScore?.(3);
      toast.success(lang === 'ar' ? '✅ صحيح! +3' : '✅ Correct! +3');
      setDrill({ b: rnd(1, 12), answer: '' });
      return;
    }
    toast.error(lang === 'ar' ? `❌ الصواب: ${fmtNum(correctAnswer, lang)}` : `❌ Answer: ${correctAnswer}`);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {Array.from({ length: 11 }, (_, index) => index + 2).map((value) => (
          <button
            key={value}
            onClick={() => setTableNumber(value)}
            className={`w-10 h-10 rounded-xl font-bold text-sm ${tableNumber === value ? 'gradient-primary text-primary-foreground' : 'bg-secondary'}`}
          >
            {fmtNum(value, lang)}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2" dir="ltr">
        {rows.map((value) => (
          <div key={value} className="rounded-xl bg-card border border-border px-3 py-2 text-sm font-bold tabular-nums flex justify-between">
            <span>{fmtNum(tableNumber, lang)} × {fmtNum(value, lang)}</span>
            <span className="text-primary">{fmtNum(tableNumber * value, lang)}</span>
          </div>
        ))}
      </div>
      {!drill ? (
        <button onClick={startDrill} className="w-full py-3 rounded-xl bg-emerald-500 text-white font-bold">
          {lang === 'ar' ? '🎯 تمرين دقيق' : '🎯 Precise drill'}
        </button>
      ) : (
        <div className="rounded-2xl p-4 bg-primary/10 space-y-3" dir="ltr">
          <p className="text-3xl text-center font-extrabold">{fmtNum(tableNumber, lang)} × {fmtNum(drill.b, lang)} = ?</p>
          <input
            type="text"
            inputMode="numeric"
            value={drill.answer}
            onChange={(event) => setDrill({ ...drill, answer: event.target.value })}
            autoFocus
            onKeyDown={(event) => event.key === 'Enter' && submitDrill()}
            className="w-full px-3 py-2 rounded-xl bg-background border-2 border-border text-2xl text-center font-bold"
          />
          <NumericKeypad
            lang={lang}
            onDigit={(digit) => setDrill((current) => (current ? { ...current, answer: appendLocalizedDigit(current.answer, digit, lang) } : current))}
            onBackspace={() => setDrill((current) => (current ? { ...current, answer: current.answer.slice(0, -1) } : current))}
            onSkip={() => setDrill(generateDrill())}
          />
          <button onClick={submitDrill} className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-bold">
            {lang === 'ar' ? 'تحقق' : 'Check'}
          </button>
        </div>
      )}
    </div>
  );
};

export default MathLab;
