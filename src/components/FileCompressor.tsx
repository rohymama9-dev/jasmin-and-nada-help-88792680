import { useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Download, X, Check } from 'lucide-react';

const FileCompressor = () => {
  const { lang } = useLang();
  const [tab, setTab] = useState<'image' | 'file'>('image');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [quality, setQuality] = useState(70);
  const [imageFormat, setImageFormat] = useState<'auto' | 'image/webp' | 'image/jpeg' | 'image/png'>('auto');
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleFile = (nextFile: File) => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(nextFile);
    setDone(false);
    setResultBlob(null);
    setResultSize(0);
    setStatusMessage(null);
    if (tab === 'image' && nextFile.type.startsWith('image/')) setPreview(URL.createObjectURL(nextFile));
    else setPreview(null);
  };

  const resetCurrentFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setDone(false);
    setPreview(null);
    setResultBlob(null);
    setResultSize(0);
    setStatusMessage(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const resolvedImageMime = (inputType: string) => {
    if (imageFormat !== 'auto') return imageFormat;
    if (inputType === 'image/png') return 'image/png';
    if (inputType === 'image/webp') return 'image/webp';
    return 'image/webp';
  };

  const imageExt = (mime: string) => {
    if (mime === 'image/png') return 'png';
    if (mime === 'image/jpeg') return 'jpg';
    return 'webp';
  };

  const compress = async () => {
    if (!file) return;
    setProcessing(true);
    setStatusMessage(null);

    try {
      if (file.type.startsWith('image/')) {
        const img = new Image();
        const url = URL.createObjectURL(file);
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = url;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context unavailable');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0);

        const outputType = resolvedImageMime(file.type);
        const outputQuality = outputType === 'image/png' ? undefined : quality / 100;
        const blob = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob(result => (result ? resolve(result) : reject(new Error('Compression failed'))), outputType, outputQuality),
        );

        setResultBlob(blob);
        setResultSize(blob.size);
        setDone(true);
        setStatusMessage(
          lang === 'ar'
            ? `تم ضغط الصورة محليًا وإخراجها بصيغة ${outputType.replace('image/', '').toUpperCase()}.`
            : `The image was compressed locally and exported as ${outputType.replace('image/', '').toUpperCase()}.`,
        );
        URL.revokeObjectURL(url);
      } else {
        if (!('CompressionStream' in window)) {
          setStatusMessage(
            lang === 'ar'
              ? 'هذا المتصفح لا يدعم ضغط الملفات العامة محليًا. جرّبي متصفحًا أحدث.'
              : 'This browser does not support local generic file compression. Try a newer browser.',
          );
          return;
        }

        const stream = file.stream().pipeThrough(new (window as any).CompressionStream('gzip'));
        const blob = await new Response(stream).blob();
        setResultBlob(blob);
        setResultSize(blob.size);
        setDone(true);
        setStatusMessage(
          lang === 'ar'
            ? 'تم ضغط الملف محليًا بصيغة GZ مع ترك الملف الأصلي كما هو.'
            : 'The file was compressed locally as GZ while leaving the original untouched.',
        );
      }
    } catch {
      setStatusMessage(
        lang === 'ar'
          ? 'تعذر ضغط هذا الملف حاليًا. جرّبي نسخة أوضح أو ملفًا محفوظًا بصيغة أصلية مستقرة.'
          : 'Could not compress this file right now. Try a cleaner copy or a more stable original format.',
      );
    } finally {
      setProcessing(false);
    }
  };

  const download = () => {
    if (!resultBlob || !file) return;
    const url = URL.createObjectURL(resultBlob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = file.type.startsWith('image/')
      ? `compressed_${file.name.replace(/\.[^.]+$/, '')}.${imageExt(resolvedImageMime(file.type))}`
      : `compressed_${file.name}.gz`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="space-y-0">
      <div className="rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 p-5 text-white text-center mb-4">
        <div className="text-4xl mb-2">🗜️</div>
        <h2 className="text-xl font-extrabold">{lang === 'ar' ? 'ضغط الملفات والصور' : 'Compress Files and Images'}</h2>
        <p className="text-white/80 text-xs mt-1">{lang === 'ar' ? 'ضغط مجاني أوفلاين بجودة عالية' : 'Free offline high quality compression'}</p>
      </div>

      <div className="flex bg-secondary rounded-xl p-1 mb-4">
        {[
          { id: 'image', emoji: '📸', ar: 'صور', en: 'Images' },
          { id: 'file', emoji: '📄', ar: 'ملفات', en: 'Files' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => {
              setTab(item.id as 'image' | 'file');
              resetCurrentFile();
            }}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1 ${tab === item.id ? 'bg-blue-500 text-white shadow' : 'text-muted-foreground'}`}
          >
            <span>{item.emoji}</span> {lang === 'ar' ? item.ar : item.en}
          </button>
        ))}
      </div>

      {!file ? (
        <label className="relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20 p-10 cursor-pointer hover:bg-blue-100/50 transition-colors">
          <input
            type="file"
            accept={tab === 'image' ? 'image/*' : '*/*'}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            onChange={event => event.target.files?.[0] && handleFile(event.target.files[0])}
          />
          <div className="text-5xl mb-3">📁</div>
          <p className="font-extrabold text-blue-700 dark:text-blue-300 text-center text-base">
            {lang === 'ar' ? 'ارفع ملفك هنا' : 'Upload your file here'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {tab === 'image'
              ? (lang === 'ar' ? 'JPG · PNG · WebP · GIF' : 'JPG · PNG · WebP · GIF')
              : (lang === 'ar' ? 'كل أنواع الملفات بما فيها DOCX' : 'All file types including DOCX')}
          </p>
        </label>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-secondary/60 rounded-2xl p-3 border border-border">
            {preview
              ? <img src={preview} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" alt="" />
              : <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-2xl flex-shrink-0">📄</div>}
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate text-foreground text-sm">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
            </div>
            <button
              onClick={resetCurrentFile}
              className="text-muted-foreground hover:text-destructive p-1 rounded-lg hover:bg-secondary transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {tab === 'image' && (
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm">{lang === 'ar' ? 'جودة الإخراج' : 'Output Quality'}</span>
                <span className="text-blue-600 font-extrabold text-xl">{quality}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={95}
                value={quality}
                onChange={event => setQuality(Number(event.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: lang === 'ar' ? 'صغير الحجم' : 'Small', value: 30 },
                  { label: lang === 'ar' ? 'متوازن' : 'Balanced', value: 60 },
                  { label: lang === 'ar' ? 'عالي الجودة' : 'High Quality', value: 85 },
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setQuality(option.value)}
                    className={`py-1.5 rounded-xl text-xs font-bold border transition-colors ${quality === option.value ? 'bg-blue-500 text-white border-blue-500' : 'border-border text-muted-foreground hover:border-blue-300'}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: lang === 'ar' ? 'تلقائي' : 'Auto', value: 'auto' as const },
                  { label: 'WebP', value: 'image/webp' as const },
                  { label: 'JPG', value: 'image/jpeg' as const },
                  { label: 'PNG', value: 'image/png' as const },
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setImageFormat(option.value)}
                    className={`py-1.5 rounded-xl text-xs font-bold border transition-colors ${imageFormat === option.value ? 'bg-cyan-500 text-white border-cyan-500' : 'border-border text-muted-foreground hover:border-cyan-300'}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {statusMessage && (
            <div className="rounded-2xl border border-border bg-secondary/40 p-3 text-sm text-foreground">
              {statusMessage}
            </div>
          )}

          {done && resultBlob && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-4 text-center space-y-3">
              <Check size={32} className="text-emerald-500 mx-auto" />
              <p className="font-extrabold text-emerald-800 dark:text-emerald-300 text-base">
                {lang === 'ar' ? 'تم الضغط بنجاح! 🎉' : 'Compressed successfully! 🎉'}
              </p>
              <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                {formatSize(file.size)} → <strong>{formatSize(resultSize)}</strong>
                {' '}({Math.max(0, Math.round((1 - resultSize / file.size) * 100))}% {lang === 'ar' ? 'توفير' : 'saved'})
              </p>
              <button
                onClick={download}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Download size={18} /> {lang === 'ar' ? 'تحميل الملف المضغوط' : 'Download Compressed File'}
              </button>
            </div>
          )}

          {!done && (
            <button
              onClick={compress}
              disabled={processing}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-extrabold text-base shadow-lg disabled:opacity-50 active:scale-95 transition-all"
            >
              {processing
                ? (lang === 'ar' ? '⚙️ جاري الضغط...' : '⚙️ Compressing...')
                : (lang === 'ar' ? '🗜️ ابدأ الضغط الآن' : '🗜️ Compress Now')}
            </button>
          )}

          {done && (
            <button
              onClick={resetCurrentFile}
              className="w-full py-3 rounded-xl border border-border text-muted-foreground font-bold hover:bg-secondary transition-colors"
            >
              {lang === 'ar' ? '+ ضغط ملف آخر' : '+ Compress another file'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FileCompressor;
