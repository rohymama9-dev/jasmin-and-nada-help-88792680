import { useState, useEffect, useRef } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Download, X, Check, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const getUsesKey = () => {
  const d = new Date();
  return `app-filecompressor-uses-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};
const getMaxUsesKey = () => {
  const d = new Date();
  return `app-filecompressor-maxuses-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};
const DEFAULT_MAX_USES = 3;

const FileCompressor = () => {
  const { lang } = useLang();
  const [uses, setUses] = useState(0);
  const [maxUses, setMaxUses] = useState(DEFAULT_MAX_USES);
  const [tab, setTab] = useState<'image' | 'file' | 'video'>('image');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [quality, setQuality] = useState(70);
  const [videoQuality, setVideoQuality] = useState<'small' | 'balanced' | 'high'>('balanced');
  const ffmpegRef = useRef(new FFmpeg());
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [watchingAd, setWatchingAd] = useState(false);

  useEffect(() => {
    setUses(Number(localStorage.getItem(getUsesKey()) || 0));
    setMaxUses(Number(localStorage.getItem(getMaxUsesKey()) || DEFAULT_MAX_USES));
  }, []);

  useEffect(() => {
    if (tab !== 'video' || ffmpegLoaded) return;
    let cancelled = false;

    const load = async () => {
      const ffmpeg = ffmpegRef.current;
      try {
        ffmpeg.on('progress', ({ progress }) => {
          if (cancelled) return;
          const pct = Math.max(0, Math.min(100, Math.round(progress * 100)));
          setVideoProgress(pct);
        });
        await ffmpeg.load({
          coreURL: await toBlobURL('https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js', 'text/javascript'),
          wasmURL: await toBlobURL('https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm', 'application/wasm'),
        });
        if (!cancelled) setFfmpegLoaded(true);
      } catch {
        if (!cancelled) toast.error(lang === 'ar' ? 'فشل تحميل FFmpeg' : 'Failed to load FFmpeg');
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [tab, ffmpegLoaded, lang]);

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
    setFile(f); setDone(false); setResultBlob(null); setResultSize(0);
    if (tab === 'image' && f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f));
    } else if (tab === 'video' && f.type.startsWith('video/')) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
    setVideoProgress(0);
  };

  const formatSize = (b: number) => {
    if (b < 1024) return `${b} B`;
    if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1048576).toFixed(1)} MB`;
  };

  const compress = async () => {
    if (!file || uses >= maxUses) return;
    setProcessing(true);
    try {
      if (tab === 'video') {
        if (!ffmpegLoaded) {
          toast.error(lang === 'ar' ? 'FFmpeg لم يتم تحميله بعد' : 'FFmpeg not loaded yet');
          return;
        }
        if (!file.type.startsWith('video/')) {
          toast.error(lang === 'ar' ? 'الرجاء اختيار ملف فيديو' : 'Please choose a video file');
          return;
        }

        const ffmpeg = ffmpegRef.current;
        const ext = (file.name.split('.').pop() || '').toLowerCase();
        const inputName = ext ? `input.${ext}` : 'input.mp4';
        const outputName = 'output.mp4';

        const map = {
          small: { crf: '26', preset: 'veryfast', audio: '128k' },
          balanced: { crf: '23', preset: 'medium', audio: '160k' },
          high: { crf: '20', preset: 'slow', audio: '192k' },
        } as const;

        setVideoProgress(0);
        try { await ffmpeg.deleteFile(inputName); } catch {}
        try { await ffmpeg.deleteFile(outputName); } catch {}
        await ffmpeg.writeFile(inputName, await fetchFile(file));
        await ffmpeg.exec([
          '-i', inputName,
          '-map', '0',
          '-c:v', 'libx264',
          '-preset', map[videoQuality].preset,
          '-crf', map[videoQuality].crf,
          '-pix_fmt', 'yuv420p',
          '-c:a', 'aac',
          '-b:a', map[videoQuality].audio,
          '-movflags', '+faststart',
          outputName,
        ]);
        const data = await ffmpeg.readFile(outputName);
        const blob = new Blob([data], { type: 'video/mp4' });
        setResultBlob(blob); setResultSize(blob.size); recordUse(); setDone(true);
        try { await ffmpeg.deleteFile(inputName); } catch {}
        try { await ffmpeg.deleteFile(outputName); } catch {}
      } else if (file.type.startsWith('image/')) {
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
          canvas.toBlob(b => b ? res(b) : rej(new Error('Failed')), 'image/jpeg', quality / 100)
        );
        setResultBlob(blob); setResultSize(blob.size); recordUse(); setDone(true);
        URL.revokeObjectURL(url);
      } else {
        if (!('CompressionStream' in window)) {
          toast.error(lang === 'ar' ? 'المتصفح لا يدعم الضغط' : 'Browser does not support compression');
          return;
        }
        const stream = file.stream().pipeThrough(new (window as any).CompressionStream('gzip'));
        const blob = await new Response(stream).blob();
        setResultBlob(blob); setResultSize(blob.size); recordUse(); setDone(true);
      }
    } catch { toast.error(lang === 'ar' ? 'حدث خطأ أثناء الضغط' : 'Compression error'); }
    finally { setProcessing(false); }
  };

  const download = () => {
    if (!resultBlob || !file) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a'); a.href = url;
    a.download = file.type.startsWith('image/')
      ? `compressed_${file.name.replace(/\.[^.]+$/, '')}.jpg`
      : file.type.startsWith('video/')
        ? `compressed_${file.name.replace(/\.[^.]+$/, '')}.mp4`
      : `compressed_${file.name}.gz`;
    a.click(); URL.revokeObjectURL(url);
  };

  const limitReached = uses >= maxUses;

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="space-y-0">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 p-5 text-white text-center mb-4">
        <div className="text-4xl mb-2">🗜️</div>
        <h2 className="text-xl font-extrabold">{lang === 'ar' ? 'ضغط الملفات والصور والفيديوهات' : 'Compress Files, Images, and Videos'}</h2>
        <p className="text-white/80 text-xs mt-1">{lang === 'ar' ? 'ضغط مجاني أوفلاين بجودة عالية' : 'Free offline high quality compression'}</p>
        <div className="mt-3 inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 text-xs font-bold">
          <span>{uses}/{maxUses} {lang === 'ar' ? 'محاولة اليوم' : 'uses today'}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-secondary rounded-xl p-1 mb-4">
        {[
          { id: 'image', emoji: '📸', ar: 'صور', en: 'Images' },
          { id: 'file', emoji: '📄', ar: 'ملفات', en: 'Files' },
          { id: 'video', emoji: '🎬', ar: 'فيديو', en: 'Video' },
        ].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id as any); setFile(null); setDone(false); setPreview(null); }}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1 ${tab === t.id ? 'bg-blue-500 text-white shadow' : 'text-muted-foreground'}`}>
            <span>{t.emoji}</span> {lang === 'ar' ? t.ar : t.en}
          </button>
        ))}
      </div>

      {/* Daily limit warning */}
      {limitReached && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-2xl p-4 text-center space-y-3 mb-4">
          <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">
            ⏳ {lang === 'ar' ? 'استنفدت محاولاتك اليوم!' : 'Daily limit reached!'}
          </p>
          <button onClick={watchAd} disabled={watchingAd}
            className="mx-auto flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold disabled:opacity-60">
            <PlayCircle size={14} />
            {watchingAd ? (lang === 'ar' ? 'جاري عرض الإعلان...' : 'Watching...') : (lang === 'ar' ? 'شاهد إعلاناً (+1 محاولة)' : 'Watch Ad (+1 use)')}
          </button>
        </div>
      )}

      {!file ? (
        <label className="relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20 p-10 cursor-pointer hover:bg-blue-100/50 transition-colors">
          <input type="file" accept={tab === 'image' ? 'image/*' : tab === 'video' ? 'video/*' : '*/*'} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <div className="text-5xl mb-3">📁</div>
          <p className="font-extrabold text-blue-700 dark:text-blue-300 text-center text-base">
            {lang === 'ar' ? 'ارفع ملفك هنا' : 'Upload your file here'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {tab === 'image'
              ? (lang === 'ar' ? 'JPG · PNG · WebP · GIF' : 'JPG · PNG · WebP · GIF')
              : tab === 'video'
                ? (lang === 'ar' ? 'MP4 · MOV · WebM وأكثر' : 'MP4 · MOV · WebM and more')
              : (lang === 'ar' ? 'كل أنواع الملفات' : 'All file types')}
          </p>
        </label>
      ) : (
        <div className="space-y-4">
          {/* File Info */}
          <div className="flex items-center gap-3 bg-secondary/60 rounded-2xl p-3 border border-border">
            {preview
              ? <img src={preview} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" alt="" />
              : <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-2xl flex-shrink-0">📄</div>}
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate text-foreground text-sm">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
            </div>
            <button onClick={() => { setFile(null); setDone(false); setPreview(null); setResultBlob(null); }}
              className="text-muted-foreground hover:text-destructive p-1 rounded-lg hover:bg-secondary transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Video Quality */}
          {tab === 'video' && (
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">{lang === 'ar' ? 'جودة ضغط الفيديو' : 'Video compression quality'}</span>
                <span className="text-blue-600 font-extrabold text-sm">
                  {lang === 'ar'
                    ? (videoQuality === 'small' ? 'حجم أصغر' : videoQuality === 'balanced' ? 'متوازن' : 'عالي الجودة')
                    : (videoQuality === 'small' ? 'Smaller' : videoQuality === 'balanced' ? 'Balanced' : 'High')}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { v: 'small', ar: 'حجم أصغر', en: 'Smaller' },
                  { v: 'balanced', ar: 'متوازن', en: 'Balanced' },
                  { v: 'high', ar: 'عالي', en: 'High' },
                ].map(p => (
                  <button key={p.v} onClick={() => setVideoQuality(p.v as any)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors ${videoQuality === p.v ? 'bg-blue-500 text-white border-blue-500' : 'border-border text-muted-foreground hover:border-blue-300'}`}>
                    {lang === 'ar' ? p.ar : p.en}
                  </button>
                ))}
              </div>
              {!ffmpegLoaded && (
                <div className="text-xs text-muted-foreground font-semibold">
                  {lang === 'ar' ? '⏳ جارٍ تجهيز محرّك ضغط الفيديو...' : '⏳ Preparing video engine...'}
                </div>
              )}
              {processing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                    <span>{lang === 'ar' ? 'التقدم' : 'Progress'}</span>
                    <span>{videoProgress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all" style={{ width: `${videoProgress}%` }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quality Slider */}
          {tab === 'image' && (
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm">{lang === 'ar' ? 'جودة الإخراج' : 'Output Quality'}</span>
                <span className="text-blue-600 font-extrabold text-xl">{quality}%</span>
              </div>
              <input type="range" min={10} max={95} value={quality} onChange={e => setQuality(Number(e.target.value))}
                className="w-full accent-blue-500" />
              <div className="grid grid-cols-3 gap-2">
                {[{ l: lang === 'ar' ? 'صغير الحجم' : 'Small', v: 30 }, { l: lang === 'ar' ? 'متوازن' : 'Balanced', v: 60 }, { l: lang === 'ar' ? 'عالي الجودة' : 'High Quality', v: 85 }].map(p => (
                  <button key={p.v} onClick={() => setQuality(p.v)}
                    className={`py-1.5 rounded-xl text-xs font-bold border transition-colors ${quality === p.v ? 'bg-blue-500 text-white border-blue-500' : 'border-border text-muted-foreground hover:border-blue-300'}`}>
                    {p.l}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === 'video' && preview && (
            <div className="bg-secondary/40 border border-border rounded-2xl p-3">
              <video src={preview} controls className="w-full rounded-xl" />
            </div>
          )}

          {/* Result */}
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
              <button onClick={download}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                <Download size={18} /> {lang === 'ar' ? 'تحميل الملف المضغوط' : 'Download Compressed File'}
              </button>
            </div>
          )}

          {!done && (
            <button onClick={compress} disabled={processing || limitReached || (tab === 'video' && !ffmpegLoaded)}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-extrabold text-base shadow-lg disabled:opacity-50 active:scale-95 transition-all">
              {processing
                ? (lang === 'ar' ? '⚙️ جاري الضغط...' : '⚙️ Compressing...')
                : (lang === 'ar' ? '🗜️ ابدأ الضغط الآن' : '🗜️ Compress Now')}
            </button>
          )}

          {done && (
            <button onClick={() => { setFile(null); setDone(false); setPreview(null); setResultBlob(null); }}
              className="w-full py-3 rounded-xl border border-border text-muted-foreground font-bold hover:bg-secondary transition-colors">
              {lang === 'ar' ? '+ ضغط ملف آخر' : '+ Compress another file'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FileCompressor;
