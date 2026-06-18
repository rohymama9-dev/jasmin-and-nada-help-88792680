import { useEffect, useMemo, useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Download, X, Check, PlayCircle, FileText, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = workerSrc;

const getUsesKey = () => {
  const d = new Date();
  return `app-formatconverter-uses-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};
const getMaxUsesKey = () => {
  const d = new Date();
  return `app-formatconverter-maxuses-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};
const DEFAULT_MAX_USES = 5;

const IMAGE_FORMATS = [
  { value: 'image/webp', label: 'WebP', ext: 'webp' },
  { value: 'image/jpeg', label: 'JPG', ext: 'jpg' },
  { value: 'image/png', label: 'PNG', ext: 'png' },
];

const FormatConverter = () => {
  const { lang } = useLang();
  const [uses, setUses] = useState(0);
  const [maxUses, setMaxUses] = useState(DEFAULT_MAX_USES);
  const [category, setCategory] = useState<'image' | 'document' | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [targetFormat, setTargetFormat] = useState('image/webp');
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultKind, setResultKind] = useState<'image' | 'txt' | null>(null);
  const [watchingAd, setWatchingAd] = useState(false);

  useEffect(() => {
    setUses(Number(localStorage.getItem(getUsesKey()) || 0));
    setMaxUses(Number(localStorage.getItem(getMaxUsesKey()) || DEFAULT_MAX_USES));
  }, [category, lang]);

  const recordUse = () => {
    const n = uses + 1; setUses(n);
    localStorage.setItem(getUsesKey(), n.toString());
  };

  const watchAd = () => {
    setWatchingAd(true);
    setTimeout(() => {
      setWatchingAd(false);
      const nm = maxUses + 1; setMaxUses(nm);
      localStorage.setItem(getMaxUsesKey(), nm.toString());
      toast.success(lang === 'ar' ? 'تمت إضافة محاولة! 🎉' : '+1 use added! 🎉');
    }, 3000);
  };

  const handleFile = (f: File) => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(f); setDone(false); setResultBlob(null); setResultKind(null);
    if (f.type.startsWith('image/')) setPreview(URL.createObjectURL(f));
    else setPreview(null);
  };

  const limitReached = uses >= maxUses;

  const normalizeWhitespace = (s: string) => s.replace(/\s+/g, ' ').trim();

  const normalizeArabicText = (text: string): string => {
    if (!text) return '';
    let cleaned = text.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, '');
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
    if (!arabicRegex.test(cleaned)) return normalizeWhitespace(cleaned);
    cleaned = cleaned.replace(/([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF])\s+([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF])/g, '$1$2');
    return normalizeWhitespace(cleaned);
  };

  const extractPdfText = async (f: File) => {
    const buf = await f.arrayBuffer();
    const loadingTask = getDocument({
      data: new Uint8Array(buf),
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/standard_fonts/',
    });
    const pdf = await loadingTask.promise;
    const pages: string[] = [];
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      let pageText = '';
      let lastY = -1;
      for (const item of content.items as any[]) {
        if (!item.str) continue;
        if (lastY !== -1 && Math.abs(item.transform[5] - lastY) > 5) pageText += ' ';
        else if (lastY !== -1 && item.hasEOL) pageText += ' ';
        const cleanStr = String(item.str).replace(/[\u200B-\u200D\uFEFF]/g, '');
        pageText += cleanStr;
        lastY = item.transform[5];
      }
      pages.push(normalizeArabicText(pageText));
    }
    return pages.join('\n');
  };

  const convert = async () => {
    if (!file || limitReached || !category) return;
    setProcessing(true);
    try {
      if (category === 'image') {
        if (!file.type.startsWith('image/')) {
          toast.error(lang === 'ar' ? 'الرجاء اختيار صورة' : 'Please choose an image');
          return;
        }
        const img = new Image();
        const url = URL.createObjectURL(file);
        await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; img.src = url; });
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0);
        const blob = await new Promise<Blob>((res, rej) =>
          canvas.toBlob(b => b ? res(b) : rej(new Error('Failed')), targetFormat, 0.95)
        );
        setResultBlob(blob); setResultKind('image'); recordUse(); setDone(true);
        URL.revokeObjectURL(url);
      } else if (category === 'document') {
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        const text = isPdf ? await extractPdfText(file) : normalizeWhitespace(await file.text());
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        setResultBlob(blob);
        setResultKind('txt');
        recordUse();
        setDone(true);
      }
    } catch (error) { 
      console.error('Conversion error:', error);
      toast.error(lang === 'ar' ? 'حدث خطأ أثناء التحويل' : 'Conversion error'); 
    }
    finally { setProcessing(false); }
  };

  const getExt = () => {
    if (resultKind === 'txt') return '.txt';
    return '.' + (IMAGE_FORMATS.find(f => f.value === targetFormat)?.ext || 'webp');
  };

  const download = () => {
    if (!resultBlob || !file) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a'); a.href = url;
    a.download = `converted_${file.name.replace(/\.[^.]+$/, '')}${getExt()}`;
    a.click(); URL.revokeObjectURL(url);
  };

  // Category selection screen
  if (!category) {
    return (
      <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-purple-600 to-violet-500 p-5 text-white text-center">
          <div className="text-4xl mb-2">🔄</div>
          <h2 className="text-xl font-extrabold">{lang === 'ar' ? 'محول الصيغ الشامل' : 'Universal Format Converter'}</h2>
          <p className="text-white/80 text-xs mt-1">{lang === 'ar' ? 'حول ملفاتك لأي صيغة تريدها' : 'Convert your files to any format'}</p>
          <div className="mt-2 inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 text-xs font-bold">
            {uses}/{maxUses} {lang === 'ar' ? 'محاولة اليوم' : 'uses today'}
          </div>
        </div>

        {limitReached && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-2xl p-4 text-center space-y-3">
            <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">
              ⏳ {lang === 'ar' ? 'استنفدت محاولاتك اليوم!' : 'Daily limit reached!'}
            </p>
            <button onClick={watchAd} disabled={watchingAd}
              className="mx-auto flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold disabled:opacity-60">
              <PlayCircle size={14} />
              {watchingAd ? (lang === 'ar' ? 'جاري العرض...' : 'Watching...') : (lang === 'ar' ? 'شاهد إعلاناً (+1 محاولة)' : 'Watch Ad (+1 use)')}
            </button>
          </div>
        )}

        <p className="font-bold text-foreground text-sm px-1">{lang === 'ar' ? 'اختر نوع التحويل:' : 'Choose conversion type:'}</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => !limitReached && setCategory('image')}
            disabled={limitReached}
            className={`relative rounded-2xl p-4 text-start border transition-all ${
              limitReached ? 'opacity-50 cursor-not-allowed border-border bg-secondary/30' : 'border-border bg-card hover:border-purple-300 hover:shadow-md active:scale-95'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-2 text-xl">
              🖼️
            </div>
            <p className="font-bold text-foreground text-xs leading-tight">{lang === 'ar' ? 'تحويل الصور' : 'Image Conversion'}</p>
            <p className="text-muted-foreground text-[10px] mt-0.5">{lang === 'ar' ? 'تحويل إلى WebP / JPG / PNG' : 'Convert to WebP / JPG / PNG'}</p>
          </button>

          <button
            onClick={() => !limitReached && setCategory('document')}
            disabled={limitReached}
            className={`relative rounded-2xl p-4 text-start border transition-all ${
              limitReached ? 'opacity-50 cursor-not-allowed border-border bg-secondary/30' : 'border-border bg-card hover:border-purple-300 hover:shadow-md active:scale-95'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-2 text-xl">
              📄
            </div>
            <p className="font-bold text-foreground text-xs leading-tight">{lang === 'ar' ? 'تحويل المستندات' : 'Document Conversion'}</p>
            <p className="text-muted-foreground text-[10px] mt-0.5">{lang === 'ar' ? 'PDF أو TXT → TXT' : 'PDF or TXT → TXT'}</p>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="space-y-4">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button onClick={() => { setCategory(null); setFile(null); setDone(false); setResultBlob(null); }}
          className="text-purple-600 font-bold text-sm flex items-center gap-1">
          {lang === 'ar' ? '→ رجوع' : '← Back'}
        </button>
        <div className={`flex-1 rounded-2xl bg-gradient-to-r ${category === 'image' ? 'from-emerald-400 to-teal-500' : 'from-amber-400 to-orange-500'} px-3 py-2 text-white font-bold text-sm flex items-center gap-2`}>
          {category === 'image' ? <ImageIcon size={16} /> : <FileText size={16} />}
          <span>{category === 'image' ? (lang === 'ar' ? 'تحويل الصور' : 'Image Conversion') : (lang === 'ar' ? 'تحويل المستندات' : 'Document Conversion')}</span>
        </div>
      </div>

      {/* Daily limit */}
      {limitReached && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-2xl p-4 text-center space-y-3">
          <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">
            ⏳ {lang === 'ar' ? 'استنفدت المحاولات!' : 'Daily limit reached!'}
          </p>
          <button onClick={watchAd} disabled={watchingAd}
            className="mx-auto flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold disabled:opacity-60">
            <PlayCircle size={14} />
            {watchingAd ? (lang === 'ar' ? 'جاري العرض...' : 'Watching...') : (lang === 'ar' ? 'شاهد إعلاناً (+1)' : 'Watch Ad (+1)')}
          </button>
        </div>
      )}

      {/* Upload */}
      {!file ? (
        <label className="relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/20 p-10 cursor-pointer hover:bg-purple-100/40 transition-colors">
          <input type="file"
            accept={category === 'image' ? 'image/*' : '.pdf,application/pdf,.txt,text/plain'}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <div className="text-5xl mb-3">{category === 'image' ? '🖼️' : '📄'}</div>
          <p className="font-extrabold text-purple-700 dark:text-purple-300 text-base text-center">
            {lang === 'ar' ? 'ارفع ملفك هنا' : 'Upload your file here'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {category === 'image'
              ? (lang === 'ar' ? 'تحويل إلى WebP / JPG / PNG' : 'Convert to WebP / JPG / PNG')
              : (lang === 'ar' ? 'PDF أو TXT → TXT' : 'PDF or TXT → TXT')}
          </p>
        </label>
      ) : (
        <div className="space-y-4">
          {/* File info */}
          <div className="flex items-center gap-3 bg-secondary/60 rounded-2xl p-3 border border-border">
            {preview
              ? <img src={preview} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" alt="" />
              : <div className="w-14 h-14 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-2xl flex-shrink-0">{category === 'image' ? '🖼️' : '📄'}</div>}
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate text-foreground text-sm">{file.name}</p>
              <p className="text-xs text-muted-foreground">{file.type || 'unknown'}</p>
            </div>
            <button onClick={() => { setFile(null); setDone(false); setPreview(null); setResultBlob(null); }}
              className="text-muted-foreground hover:text-destructive p-1"><X size={18} /></button>
          </div>

          {/* Format selection (image only) */}
          {category === 'image' && (
            <div className="space-y-2">
              <p className="font-bold text-sm text-foreground">{lang === 'ar' ? 'الصيغة المطلوبة:' : 'Target format:'}</p>
              <div className="grid grid-cols-3 gap-2">
                {IMAGE_FORMATS.map(f => (
                  <button key={f.value} onClick={() => setTargetFormat(f.value)}
                    className={`py-2 rounded-xl text-sm font-bold border transition-colors ${targetFormat === f.value ? 'bg-purple-500 text-white border-purple-500' : 'border-border text-muted-foreground hover:border-purple-300'}`}>
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="text-[11px] text-muted-foreground font-semibold">
                {lang === 'ar' ? 'خيار تحويل إلى WebP متاح.' : 'Convert to WebP is available.'}
              </div>
            </div>
          )}

          {/* Result */}
          {done && resultBlob && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-4 text-center space-y-3">
              <Check size={32} className="text-emerald-500 mx-auto" />
              <p className="font-extrabold text-emerald-800 dark:text-emerald-300">
                {lang === 'ar' ? 'تم التحويل بنجاح! 🎉' : 'Converted successfully! 🎉'}
              </p>
              <button onClick={download}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                <Download size={18} /> {lang === 'ar' ? 'تحميل الملف المحوّل' : 'Download Converted File'}
              </button>
            </div>
          )}

          {!done && (
            <button onClick={() => convert()} disabled={processing || limitReached}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-violet-500 text-white font-extrabold text-base shadow-lg disabled:opacity-50 active:scale-95 transition-all">
              {processing
                ? (lang === 'ar' ? '⚙️ جاري التحويل...' : '⚙️ Converting...')
                : (lang === 'ar'
                  ? category === 'image'
                    ? `🔄 تحويل إلى ${IMAGE_FORMATS.find(f => f.value === targetFormat)?.label || 'WebP'}`
                    : '🔄 استخراج النص (TXT)'
                  : category === 'image'
                    ? `🔄 Convert to ${IMAGE_FORMATS.find(f => f.value === targetFormat)?.label || 'WebP'}`
                    : '🔄 Extract Text (TXT)')}
            </button>
          )}

          {done && (
            <button onClick={() => { setFile(null); setDone(false); setPreview(null); setResultBlob(null); }}
              className="w-full py-3 rounded-xl border border-border text-muted-foreground font-bold hover:bg-secondary transition-colors">
              {lang === 'ar' ? '+ تحويل ملف آخر' : '+ Convert another file'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FormatConverter;
