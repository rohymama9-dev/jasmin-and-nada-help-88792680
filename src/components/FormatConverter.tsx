import { useState, useEffect } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Download, X, Check, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';

const getUsesKey = () => {
  const d = new Date();
  return `app-formatconverter-uses-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};
const getMaxUsesKey = () => {
  const d = new Date();
  return `app-formatconverter-maxuses-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};
const DEFAULT_MAX_USES = 5;

const CATEGORIES = [
  { id: 'image', emoji: '🖼️', ar: 'تحويل الصور', en: 'Image Conversion', desc_ar: 'JPG ↔ PNG ↔ WebP', desc_en: 'JPG ↔ PNG ↔ WebP', color: 'from-emerald-400 to-teal-500', border: 'border-emerald-200', soon: false },
  { id: 'file', emoji: '📄', ar: 'ضغط الملفات', en: 'File to GZ', desc_ar: 'تحويل أي ملف إلى GZ', desc_en: 'Convert any file to GZ', color: 'from-blue-400 to-indigo-500', border: 'border-blue-200', soon: false },
  { id: 'audio', emoji: '🎵', ar: 'تحويل الصوت', en: 'Audio', desc_ar: 'قريباً', desc_en: 'Coming soon', color: 'from-purple-400 to-violet-500', border: 'border-purple-200', soon: true },
  { id: 'video', emoji: '🎬', ar: 'تحويل الفيديو', en: 'Video', desc_ar: 'قريباً', desc_en: 'Coming soon', color: 'from-rose-400 to-pink-500', border: 'border-rose-200', soon: true },
  { id: 'doc', emoji: '📑', ar: 'المستندات', en: 'Documents', desc_ar: 'قريباً', desc_en: 'Coming soon', color: 'from-amber-400 to-orange-500', border: 'border-amber-200', soon: true },
  { id: 'ebook', emoji: '📚', ar: 'الكتب الإلكترونية', en: 'Ebooks', desc_ar: 'قريباً', desc_en: 'Coming soon', color: 'from-cyan-400 to-sky-500', border: 'border-cyan-200', soon: true },
];

const IMAGE_FORMATS = [
  { value: 'image/webp', label: 'WebP', ext: 'webp' },
  { value: 'image/jpeg', label: 'JPG', ext: 'jpg' },
  { value: 'image/png', label: 'PNG', ext: 'png' },
];

const FormatConverter = () => {
  const { lang } = useLang();
  const [uses, setUses] = useState(0);
  const [maxUses, setMaxUses] = useState(DEFAULT_MAX_USES);
  const [category, setCategory] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [targetFormat, setTargetFormat] = useState('image/webp');
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [watchingAd, setWatchingAd] = useState(false);

  useEffect(() => {
    setUses(Number(localStorage.getItem(getUsesKey()) || 0));
    setMaxUses(Number(localStorage.getItem(getMaxUsesKey()) || DEFAULT_MAX_USES));
  }, []);

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
    setFile(f); setDone(false); setResultBlob(null);
    if (f.type.startsWith('image/')) setPreview(URL.createObjectURL(f));
    else setPreview(null);
  };

  const limitReached = uses >= maxUses;

  const convert = async () => {
    if (!file || limitReached) return;
    setProcessing(true);
    try {
      if (category === 'image' && file.type.startsWith('image/')) {
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
        setResultBlob(blob); recordUse(); setDone(true);
        URL.revokeObjectURL(url);
      } else if (category === 'file') {
        if (!('CompressionStream' in window)) {
          toast.error(lang === 'ar' ? 'المتصفح لا يدعم الضغط' : 'Browser does not support compression');
          return;
        }
        const stream = file.stream().pipeThrough(new (window as any).CompressionStream('gzip'));
        const blob = await new Response(stream).blob();
        setResultBlob(blob); recordUse(); setDone(true);
      }
    } catch { toast.error(lang === 'ar' ? 'حدث خطأ أثناء التحويل' : 'Conversion error'); }
    finally { setProcessing(false); }
  };

  const getExt = () => {
    if (category === 'file') return '.gz';
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
          {CATEGORIES.map(cat => (
            <button key={cat.id}
              onClick={() => !cat.soon && !limitReached && setCategory(cat.id)}
              disabled={cat.soon || limitReached}
              className={`relative rounded-2xl p-4 text-start border transition-all ${
                cat.soon || limitReached
                  ? 'opacity-50 cursor-not-allowed border-border bg-secondary/30'
                  : 'border-border bg-card hover:border-purple-300 hover:shadow-md active:scale-95'
              }`}>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-2 text-xl`}>
                {cat.emoji}
              </div>
              <p className="font-bold text-foreground text-xs leading-tight">
                {lang === 'ar' ? cat.ar : cat.en}
              </p>
              <p className="text-muted-foreground text-[10px] mt-0.5">
                {lang === 'ar' ? cat.desc_ar : cat.desc_en}
              </p>
              {cat.soon && (
                <span className="absolute top-2 left-2 bg-secondary text-muted-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  {lang === 'ar' ? 'قريباً' : 'Soon'}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Converter screen
  const catInfo = CATEGORIES.find(c => c.id === category)!;

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="space-y-4">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button onClick={() => { setCategory(null); setFile(null); setDone(false); setResultBlob(null); }}
          className="text-purple-600 font-bold text-sm flex items-center gap-1">
          {lang === 'ar' ? '→ رجوع' : '← Back'}
        </button>
        <div className={`flex-1 rounded-2xl bg-gradient-to-r ${catInfo.color} px-3 py-2 text-white font-bold text-sm flex items-center gap-2`}>
          <span>{catInfo.emoji}</span>
          <span>{lang === 'ar' ? catInfo.ar : catInfo.en}</span>
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
            accept={category === 'image' ? 'image/*' : '*/*'}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <div className="text-5xl mb-3">{catInfo.emoji}</div>
          <p className="font-extrabold text-purple-700 dark:text-purple-300 text-base text-center">
            {lang === 'ar' ? 'ارفع ملفك هنا' : 'Upload your file here'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {category === 'image'
              ? (lang === 'ar' ? 'JPG · PNG · WebP · GIF · BMP' : 'JPG · PNG · WebP · GIF · BMP')
              : (lang === 'ar' ? 'كل أنواع الملفات' : 'All file types')}
          </p>
        </label>
      ) : (
        <div className="space-y-4">
          {/* File info */}
          <div className="flex items-center gap-3 bg-secondary/60 rounded-2xl p-3 border border-border">
            {preview
              ? <img src={preview} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" alt="" />
              : <div className="w-14 h-14 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-2xl flex-shrink-0">{catInfo.emoji}</div>}
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
            <button onClick={convert} disabled={processing || limitReached}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-violet-500 text-white font-extrabold text-base shadow-lg disabled:opacity-50 active:scale-95 transition-all">
              {processing
                ? (lang === 'ar' ? '⚙️ جاري التحويل...' : '⚙️ Converting...')
                : (lang === 'ar' ? `🔄 حوّل إلى ${IMAGE_FORMATS.find(f => f.value === targetFormat)?.label || 'GZ'}` : `🔄 Convert Now`)}
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
