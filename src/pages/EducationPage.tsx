import { useEffect, useMemo, useState } from 'react';
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
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = workerSrc;

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
  const [summary, setSummary] = useState('');

  const normalizeWhitespace = (s: string) => s.replace(/\s+/g, ' ').trim();

  const normalizeArabicText = (text: string): string => {
    if (!text) return '';

    // Step 1: Remove all zero-width and invisible characters
    let cleaned = text.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, '');
    
    // Step 2: Detect if text contains Arabic characters
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
    if (!arabicRegex.test(cleaned)) return normalizeWhitespace(cleaned);

    // Step 3: Fix character spacing issues (remove spaces between Arabic characters)
    // Match sequences of Arabic characters separated by single spaces and join them
    cleaned = cleaned.replace(/([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF])\s+([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF])/g, '$1$2');

    // Step 4: Reverse only the Arabic segments (handle RTL correctly)
    // Split into segments of Arabic and non-Arabic text
    const segments = [];
    let currentSegment = '';
    let currentIsArabic = false;
    
    for (const char of cleaned) {
      const isArabic = arabicRegex.test(char);
      if (isArabic !== currentIsArabic) {
        if (currentSegment) segments.push({ text: currentSegment, isArabic: currentIsArabic });
        currentSegment = char;
        currentIsArabic = isArabic;
      } else {
        currentSegment += char;
      }
    }
    if (currentSegment) segments.push({ text: currentSegment, isArabic: currentIsArabic });

    // Reverse each Arabic segment
    const processedSegments = segments.map(seg => {
      if (seg.isArabic) {
        // Reverse the entire segment (fixes word order too)
        return seg.text.split('').reverse().join('');
      }
      return seg.text;
    });

    // Join all segments back and normalize whitespace
    return normalizeWhitespace(processedSegments.join(''));
  };

  const parseDocument = async (f: File) => {
    setDocLoading(true);
    setDocError(null);
    setDocPages([]);
    setDocText('');
    setSearchQuery('');
    setSearchResults([]);
    setSummary('');
    try {
      const isPdf = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        const text = normalizeWhitespace(await f.text());
        setDocPages([{ page: 1, text }]);
        setDocText(text);
        return;
      }

      const buf = await f.arrayBuffer();
      const loadingTask = getDocument({
        data: new Uint8Array(buf),
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/standard_fonts/'
      });
      const pdf = await loadingTask.promise;
      const pages: DocPage[] = [];
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        
        // Custom text assembly to fix Arabic fragmenting (joining characters without spaces)
        let pageText = '';
        let lastY = -1;
        
        for (const item of content.items as any[]) {
          if (!item.str) continue;
          
          // If Y coordinate changed significantly, it's a new line
          if (lastY !== -1 && Math.abs(item.transform[5] - lastY) > 5) {
            pageText += ' ';
          } else if (lastY !== -1 && item.hasEOL) {
            pageText += ' ';
          }
          
          // Remove zero-width spaces and other invisible formatting characters
          const cleanStr = item.str.replace(/[\u200B-\u200D\uFEFF]/g, '');
          pageText += cleanStr;
          lastY = item.transform[5];
        }
        
        const text = normalizeArabicText(pageText);
        pages.push({ page: pageNum, text });
      }
      setDocPages(pages);
      setDocText(pages.map(p => p.text).join('\n'));
    } catch {
      setDocError(t('فشل قراءة المستند', 'Failed to read document'));
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

  const summarizeText = (text: string) => {
    const cleaned = normalizeWhitespace(text);
    if (!cleaned) return '';
    const rawSentences = cleaned.split(/(?<=[.!?؟])\s+/).map(s => s.trim()).filter(Boolean);
    const sentences = rawSentences.slice(0, 400);
    if (sentences.length <= 3) return sentences.join(' ');

    const stop = new Set([
      'the','a','an','and','or','to','of','in','on','for','with','as','at','by','from','is','are','was','were','be','been','it','this','that','these','those',
      'و','في','على','إلى','من','عن','أن','إن','كان','كانت','يكون','تكون','هو','هي','هم','هن','هذا','هذه','ذلك','تلك','هناك','هنا','ثم','أو','لكن','كما','ما','لا','لم','لن','قد','حتى',
    ]);

    const freq = new Map<string, number>();
    const tokenize = (s: string) =>
      s
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
        .split(/\s+/)
        .filter(w => w.length >= 2 && !stop.has(w));

    for (const s of sentences) {
      for (const w of tokenize(s)) freq.set(w, (freq.get(w) || 0) + 1);
    }

    const scored = sentences.map((s, i) => {
      const words = tokenize(s);
      const sum = words.reduce((acc, w) => acc + (freq.get(w) || 0), 0);
      const score = sum / Math.max(8, words.length);
      return { i, s, score };
    });

    const take = Math.min(7, Math.max(3, Math.round(sentences.length * 0.15)));
    const top = scored.sort((a, b) => b.score - a.score).slice(0, take).sort((a, b) => a.i - b.i);
    return top.map(x => x.s).join(' ');
  };

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
      <div className="text-center mb-2">
        <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-3 shadow-lg">
          <GraduationCap size={28} className="text-primary-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground">
          {t('مركز التعليم', 'Education Center')}
        </h2>
        <GlobalLeaderboard currentPoints={educationPoints} section="education" />
      <div className="flex justify-center gap-2 mt-4">
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
                  setSummary('');
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
                {searchResults.map((r, i) => (
                  <div key={`${r.page}-${r.index}-${i}`} className="rounded-2xl border border-border bg-card p-3">
                    <div className="text-[10px] text-muted-foreground font-bold mb-1">
                      {t('صفحة', 'Page')} {r.page} • #{r.index}
                    </div>
                    <div className="text-sm text-foreground leading-relaxed" style={{ textAlign: 'start' }}>
                      {r.snippet}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-bold text-foreground text-sm">{t('تلخيص Extractive', 'Extractive Summarization')}</p>
              <button
                onClick={() => setSummary(summarizeText(docText))}
                disabled={!docText || docLoading}
                className="px-3 py-2 rounded-xl gradient-primary text-white text-xs font-extrabold disabled:opacity-60"
              >
                {t('تلخيص', 'Summarize')}
              </button>
            </div>
            {summary && (
              <div className="rounded-2xl border border-border bg-secondary/30 p-3 text-sm leading-relaxed" style={{ textAlign: 'start' }}>
                {summary}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EducationPage;
