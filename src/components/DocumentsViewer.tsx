import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, FileText, Image as ImageIcon, Search, ScanText, X, ZoomIn, ZoomOut, Eye, EyeOff } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import {
  extractImageText,
  normalizeWhitespace,
  parseSupportedDocument,
  type OcrWordBox,
  type ParsedDocumentPage,
} from '@/lib/documentTools';

const ACCEPTED_FILES = [
  '.pdf',
  'application/pdf',
  '.txt',
  'text/plain',
  '.docx',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/*',
].join(',');

type SearchResult = {
  page: number;
  index: number;
  snippet: string;
};

type DirectionalRun = {
  text: string;
  isArabic: boolean;
};

// Arabic character range regex
const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

/**
 * Strict physical separation: splits a line into runs where each run is
 * EITHER purely Arabic OR purely Latin/technical text.
 * Words from different scripts are NEVER combined in one run — each
 * script-switch creates a new block, guaranteeing they render on separate lines.
 */
const splitIntoDirectionalRuns = (line: string): DirectionalRun[] => {
  // Split into word-level tokens (preserve spaces as separators but don't include them in output)
  const words = line.split(/\s+/).filter(w => w.length > 0);
  const runs: DirectionalRun[] = [];
  let currentText = '';
  let currentIsArabic: boolean | null = null;

  for (const word of words) {
    const wordIsArabic = ARABIC_RE.test(word);

    if (currentIsArabic === null) {
      // First word
      currentText = word;
      currentIsArabic = wordIsArabic;
    } else if (wordIsArabic === currentIsArabic) {
      // Same script — append to current run with a space
      currentText += ' ' + word;
    } else {
      // Script switch — flush current run and start new one
      if (currentText.trim()) {
        runs.push({ text: currentText.trim(), isArabic: currentIsArabic });
      }
      currentText = word;
      currentIsArabic = wordIsArabic;
    }
  }

  // Flush final run
  if (currentText.trim()) {
    runs.push({ text: currentText.trim(), isArabic: !!currentIsArabic });
  }

  return runs;
};

const DocumentsViewer = () => {
  const { lang } = useLang();
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docPages, setDocPages] = useState<ParsedDocumentPage[]>([]);
  const [docText, setDocText] = useState('');
  const [docLoading, setDocLoading] = useState(false);
  const [docMessage, setDocMessage] = useState<string | null>(null);
  const [docNotices, setDocNotices] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePage, setActivePage] = useState(1);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrMessage, setOcrMessage] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [ocrWords, setOcrWords] = useState<OcrWordBox[]>([]);
  const pageViewerRef = useRef<HTMLDivElement | null>(null);

  // ── Previously missing state (this caused a ReferenceError that crashed
  //    the whole component before any of the rendering logic below could run) ──
  const [docFontSize, setDocFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [isOcrView, setIsOcrView] = useState(false);

  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  const revokePreview = useCallback((url: string | null) => {
    if (url) URL.revokeObjectURL(url);
  }, []);

  useEffect(() => () => revokePreview(previewUrl), [previewUrl, revokePreview]);

  const clearDocument = useCallback(() => {
    revokePreview(previewUrl);
    setDocFile(null);
    setDocPages([]);
    setDocText('');
    setDocLoading(false);
    setDocMessage(null);
    setDocNotices([]);
    setSearchQuery('');
    setActivePage(1);
    setOcrLoading(false);
    setOcrMessage(null);
    setOcrText('');
    setPreviewUrl(null);
    setImageSize(null);
    setOcrWords([]);
    setIsOcrView(false);
  }, [previewUrl, revokePreview]);

  const parseFile = useCallback(async (file: File) => {
    setDocLoading(true);
    setDocMessage(null);
    setDocNotices([]);
    setSearchQuery('');
    setActivePage(1);
    setOcrMessage(null);
    setOcrText('');
    setIsOcrView(false);

    try {
      const parsed = await parseSupportedDocument(file);
      revokePreview(previewUrl);
      setDocFile(file);
      setDocPages(parsed.pages);
      setDocText(parsed.text);
      setDocNotices(parsed.notices);
      setPreviewUrl(parsed.previewUrl || null);
      setImageSize(parsed.imageSize || null);
      setOcrWords(parsed.ocrWords || []);

      if (!parsed.text) {
        setDocMessage(t('تم فتح الملف، لكن لم يتم العثور على نص واضح داخله بعد.', 'The file opened, but no clear text was detected yet.'));
      } else if (parsed.source === 'image') {
        setDocMessage(t('تم استخراج النص من الصورة داخل المتصفح مع تحديد مواضع الكلمات.', 'Text was extracted from the image in the browser with word locations.'));
      } else {
        setDocMessage(null);
      }
    } catch {
      setDocFile(file);
      setDocPages([]);
      setDocText('');
      setPreviewUrl(null);
      setImageSize(null);
      setOcrWords([]);
      setDocMessage(t('تعذر قراءة هذا الملف حاليًا. جرّبي نسخة أوضح أو ملفًا محفوظًا بشكل قياسي.', 'This file could not be read right now. Try a cleaner copy or a standard saved file.'));
    } finally {
      setDocLoading(false);
    }
  }, [lang, previewUrl, revokePreview]);

  const computedResults = useMemo<SearchResult[]>(() => {
    const query = normalizeWhitespace(searchQuery);
    if (!query || !docPages.length) return [];

    const needle = query.toLowerCase();
    const results: SearchResult[] = [];

    for (const page of docPages) {
      const haystack = page.text;
      const haystackLower = haystack.toLowerCase();
      let start = 0;
      for (;;) {
        const index = haystackLower.indexOf(needle, start);
        if (index === -1) break;
        const before = haystack.slice(Math.max(0, index - 60), index);
        const match = haystack.slice(index, index + query.length);
        const after = haystack.slice(index + query.length, Math.min(haystack.length, index + query.length + 60));
        results.push({ page: page.page, index, snippet: `${before}${match}${after}` });
        start = index + query.length;
        if (results.length >= 50) return results;
      }
    }

    return results;
  }, [docPages, searchQuery]);

  const activePageText = useMemo(
    () => docPages.find(page => page.page === activePage)?.text || '',
    [activePage, docPages],
  );

  const findBestQueryInDocument = useCallback((documentText: string, ocrCandidate: string) => {
    const normalizeForSearch = (value: string) =>
      normalizeWhitespace(value)
        .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const docNormalized = normalizeForSearch(documentText).toLowerCase();
    const words = normalizeForSearch(ocrCandidate)
      .split(' ')
      .filter(word => word.length >= 2);

    if (words.length === 0) return null;

    const maxWindow = Math.min(10, words.length);
    for (let windowSize = maxWindow; windowSize >= 2; windowSize--) {
      for (let index = 0; index + windowSize <= words.length; index++) {
        const phrase = words.slice(index, index + windowSize).join(' ');
        if (phrase.length >= 6 && docNormalized.includes(phrase.toLowerCase())) return phrase;
      }
    }

    const fallback = words.slice(0, 6).join(' ');
    return fallback.length >= 6 ? fallback : null;
  }, []);

  const runOcrLookup = useCallback(async (imageFile: File) => {
    if (!docText || docLoading) {
      setOcrMessage(t('ارفعي المستند أولًا ثم صورة الصفحة أو المقتطف المراد مطابقته.', 'Upload the document first, then upload the page image or snippet to match.'));
      return;
    }

    setOcrLoading(true);
    setOcrMessage(null);
    setOcrText('');

    try {
      const result = await extractImageText(imageFile);
      setOcrText(result.text);
      setDocNotices(current => Array.from(new Set([...current, ...result.notices])));

      if (!result.text) {
        setOcrMessage(t('لم أتمكن من استخراج نص كافٍ من الصورة الحالية.', 'I could not extract enough text from the current image.'));
        return;
      }

      const query = findBestQueryInDocument(docText, result.text);
      if (!query) {
        setOcrMessage(t('تمت قراءة الصورة، لكن لم أجد تطابقًا واضحًا داخل المستند الحالي.', 'The image was read, but I did not find a clear match inside the current document.'));
        return;
      }

      setSearchQuery(query);
      const firstResult = computedResults.find(resultItem => resultItem.snippet.toLowerCase().includes(query.toLowerCase()))
        || docPages.flatMap(page => {
          const index = page.text.toLowerCase().indexOf(query.toLowerCase());
          return index >= 0 ? [{ page: page.page, index }] : [];
        })[0];

      if (firstResult) setActivePage(firstResult.page);
      setOcrMessage(t('تمت قراءة الصورة وتحديد أقرب موضع مطابق داخل المستند.', 'The image was read and the closest matching place inside the document was found.'));
      toast.success(t('تمت مطابقة النص من الصورة داخل المستند.', 'Matched text from the image inside the document.'));
    } finally {
      setOcrLoading(false);
    }
  }, [computedResults, docLoading, docPages, docText, findBestQueryInDocument, lang]);

  useEffect(() => {
    if (!pageViewerRef.current) return;
    const firstHit = pageViewerRef.current.querySelector('[data-doc-hit="1"]') as HTMLElement | null;
    if (firstHit) firstHit.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activePage, searchQuery]);

  // Highlights a search match within a single directional run (already
  // guaranteed to be pure Arabic or pure non-Arabic text).
  const highlightText = useCallback((text: string, query: string) => {
    const normalizedQuery = normalizeWhitespace(query);
    if (!normalizedQuery) return text;

    const lowerText = text.toLowerCase();
    const lowerQuery = normalizedQuery.toLowerCase();
    const parts: Array<string | JSX.Element> = [];
    let cursor = 0;
    let key = 0;

    for (;;) {
      const matchIndex = lowerText.indexOf(lowerQuery, cursor);
      if (matchIndex === -1) break;
      if (matchIndex > cursor) parts.push(text.slice(cursor, matchIndex));
      parts.push(
        <mark
          key={`hit-${key}`}
          data-doc-hit="1"
          className="bg-yellow-300 text-foreground px-1 rounded dark:bg-yellow-700"
        >
          {text.slice(matchIndex, matchIndex + normalizedQuery.length)}
        </mark>,
      );
      cursor = matchIndex + normalizedQuery.length;
      key += 1;
    }

    if (cursor < text.length) parts.push(text.slice(cursor));
    return parts.length ? parts : text;
  }, []);

  const matchedImageWords = useMemo(() => {
    if (!ocrWords.length) return [];
    const normalizedQuery = normalizeWhitespace(searchQuery).toLowerCase();
    if (!normalizedQuery) return ocrWords;

    const queryTerms = normalizedQuery.split(' ').filter(Boolean);
    return ocrWords.filter(word => {
      const value = word.text.toLowerCase();
      return queryTerms.some(term => value.includes(term));
    });
  }, [ocrWords, searchQuery]);

  const downloadExtractedText = useCallback(() => {
    if (!docFile) return;
    const blob = new Blob([docText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${docFile.name.replace(/\.[^.]+$/, '')}_extracted.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [docFile, docText]);

  const fontSizeClass = docFontSize === 'small' ? 'text-sm' : docFontSize === 'large' ? 'text-xl' : 'text-base';
  const textToRender = isOcrView ? ocrText : activePageText;

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="space-y-4">
      {/* Disclaimer Alert */}
      <div className="rounded-2xl border border-blue-300/50 bg-blue-50 dark:bg-blue-950/20 p-3 text-sm text-blue-900 dark:text-blue-200 text-center font-bold">
        {lang === 'ar' ? 'ممتاز باللغة الإنجليزية، وما زال قيد التطوير لدعم اللغة العربية بشكل كامل.' : 'Excellent in English, still under development for full Arabic support.'}
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-fuchsia-600 via-purple-600 to-violet-600 p-5 text-white text-center">
        <div className="text-4xl mb-2">📚</div>
        <h2 className="text-xl font-extrabold">{t('عارض المستندات الذكي', 'Smart Document Viewer')}</h2>
        <p className="text-white/80 text-xs mt-1">
          {t('PDF و DOCX و TXT والصور مع OCR محلي وبحث داخل النص', 'PDF, DOCX, TXT, and images with local OCR and in-text search')}
        </p>
      </div>

      {!docFile ? (
        <label className="relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/20 p-10 cursor-pointer hover:bg-purple-100/40 transition-colors">
          <input
            type="file"
            accept={ACCEPTED_FILES}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            onChange={event => {
              const file = event.target.files?.[0];
              if (!file) return;
              void parseFile(file);
              event.currentTarget.value = '';
            }}
          />
          <div className="text-5xl mb-3">📄</div>
          <p className="font-extrabold text-purple-700 dark:text-purple-300 text-base text-center">
            {t('ارفع المستند أو الصورة هنا', 'Upload the document or image here')}
          </p>
          <p className="text-sm text-muted-foreground mt-1 text-center">
            {t('يدعم DOCX و PDF و TXT و WebP وباقي الصور', 'Supports DOCX, PDF, TXT, WebP, and other images')}
          </p>
        </label>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-secondary/60 rounded-2xl p-3 border border-border">
            <div className="w-14 h-14 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-2xl flex-shrink-0">
              {previewUrl ? <ImageIcon size={24} className="text-purple-600" /> : <FileText size={24} className="text-purple-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate text-foreground text-sm">{docFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {docLoading
                  ? t('جارٍ تحليل الملف...', 'Analyzing file...')
                  : `${docPages.length || 1} ${t('صفحة/مستوى نصي', 'page/text layer')}`}
              </p>
            </div>
            <button
              onClick={downloadExtractedText}
              disabled={!docText}
              className="p-2 rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
              title={t('تحميل النص المستخرج', 'Download extracted text')}
            >
              <Download size={16} />
            </button>
            <button onClick={clearDocument} className="text-muted-foreground hover:text-destructive p-1">
              <X size={18} />
            </button>
          </div>

          {docMessage && (
            <div className="rounded-2xl border border-amber-300/60 bg-amber-50 dark:bg-amber-950/20 p-3 text-sm text-amber-900 dark:text-amber-200">
              {docMessage}
            </div>
          )}

          {docNotices.length > 0 && (
            <div className="rounded-2xl border border-blue-300/50 bg-blue-50 dark:bg-blue-950/20 p-3 text-xs text-blue-900 dark:text-blue-200 space-y-1">
              {docNotices.slice(0, 4).map((notice, index) => (
                <p key={`${notice}-${index}`}>{notice}</p>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-secondary text-muted-foreground">
                <Search size={16} />
              </div>
              <input
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                placeholder={t('ابحث داخل النص المستخرج...', 'Search inside the extracted text...')}
                disabled={!docText || docLoading}
                className="flex-1 px-3 py-2 rounded-xl bg-secondary/60 border border-border text-sm outline-none focus:ring-2 ring-primary disabled:opacity-60"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-foreground">{t('بحث بالصورة (OCR)', 'Image-Based Search (OCR)')}</p>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  {ocrLoading ? t('جاري OCR...', 'Running OCR...') : ''}
                </span>
              </div>
              <label className="relative flex items-center justify-center rounded-2xl border border-border bg-secondary/30 px-4 py-3 text-xs font-bold cursor-pointer hover:bg-secondary/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  disabled={ocrLoading}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer disabled:cursor-not-allowed"
                  onChange={event => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    void runOcrLookup(file);
                    event.currentTarget.value = '';
                  }}
                />
                <ScanText size={14} className="me-2" />
                {t('ارفع صورة صفحة أو فقرة للعثور على موضعها', 'Upload a page or paragraph image to find its place')}
              </label>
              {ocrMessage && (
                <div className="rounded-2xl border border-border bg-secondary/30 p-3 text-sm text-foreground">
                  {ocrMessage}
                </div>
              )}
              {ocrText && (
                <button
                  onClick={() => setIsOcrView(prev => !prev)}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border border-border bg-secondary/30 p-2 text-xs font-bold hover:bg-secondary/50 transition-colors"
                >
                  {isOcrView ? <EyeOff size={14} /> : <Eye size={14} />}
                  {isOcrView
                    ? t('إخفاء نص الصورة والعودة لنص المستند', 'Hide image text and return to document text')
                    : t('عرض نص الصورة (OCR) في الأسفل بدل نص الصفحة', 'Show the OCR image text below instead of the page text')}
                </button>
              )}
            </div>

            {normalizeWhitespace(searchQuery) && (
              <div className="text-xs text-muted-foreground font-semibold">
                {t('عدد النتائج', 'Results count')}: {computedResults.length}
              </div>
            )}

            {computedResults.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-auto pr-1">
                {computedResults.map((result, index) => {
                  const query = normalizeWhitespace(searchQuery);
                  const hitIndex = result.snippet.toLowerCase().indexOf(query.toLowerCase());
                  const before = hitIndex >= 0 ? result.snippet.slice(0, hitIndex) : result.snippet;
                  const match = hitIndex >= 0 ? result.snippet.slice(hitIndex, hitIndex + query.length) : '';
                  const after = hitIndex >= 0 ? result.snippet.slice(hitIndex + query.length) : '';

                  return (
                    <button
                      key={`${result.page}-${result.index}-${index}`}
                      onClick={() => { setActivePage(result.page); setIsOcrView(false); }}
                      className="w-full text-left rounded-2xl border border-border bg-card p-3 hover:bg-primary/5 transition"
                    >
                      <div className="text-[10px] text-primary font-bold mb-1">
                        {t('صفحة', 'Page')} {result.page} • #{result.index}
                      </div>
                      <div
                        className="text-sm text-foreground leading-relaxed"
                        style={
                          /[\u0600-\u06FF]/.test(result.snippet)
                            ? { direction: 'rtl', unicodeBidi: 'isolate', textAlign: 'right' }
                            : { direction: 'ltr', textAlign: 'left' }
                        }
                      >
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

          {previewUrl && imageSize && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-bold text-foreground text-sm">{t('تحديد مواقع الكلمات', 'Word Locations')}</p>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  {matchedImageWords.length} {t('مربع', 'boxes')}
                </span>
              </div>
              <div className="overflow-hidden rounded-2xl border border-border bg-card p-2">
                <div className="relative w-full">
                  <img src={previewUrl} alt="" className="w-full h-auto rounded-xl" />
                  <div className="absolute inset-0 pointer-events-none">
                    {matchedImageWords.map((word, index) => {
                      const width = imageSize.width || 1;
                      const height = imageSize.height || 1;
                      const left = (word.bbox.x0 / width) * 100;
                      const top = (word.bbox.y0 / height) * 100;
                      const boxWidth = ((word.bbox.x1 - word.bbox.x0) / width) * 100;
                      const boxHeight = ((word.bbox.y1 - word.bbox.y0) / height) * 100;
                      const isFocused = !!normalizeWhitespace(searchQuery);

                      return (
                        <div
                          key={`${word.text}-${index}`}
                          title={word.text}
                          className={`absolute rounded-sm border ${isFocused ? 'border-emerald-400 bg-emerald-400/20' : 'border-amber-400/60 bg-amber-300/10'}`}
                          style={{
                            left: `${left}%`,
                            top: `${top}%`,
                            width: `${Math.max(boxWidth, 1)}%`,
                            height: `${Math.max(boxHeight, 1)}%`,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {docPages.length > 0 && !docLoading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-bold text-foreground text-sm">
                  {isOcrView ? t('نص الصورة (OCR)', 'Image Text (OCR)') : t('عرض النص', 'Text Viewer')}
                </p>
                <div className="flex items-center gap-2">
                  {/* Font size controls */}
                  <button
                    onClick={() => setDocFontSize(s => (s === 'large' ? 'medium' : s === 'medium' ? 'small' : 'small'))}
                    disabled={docFontSize === 'small'}
                    className="p-1.5 rounded-lg bg-secondary disabled:opacity-40"
                    title={t('تصغير الخط', 'Smaller text')}
                  >
                    <ZoomOut size={14} />
                  </button>
                  <button
                    onClick={() => setDocFontSize(s => (s === 'small' ? 'medium' : s === 'medium' ? 'large' : 'large'))}
                    disabled={docFontSize === 'large'}
                    className="p-1.5 rounded-lg bg-secondary disabled:opacity-40"
                    title={t('تكبير الخط', 'Larger text')}
                  >
                    <ZoomIn size={14} />
                  </button>

                  {!isOcrView && (
                    <>
                      <button
                        onClick={() => setActivePage(current => Math.max(1, current - 1))}
                        disabled={activePage <= 1}
                        className="px-2 py-1 rounded-lg bg-secondary text-xs font-bold disabled:opacity-50"
                      >
                        {t('السابق', 'Prev')}
                      </button>
                      <span className="text-xs font-bold text-muted-foreground">
                        {activePage}/{docPages.length}
                      </span>
                      <button
                        onClick={() => setActivePage(current => Math.min(docPages.length, current + 1))}
                        disabled={activePage >= docPages.length}
                        className="px-2 py-1 rounded-lg bg-secondary text-xs font-bold disabled:opacity-50"
                      >
                        {t('التالي', 'Next')}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div
                ref={pageViewerRef}
                className={`p-8 bg-white dark:bg-dark-100 rounded-lg shadow-sm border border-border min-h-[500px] font-sans text-foreground leading-relaxed ${fontSizeClass}`}
              >
                {(() => {
                  if (!textToRender) return null;

                  // Step 1: split into logical lines/paragraphs.
                  const lines = textToRender.split('\n').filter(b => b.trim() !== '');

                  return lines.map((line, lineIndex) => {
                    // Step 2: within each line, split further into pure-Arabic /
                    // pure-non-Arabic runs so the two scripts NEVER share a
                    // visual line or text-direction.
                    const runs = splitIntoDirectionalRuns(line);

                    return (
                      <div key={lineIndex} className="mb-4 w-full">
                        {runs.map((run, runIndex) => (
                          <div
                            key={runIndex}
                            dir={run.isArabic ? 'rtl' : 'ltr'}
                            className={
                              run.isArabic
                                ? 'text-right w-full font-arabic'
                                : 'text-left w-full font-sans text-emerald-700 dark:text-emerald-400'
                            }
                          >
                            {searchQuery ? highlightText(run.text.trim(), searchQuery) : run.text.trim()}
                          </div>
                        ))}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentsViewer;
