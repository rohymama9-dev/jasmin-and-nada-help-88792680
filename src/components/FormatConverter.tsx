import { useState, useEffect, useRef } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Download, X, Check, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';

const getUsesKey = () => { const d = new Date(); return `app-formatconverter-uses-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };
const getMaxKey = () => { const d = new Date(); return `app-formatconverter-max-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };
const DEFAULT_MAX = 5;

const IMAGE_FMTS = [
  { value: 'image/png', label: 'PNG', ext: 'png' },
  { value: 'image/jpeg', label: 'JPG', ext: 'jpg' },
  { value: 'image/webp', label: 'WebP', ext: 'webp' },
  { value: 'application/pdf', label: 'PDF', ext: 'pdf' },
];

const DOC_FMTS = [
  { value: 'pdf', label: 'PDF', ext: 'pdf' },
  { value: 'txt', label: 'TXT', ext: 'txt' },
  { value: 'docx', label: 'DOCX', ext: 'docx' },
];

const CATEGORIES = [
  { id: 'image', emoji: '🖼️', ar: 'تحويل الصور', en: 'Images', desc_ar: 'JPG ↔ PNG ↔ WebP ↔ PDF', desc_en: 'JPG ↔ PNG ↔ WebP ↔ PDF', color: 'from-emerald-400 to-teal-500', soon: false },
  { id: 'audio', emoji: '🎵', ar: 'استخراج الصوت من فيديو', en: 'Extract Audio from Video', desc_ar: 'MP4 / MOV → ملف صوتي', desc_en: 'MP4 / MOV → audio file', color: 'from-purple-400 to-violet-500', soon: false },
  { id: 'compress', emoji: '📦', ar: 'ضغط الملفات إلى GZ', en: 'Compress to GZ', desc_ar: 'أي ملف → .gz', desc_en: 'Any file → .gz', color: 'from-blue-400 to-indigo-500', soon: false },
  { id: 'doc', emoji: '📄', ar: 'تحويل المستندات', en: 'Document Converter', desc_ar: 'PDF · TXT · DOCX', desc_en: 'PDF · TXT · DOCX', color: 'from-amber-400 to-orange-500', soon: false },
  { id: 'video', emoji: '🎬', ar: 'ضغط الفيديو', en: 'Video Compression', desc_ar: 'قلّل حجم الفيديو (WebM)', desc_en: 'Reduce video size (WebM)', color: 'from-rose-400 to-pink-500', soon: false },
  { id: 'ebook', emoji: '📚', ar: 'تحويل الكتب', en: 'Ebook Conversion', desc_ar: 'قريباً', desc_en: 'Coming soon', color: 'from-cyan-400 to-sky-500', soon: true },
];

type CatId = 'image' | 'audio' | 'compress' | 'doc' | 'video' | 'ebook';

