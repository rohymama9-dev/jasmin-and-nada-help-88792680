import { useEffect, useMemo, useRef, useState } from 'react';
import { GraduationCap, Volume2, ArrowLeft, Check, Search } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { lsGetJSON, lsSetJSON } from '@/lib/userStorage';
import GlobalLeaderboard from '@/components/GlobalLeaderboard';
import {
  ALL_LESSONS, CATEGORY_META, lessonsByCategory,
  type Lesson, type LessonCategory,
} from '@/data/educationCatalog';
import { speak, cancelSpeech } from '@/lib/speech';
import { toast } from 'sonner';
import PronunciationExercise from '@/components/PronunciationExercise';
import LessonExercises from '@/components/LessonExercises';
import MathLab from '@/components/MathLab';
import DictationPhonics from '@/components/DictationPhonics';
import GrammarQuestions from '@/components/GrammarQuestions';
import { useDailyComboChallenge } from '@/contexts/DailyComboChallengeContext';
import { normalizeWhitespace, parseSupportedDocument } from '@/lib/documentTools';
import floralBg from '@/assets/floral-bg.jpg';

interface Props {
  points: number;
  educationPoints: number;
  addPoints: (n: number) => void;
}

const CATEGORIES: LessonCategory[] =
  ['letters','words','grammar','listening','texts','phrases','conversations'];
const COMPLETED_BASE = 'app-lessons-completed';

