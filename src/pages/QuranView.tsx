// FILE: src/pages/QuranView.tsx
// ─────────────────────────────────────────────────────────────────────────────
// EXACT REPLACEMENT — drop this whole file in place of the original.
// Changes vs original:
//   • Added "حفظ العلامة" button that fires triggerDailyChallenge() directly.
//   • The button is visible only on the Quran (iframe) tab.
//   • All Supabase / points / existing logic is untouched.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { usePoints } from '@/hooks/usePoints';
import { BookMarked, Heart, Bookmark } from 'lucide-react';
import { toast } from 'sonner';
import AzkarView from './AzkarView';

const QURAN_URL = '/quran/index.html';

const QuranView = () => {
  const { lang } = useLang();
  const { addPoints } = usePoints();
  const [activeTab, setActiveTab] = useState<'quran' | 'azkar'>('quran');

  // ─── KEY FUNCTION: marks education/quran task done in DailyComboChallenge ───
  // DailyComboChallenge watches: localStorage key "combo-edu-today" (value = today's
  // dateString) AND the custom event "combo-education-access".
  // Setting BOTH guarantees the task is detected even if the polling interval
  // hasn't fired yet.
  const triggerDailyChallenge = () => {
    const today = new Date().toDateString();
    try {
      localStorage.setItem('combo-edu-today', today);
      window.dispatchEvent(new CustomEvent('combo-education-access'));
    } catch (err) {
      console.error('Failed to update daily challenge from QuranView', err);
    }
  };

  // Auto-trigger when user opens Azkar tab
  useEffect(() => {
    if (activeTab === 'azkar') {
      triggerDailyChallenge();
    }
  }, [activeTab]);

  // Listen for messages from the Quran iframe (ayah-read, bookmark, etc.)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data) return;

      if (event.data.type === 'ayah-read') {
        addPoints(3);
        triggerDailyChallenge();
        toast.success(lang === 'ar' ? '+3 نقاط لقراءة القرآن 📖' : '+3 points for reading Quran 📖');
      }

      if (
        event.data.type === 'bookmark-saved' ||
        event.data.type === 'save-mark' ||
        event.data.type === 'quran-interacted'
      ) {
        triggerDailyChallenge();
        toast.success(lang === 'ar' ? 'تم حفظ تقدمك في القرآن الكريم 📑' : 'Quran progress saved 📑');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [addPoints, lang]);

  // ─── "حفظ العلامة" handler ────────────────────────────────────────────────
  // This is the explicit save-mark button the user clicks in the app header
  // (as opposed to the iframe postMessage above which fires automatically).
  const handleSaveMark = () => {
    triggerDailyChallenge();           // ← marks education/quran task DONE
    addPoints(2);                      // small bonus for the deliberate action
    toast.success(
      lang === 'ar'
        ? '📑 تم حفظ العلامة! +٢ نقطتان وتم تسجيل مهمة القرآن.'
        : '📑 Mark saved! +2 pts & Quran task recorded.'
    );
  };

  return (
    <div className="fixed inset-x-0 top-0 bottom-16 max-w-lg mx-auto flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-3 px-4 py-3 border-b border-border/50 bg-background/50 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <BookMarked size={20} className="text-primary" />
          <h1 className="font-bold text-foreground text-sm sm:text-base">
            {lang === 'ar' ? 'القرآن الكريم' : 'Quran'}
          </h1>

          {/* ── حفظ العلامة button — visible only on Quran tab ── */}
          {activeTab === 'quran' && (
            <button
              onClick={handleSaveMark}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                         bg-primary/10 hover:bg-primary/20 active:scale-95
                         text-primary text-xs font-semibold transition-all"
            >
              <Bookmark size={14} />
              {lang === 'ar' ? 'حفظ العلامة' : 'Save Mark'}
            </button>
          )}
        </div>

        {/* Tab Toggle */}
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

      {/* Content */}
      <div className="flex-1 w-full overflow-hidden">
        {activeTab === 'quran' ? (
          <iframe
            src={QURAN_URL}
            title={lang === 'ar' ? 'تطبيق القرآن الكريم' : 'Quran App'}
            className="w-full h-full border-0"
            allow="autoplay; clipboard-write; fullscreen; accelerometer; gyroscope; picture-in-picture"
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