const FormatConverter = () => {
  const { lang } = useLang();
  const [uses, setUses] = useState(0);
  const [maxUses, setMaxUses] = useState(DEFAULT_MAX);
  const [category, setCategory] = useState<CatId | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  
  // Format states
  const [targetFmt, setTargetFmt] = useState('image/webp');
  const [docFormat, setDocFormat] = useState('pdf');

  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultName, setResultName] = useState('');
  const [watching, setWatching] = useState(false);
  const [progress, setProgress] = useState('');

  useEffect(() => {
    setUses(Number(localStorage.getItem(getUsesKey()) || 0));
    setMaxUses(Number(localStorage.getItem(getMaxKey()) || DEFAULT_MAX));
  }, []);

  const recordUse = () => { const n = uses + 1; setUses(n); localStorage.setItem(getUsesKey(), n.toString()); };
  const watchAd = () => {
    setWatching(true);
    setTimeout(() => { setWatching(false); const nm = maxUses + 1; setMaxUses(nm); localStorage.setItem(getMaxKey(), nm.toString()); toast.success(lang === 'ar' ? '+1 محاولة 🎉' : '+1 use 🎉'); }, 3000);
  };

  const handleFile = (f: File) => {
    setFile(f); setDone(false); setResultBlob(null); setProgress('');
    if (f.type.startsWith('image/')) setPreview(URL.createObjectURL(f)); else setPreview(null);
  };

  const limitReached = uses >= maxUses;

  // ─── Conversion logic ───
  const convert = async () => {
    if (!file || limitReached) return;
    setProcessing(true); setProgress('');
    try {
      let blob: Blob; let name: string;

      if (category === 'image') {
        const img = new Image();
        const url = URL.createObjectURL(file);
        await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; img.src = url; });
        
        if (targetFmt === 'application/pdf') {
          // Convert image to PDF
          const doc = new jsPDF({ orientation: img.width > img.height ? 'l' : 'p', unit: 'px', format: [img.width, img.height] });
          doc.addImage(img, 'JPEG', 0, 0, img.width, img.height);
          blob = doc.output('blob');
          name = `converted_${file.name.replace(/\.[^.]+$/, '')}.pdf`;
        } else {
          // Normal image conversion
          const canvas = document.createElement('canvas');
          canvas.width = img.width; canvas.height = img.height;
          const ctx = canvas.getContext('2d')!;
          ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0);
          const ext = IMAGE_FMTS.find(f => f.value === targetFmt)?.ext || 'webp';
          blob = await new Promise<Blob>((res, rej) => canvas.toBlob(b => b ? res(b) : rej(new Error('Failed')), targetFmt, 0.95));
          name = `converted_${file.name.replace(/\.[^.]+$/, '')}.${ext}`;
        }
        URL.revokeObjectURL(url);

      } else if (category === 'audio') {
        setProgress(lang === 'ar' ? 'جاري استخراج الصوت... قد يستغرق وقتاً حسب طول الفيديو' : 'Extracting audio... may take a while depending on video length');
        blob = await extractAudio(file, setProgress);
        name = `audio_${file.name.replace(/\.[^.]+$/, '')}.webm`;

      } else if (category === 'compress') {
        if (!('CompressionStream' in window)) throw new Error('Browser does not support CompressionStream');
        const stream = file.stream().pipeThrough(new (window as any).CompressionStream('gzip'));
        blob = await new Response(stream).blob();
        name = `${file.name}.gz`;

      } else if (category === 'doc') {
        // Document conversion
        blob = await convertDocument(file, docFormat);
        name = `converted_${file.name.replace(/\.[^.]+$/, '')}.${docFormat}`;

      } else if (category === 'video') {
        setProgress(lang === 'ar' ? 'جاري ضغط الفيديو... يستغرق وقتاً مثل مدة الفيديو نفسها' : 'Compressing video... takes as long as the video duration');
        blob = await compressVideo(file, setProgress);
        name = `compressed_${file.name.replace(/\.[^.]+$/, '')}.webm`;

      } else { throw new Error('Unknown category'); }

      setResultBlob(blob); setResultName(name); recordUse(); setDone(true);
    } catch (e: any) {
      toast.error(lang === 'ar' ? `خطأ: ${e.message || 'حدث خطأ'}` : `Error: ${e.message || 'Failed'}`);
    } finally { setProcessing(false); setProgress(''); }
  };

  const downloadResult = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a'); a.href = url; a.download = resultName; a.click();
    URL.revokeObjectURL(url);
  };

  const catInfo = category ? CATEGORIES.find(c => c.id === category)! : null;

  // ── Category Grid ──
  if (!category) {
    return (
      <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-purple-600 to-violet-500 p-5 text-white text-center">
          <div className="text-4xl mb-2">🔄</div>
          <h2 className="text-xl font-extrabold">{lang === 'ar' ? 'محول الصيغ الشامل' : 'Universal Format Converter'}</h2>
          <p className="text-white/80 text-xs mt-1">{lang === 'ar' ? 'حول ملفاتك لأي صيغة — مجاناً وبدون إنترنت' : 'Convert files to any format — free & offline'}</p>
          <div className="mt-2 inline-flex bg-white/20 rounded-full px-3 py-1 text-xs font-bold">{uses}/{maxUses} {lang === 'ar' ? 'محاولة اليوم' : 'uses today'}</div>
        </div>
        {limitReached && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-2xl p-4 text-center space-y-3">
            <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">⏳ {lang === 'ar' ? 'استنفدت المحاولات!' : 'Daily limit reached!'}</p>
            <button onClick={watchAd} disabled={watching} className="mx-auto flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold disabled:opacity-60">
              <PlayCircle size={14} /> {watching ? (lang === 'ar' ? 'جاري العرض...' : 'Watching...') : (lang === 'ar' ? 'شاهد إعلاناً (+1)' : 'Watch Ad (+1)')}
            </button>
          </div>
        )}
        <p className="font-bold text-foreground text-sm px-1">{lang === 'ar' ? 'اختر نوع التحويل:' : 'Choose conversion type:'}</p>
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => !cat.soon && !limitReached && setCategory(cat.id as CatId)}
              disabled={cat.soon || limitReached}
              className={`relative rounded-2xl p-4 text-start border transition-all ${cat.soon || limitReached ? 'opacity-50 cursor-not-allowed border-border bg-secondary/30' : 'border-border bg-card hover:border-purple-300 hover:shadow-md active:scale-95'}`}>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-2 text-xl`}>{cat.emoji}</div>
              <p className="font-bold text-foreground text-xs leading-tight">{lang === 'ar' ? cat.ar : cat.en}</p>
              <p className="text-muted-foreground text-[10px] mt-0.5">{lang === 'ar' ? cat.desc_ar : cat.desc_en}</p>
              {cat.soon && <span className="absolute top-2 left-2 bg-secondary text-muted-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full">{lang === 'ar' ? 'قريباً' : 'Soon'}</span>}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Converter Screen ──
  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => { setCategory(null); setFile(null); setDone(false); setResultBlob(null); }} className="text-purple-600 font-bold text-sm">{lang === 'ar' ? '→ رجوع' : '← Back'}</button>
        <div className={`flex-1 rounded-2xl bg-gradient-to-r ${catInfo!.color} px-3 py-2 text-white font-bold text-sm flex items-center gap-2`}>
          <span>{catInfo!.emoji}</span><span>{lang === 'ar' ? catInfo!.ar : catInfo!.en}</span>
        </div>
      </div>

      {limitReached && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-2xl p-4 text-center space-y-3">
          <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">⏳ {lang === 'ar' ? 'استنفدت المحاولات!' : 'Daily limit reached!'}</p>
          <button onClick={watchAd} disabled={watching} className="mx-auto flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold disabled:opacity-60">
            <PlayCircle size={14} /> {watching ? (lang === 'ar' ? 'جاري العرض...' : 'Watching...') : (lang === 'ar' ? 'شاهد إعلاناً (+1)' : 'Watch Ad (+1)')}
          </button>
        </div>
      )}

      {/* Video note */}
      {category === 'video' && !file && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-2xl p-3 text-xs text-rose-700 dark:text-rose-400 font-medium">
          ⚠️ {lang === 'ar' ? 'ضغط الفيديو يستغرق وقتاً مماثلاً لمدة الفيديو نفسها. النتيجة ستكون بصيغة WebM.' : 'Video compression takes as long as the video duration. Output will be WebM format.'}
        </div>
      )}
      {/* Audio note */}
      {category === 'audio' && !file && (
        <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40 rounded-2xl p-3 text-xs text-purple-700 dark:text-purple-400 font-medium">
          🎵 {lang === 'ar' ? 'يستخرج المسار الصوتي من ملف الفيديو ويحفظه كملف صوتي WebM (Opus).' : 'Extracts audio track from video and saves it as WebM audio (Opus codec).'}
        </div>
      )}

      {/* Upload zone */}
      {!file ? (
        <label className="relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/20 p-10 cursor-pointer hover:bg-purple-100/40 transition-colors">
          <input type="file"
            accept={category === 'image' ? 'image/*' : category === 'audio' || category === 'video' ? 'video/*' : '*/*'}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <div className="text-5xl mb-3">{catInfo!.emoji}</div>
          <p className="font-extrabold text-purple-700 dark:text-purple-300 text-base text-center">{lang === 'ar' ? 'ارفع ملفك هنا' : 'Upload your file here'}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {category === 'image' ? 'JPG · PNG · WebP · GIF · BMP' :
             category === 'audio' || category === 'video' ? 'MP4 · MOV · AVI · MKV · WebM' :
             category === 'doc' ? 'PDF · TXT · DOCX · HTML' : lang === 'ar' ? 'كل الملفات' : 'All files'}
          </p>
        </label>
      ) : (
        <div className="space-y-4">
          {/* File info */}
          <div className="flex items-center gap-3 bg-secondary/60 rounded-2xl p-3 border border-border">
            {preview ? <img src={preview} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" alt="" /> :
              <div className="w-14 h-14 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-2xl flex-shrink-0">{catInfo!.emoji}</div>}
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate text-foreground text-sm">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1048576).toFixed(2)} MB</p>
            </div>
            <button onClick={() => { setFile(null); setDone(false); setPreview(null); setResultBlob(null); }}
              className="text-muted-foreground hover:text-destructive p-1"><X size={18} /></button>
          </div>

          {/* format selector AFTER upload */}
          {category === 'image' && !done && (
            <div className="space-y-2">
              <p className="font-bold text-sm text-foreground px-1">{lang === 'ar' ? 'حوّل إلى:' : 'Convert to:'}</p>
              <div className="grid grid-cols-4 gap-2">
                {IMAGE_FMTS.map(f => (
                  <button key={f.value} onClick={() => setTargetFmt(f.value)}
                    className={`py-2 rounded-xl text-xs sm:text-sm font-bold border transition-colors ${targetFmt === f.value ? 'bg-purple-500 text-white border-purple-500 shadow-md scale-[1.02]' : 'border-border text-muted-foreground hover:border-purple-300'}`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {category === 'doc' && !done && (
            <div className="space-y-2">
              <p className="font-bold text-sm text-foreground px-1">{lang === 'ar' ? 'حوّل إلى:' : 'Convert to:'}</p>
              <div className="grid grid-cols-3 gap-2">
                {DOC_FMTS.map(f => (
                  <button key={f.value} onClick={() => setDocFormat(f.value)}
                    className={`py-2 rounded-xl text-sm font-bold border transition-colors ${docFormat === f.value ? 'bg-purple-500 text-white border-purple-500 shadow-md scale-[1.02]' : 'border-border text-muted-foreground hover:border-purple-300'}`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Progress */}
          {progress && (
            <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 rounded-2xl p-3 text-xs text-purple-700 dark:text-purple-300 font-medium animate-pulse">{progress}</div>
          )}

          {/* Result */}
          {done && resultBlob && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-4 text-center space-y-3">
              <Check size={32} className="text-emerald-500 mx-auto" />
              <p className="font-extrabold text-emerald-800 dark:text-emerald-300">{lang === 'ar' ? 'تم التحويل بنجاح! 🎉' : 'Converted successfully! 🎉'}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">{resultName}</p>
              <button onClick={downloadResult} className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                <Download size={18} /> {lang === 'ar' ? 'تحميل الملف' : 'Download File'}
              </button>
            </div>
          )}

          {!done && (
            <button onClick={convert} disabled={processing || limitReached}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-violet-500 text-white font-extrabold text-base shadow-lg disabled:opacity-50 active:scale-95 transition-all">
              {processing ? (lang === 'ar' ? '⚙️ جاري التحويل...' : '⚙️ Converting...') : (lang === 'ar' ? '🔄 ابدأ التحويل' : '🔄 Convert Now')}
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

// ─── Helper: Extract audio from video ───────────────────────────────────────
async function extractAudio(videoFile: File, setProgress: (s: string) => void): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoFile);
    video.crossOrigin = 'anonymous';
    video.muted = false;
    video.preload = 'auto';

    video.onloadedmetadata = () => {
      try {
        const audioCtx = new AudioContext();
        const destination = audioCtx.createMediaStreamDestination();
        const source = audioCtx.createMediaElementSource(video);
        source.connect(destination);
        source.connect(audioCtx.destination); 

        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
        const recorder = new MediaRecorder(destination.stream, { mimeType });
        const chunks: Blob[] = [];

        recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
        recorder.onstop = () => {
          audioCtx.close();
          URL.revokeObjectURL(video.src);
          resolve(new Blob(chunks, { type: mimeType }));
        };

        video.play();
        recorder.start(1000);

        video.ontimeupdate = () => {
          const pct = Math.round((video.currentTime / video.duration) * 100);
          setProgress(`⏳ ${pct}%`);
        };
        video.onended = () => { recorder.stop(); video.pause(); };
        video.onerror = () => { recorder.stop(); reject(new Error('Video error')); };
      } catch (e) { reject(e); }
    };
    video.onerror = () => reject(new Error('Cannot load video'));
  });
}

// ─── Helper: Compress video via Canvas + MediaRecorder ───────────────────────
async function compressVideo(videoFile: File, setProgress: (s: string) => void): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoFile);
    video.muted = true;
    video.preload = 'auto';

    video.onloadedmetadata = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d')!;

      const stream = canvas.captureStream(24);
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8') ? 'video/webm;codecs=vp8' : 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 800_000 });
      const chunks: Blob[] = [];

      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => { URL.revokeObjectURL(video.src); resolve(new Blob(chunks, { type: 'video/webm' })); };

      const drawFrame = () => {
        if (video.ended || video.paused) { try { recorder.stop(); } catch {} return; }
        ctx.drawImage(video, 0, 0);
        requestAnimationFrame(drawFrame);
      };

      video.onplay = () => { recorder.start(1000); requestAnimationFrame(drawFrame); };
      video.ontimeupdate = () => {
        const pct = Math.round((video.currentTime / video.duration) * 100);
        setProgress(`⏳ ${pct}% — ${lang_global}`);
      };
      video.onended = () => { try { recorder.stop(); } catch {} };
      video.onerror = () => reject(new Error('Video error'));
      video.play().catch(reject);
    };
    video.onerror = () => reject(new Error('Cannot load video'));
  });
}

// ─── Helper: Document conversion ─────────────────────────────────────────────
async function convertDocument(file: File, format: string): Promise<Blob> {
  let text = '';
  try {
    text = await file.text();
  } catch (e) {
    // If it's binary like an existing PDF or DOCX, we do best-effort or fail fallback
    text = "Binary file cannot be fully extracted in this version.";
  }

  if (format === 'txt') {
    const output = text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
    return new Blob([output], { type: 'text/plain' });
  } else if (format === 'docx') {
    const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Document</title></head>
    <body>${text.replace(/\n/g, '<br>')}</body>
    </html>`;
    return new Blob([html], { type: 'application/msword' });
  } else if (format === 'pdf') {
    const doc = new jsPDF();
    const lines = doc.splitTextToSize(text.substring(0, 10000), 180); // Protect against huge files crashing memory
    doc.text(lines, 10, 10);
    return doc.output('blob');
  }
  
  return new Blob([text], { type: 'text/plain' });
}

let lang_global = 'جاري الضغط...';
export default FormatConverter;
