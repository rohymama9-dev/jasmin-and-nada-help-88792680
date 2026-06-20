import { toast } from 'sonner';
import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Volume2, Check, X, Volume1, VolumeX } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { speak, cancelSpeech } from '@/lib/speech';

interface Props {
  target: string;
  lang?: 'ar' | 'en';
  onScore?: (correct: boolean) => void;
}

/** Normalize text for comparison: strip diacritics, punctuation, lower-case. */
const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0670]/g, '') // Arabic diacritics
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

const similarity = (a: string, b: string): number => {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  // Word-level overlap
  const aw = na.split(' ');
  const bw = nb.split(' ');
  const set = new Set(bw);
  let hit = 0;
  aw.forEach(w => { if (set.has(w)) hit++; });
  return hit / Math.max(aw.length, bw.length);
};

const PronunciationExercise = ({ target, lang: lessonLang, onScore }: Props) => {
  const { lang: uiLang } = useLang();
  const lang = lessonLang ?? uiLang;
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [volume, setVolume] = useState(1.0);
  const recRef = useRef<any>(null);

  useEffect(() => () => { recRef.current?.stop?.(); cancelSpeech(); }, []);

  const changeVolume = (delta: number) => {
    setVolume(prev => Math.min(1.0, Math.max(0.0, prev + delta)));
  };

  const start = () => {
    setTranscript('');
    setScore(null);
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast(lang === 'ar'
        ? 'المتصفح لا يدعم التعرف على الصوت. جرّبي Chrome.'
        : 'Speech recognition not supported. Try Chrome.');
      return;
    }
    const rec = new SR();
    rec.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e: any) => {
      let text = '';
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      setTranscript(text);
    };
    rec.onend = () => {
      setListening(false);
      // Use a microtask so the latest transcript is captured
      setTimeout(() => {
        setTranscript(prev => {
          const sim = similarity(prev, target);
          const pct = Math.round(sim * 100);
          setScore(pct);
          onScore?.(pct >= 60);
          return prev;
        });
      }, 50);
    };
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  };

  const stop = () => recRef.current?.stop?.();

  const ok = score !== null && score >= 60;
  const tryAgain = score !== null && score < 60;

  return (
    <div className="rounded-2xl border border-border bg-secondary/30 p-4 space-y-3">
      <p className="text-xs font-semibold text-muted-foreground">
        {lang === 'ar' ? '🎤 استمعي ثم كرّري' : '🎤 Listen then repeat'}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex bg-background rounded-xl border border-border p-1 gap-1">
          <button
            onClick={() => changeVolume(-0.1)}
            className="p-2 rounded-lg text-muted-foreground hover:text-primary transition-colors"
          >
            {volume === 0 ? <VolumeX size={14} /> : <Volume1 size={14} />}
          </button>
          <button
            onClick={() => changeVolume(0.1)}
            className="p-2 rounded-lg text-muted-foreground hover:text-primary transition-colors"
          >
            <Volume2 size={14} />
          </button>
        </div>
        <button
          onClick={() => speak(target, lang, { volume })}
          className="px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm font-semibold flex items-center gap-2 active:scale-95"
        >
          <Volume2 size={14} /> {lang === 'ar' ? 'استمعي' : 'Listen'}
        </button>
        <button
          onClick={listening ? stop : start}
          className={`px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 active:scale-95 ${
            listening ? 'bg-destructive text-destructive-foreground animate-pulse' : 'bg-primary text-primary-foreground'
          }`}
        >
          {listening ? <><MicOff size={14} /> {lang === 'ar' ? 'إيقاف' : 'Stop'}</> : <><Mic size={14} /> {lang === 'ar' ? 'تحدّثي' : 'Speak'}</>}
        </button>
      </div>
      <p className="text-base font-bold text-foreground" dir={lang === 'ar' ? 'rtl' : 'ltr'}>{target}</p>
      {transcript && (
        <div className="text-xs text-muted-foreground">
          <span className="font-semibold">{lang === 'ar' ? 'سمعت:' : 'Heard:'} </span>
          <span dir={lang === 'ar' ? 'rtl' : 'ltr'}>{transcript}</span>
        </div>
      )}
      {score !== null && (
        <div className={`flex items-center gap-2 text-sm font-semibold ${ok ? 'text-success' : 'text-destructive'}`}>
          {ok ? <Check size={16} /> : <X size={16} />}
          {lang === 'ar' ? `الدقة: ${score}%` : `Accuracy: ${score}%`}
          {tryAgain && (
            <span className="text-muted-foreground font-normal">
              — {lang === 'ar' ? 'أعيدي بنطق أوضح' : 'try again with clearer pronunciation'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default PronunciationExercise;
