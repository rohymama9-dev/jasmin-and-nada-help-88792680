import { toast } from 'sonner';
import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { Surah } from '@/data/surahs';

interface RecitationRoomProps {
  surah: Surah;
  fromAyah: number;
  toAyah: number;
  onBack: () => void;
  onPoints?: (n: number) => void;
}

const RecitationRoom = ({ surah, fromAyah, toAyah, onBack, onPoints }: RecitationRoomProps) => {
  const { t, lang, dir } = useLang();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const BackArrow = dir === 'rtl' ? ArrowRight : ArrowLeft;

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const toggleListening = async () => {
    if (isListening) {
      try { recognitionRef.current?.stop(); } catch { /* ignore */ }
      setIsListening(false);
      if (transcript.trim().length > 20) onPoints?.(5);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast(lang === 'ar'
        ? 'المتصفح لا يدعم التعرف على الصوت. جرّبي Chrome على أندرويد.'
        : 'Browser does not support Speech Recognition. Try Chrome on Android.');
      return;
    }

    // Pre-warm mic permission so Android Chrome surfaces the prompt on the
    // user gesture instead of silently failing inside recognition.start().
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true });
        s.getTracks().forEach(t => t.stop());
      }
    } catch {
      toast(lang === 'ar'
        ? 'يرجى السماح بالوصول إلى الميكروفون من إعدادات المتصفح.'
        : 'Please allow microphone access from browser settings.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-SA';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let text = '';
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text);
    };

    recognition.onerror = (e: any) => {
      setIsListening(false);
      const err = e?.error;
      if (err === 'not-allowed' || err === 'service-not-allowed') {
        toast(lang === 'ar'
          ? 'تم رفض الإذن للميكروفون. فعّليه من إعدادات المتصفح.'
          : 'Microphone permission denied. Enable it in browser settings.');
      } else if (err === 'no-speech') {
        // silently ignore — user can tap again
      } else if (err === 'audio-capture') {
        toast(lang === 'ar' ? 'لم يتم العثور على ميكروفون.' : 'No microphone found.');
      }
    };
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
    } catch {
      // start() throws if already started — reset state
      setIsListening(false);
    }
  };

  return (
    <div className="pb-4">
      <button onClick={onBack} className="flex items-center gap-2 text-primary mb-5 hover:text-primary/80 transition-colors">
        <BackArrow size={18} />
        <span className="text-sm font-medium">{t('back')}</span>
      </button>

      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-3">
          <span className="text-primary-foreground font-bold text-xl">{surah.number}</span>
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          {lang === 'ar' ? surah.nameAr : surah.nameEn}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t('recitationRoom')}</p>
        <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
          <BookOpen size={12} />
          {lang === 'ar' ? `الآيات ${fromAyah} - ${toAyah}` : `Verses ${fromAyah} - ${toAyah}`}
        </div>
      </div>

      {/* Transcript area */}
      <div className="glass-card rounded-2xl p-5 mb-8 min-h-[200px] overflow-hidden" dir="rtl" style={{ direction: 'rtl', unicodeBidi: 'isolate' }}>
        {transcript ? (
          <p
            className="text-foreground break-words"
            style={{
              fontFamily: 'Cairo, sans-serif',
              fontSize: 'clamp(1rem, 4.5vw, 1.35rem)',
              lineHeight: 1.8,
              wordSpacing: '2px',
              letterSpacing: '0.5px',
            }}
          >
            {transcript}
          </p>
        ) : (
          <p className="text-center text-muted-foreground mt-16">
            {lang === 'ar' ? 'اضغط على الميكروفون وابدأ بالتلاوة' : 'Tap the microphone and start reciting'}
          </p>
        )}
      </div>

      {/* Mic button */}
      <div className="flex justify-center">
        <button
          onClick={toggleListening}
          className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
            isListening
              ? 'bg-destructive text-destructive-foreground animate-pulse-soft scale-110'
              : 'gradient-primary text-primary-foreground hover:scale-105'
          }`}
        >
          {isListening ? <MicOff size={32} /> : <Mic size={32} />}
        </button>
      </div>
      <p className="text-center text-sm text-muted-foreground mt-3">
        {isListening ? t('stopReciting') : t('startReciting')}
      </p>
    </div>
  );
};

export default RecitationRoom;
