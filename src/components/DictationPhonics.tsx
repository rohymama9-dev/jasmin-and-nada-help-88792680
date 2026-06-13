import { useState, useEffect, useRef } from 'react';
import { Volume2, Type, Eraser, Trash2, FastForward, Eye, Volume1, VolumeX, RotateCcw, PlayCircle } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { usePoints } from '@/hooks/usePoints';
import { speak } from '@/lib/speech';
import { toast } from 'sonner';

const DICTIONARY = [
  { ar: 'مدرسة', en: 'school' }, { ar: 'كتاب', en: 'book' }, { ar: 'قلم', en: 'pen' },
  { ar: 'بيت', en: 'house' }, { ar: 'شمس', en: 'sun' }, { ar: 'قمر', en: 'moon' },
  { ar: 'شجرة', en: 'tree' }, { ar: 'زهرة', en: 'flower' }, { ar: 'سيارة', en: 'car' },
  { ar: 'طائرة', en: 'plane' }, { ar: 'طبيب', en: 'doctor' }, { ar: 'معلم', en: 'teacher' },
  { ar: 'طالب', en: 'student' }, { ar: 'ملعب', en: 'playground' }, { ar: 'حديقة', en: 'garden' },
  { ar: 'سماء', en: 'sky' }, { ar: 'أرض', en: 'earth' }, { ar: 'بحر', en: 'sea' },
  { ar: 'جبل', en: 'mountain' }, { ar: 'نهر', en: 'river' }, { ar: 'فاكهة', en: 'fruit' },
  { ar: 'تفاح', en: 'apple' }, { ar: 'برتقال', en: 'orange' }, { ar: 'خبز', en: 'bread' },
  { ar: 'حليب', en: 'milk' }, { ar: 'ماء', en: 'water' }, { ar: 'عصير', en: 'juice' },
  { ar: 'طعام', en: 'food' }, { ar: 'صلاة', en: 'prayer' }, { ar: 'رمضان', en: 'ramadan' },
  { ar: 'صداقة', en: 'friendship' }, { ar: 'سعادة', en: 'happiness' }, { ar: 'نجاح', en: 'success' },
  { ar: 'عمل', en: 'work' }, { ar: 'دراسة', en: 'study' }, { ar: 'وطن', en: 'homeland' }
];

const NON_LEFT_CONNECTORS = ['ا', 'أ', 'إ', 'آ', 'د', 'ذ', 'ر', 'ز', 'و', 'ؤ', 'ء', 'ة'];

const getExpectedShapeIndex = (word: string, index: number) => {
  if (index < 0 || index >= word.length) return 3;
  
  const char = word[index];
  const prevChar = index > 0 ? word[index - 1] : null;
  const nextChar = index < word.length - 1 ? word[index + 1] : null;

  const connectsRight = prevChar && !NON_LEFT_CONNECTORS.includes(prevChar);
  const connectsLeft = nextChar && !NON_LEFT_CONNECTORS.includes(char);

  if (connectsRight && connectsLeft) return 1; // Medial
  if (connectsRight) return 2; // Final
  if (connectsLeft) return 0; // Initial
  return 3; // Isolated
};

