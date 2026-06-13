import { useEffect, useRef, useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { usePoints } from '@/hooks/usePoints';
import { BookMarked, Heart } from 'lucide-react';
import { toast } from 'sonner';
import AzkarView from './AzkarView';
import { useDailyComboChallenge } from '@/contexts/DailyComboChallengeContext';

const QURAN_URL = '/quran/index.html';

const QuranView = () => {
  const { lang } = useLang();
  const { addPoints } = usePoints();
  const { updateChallenge } = useDailyComboChallenge();
  const [activeTab, setActiveTab] = useState<'quran' | 'azkar'>('quran');
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const completeEducationChallenge = () => {
    updateChallenge('education', true);
  };

  useEffect(() => {
    if (activeTab === 'azkar') {
      completeEducationChallenge();
    }
  }, [activeTab]);

  const handleSaveMark = () => {
    completeEducationChallenge();
    try {
      iframeRef.current?.contentWindow?.postMessage({ type: 'save-mark' }, '*');
    } catch {
      // ignore
    }
    toast.success(lang === 'ar' ? 'تم حفظ العلامة ✅' : 'Mark saved ✅');
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data) return;
      const messageType = typeof event.data === 'string' ? event.data : event.data.type;

      if (messageType === 'ayah-read') {
        addPoints(2);
        completeEducationChallenge();
        toast.success(lang === 'ar' ? '+2 نقاط لقراءة القرآن 📖' : '+2 points for reading Quran 📖');
      }

      if (
        messageType === 'bookmark-saved' ||
        messageType === 'save-mark' ||
        messageType === 'bookmark_saved' ||
        messageType === 'saveMark' ||
        messageType === 'quran-interacted'
      ) {
        addPoints(2);
        completeEducationChallenge();
        toast.success(lang === 'ar' ? 'تم حفظ تقدمك في القرآن الكريم 📑' : 'Quran progress saved 📑');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [addPoints, lang]);

  return (
    <div className="fixed inset-x-0 top-0 bottom-16 max-w-lg mx-auto flex flex-col bg-background overflow-hidden">
      <div className="flex flex-col gap-3 px-4 py-3 border-b border-border/50 bg-background/50 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
          <BookMarked size={20} className="text-primary" />
          <h1 className="font-bold text-foreground text-sm sm:text-base">
            {lang === 'ar' ? 'القرآن الكريم' : 'Quran'}
          </h1>
          </div>
          {activeTab === 'quran' && (
            <button
              onClick={handleSaveMark}
              className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition"
            >
              {lang === 'ar' ? 'حفظ العلامة' : 'Save Mark'}
            </button>
          )}
        </div>

        <div className="flex gap-2 border-b border-border/30 -mx-4 px-4">
          <button
            onClick={() => setActiveTab('quran')}
            className={`pb-2 px-3 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === 'quran'
                ? 'text-primary border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            {lang === 'ar' ? 'السور' : 'Surahs'}
          </button>
          <button
            onClick={() => setActiveTab('azkar')}
            className={`pb-2 px-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'azkar'
                ? 'text-primary border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            <Heart size={16} />
            {lang === 'ar' ? 'الأذكار' : 'Azkar'}
          </button>
        </div>
      </div>

      <div className="flex-1 w-full overflow-hidden">
        {activeTab === 'quran' ? (
          <iframe
            ref={iframeRef}
            src={QURAN_URL}
            title={lang === 'ar' ? 'تطبيق القرآن الكريم' : 'Quran App'}
            className="w-full h-full border-0"
            allow="autoplay; clipboard-write; fullscreen; accelerometer; gyroscope; picture-in-picture"
            referrerPolicy="no-referrer"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation"
            loading="lazy"
          />
        ) : (
          <AzkarView />
        )}
      </div>
    </div>
  );
};

export default QuranView;
