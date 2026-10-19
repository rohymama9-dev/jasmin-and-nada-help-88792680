import { useState, useEffect } from 'react';
import { Lock, Clock, FileText, CheckCircle2, RefreshCw } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface CapsuleData {
  text: string;
  unlockTime: number;
}

const TimeCapsule = () => {
  const { lang, t } = useLang();
  const [capsule, setCapsule] = useState<CapsuleData | null>(null);
  const [inputText, setInputText] = useState('');
  const [daysLeft, setDaysLeft] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    const data = localStorage.getItem('time_capsule');
    if (data) {
      try {
        const parsed = JSON.parse(data) as CapsuleData;
        setCapsule(parsed);
        const now = Date.now();
        if (now >= parsed.unlockTime) {
          setIsUnlocked(true);
        } else {
          setDaysLeft(Math.ceil((parsed.unlockTime - now) / (1000 * 60 * 60 * 24)));
        }
      } catch {
        // ignore
      }
    }
  }, []);

  const saveCapsule = () => {
    if (!inputText.trim()) return;
    const unlockTime = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
    const newData = { text: inputText.trim(), unlockTime };
    localStorage.setItem('time_capsule', JSON.stringify(newData));
    setCapsule(newData);
    setDaysLeft(30);
    setIsUnlocked(false);
    toast.success(lang === 'ar' ? 'تم إغلاق الكبسولة! نراك بعد 30 يوماً.' : 'Capsule locked! See you in 30 days.');
  };

  const resetCapsule = () => {
    localStorage.removeItem('time_capsule');
    setCapsule(null);
    setInputText('');
    setIsUnlocked(false);
  };

  return (
    <div className="glass-card rounded-3xl p-6 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 opacity-50" />
      
      <div className="relative z-10 flex flex-col items-center text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
          {capsule && !isUnlocked ? <Lock size={24} /> : capsule && isUnlocked ? <FileText size={24} /> : <Clock size={24} />}
        </div>
        
        <h3 className="text-lg font-bold text-foreground">
          {lang === 'ar' ? 'كبسولة الزمن' : 'Time Capsule'}
        </h3>

        {!capsule && (
          <div className="w-full space-y-3 animate-fade-in">
            <p className="text-sm text-muted-foreground">
              {lang === 'ar' 
                ? 'اكتب رسالة لنفسك المستقبلية. سيتم إغلاقها ولن تفتح إلا بعد 30 يوماً.'
                : 'Write a message to your future self. It will be locked and only open after 30 days.'}
            </p>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={lang === 'ar' ? 'رسالتي إلى المستقبل...' : 'My message to the future...'}
              className="w-full h-32 p-3 rounded-xl bg-background border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button 
              onClick={saveCapsule}
              className="w-full py-2.5 rounded-xl gradient-primary text-white font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Lock size={16} />
              {lang === 'ar' ? 'إغلاق الكبسولة لمدة 30 يوماً' : 'Lock Capsule for 30 Days'}
            </button>
          </div>
        )}

        {capsule && !isUnlocked && (
          <div className="w-full space-y-3 animate-fade-in py-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-indigo-500/20 flex items-center justify-center animate-pulse-soft">
              <Lock size={28} className="text-indigo-500" />
            </div>
            <p className="font-bold text-foreground text-lg">
              {lang === 'ar' ? `تفتح بعد ${daysLeft} يوم` : `Opens in ${daysLeft} days`}
            </p>
            <p className="text-xs text-muted-foreground">
              {lang === 'ar' ? 'الرسالة محكمة الإغلاق. الصبر مفتاح الفرج!' : 'Message tightly locked. Patience is a virtue!'}
            </p>
          </div>
        )}

        {capsule && isUnlocked && (
          <div className="w-full space-y-4 animate-slide-up">
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-start">
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {capsule.text}
              </p>
            </div>
            <button 
              onClick={resetCapsule}
              className="w-full py-2.5 rounded-xl bg-secondary text-secondary-foreground font-bold hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} />
              {lang === 'ar' ? 'إنشاء كبسولة جديدة' : 'Create New Capsule'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeCapsule;