const ARABIC_ALPHABET = [
  { char: 'ا', shapes: ['ا', 'ـا', 'ـا', 'ا'] },
  { char: 'أ', shapes: ['أ', 'ـأ', 'ـأ', 'أ'] },
  { char: 'ب', shapes: ['بـ', 'ـبـ', 'ـب', 'ب'] },
  { char: 'ت', shapes: ['تـ', 'ـتـ', 'ـت', 'ت'] },
  { char: 'ث', shapes: ['ثـ', 'ـثـ', 'ـث', 'ث'] },
  { char: 'ج', shapes: ['جـ', 'ـجـ', 'ـج', 'ج'] },
  { char: 'چ', shapes: ['چـ', 'ـچـ', 'ـچ', 'چ'] },
  { char: 'ح', shapes: ['حـ', 'ـحـ', 'ـح', 'ح'] },
  { char: 'خ', shapes: ['خـ', 'ـخـ', 'ـخ', 'خ'] },
  { char: 'د', shapes: ['د', 'ـد', 'ـد', 'د'] },
  { char: 'ذ', shapes: ['ذ', 'ـذ', 'ـذ', 'ذ'] },
  { char: 'ر', shapes: ['ر', 'ـر', 'ـر', 'ر'] },
  { char: 'ز', shapes: ['ز', 'ـز', 'ـز', 'ز'] },
  { char: 'س', shapes: ['سـ', 'ـسـ', 'ـس', 'س'] },
  { char: 'ش', shapes: ['شـ', 'ـشـ', 'ـش', 'ش'] },
  { char: 'ص', shapes: ['صـ', 'ـصـ', 'ـص', 'ص'] },
  { char: 'ض', shapes: ['ضـ', 'ـضـ', 'ـض', 'ض'] },
  { char: 'ط', shapes: ['طـ', 'ـطـ', 'ـط', 'ط'] },
  { char: 'ظ', shapes: ['ظـ', 'ـظـ', 'ـظ', 'ظ'] },
  { char: 'ع', shapes: ['عـ', 'ـعـ', 'ـع', 'ع'] },
  { char: 'غ', shapes: ['غـ', 'ـغـ', 'ـغ', 'غ'] },
  { char: 'ف', shapes: ['فـ', 'ـفـ', 'ـف', 'ف'] },
  { char: 'ق', shapes: ['قـ', 'ـقـ', 'ـق', 'ق'] },
  { char: 'ك', shapes: ['كـ', 'ـكـ', 'ـك', 'ك'] },
  { char: 'ل', shapes: ['لـ', 'ـلـ', 'ـل', 'ل'] },
  { char: 'م', shapes: ['مـ', 'ـمـ', 'ـم', 'م'] },
  { char: 'ن', shapes: ['نـ', 'ـنـ', 'ـن', 'ن'] },
  { char: 'ه', shapes: ['هـ', 'ـهـ', 'ـه', 'ه'] },
  { char: 'و', shapes: ['و', 'ـو', 'ـو', 'و'] },
  { char: 'ي', shapes: ['يـ', 'ـيـ', 'ـي', 'ي'] },
  { char: 'ء', shapes: ['ء', 'ء', 'ء', 'ء'] },
  { char: 'ئ', shapes: ['ئـ', 'ـئـ', 'ـئ', 'ئ'] },
  { char: 'ؤ', shapes: ['ؤ', 'ـؤ', 'ـؤ', 'ؤ'] },
  { char: 'ة', shapes: ['ة', 'ـة', 'ـة', 'ة'] },
  { char: 'ى', shapes: ['ى', 'ـى', 'ـى', 'ى'] },
];

const ENGLISH_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const RECENT_WORD_LIMIT = 6;

const buildWordSequence = (pool: typeof DICTIONARY, recentKeys: string[], mode: 'ar' | 'en') => {
  const keyOf = (item: typeof DICTIONARY[number]) => (mode === 'ar' ? item.ar : item.en.toLowerCase());
  const recent = new Set(recentKeys);
  const freshPool = pool.filter((item) => !recent.has(keyOf(item)));
  const candidatePool = freshPool.length >= 4 ? freshPool : pool;
  const shuffled = [...candidatePool].sort(() => Math.random() - 0.5);
  if (shuffled.length === 0) return [...pool];
  return shuffled;
};

