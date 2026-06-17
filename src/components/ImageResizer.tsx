import { useState, useEffect } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Download, PlayCircle, Crop } from 'lucide-react';
import { toast } from 'sonner';

const getUsesKey = () => {
  const d = new Date();
  return `app-imageresizer-uses-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};
const getMaxUsesKey = () => {
  const d = new Date();
  return `app-imageresizer-maxuses-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};
const DEFAULT_MAX_USES = 3;

const PRESETS = [
  { label: 'Instagram', w: 1080, h: 1080, icon: '📸' },
  { label: 'Story', w: 1080, h: 1920, icon: '📱' },
  { label: 'Twitter/X', w: 1500, h: 500, icon: '🐦' },
  { label: 'Facebook', w: 1200, h: 630, icon: '👍' },
  { label: 'YouTube', w: 1280, h: 720, icon: '▶️' },
  { label: 'A4', w: 2480, h: 3508, icon: '📄' },
];

const ImageResizer = () => {
  const { lang } = useLang();
  const [uses, setUses] = useState(0);
  const [maxUses, setMaxUses] = useState(DEFAULT_MAX_USES);
  const [file, setFile] = useState<File | null>(null);
  const [originalImg, setOriginalImg] = useState<HTMLImageElement | null>(null);
  const [origPxW, setOrigPxW] = useState(0);
  const [origPxH, setOrigPxH] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [width, setWidth] = useState(1080);
  const [height, setHeight] = useState(1080);
  const [unit, setUnit] = useState<'px' | 'cm'>('px');
  const [origRatio, setOrigRatio] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [watchingAd, setWatchingAd] = useState(false);

  useEffect(() => {
    setUses(Number(localStorage.getItem(getUsesKey()) || 0));
    setMaxUses(Number(localStorage.getItem(getMaxUsesKey()) || DEFAULT_MAX_USES));
  }, []);

  const watchAd = () => {
    setWatchingAd(true);
    setTimeout(() => {
      setWatchingAd(false);
      const nm = maxUses + 1; setMaxUses(nm);
      localStorage.setItem(getMaxUsesKey(), nm.toString());
      toast.success(lang === 'ar' ? 'محاولة إضافية! 🎉' : '+1 use added! 🎉');
    }, 3000);
  };

  const recordUse = () => {
    const n = uses + 1; setUses(n);
    localStorage.setItem(getUsesKey(), n.toString());
  };

  const pxFromCm = (cm: number) => Math.round(cm * 118.11);
  const cmFromPx = (px: number) => parseFloat((px / 118.11).toFixed(2));
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  const handleFileChange = (f: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(f);
    setFile(f);
    setPreviewUrl(url);
    const img = new Image();
    img.onload = () => {
      setOriginalImg(img);
      setOrigPxW(img.width);
      setOrigPxH(img.height);
      const ratio = img.width / img.height;
      setOrigRatio(ratio);
      setWidth(img.width);
      setHeight(img.height);
    };
    img.src = url;
  };

  const handleWidthChange = (val: number) => {
    if (!origRatio || !origPxW || !origPxH) return;
    const pxRaw = unit === 'cm' ? pxFromCm(val) : val;
    const px = clamp(pxRaw, 1, origPxW);
    const newHpx = clamp(Math.round(px / origRatio), 1, origPxH);
    const newWVal = unit === 'cm' ? cmFromPx(px) : px;
    const newHVal = unit === 'cm' ? cmFromPx(newHpx) : newHpx;
    setWidth(newWVal);
    setHeight(newHVal);
  };

  const handleHeightChange = (val: number) => {
    if (!origRatio || !origPxW || !origPxH) return;
    const pxRaw = unit === 'cm' ? pxFromCm(val) : val;
    const px = clamp(pxRaw, 1, origPxH);
    const newWpx = clamp(Math.round(px * origRatio), 1, origPxW);
    const newWVal = unit === 'cm' ? cmFromPx(newWpx) : newWpx;
    const newHVal = unit === 'cm' ? cmFromPx(px) : px;
    setWidth(newWVal);
    setHeight(newHVal);
  };

  const applyPreset = (w: number, h: number) => {
    if (!origPxW || !origPxH) return;
    const scale = Math.min(1, w / origPxW, h / origPxH);
    const tw = Math.max(1, Math.round(origPxW * scale));
    const th = Math.max(1, Math.round(origPxH * scale));
    setWidth(unit === 'cm' ? cmFromPx(tw) : tw);
    setHeight(unit === 'cm' ? cmFromPx(th) : th);
  };

  const switchUnit = (u: 'px' | 'cm') => {
    if (u === unit) return;
    if (u === 'cm') {
      setWidth(cmFromPx(width));
      setHeight(cmFromPx(height));
    } else {
      setWidth(pxFromCm(width));
      setHeight(pxFromCm(height));
    }
    setUnit(u);
  };

  const doResize = async () => {
    if (!originalImg || uses >= maxUses) return;
    setProcessing(true);
    try {
      const targetW = clamp(unit === 'cm' ? pxFromCm(width) : width, 1, origPxW || originalImg.width);
      const targetH = clamp(Math.round(targetW / (origRatio || (originalImg.width / originalImg.height))), 1, origPxH || originalImg.height);

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Multi-step downscaling for best quality
      let currentCanvas = document.createElement('canvas');
      currentCanvas.width = originalImg.width;
      currentCanvas.height = originalImg.height;
      let currentCtx = currentCanvas.getContext('2d')!;
      currentCtx.drawImage(originalImg, 0, 0);

      if (targetW < originalImg.width * 0.5 || targetH < originalImg.height * 0.5) {
        // Step down in halves for quality
        let cw = originalImg.width, ch = originalImg.height;
        while (cw / 2 > targetW || ch / 2 > targetH) {
          const stepCanvas = document.createElement('canvas');
          stepCanvas.width = Math.max(targetW, Math.round(cw / 2));
          stepCanvas.height = Math.max(targetH, Math.round(ch / 2));
          const sCtx = stepCanvas.getContext('2d')!;
          sCtx.imageSmoothingEnabled = true;
          sCtx.imageSmoothingQuality = 'high';
          sCtx.drawImage(currentCanvas, 0, 0, stepCanvas.width, stepCanvas.height);
          currentCanvas = stepCanvas;
          cw = stepCanvas.width;
          ch = stepCanvas.height;
        }
      }

      ctx.drawImage(currentCanvas, 0, 0, targetW, targetH);

      canvas.toBlob((blob) => {
        if (!blob) { toast.error('Failed'); return; }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `resized_${targetW}x${targetH}_${file?.name || 'image.jpg'}`;
        a.click();
        URL.revokeObjectURL(url);
        recordUse();
        toast.success(lang === 'ar' ? 'تم الحفظ بأعلى جودة! ✨' : 'Saved in high quality! ✨');
        setProcessing(false);
      }, file?.type || 'image/jpeg', 1.0);
    } catch {
      toast.error(lang === 'ar' ? 'حدث خطأ' : 'Error occurred');
      setProcessing(false);
    }
  };

  const limitReached = uses >= maxUses;

  // ── Upload Screen ──
  if (!file) {
    return (
      <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 p-5 text-white text-center">
          <div className="w-14 h-14 mx-auto bg-white/20 rounded-2xl flex items-center justify-center mb-2">
            <Crop size={28} />
          </div>
          <h2 className="text-xl font-extrabold">{lang === 'ar' ? 'معدّل المقاسات الدقيق' : 'Precision Resizer'}</h2>
          <p className="text-white/80 text-xs mt-1">{lang === 'ar' ? 'غيّر حجم صورتك بدون فقدان الجودة' : 'Resize without losing quality'}</p>
          <div className="mt-2 inline-flex bg-white/20 rounded-full px-3 py-1 text-xs font-bold">
            {uses}/{maxUses} {lang === 'ar' ? 'محاولة اليوم' : 'uses today'}
          </div>
        </div>

        {limitReached && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-2xl p-4 text-center space-y-3">
            <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">
              ⏳ {lang === 'ar' ? 'استنفدت محاولاتك اليوم!' : 'Daily limit reached!'}
            </p>
            <button onClick={watchAd} disabled={watchingAd}
              className="mx-auto flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold disabled:opacity-60">
              <PlayCircle size={14} />
              {watchingAd ? (lang === 'ar' ? 'جاري العرض...' : 'Watching...') : (lang === 'ar' ? 'شاهد إعلاناً (+1)' : 'Watch Ad (+1)')}
            </button>
          </div>
        )}

        <label className={`relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-950/20 p-10 ${limitReached ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-orange-100/40'} transition-colors`}>
          {!limitReached && <input type="file" accept="image/*" className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            onChange={e => e.target.files?.[0] && handleFileChange(e.target.files[0])} />}
          <div className="text-5xl mb-3">🖼️</div>
          <p className="font-extrabold text-orange-700 dark:text-orange-300 text-center text-base">
            {lang === 'ar' ? 'ارفع صورتك هنا' : 'Upload your image here'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === 'ar' ? 'JPG · PNG · WebP · GIF وأكثر' : 'JPG · PNG · WebP · GIF and more'}
          </p>
        </label>
      </div>
    );
  }

  const displayW = width;
  const displayH = height;

  const previewMaxW = 280;
  const pxW = unit === 'cm' ? pxFromCm(width) : width;
  const pxH = unit === 'cm' ? pxFromCm(height) : height;
  const scale = pxW > 0 && pxH > 0 ? Math.min(previewMaxW / pxW, 180 / pxH, 1) : 1;
  const previewW = Math.round(pxW * scale);
  const previewH = Math.round(pxH * scale);

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => { if (previewUrl) URL.revokeObjectURL(previewUrl); setFile(null); setPreviewUrl(null); setOriginalImg(null); setOrigPxW(0); setOrigPxH(0); }}
          className="text-orange-600 font-bold text-sm">
          {lang === 'ar' ? '→ رجوع' : '← Back'}
        </button>
        <div className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-3 py-1 rounded-full font-bold">
          {uses}/{maxUses} {lang === 'ar' ? 'محاولة' : 'uses'}
        </div>
      </div>

      {/* Visual Preview */}
      <div className="bg-[#f0f4f8] dark:bg-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[220px] border border-border relative overflow-hidden">
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: 'linear-gradient(#ccc 1px, transparent 1px), linear-gradient(90deg, #ccc 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        {previewUrl && (
          <div className="relative z-10 shadow-2xl" style={{ width: previewW, height: previewH, minWidth: 40, minHeight: 40 }}>
            <img src={previewUrl} className="w-full h-full object-contain" alt="preview" />
          </div>
        )}
        <div className="absolute bottom-2 right-2 z-10 bg-black/60 text-white text-[10px] font-mono px-2 py-0.5 rounded">
          {pxW} × {pxH} px
        </div>
      </div>

      {/* Quick Presets */}
      <div>
        <p className="text-xs font-bold text-muted-foreground mb-2">{lang === 'ar' ? 'مقاسات سريعة:' : 'Quick presets:'}</p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => applyPreset(p.w, p.h)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary border border-border text-xs font-bold hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors whitespace-nowrap">
              <span>{p.icon}</span> {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dimensions */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
        {/* Unit Toggle */}
        <div className="flex bg-secondary rounded-xl p-1">
          <button onClick={() => switchUnit('px')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${unit === 'px' ? 'bg-orange-500 text-white shadow' : 'text-muted-foreground'}`}>
            Pixels (px)
          </button>
          <button onClick={() => switchUnit('cm')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${unit === 'cm' ? 'bg-orange-500 text-white shadow' : 'text-muted-foreground'}`}>
            Centimeters (cm)
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-muted-foreground uppercase">{lang === 'ar' ? 'العرض' : 'Width'} ({unit})</label>
            <input type="number" value={displayW} min={1}
              onChange={e => handleWidthChange(Number(e.target.value))}
              className="w-full text-center text-lg font-mono font-bold bg-secondary border-none rounded-xl p-3 outline-none focus:ring-2 ring-orange-400" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-muted-foreground uppercase">{lang === 'ar' ? 'الطول' : 'Height'} ({unit})</label>
            <input type="number" value={displayH} min={1}
              onChange={e => handleHeightChange(Number(e.target.value))}
              className="w-full text-center text-lg font-mono font-bold bg-secondary border-none rounded-xl p-3 outline-none focus:ring-2 ring-orange-400" />
          </div>
        </div>
      </div>

      {/* Daily limit */}
      {limitReached && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-2xl p-4 text-center space-y-3">
          <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">⏳ {lang === 'ar' ? 'استنفدت محاولاتك!' : 'Daily limit reached!'}</p>
          <button onClick={watchAd} disabled={watchingAd}
            className="mx-auto flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold disabled:opacity-60">
            <PlayCircle size={14} />
            {watchingAd ? (lang === 'ar' ? 'جاري العرض...' : 'Watching...') : (lang === 'ar' ? 'شاهد إعلاناً (+1)' : 'Watch Ad (+1)')}
          </button>
        </div>
      )}

      {/* Download Button */}
      <button onClick={doResize} disabled={processing || limitReached || !originalImg}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold text-base shadow-lg disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2">
        {processing
          ? <><span className="animate-spin">⚙️</span> {lang === 'ar' ? 'جاري المعالجة...' : 'Processing...'}</>
          : <><Download size={18} /> {lang === 'ar' ? 'حفظ بأعلى جودة' : 'Save in Max Quality'}</>}
      </button>
    </div>
  );
};

export default ImageResizer;