const EducationPage = ({ points, educationPoints, addPoints }: Props) => {
  const { lang } = useLang();
  const { updateChallenge } = useDailyComboChallenge();
  
  // تاম نقل activeTab هنا لأعلى لتجنب أخطاء React Hooks
  const [activeTab, setActiveTab] = useState<'math' | 'dictation' | 'grammarQuestions' | 'docs'>('math');
  
  const [activeCat, setActiveCat] = useState<LessonCategory | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(
    () => new Set(lsGetJSON<string[]>(COMPLETED_BASE, [])),
  );

  // Re-hydrate when the guest name changes (logout / fresh name).
  useEffect(() => {
    const sync = () => setCompleted(new Set(lsGetJSON<string[]>(COMPLETED_BASE, [])));
    window.addEventListener('guest-name-changed', sync);
    return () => {
      window.removeEventListener('guest-name-changed', sync);
      cancelSpeech();
    };
  }, []);

  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  type DocPage = { page: number; text: string };
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docPages, setDocPages] = useState<DocPage[]>([]);
  const [docText, setDocText] = useState('');
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ page: number; index: number; snippet: string }>>([]);
  const [activePage, setActivePage] = useState(1);
  const pageViewerRef = useRef<HTMLDivElement>(null);

  const parseDocument = async (f: File) => {
    setDocLoading(true);
    setDocError(null);
    setDocPages([]);
    setDocText('');
    setSearchQuery('');
    setSearchResults([]);
    try {
      const parsed = await parseSupportedDocument(f);
      setDocPages(parsed.pages as DocPage[]);
      setDocText(parsed.text);
      if (!parsed.text) {
        setDocError(t('تم فتح الملف لكن لم يتم العثور على نص واضح داخله بعد.', 'The file opened, but no clear text was found inside it yet.'));
      }
    } catch {
      setDocError(t('تعذر قراءة هذا المستند الآن. جرّبي ملفًا أوضح أو محفوظًا بصيغة قياسية.', 'This document could not be read right now. Try a clearer file or a standard saved copy.'));
    } finally {
      setDocLoading(false);
    }
  };

  const computedResults = useMemo(() => {
    const q = normalizeWhitespace(searchQuery);
    if (!q || !docPages.length) return [];
    const needle = q.toLowerCase();
    const results: Array<{ page: number; index: number; snippet: string }> = [];
    for (const p of docPages) {
      const hay = p.text;
      const lower = hay.toLowerCase();
      let start = 0;
      for (;;) {
        const idx = lower.indexOf(needle, start);
        if (idx === -1) break;
        const before = hay.slice(Math.max(0, idx - 60), idx);
        const match = hay.slice(idx, idx + q.length);
        const after = hay.slice(idx + q.length, Math.min(hay.length, idx + q.length + 60));
        results.push({ page: p.page, index: idx, snippet: `${before}${match}${after}` });
        start = idx + q.length;
        if (results.length >= 50) return results;
      }
    }
    return results;
  }, [docPages, searchQuery]);

  useEffect(() => {
    setSearchResults(computedResults);
  }, [computedResults]);

  const normalizeForSearch = (s: string) =>
    normalizeWhitespace(s)
      .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const findBestQueryInDocument = (doc: string, ocr: string) => {
    const docNorm = normalizeForSearch(doc).toLowerCase();
    const words = normalizeForSearch(ocr).split(' ').filter(w => w.length >= 2);
    if (words.length === 0) return null;

    const maxWindow = Math.min(10, words.length);
    for (let windowSize = maxWindow; windowSize >= 2; windowSize--) {
      for (let i = 0; i + windowSize <= words.length; i++) {
        const phrase = words.slice(i, i + windowSize).join(' ');
        if (phrase.length < 6) continue;
        if (docNorm.includes(phrase.toLowerCase())) return phrase;
      }
    }

    const fallback = words.slice(0, 6).join(' ');
    return fallback.length >= 6 ? fallback : null;
  };

  useEffect(() => {
    if (!pageViewerRef.current) return;
    const q = normalizeWhitespace(searchQuery);
    if (!q) return;
    const el = pageViewerRef.current.querySelector('[data-doc-hit="1"]') as HTMLElement | null;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activePage, searchQuery]);

  const completeLesson = (lesson: Lesson) => {
    if (completed.has(lesson.id)) {
      toast.info(t('أكملتِ هذا الدرس مسبقاً', 'Already completed'));
      return;
    }
    const next = new Set(completed).add(lesson.id);
    setCompleted(next);
    lsSetJSON(COMPLETED_BASE, Array.from(next));
    addPoints(3); // Set to 3 points per lesson as requested
    updateChallenge('education', true);
    toast.success(t(`+3 نقاط 🌟`, `+3 points 🌟`));
  };


  // ============= Lesson view =============
  if (activeLesson) {
    const lesson = activeLesson;
    const items = (lang === 'ar' ? lesson.itemsAr : lesson.itemsEn) ?? [];
    return (
      <div className="space-y-4 pb-4" style={{ textAlign: 'start' }}>
        <button onClick={() => { cancelSpeech(); setActiveLesson(null); }}
          className="text-primary text-sm font-medium flex items-center gap-1"
          style={{ flexDirection: 'row' }}>
          <ArrowLeft size={16} className={lang === 'ar' ? 'rotate-180' : ''} /> {t('رجوع', 'Back')}
        </button>

        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs" style={{ flexDirection: 'row' }}>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
              {CATEGORY_META[lesson.category][lang]} {CATEGORY_META[lesson.category].emoji}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
              {t('مستوى', 'Level')} {lesson.difficulty}/5
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-semibold">
              ⭐ 3
            </span>
          </div>

          <h2 className="text-xl font-bold text-foreground">
            {lang === 'ar' ? lesson.titleAr : lesson.titleEn}
          </h2>

          {/* Body — also tappable to hear the whole thing */}
          <button
            onClick={() => speak(lang === 'ar' ? lesson.bodyAr : lesson.bodyEn, lang)}
            className="w-full rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-all p-4"
            style={{ textAlign: 'start' }}
          >
            <p className="text-sm leading-relaxed text-foreground">
              {lang === 'ar' ? lesson.bodyAr : lesson.bodyEn}
            </p>
            <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1" style={{ flexDirection: 'row' }}>
              <Volume2 size={12} /> {t('اضغطي للاستماع', 'Tap to listen')}
            </p>
          </button>

          {/* Per-item pronunciation */}
          {items.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">
                {t('استمعي وكرّري', 'Listen & repeat')}
              </p>
              <div className="flex flex-wrap gap-2" style={{ flexDirection: 'row' }}>
                {items.map((it, i) => (
                  <button key={i} onClick={() => speak(it, lang)}
                    className="px-3 py-2 rounded-xl bg-primary/5 hover:bg-primary/10 text-foreground text-sm font-medium flex items-center gap-2 active:scale-95 transition-all"
                    style={{ flexDirection: 'row' }}>
                    <Volume2 size={14} className="text-primary" />
                    <span>{it}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pronunciation correction (STT) */}
          <PronunciationExercise target={lang === 'ar' ? lesson.bodyAr : lesson.bodyEn} lang={lang} />

          {/* Interactive exercises */}
          <LessonExercises lesson={lesson} />

          <button
            onClick={() => completeLesson(lesson)}
            disabled={completed.has(lesson.id)}
            className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {completed.has(lesson.id)
              ? <><Check size={16} /> {t('تم الإكمال', 'Completed')}</>
              : t(`إنهاء الدرس (+3)`, `Complete lesson (+3)`)}
          </button>
        </div>
      </div>
    );
  }

  // ============= Category view =============
  if (activeCat) {
    const list = lessonsByCategory(activeCat);
    const meta = CATEGORY_META[activeCat];
    return (
      <div className="space-y-3 pb-4" style={{ textAlign: 'start' }}>
        <button onClick={() => setActiveCat(null)}
          className="text-primary text-sm font-medium flex items-center gap-1"
          style={{ flexDirection: 'row' }}>
          <ArrowLeft size={16} className={lang === 'ar' ? 'rotate-180' : ''} /> {t('رجوع', 'Back')}
        </button>
        <div className="text-center">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${meta.color} flex items-center justify-center mx-auto mb-2 shadow-lg`}>
            <span className="text-2xl">{meta.emoji}</span>
          </div>
          <h2 className="text-lg font-bold text-foreground">{meta[lang]}</h2>
          <p className="text-xs text-muted-foreground">{list.length} {t('درس', 'lessons')}</p>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {list.map((l, idx) => {
            const done = completed.has(l.id);
            return (
              <button key={l.id} onClick={() => setActiveLesson(l)}
                className="glass-card rounded-xl p-3 flex items-center gap-3 hover:bg-primary/5 transition-all active:scale-[0.98]"
                style={{ textAlign: 'start', flexDirection: 'row' }}>
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${meta.color} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">
                    {lang === 'ar' ? l.titleAr : l.titleEn}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {t('مستوى', 'Lvl')} {l.difficulty} · ⭐ 3
                  </p>
                </div>
                {done && <Check size={16} className="text-success" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ============= Hub view =============
  const totalCompleted = completed.size;

  return (
    <div className="space-y-4 pb-4">
      <div className="relative -mx-5 -mt-5 rounded-b-3xl overflow-hidden mb-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500 shadow-lg px-5 pt-8 pb-6 text-center">
        <img src={floralBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay pointer-events-none" />
        <div className="relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3 shadow-sm border border-white/30">
            <GraduationCap size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2">
            {t('مركز التعليم', 'Education Center')}
          </h2>
          <div className="text-white/90">
            <GlobalLeaderboard currentPoints={educationPoints} section="education" />
          </div>
        </div>
      </div>
      <div className="flex justify-center flex-wrap gap-2 mt-4 px-2">
          <button
            onClick={() => setActiveTab('math')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'math' ? 'gradient-primary text-white' : 'bg-secondary text-muted-foreground'}`}
          >
            {t('مختبر الرياضيات', 'Math Lab')}
          </button>
          <button
            onClick={() => setActiveTab('dictation')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'dictation' ? 'gradient-primary text-white' : 'bg-secondary text-muted-foreground'}`}
          >
            {t('الإملاء والنطق', 'Dictation')}
          </button>
          <button
            onClick={() => setActiveTab('grammarQuestions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'grammarQuestions' ? 'gradient-primary text-white' : 'bg-secondary text-muted-foreground'}`}
          >
            {t('أسئلة قواعد', 'Grammar Questions')}
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'docs' ? 'gradient-primary text-white' : 'bg-secondary text-muted-foreground'}`}
          >
            {t('أداة المستندات', 'Document Tool')}
          </button>
        </div>


      {activeTab === 'math' && (
        <div className="glass-card rounded-2xl p-4">
          <MathLab onScore={addPoints} />
        </div>
      )}

      {activeTab === 'grammarQuestions' && (
        <div className="glass-card rounded-2xl p-4">
          <GrammarQuestions onScore={addPoints} />
        </div>
      )}

      {activeTab === 'dictation' && (
        <DictationPhonics onScore={addPoints} />
      )}

      {activeTab === 'docs' && (
        <div className="glass-card rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-foreground text-sm">{t('أداة المستندات التعليمية', 'Education Document Tool')}</h3>
            <span className="text-[10px] text-muted-foreground font-semibold">{t('PDF أو TXT', 'PDF or TXT')}</span>
          </div>

          {!docFile ? (
            <label className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-secondary/30 p-8 cursor-pointer hover:bg-secondary/50 transition-colors">
              <input
                type="file"
                accept=".pdf,application/pdf,.txt,text/plain"
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setDocFile(f);
                  setActivePage(1);
                  void parseDocument(f);
                }}
              />
              <div className="text-3xl mb-2">📄</div>
              <p className="font-extrabold text-foreground text-sm">{t('ارفع ملف PDF أو TXT', 'Upload a PDF or TXT')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('سيتم استخراج النص محلياً بدون إنترنت', 'Text is extracted locally without internet')}</p>
            </label>
          ) : (
            <div className="bg-secondary/40 border border-border rounded-2xl p-3 flex items-center gap-3">
              <div className="text-2xl">📄</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground text-sm truncate">{docFile.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {docLoading ? t('جارٍ المعالجة...', 'Processing...') : t('جاهز', 'Ready')}
                  {docPages.length ? ` • ${docPages.length} ${t('صفحة', 'pages')}` : ''}
                </p>
              </div>
              <button
                onClick={() => {
                  setDocFile(null);
                  setDocPages([]);
                  setDocText('');
                  setDocError(null);
                  setSearchQuery('');
                  setSearchResults([]);
                  setActivePage(1);
                }}
                className="px-3 py-2 rounded-xl bg-secondary text-muted-foreground text-xs font-bold hover:bg-secondary/80 transition"
              >
                {t('إزالة', 'Remove')}
              </button>
            </div>
          )}

          {docError && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-3 text-sm text-destructive font-bold">
              {docError}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-secondary text-muted-foreground">
                <Search size={16} />
              </div>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('ابحث داخل المستند...', 'Search inside the document...')}
                disabled={!docText || docLoading}
                className="flex-1 px-3 py-2 rounded-xl bg-secondary/60 border border-border text-sm outline-none focus:ring-2 ring-primary disabled:opacity-60"
              />
            </div>

            {searchQuery.trim() && (
              <div className="text-xs text-muted-foreground font-semibold">
                {t('نتائج', 'Results')}: {searchResults.length}
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-auto pr-1">
                {searchResults.map((r, i) => {
                  const q = normalizeWhitespace(searchQuery);
                  const idx = r.snippet.toLowerCase().indexOf(q.toLowerCase());
                  const before = idx >= 0 ? r.snippet.slice(0, idx) : r.snippet;
                  const match = idx >= 0 ? r.snippet.slice(idx, idx + q.length) : '';
                  const after = idx >= 0 ? r.snippet.slice(idx + q.length) : '';
                  
                  return (
                    <button
                      key={`${r.page}-${r.index}-${i}`}
                      onClick={() => setActivePage(r.page)}
                      className="w-full text-left rounded-2xl border border-border bg-card p-3 hover:bg-primary/5 transition"
                    >
                      <div className="text-[10px] text-primary font-bold mb-1">
                        {t('صفحة', 'Page')} {r.page} • #{r.index}
                      </div>
                      <div className="text-sm text-foreground leading-relaxed" style={{ textAlign: 'start' }}>
                        {before}
                        <span className="bg-yellow-300 dark:bg-yellow-700 px-1 rounded">{match}</span>
                        {after}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Page viewer */}
          {docPages.length > 0 && !docLoading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-bold text-foreground text-sm">{t('عرض الصفحات', 'Page Viewer')}</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActivePage(Math.max(1, activePage - 1))}
                    disabled={activePage <= 1}
                    className="px-2 py-1 rounded-lg bg-secondary text-xs font-bold disabled:opacity-50"
                  >
                    {lang === 'ar' ? '→' : '←'}
                  </button>
                  <span className="text-xs font-mono">{activePage} / {docPages.length}</span>
                  <button
                    onClick={() => setActivePage(Math.min(docPages.length, activePage + 1))}
                    disabled={activePage >= docPages.length}
                    className="px-2 py-1 rounded-lg bg-secondary text-xs font-bold disabled:opacity-50"
                  >
                    {lang === 'ar' ? '←' : '→'}
                  </button>
                </div>
              </div>
              <div
                className="rounded-2xl border border-border bg-white dark:bg-slate-900 p-4 max-h-96 overflow-auto"
                ref={pageViewerRef}
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
                style={{ textAlign: 'start' }}
              >
                {(() => {
                  const page = docPages.find(p => p.page === activePage)!;
                  const q = normalizeWhitespace(searchQuery);
                  
                  if (!q) {
                    return <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{page.text}</p>;
                  }
                  
                  const parts: Array<string | JSX.Element> = [];
                  let lastIndex = 0;
                  let hits = 0;
                  const lowerText = page.text.toLowerCase();
                  const lowerQ = q.toLowerCase();
                  
                  for (;;) {
                    const idx = lowerText.indexOf(lowerQ, lastIndex);
                    if (idx === -1) {
                      parts.push(page.text.slice(lastIndex));
                      break;
                    }
                    parts.push(page.text.slice(lastIndex, idx));
                    const hit = page.text.slice(idx, idx + q.length);
                    if (hits === 0) {
                      parts.push(<span key={idx} data-doc-hit="1" className="bg-yellow-300 dark:bg-yellow-700 px-1 rounded">{hit}</span>);
                    } else {
                      parts.push(<span key={idx} className="bg-yellow-300 dark:bg-yellow-700 px-1 rounded">{hit}</span>);
                    }
                    hits += 1;
                    lastIndex = idx + q.length;
                  }
                  
                  return <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{parts}</p>;
                })()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EducationPage;
