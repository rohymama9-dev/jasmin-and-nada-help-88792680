import { useState, useRef, useEffect } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Download, X, Check, Lock, PlayCircle, Settings2, Image as ImageIcon, FileText, Video } from 'lucide-react';
import { toast } from 'sonner';

const FileCompressor = () => {
  const { lang } = useLang();
  const [tab, setTab] = useState<'image' | 'file' | 'video'>('image');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  
  // Compression & format states
  const [compressionRatio, setCompressionRatio] = useState(70);
  const [imageFormat, setImageFormat] = useState<'auto' | 'image/webp' | 'image/jpeg' | 'image/png'>('auto');
  const [videoFormat, setVideoFormat] = useState<'video/mp4' | 'video/webm'>('video/mp4');
  
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');

  // Points & Unlocking logic
  const [points, setPoints] = useState(() => parseInt(localStorage.getItem('points') || '100'));
  const [isUnlocked, setIsUnlocked] = useState(() => localStorage.getItem('compressorUnlocked') === 'true');
  const UNLOCK_COST = 80;

  const handleUnlock = () => {
    if (points >= UNLOCK_COST) {
      const newPoints = points - UNLOCK_COST;
      setPoints(newPoints);
      localStorage.setItem('points', newPoints.toString());
      localStorage.setItem('compressorUnlocked', 'true');
      setIsUnlocked(true);
      toast.success(lang === 'ar' ? 'تم فك القفل بنجاح!' : 'Unlocked successfully!');
    } else {
      toast.error(lang === 'ar' ? 'نقاطك غير كافية!' : 'Not enough points!');
    }
  };

  const handleFile = (nextFile: File) => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(nextFile);
    setDone(false);
    setResultBlob(null);
    setResultSize(0);
    setStatusMessage(null);
    setProgress('');
    if ((tab === 'image' && nextFile.type.startsWith('image/')) || (tab === 'video' && nextFile.type.startsWith('video/'))) {
      setPreview(URL.createObjectURL(nextFile));
    } else {
      setPreview(null);
    }
  };

  const resetCurrentFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setDone(false);
    setPreview(null);
    setResultBlob(null);
    setResultSize(0);
    setStatusMessage(null);
    setProgress('');
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const compressImage = async () => {
    if (!file) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });

    const canvas = document.createElement('canvas');
    // Basic scaling logic based on compression ratio
    let scale = 1;
    if (compressionRatio > 50) scale = 1 - ((compressionRatio - 50) / 100); 
    
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context unavailable');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = compressionRatio > 80 ? 'low' : 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    let outputType = imageFormat === 'auto' ? 'image/webp' : imageFormat;
    if (imageFormat === 'auto' && file.type === 'image/png') outputType = 'image/png';
    if (imageFormat === 'auto' && file.type === 'image/jpeg') outputType = 'image/jpeg';

    const outputQuality = outputType === 'image/png' ? undefined : (100 - compressionRatio) / 100;
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(result => (result ? resolve(result) : reject(new Error('Compression failed'))), outputType, outputQuality),
    );

    setResultBlob(blob);
    setResultSize(blob.size);
    setDone(true);
    setStatusMessage(
      lang === 'ar'
        ? `تم ضغط الصورة بصيغة ${outputType.replace('image/', '').toUpperCase()}.`
        : `Image compressed as ${outputType.replace('image/', '').toUpperCase()}.`
    );
    URL.revokeObjectURL(url);
  };

  const compressVideoNative = async () => {
    if (!file) return;
    setStatusMessage(lang === 'ar' ? 'جاري ضغط الفيديو...' : 'Compressing video...');
    
    try {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.muted = true;
      video.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      let scale = 1;
      if (compressionRatio > 50) scale = 1 - ((compressionRatio - 50) / 100); 
      canvas.width = video.videoWidth * scale;
      canvas.height = video.videoHeight * scale;
      
      const ctx = canvas.getContext('2d');
      const stream = canvas.captureStream(30); // 30 FPS
      
      // Try to get audio track
      const audioCtx = new AudioContext();
      const dest = audioCtx.createMediaStreamDestination();
      try {
        const source = audioCtx.createMediaElementSource(video);
        source.connect(dest);
        const audioTrack = dest.stream.getAudioTracks()[0];
        if (audioTrack) stream.addTrack(audioTrack);
      } catch (e) {
        // Audio might fail if cross-origin, ignore
      }

      const mimeType = videoFormat === 'video/mp4' ? 'video/mp4' : 'video/webm;codecs=vp8,opus';
      const options = { mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : '' };
      const recorder = new MediaRecorder(stream, options);
      const chunks: Blob[] = [];

      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || 'video/mp4' });
        setResultBlob(blob);
        setResultSize(blob.size);
        setDone(true);
        setStatusMessage(lang === 'ar' ? 'تم ضغط الفيديو بنجاح.' : 'Video compressed successfully.');
      };

      video.play();
      recorder.start();

      const renderLoop = () => {
        if (video.ended || video.paused) {
          recorder.stop();
          return;
        }
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        setProgress(`${Math.round((video.currentTime / video.duration) * 100)}%`);
        requestAnimationFrame(renderLoop);
      };
      
      requestAnimationFrame(renderLoop);
    } catch (error) {
      console.error(error);
      toast.error(lang === 'ar' ? 'فشل ضغط الفيديو.' : 'Video compression failed.');
      setProcessing(false);
    }
  };

  const compressFileGzip = async () => {
    if (!file) return;
    if (!('CompressionStream' in window)) {
      toast.error(lang === 'ar' ? 'متصفحك لا يدعم هذا النوع من الضغط.' : 'Your browser does not support this compression.');
      setProcessing(false);
      return;
    }

    try {
      const stream = file.stream();
      const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
      const reader = compressedStream.getReader();
      const chunks = [];
      let total = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        total += value.length;
      }

      const blob = new Blob(chunks, { type: 'application/gzip' });
      setResultBlob(blob);
      setResultSize(blob.size);
      setDone(true);
      setStatusMessage(lang === 'ar' ? 'تم ضغط الملف بصيغة GZIP.' : 'File compressed as GZIP.');
    } catch (e) {
      toast.error('Compression error');
    }
  };

  const compress = async () => {
    setProcessing(true);
    setProgress('');
    try {
      if (tab === 'image' && file?.type.startsWith('image/')) {
        await compressImage();
      } else if (tab === 'video' && file?.type.startsWith('video/')) {
        await compressVideoNative();
        return; // handle processing state in recorder
      } else {
        await compressFileGzip();
      }
    } catch (error) {
      console.error(error);
      toast.error('Compression failed');
    }
    if (tab !== 'video') setProcessing(false);
  };

  const download = () => {
    if (!resultBlob || !file) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(resultBlob);
    
    let ext = '.gz';
    if (tab === 'image') {
      const outType = imageFormat === 'auto' ? file.type : imageFormat;
      ext = outType === 'image/jpeg' ? '.jpg' : outType === 'image/png' ? '.png' : '.webp';
    } else if (tab === 'video') {
      ext = videoFormat === 'video/mp4' ? '.mp4' : '.webm';
    }

    a.download = `compressed_${file.name.replace(/\.[^/.]+$/, '')}${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (!isUnlocked) {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 text-center text-white shadow-xl relative overflow-hidden glass-card">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
          <Lock size={64} className="mx-auto mb-6 opacity-90 drop-shadow-lg" />
          <h2 className="text-3xl font-extrabold mb-4 drop-shadow">
            {lang === 'ar' ? 'ضغط الملفات والصور والفيديوهات' : 'Universal Compressor'}
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-md mx-auto font-medium">
            {lang === 'ar' 
              ? `افتح أداة الضغط الشاملة لتقليل حجم الصور، الفيديوهات، والملفات محلياً وبأعلى جودة.` 
              : `Unlock the universal compressor to reduce image, video, and file sizes locally with highest quality.`}
          </p>
          <button
            onClick={handleUnlock}
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-indigo-600 rounded-full font-extrabold text-lg transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] active:scale-95"
          >
            <PlayCircle className="group-hover:rotate-12 transition-transform" />
            {lang === 'ar' ? `فتح مقابل ${UNLOCK_COST} نقطة` : `Unlock for ${UNLOCK_COST} points`}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex gap-2 p-1.5 bg-secondary/50 rounded-2xl backdrop-blur-sm border border-border/50">
        {[
          { id: 'image', icon: ImageIcon, label: lang === 'ar' ? 'صورة' : 'Image' },
          { id: 'video', icon: Video, label: lang === 'ar' ? 'فيديو' : 'Video' },
          { id: 'file', icon: FileText, label: lang === 'ar' ? 'ملف عام' : 'File' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id as any); resetCurrentFile(); }}
            className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              tab === t.id 
                ? 'bg-background shadow-md text-foreground scale-[1.02]' 
                : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
            }`}
          >
            <t.icon size={18} /> {t.label}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden glass-card">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
        
        {!file ? (
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-border rounded-2xl cursor-pointer bg-secondary/20 hover:bg-secondary/40 transition-colors group">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Settings2 className="w-12 h-12 text-muted-foreground mb-4 group-hover:text-primary transition-colors group-hover:rotate-180 duration-500" />
                <p className="mb-2 text-sm text-muted-foreground font-bold">
                  {lang === 'ar' ? 'اضغط لاختيار أو اسحب الملف هنا' : 'Click to select or drag file here'}
                </p>
                <p className="text-xs text-muted-foreground/70 font-medium">
                  {tab === 'image' ? 'PNG, JPG, WebP' : tab === 'video' ? 'MP4, WebM, MOV' : 'Any File (GZIP compression)'}
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                accept={tab === 'image' ? 'image/*' : tab === 'video' ? 'video/*' : '*/*'}
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </label>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-start justify-between bg-secondary/30 p-4 rounded-2xl border border-border">
              <div className="flex items-center gap-4">
                {preview ? (
                  tab === 'video' ? (
                    <video src={preview} className="w-16 h-16 rounded-xl object-cover border border-border bg-black/5" />
                  ) : (
                    <img src={preview} alt="Preview" className="w-16 h-16 rounded-xl object-cover border border-border bg-black/5" />
                  )
                ) : (
                  <div className="w-16 h-16 rounded-xl border border-border bg-secondary flex items-center justify-center text-muted-foreground">
                    <FileText size={24} />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-sm max-w-[200px] truncate" title={file.name}>{file.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{formatSize(file.size)}</p>
                </div>
              </div>
              {!processing && !done && (
                <button onClick={resetCurrentFile} className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-full transition-colors">
                  <X size={18} />
                </button>
              )}
            </div>

            {(tab === 'image' || tab === 'video') && !done && (
              <div className="bg-card border border-border rounded-2xl p-5 space-y-5 shadow-inner">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm">{lang === 'ar' ? 'نسبة الضغط' : 'Compression Ratio'}</span>
                    <span className="font-extrabold text-xl text-primary">{compressionRatio}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={compressionRatio}
                    onChange={e => setCompressionRatio(Number(e.target.value))}
                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground font-medium px-1">
                    <span>{lang === 'ar' ? 'جودة أعلى' : 'Higher Quality'}</span>
                    <span>{lang === 'ar' ? 'حجم أصغر' : 'Smaller Size'}</span>
                  </div>
                </div>

                {compressionRatio > 60 && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl p-3 text-xs font-bold text-amber-700 dark:text-amber-400 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <span className="text-lg">⚠️</span> 
                    <span>{lang === 'ar' ? 'نسبة الضغط أعلى من 60% قد تؤثر على جودة الملف بشكل ملحوظ.' : 'Compression ratio above 60% may visibly affect file quality.'}</span>
                  </div>
                )}

                {tab === 'image' && (
                  <div className="space-y-3 pt-2">
                    <span className="font-bold text-xs text-muted-foreground">{lang === 'ar' ? 'صيغة الإخراج' : 'Output Format'}</span>
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
                          className={`py-2 rounded-xl text-xs font-bold border transition-colors ${imageFormat === option.value ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'border-border text-muted-foreground hover:border-primary/50 hover:bg-secondary/50'}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {tab === 'video' && (
                  <div className="space-y-3 pt-2">
                    <span className="font-bold text-xs text-muted-foreground">{lang === 'ar' ? 'صيغة الإخراج' : 'Output Format'}</span>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'MP4', value: 'video/mp4' as const },
                        { label: 'WebM', value: 'video/webm' as const },
                      ].map(option => (
                        <button
                          key={option.value}
                          onClick={() => setVideoFormat(option.value)}
                          className={`py-2 rounded-xl text-xs font-bold border transition-colors ${videoFormat === option.value ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'border-border text-muted-foreground hover:border-primary/50 hover:bg-secondary/50'}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {statusMessage && (
              <div className="rounded-xl border border-border bg-secondary/50 p-3 text-sm text-foreground text-center font-medium animate-in fade-in">
                {statusMessage}
              </div>
            )}

            {done && resultBlob && (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-2xl p-5 text-center space-y-4 animate-in zoom-in-95">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Check size={32} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="font-extrabold text-emerald-800 dark:text-emerald-300 text-lg">
                  {lang === 'ar' ? 'تم الضغط بنجاح! 🎉' : 'Compressed successfully! 🎉'}
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100/50 dark:bg-emerald-900/20 rounded-full text-sm text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200/50 dark:border-emerald-800/50">
                  <span>{formatSize(file.size)}</span>
                  <span>→</span>
                  <span className="text-emerald-600 dark:text-emerald-300">{formatSize(resultSize)}</span>
                  <span className="opacity-75">({Math.max(0, Math.round((1 - resultSize / file.size) * 100))}% {lang === 'ar' ? 'توفير' : 'saved'})</span>
                </div>
                <button
                  onClick={download}
                  className="w-full mt-2 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-emerald-500/20 btn-interactive"
                >
                  <Download size={20} /> {lang === 'ar' ? 'تحميل الملف المضغوط' : 'Download Compressed File'}
                </button>
              </div>
            )}

            {!done && (
              <button
                onClick={compress}
                disabled={processing}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-500/90 text-white font-extrabold text-base shadow-xl disabled:opacity-50 transition-all flex flex-col items-center justify-center gap-1 btn-interactive"
              >
                <div className="flex items-center gap-2">
                  {processing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {lang === 'ar' ? 'جاري الضغط...' : 'Compressing...'}
                    </>
                  ) : (
                    <>
                      <Settings2 size={20} /> {lang === 'ar' ? 'ابدأ الضغط الآن' : 'Compress Now'}
                    </>
                  )}
                </div>
                {progress && <span className="text-xs text-white/90 font-medium">{progress}</span>}
              </button>
            )}

            {done && (
              <button
                onClick={resetCurrentFile}
                className="w-full py-3.5 rounded-xl border-2 border-dashed border-border text-muted-foreground font-bold hover:bg-secondary/50 hover:text-foreground transition-all btn-interactive"
              >
                {lang === 'ar' ? '+ ضغط ملف آخر' : '+ Compress another file'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileCompressor;