const DictationPhonics = ({ onScore }: { onScore?: (n: number) => void }) => {
  const { lang, dir } = useLang();
  const { addPoints } = usePoints();
  const awardEducationPoints = onScore ?? ((amount: number) => addPoints(amount, 'education'));
  const [mode, setMode] = useState<'ar' | 'en'>(lang === 'ar' ? 'ar' : 'en');
  const recentHistoryRef = useRef<string[]>([]);
  const wordQueueRef = useRef(buildWordSequence(DICTIONARY, [], mode));
  const [targetWord, setTargetWord] = useState(wordQueueRef.current[0]);
  const [currentInput, setCurrentInput] = useState('');
  const [displayInput, setDisplayInput] = useState<string[]>([]);
  const [sentenceInput, setSentenceInput] = useState('');
  const [showShapes, setShowShapes] = useState<string | null>(null);
  const [isSentenceMode, setIsSentenceMode] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [revealed, setRevealed] = useState(false);

  const localT = (ar: string, en: string) => (mode === 'ar' ? ar : en);
  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  const resetInputs = () => {
    setCurrentInput('');
    setDisplayInput([]);
    setSentenceInput('');
    setShowShapes(null);
    setRevealed(false);
  };

  const moveToNextWord = () => {
    const currentKey = mode === 'ar' ? targetWord.ar : targetWord.en.toLowerCase();
    recentHistoryRef.current = [currentKey, ...recentHistoryRef.current].slice(0, RECENT_WORD_LIMIT);

    let queue = wordQueueRef.current.filter((item) => item.ar !== targetWord.ar || item.en !== targetWord.en);
    if (queue.length === 0) {
      queue = buildWordSequence(DICTIONARY, recentHistoryRef.current, mode);
    }
    wordQueueRef.current = queue;
    setTargetWord(queue[0] ?? DICTIONARY[0]);
    resetInputs();
  };

  useEffect(() => {
    wordQueueRef.current = buildWordSequence(DICTIONARY, recentHistoryRef.current, mode);
    setTargetWord(wordQueueRef.current[0] ?? DICTIONARY[0]);
    resetInputs();
  }, [mode]);

  const handleCharClick = (char: string) => {
    if (mode === 'ar') {
      setShowShapes(char);
    } else {
      appendChar(char, char);
    }
  };

  const appendChar = (char: string, shape: string, shapeIndex?: number) => {
    const cleanChar = char.replace(/[ـ]/g, '');
    
    if (mode === 'ar' && !isSentenceMode) {
      const expectedIndex = getExpectedShapeIndex(targetWord.ar, currentInput.length);
      const expectedChar = targetWord.ar[currentInput.length];
      
      if (cleanChar !== expectedChar || (shapeIndex !== undefined && shapeIndex !== expectedIndex)) {
        toast.error(localT('شكل الحرف أو الحرف غير صحيح!', 'Wrong letter or shape!'), {
          description: localT('حاولي مرة أخرى بتركيز أكبر', 'Try again with more focus'),
          duration: 2000,
        });
        setShowShapes(null);
        return;
      }
    }

    if (isSentenceMode) {
      setSentenceInput(prev => prev + cleanChar);
    } else {
      setCurrentInput(prev => prev + cleanChar);
      setDisplayInput(prev => [...prev, shape]);
    }
    setShowShapes(null);
  };

  const handleBackspace = () => {
    if (isSentenceMode) {
      setSentenceInput(prev => prev.slice(0, -1));
    } else {
      setCurrentInput(prev => prev.slice(0, -1));
      if (mode === 'ar') {
        setDisplayInput(prev => prev.slice(0, -1));
      }
    }
  };

  const playAudio = () => {
    speak(mode === 'ar' ? targetWord.ar : targetWord.en, mode, { volume });
  };

  const changeVolume = (delta: number) => {
    setVolume(prev => Math.min(1.0, Math.max(0.0, prev + delta)));
  };

  const checkWord = () => {
    const target = mode === 'ar' ? targetWord.ar : targetWord.en;
    if (currentInput.trim().toLowerCase() === target.toLowerCase()) {
      awardEducationPoints(3);
      toast.success(localT('أحسنتِ! +٣ نقاط 🌟', 'Excellent! +3 points 🌟'));
      moveToNextWord();
    } else {
      toast.error(localT('حاولي مرة أخرى', 'Try again'));
    }
  };

  return (
    <div className="glass-card rounded-3xl p-4 md:p-6 space-y-6 max-w-2xl mx-auto shadow-xl border border-white/20" dir={mode === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header & Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <Type size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">{localT('الإملاء والنطق', 'Dictation & Phonics')}</h2>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              {localT('تعلمي كتابة الكلمات والجمل', 'Master words and sentences')}
            </p>
          </div>
        </div>
        <div className="flex bg-secondary/50 p-1 rounded-xl border border-border">
          <button
            onClick={() => setMode('ar')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'ar' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'}`}
          >
            العربية
          </button>
          <button
            onClick={() => setMode('en')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'en' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'}`}
          >
            English
          </button>
        </div>
      </div>

      {/* Main Dictation Panel */}
      <div className="space-y-4">
        <div className="bg-secondary/20 rounded-2xl p-6 text-center space-y-4 border border-border/50 relative overflow-hidden">
          
          {/* Controls Bar - Stacked Vertically */}
          <div className="absolute top-2 right-2 flex flex-col items-center gap-2 z-10">
            <button
              onClick={playAudio}
              className="p-3 rounded-full bg-primary text-white shadow-lg hover:scale-110 active:scale-95 transition-all"
            >
              <PlayCircle size={24} />
            </button>
            <button
              onClick={playAudio}
              className="px-3 py-2 rounded-xl bg-white/90 backdrop-blur border border-border text-primary hover:bg-white transition-all flex items-center gap-1.5"
              title={localT('إعادة الصوت', 'Replay audio')}
            >
              <RotateCcw size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{localT('إعادة', 'Replay')}</span>
            </button>
            <div className="flex flex-col bg-white/80 backdrop-blur rounded-xl border border-border p-1 gap-1">
              <button
                onClick={() => changeVolume(0.1)}
                className="p-2 rounded-lg text-muted-foreground hover:text-primary transition-colors"
                title={localT('رفع الصوت', 'Raise Volume')}
              >
                <Volume2 size={16} />
              </button>
              <button
                onClick={() => changeVolume(-0.1)}
                className="p-2 rounded-lg text-muted-foreground hover:text-primary transition-colors"
                title={localT('خفض الصوت', 'Lower Volume')}
              >
                {volume <= 0.1 ? <VolumeX size={16} /> : <Volume1 size={16} />}
              </button>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="absolute top-2 left-2 flex flex-col sm:flex-row items-center gap-2 z-10">
            <button
              onClick={() => setRevealed(true)}
              className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/20 transition-all flex items-center gap-1.5"
              title={localT('إظهار الإجابة', 'Show Answer')}
            >
              <Eye size={16} />
              <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-wider">{localT('الإجابة', 'Hint')}</span>
            </button>
            <button
              onClick={moveToNextWord}
              className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all flex items-center gap-1.5"
              title={localT('تخطي', 'Skip')}
            >
              <FastForward size={16} />
              <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-wider">{localT('تخطي', 'Skip')}</span>
            </button>
          </div>

          <div className="pt-10 pb-4">
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-4">
              {localT('استمعي واكتبي', 'Listen and Type')}
            </p>

            {/* Display Area - Responsive Text Size & Centered */}
            <div
              className={`text-2xl md:text-4xl font-black min-h-[60px] flex items-center justify-center tracking-normal ${mode === 'ar' ? 'font-arabic' : 'font-sans'}`}
              style={{ direction: mode === 'ar' ? 'rtl' : 'ltr' }}
            >
              {revealed ? (
                <span className="text-amber-500 animate-in fade-in duration-500">
                  {mode === 'ar' ? targetWord.ar : targetWord.en}
                </span>
              ) : (
                isSentenceMode ? sentenceInput : (mode === 'ar' ? displayInput.join('') : currentInput) || '...'
              )}
            </div>
          </div>
        </div>

        {/* Word Input Area */}
        {!isSentenceMode && (
          <div className="flex gap-2">
            <button
              onClick={handleBackspace}
              className="p-3 rounded-xl bg-secondary text-muted-foreground hover:text-amber-500 transition-colors"
              title={localT('مسح حرف', 'Backspace')}
            >
              <Eraser size={20} />
            </button>
            <button
              onClick={() => { setCurrentInput(''); setDisplayInput([]); }}
              className="p-3 rounded-xl bg-secondary text-muted-foreground hover:text-destructive transition-colors"
              title={localT('مسح الكل', 'Clear All')}
            >
              <Trash2 size={20} />
            </button>
            <div className={`flex-1 bg-white rounded-xl border border-border p-3 flex items-center justify-center text-xl md:text-2xl font-bold shadow-inner min-h-[56px] ${mode === 'ar' ? 'font-arabic' : 'font-sans'}`} dir={mode === 'ar' ? 'rtl' : 'ltr'}>
              {mode === 'ar' ? displayInput.join('') : currentInput}
            </div>
            <button
              onClick={checkWord}
              className="px-6 rounded-xl gradient-primary text-white font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all"
            >
              {localT('تحقق', 'Check')}
            </button>
          </div>
        )}

        {/* Sentence Input Area */}
        {isSentenceMode && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                onClick={handleBackspace}
                className="p-3 rounded-xl bg-secondary text-muted-foreground hover:text-amber-500 transition-colors"
                title={localT('مسح حرف', 'Backspace')}
              >
                <Eraser size={20} />
              </button>
              <button
                onClick={() => setSentenceInput('')}
                className="p-3 rounded-xl bg-secondary text-muted-foreground hover:text-destructive transition-colors"
                title={localT('مسح الكل', 'Clear All')}
              >
                <Trash2 size={20} />
              </button>
              <div className={`flex-1 bg-white rounded-xl border border-border p-3 flex items-center justify-center text-lg md:text-xl font-bold shadow-inner min-h-[56px] ${mode === 'ar' ? 'font-arabic' : 'font-sans'}`} dir={mode === 'ar' ? 'rtl' : 'ltr'}>
                {sentenceInput}
              </div>
            </div>
            <div className="flex gap-2 justify-center">
              <button onClick={() => appendChar(' ', ' ')} className="px-6 py-2 rounded-xl bg-secondary text-foreground text-xs font-bold border border-border hover:bg-secondary/80">
                {localT('مسافة', 'Space')}
              </button>
              <button onClick={() => appendChar('.', '.')} className="px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-bold border border-border hover:bg-secondary/80">
                .
              </button>
              <button onClick={() => { const c = mode === 'ar' ? '،' : ','; appendChar(c, c); }} className="px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-bold border border-border hover:bg-secondary/80">
                {mode === 'ar' ? '،' : ','}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Alphabet Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            {mode === 'ar' ? localT('لوحة الحروف العربية', 'Arabic Alphabet') : localT('لوحة الحروف الإنجليزية', 'English Alphabet')}
          </p>
          <button
            onClick={() => setIsSentenceMode(!isSentenceMode)}
            className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${isSentenceMode ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-secondary border-border text-muted-foreground'}`}
          >
            {isSentenceMode ? localT('وضع الكلمات', 'Word Mode') : localT('وضع الجمل', 'Sentence Mode')}
          </button>
        </div>

        <div className="grid grid-cols-7 sm:grid-cols-8 gap-2 relative">
          {(mode === 'ar' ? ARABIC_ALPHABET : ENGLISH_ALPHABET).map((item) => {
            const char = typeof item === 'string' ? item : item.char;
            return (
              <button
                key={char}
                onClick={() => handleCharClick(char)}
                className={`aspect-square flex items-center justify-center bg-white border border-border rounded-xl text-base md:text-lg font-bold text-foreground hover:border-primary hover:text-primary active:scale-90 transition-all shadow-sm ${mode === 'ar' ? 'font-arabic' : 'font-sans'}`}
              >
                {char}
              </button>
            );
          })}

          {/* Contextual Shapes Popup */}
          {showShapes && mode === 'ar' && (
            <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl border border-primary/20 p-4 flex flex-wrap justify-center gap-3 animate-in zoom-in-95 duration-200">
                {ARABIC_ALPHABET.find(a => a.char === showShapes)?.shapes.map((shape, idx) => (
                  <button
                    key={idx}
                    onClick={() => appendChar(showShapes, shape, idx)}
                    className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center bg-secondary/30 rounded-xl text-xl md:text-2xl font-bold text-primary hover:bg-primary hover:text-white transition-all font-arabic"
                  >
                    {shape}
                  </button>
                ))}
                <button
                  onClick={() => setShowShapes(null)}
                  className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center bg-destructive/10 rounded-xl text-destructive hover:bg-destructive hover:text-white transition-all"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DictationPhonics;
