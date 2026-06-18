import { useState, useEffect, useRef } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { usePoints } from '@/hooks/usePoints';
import { Unlock, Download, PlayCircle, Lock } from 'lucide-react';
import { toast } from 'sonner';

const UNLOCK_KEY = 'app-imageresizer-v2-unlocked';
const getUsesKey = () => { const d = new Date(); return `app-imageresizer-v2-uses-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };
const getMaxKey = () => { const d = new Date(); return `app-imageresizer-v2-max-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };
const DEFAULT_MAX = 3;

const PRESETS = [
  { label: 'Instagram', w: 1080, h: 1080, icon: '📸' },
  { label: 'Story', w: 1080, h: 1920, icon: '📱' },
  { label: 'YouTube', w: 1280, h: 720, icon: '▶️' },
  { label: 'Twitter', w: 1500, h: 500, icon: '🐦' },
  { label: 'Facebook', w: 1200, h: 630, icon: '👍' },
  { label: 'A4', w: 2480, h: 3508, icon: '📄' },
];

const ImageResizer = () => {
  const { lang } = useLang();
  const { points, addPoints } = usePoints();
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem(UNLOCK_KEY) === 'true');
  const [uses, setUses] = useState(0);
  const [maxUses, setMaxUses] = useState(DEFAULT_MAX);
  const [file, setFile] = useState<File | null>(null);
  const [origImg, setOrigImg] = useState<HTMLImageElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [width, setWidth] = useState(1080);
  const [height, setHeight] = useState(1080);
  const [unit, setUnit] = useState<'px' | 'cm'>('px');
  const [lockRatio, setLockRatio] = useState(true);
  const [origRatio, setOrigRatio] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [watching, setWatching] = useState(false);

  useEffect(() => {
    setUses(Number(localStorage.getItem(getUsesKey()) || 0));
    setMaxUses(Number(localStorage.getItem(getMaxKey()) || DEFAULT_MAX));
  }, []);

  const handleUnlock = () => {
    if (points >= 70) { addPoints(-70); localStorage.setItem(UNLOCK_KEY, 'true'); setUnlocked(true); toast.success(lang === 'ar' ? 'تم فتح الأداة! 🌟' : 'Unlocked! 🌟'); }
    else { toast.error(lang === 'ar' ? 'نقاطك غير كافية' : 'Not enough points'); }
  };

  const watchAd = () => {
    setWatching(true);
    setTimeout(() => { setWatching(false); const nm = maxUses + 1; setMaxUses(nm); localStorage.setItem(getMaxKey(), nm.toString()); toast.success(lang === 'ar' ? '+1 محاولة 🎉' : '+1 use 🎉'); }, 3000);
  };

  const recordUse = () => { const n = uses + 1; setUses(n); localStorage.setItem(getUsesKey(), n.toString()); };

  const PX_PER_CM = 96 / 2.54;
  const toPx = (v: number) => unit === 'cm' ? Math.round(v * PX_PER_CM) : v;
  const toCurUnit = (px: number) => unit === 'cm' ? parseFloat((px / PX_PER_CM).toFixed(2)) : px;

  const handleFile = (f: File) => {
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
    const img = new Image();
    img.onload = () => { setOrigImg(img); const r = img.width / img.height; setOrigRatio(r); setWidth(img.width); setHeight(img.height); };
    img.src = url;
  };

  const onWidthChange = (val: number) => {
    setWidth(val);
    if (lockRatio && origRatio) { const px = toPx(val); setHeight(toCurUnit(Math.round(px / origRatio))); }
  };
  const onHeightChange = (val: number) => {
    setHeight(val);
    if (lockRatio && origRatio) { const px = toPx(val); setWidth(toCurUnit(Math.round(px * origRatio))); }
  };

  const applyPreset = (w: number, h: number) => { setWidth(toCurUnit(w)); setHeight(toCurUnit(h)); };

  const switchUnit = (u: 'px' | 'cm') => {
    if (u === unit) return;
    if (u === 'cm') { setWidth(parseFloat((width / PX_PER_CM).toFixed(2))); setHeight(parseFloat((height / PX_PER_CM).toFixed(2))); }
    else { setWidth(Math.round(width * PX_PER_CM)); setHeight(Math.round(height * PX_PER_CM)); }
    setUnit(u);
  };

  const doResize = async () => {
    if (!origImg || uses >= maxUses) return;
    setProcessing(true);
    try {
      const tw = toPx(width), th = toPx(height);
      // Multi-step downscale for highest quality
      let src: HTMLCanvasElement | HTMLImageElement = origImg;
      let cw = origImg.width, ch = origImg.height;
      while (cw > tw * 2 || ch > th * 2) {
        const step = document.createElement('canvas');
        step.width = Math.max(tw, Math.ceil(cw / 2));
        step.height = Math.max(th, Math.ceil(ch / 2));
        const sCtx = step.getContext('2d')!;
        sCtx.imageSmoothingEnabled = true; sCtx.imageSmoothingQuality = 'high';
        sCtx.drawImage(src, 0, 0, step.width, step.height);
        src = step; cw = step.width; ch = step.height;
      }
      const canvas = document.createElement('canvas');
      canvas.width = tw; canvas.height = th;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(src, 0, 0, tw, th);
      canvas.toBlob(blob => {
        if (!blob) { toast.error('Error'); setProcessing(false); return; }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `resized_${tw}x${th}_${file?.name || 'image.jpg'}`;
        a.click(); URL.revokeObjectURL(url);
        recordUse();
        toast.success(lang === 'ar' ? 'تم الحفظ بأعلى جودة! ✨' : 'Saved in max quality! ✨');
        setProcessing(false);
      }, file?.type || 'image/jpeg', 1.0);
    } catch { toast.error(lang === 'ar' ? 'حدث خطأ' : 'Error'); setProcessing(false); }
  };

  const limitReached = uses >= maxUses;

  // ── LOCKED ──
  if (!unlocked) {
    return (
      <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="glass-card rounded-2xl p-6 text-center space-y-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/40 border border-orange-100 dark:border-orange-900/50">
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg text-3xl">🖼️</div>
        <div>
          <h3 className="font-bold text-lg text-foreground mb-1">{lang === 'ar' ? '🖼️ معدّل المقاسات الدقيق (مثل كانفا)' : '🖼️ Precision Resizer (like Canva)'}</h3>
          <p className="text-sm text-muted-foreground mb-3">{lang === 'ar' ? 'غيّر أبعاد صورك بدقة بالبكسل أو السم مع الحفاظ على أعلى جودة.' : 'Resize precisely by px or cm at max quality.'}</p>
          <div className="flex flex-wrap gap-2 justify-center mb-3">
            {['Instagram', 'Story', 'YouTube', 'A4'].map(p => (
              <span key={p} className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 px-2 py-0.5 rounded-full font-medium">{p}</span>
            ))}
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 text-xs font-bold mb-4">
            <span className="line-through opacity-70">120 🪙</span>
            <span>🔥 {lang === 'ar' ? 'عرض: 70 نقطة فقط!' : 'Offer: 70 pts only!'}</span>
          </div>
        </div>
        <button onClick={handleUnlock} className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold shadow-md active:scale-95 transition-all flex items-center justify-center gap-2">
          <Unlock size={18} /> {lang === 'ar' ? 'افتح الأداة (70 🪙)' : 'Unlock Tool (70 🪙)'}
        </button>
      </div>
    );
  }

  // ── UPLOAD SCREEN ──
  if (!file) {
    return (
      <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 p-5 text-white text-center">
          <div className="text-4xl mb-1">🖼️</div>
          <h2 className="text-xl font-extrabold">{lang === 'ar' ? 'معدّل المقاسات' : 'Image Resizer'}</h2>
          <p className="text-white/80 text-xs mt-1">{lang === 'ar' ? 'غيّر حجم صورتك بدون فقدان الجودة' : 'Resize without losing quality'}</p>
          <div className="mt-2 inline-flex bg-white/20 rounded-full px-3 py-1 text-xs font-bold">{uses}/{maxUses} {lang === 'ar' ? 'محاولة اليوم' : 'uses today'}</div>
        </div>
        {limitReached && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-2xl p-4 text-center space-y-3">
            <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">⏳ {lang === 'ar' ? 'استنفدت محاولاتك!' : 'Daily limit reached!'}</p>
            <button onClick={watchAd} disabled={watching} className="mx-auto flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold disabled:opacity-60">
              <PlayCircle size={14} /> {watching ? (lang === 'ar' ? 'جاري العرض...' : 'Watching...') : (lang === 'ar' ? 'شاهد إعلاناً (+1)' : 'Watch Ad (+1)')}
            </button>
          </div>
        )}
        <label className={`relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-950/20 p-10 ${limitReached ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-orange-100/40'} transition-colors`}>
          {!limitReached && <input type="file" accept="image/*" className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />}
          <div className="text-5xl mb-3">🖼️</div>
          <p className="font-extrabold text-orange-700 dark:text-orange-300 text-center text-base">{lang === 'ar' ? 'ارفع صورتك هنا' : 'Upload your image here'}</p>
          <p className="text-sm text-muted-foreground mt-1">JPG · PNG · WebP · GIF</p>
        </label>
      </div>
    );
  }

  // ── EDITOR (Canva-like) ──
  const pxW = toPx(width), pxH = toPx(height);
  const scale = pxW > 0 && pxH > 0 ? Math.min(300 / pxW, 180 / pxH, 1) : 1;
  const pvW = Math.max(40, Math.round(pxW * scale));
  const pvH = Math.max(40, Math.round(pxH * scale));

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => { setFile(null); setPreviewUrl(null); setOrigImg(null); }} className="text-orange-600 font-bold text-sm">{lang === 'ar' ? '→ رجوع' : '← Back'}</button>
        <div className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-3 py-1 rounded-full font-bold">{uses}/{maxUses} {lang === 'ar' ? 'محاولة' : 'uses'}</div>
      </div>

      {/* Live Preview Canvas Area */}
      <div className="bg-[#f0f4f8] dark:bg-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[220px] border border-border relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#aaa 1px,transparent 1px),linear-gradient(90deg,#aaa 1px,transparent 1px)', backgroundSize: '20px 20px' }} />
        {previewUrl && (
          <div className="relative z-10 shadow-2xl" style={{ width: pvW, height: pvH }}>
            <img src={previewUrl} className="w-full h-full object-fill" alt="preview" />
            {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((p, i) => (
              <div key={i} className={`absolute w-3 h-3 bg-orange-500 border-2 border-white rounded-sm -m-1.5 ${p}`} />
            ))}
          </div>
        )}
        <div className="absolute bottom-2 right-2 z-10 bg-black/60 text-white text-[10px] font-mono px-2 py-0.5 rounded">{pxW} × {pxH} px</div>
      </div>

      {/* Presets */}
      <div>
        <p className="text-xs font-bold text-muted-foreground mb-2">{lang === 'ar' ? 'مقاسات سريعة:' : 'Quick presets:'}</p>
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => applyPreset(p.w, p.h)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary border border-border text-xs font-bold hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors whitespace-nowrap">
              <span>{p.icon}</span> {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dimensions Panel */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
        <div className="flex bg-secondary rounded-xl p-1">
          <button onClick={() => switchUnit('px')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${unit === 'px' ? 'bg-orange-500 text-white shadow' : 'text-muted-foreground'}`}>Pixels (px)</button>
          <button onClick={() => switchUnit('cm')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${unit === 'cm' ? 'bg-orange-500 text-white shadow' : 'text-muted-foreground'}`}>سنتيمتر (cm)</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-muted-foreground uppercase">{lang === 'ar' ? 'العرض' : 'Width'} ({unit})</label>
            <input type="number" value={width} min={1} onChange={e => onWidthChange(Number(e.target.value))}
              className="w-full text-center text-lg font-mono font-bold bg-secondary border-none rounded-xl p-3 outline-none focus:ring-2 ring-orange-400" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-muted-foreground uppercase">{lang === 'ar' ? 'الطول' : 'Height'} ({unit})</label>
            <input type="number" value={height} min={1} onChange={e => onHeightChange(Number(e.target.value))}
              className="w-full text-center text-lg font-mono font-bold bg-secondary border-none rounded-xl p-3 outline-none focus:ring-2 ring-orange-400" />
          </div>
        </div>
        <button onClick={() => setLockRatio(!lockRatio)}
          className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-colors ${lockRatio ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' : 'bg-secondary text-muted-foreground'}`}>
          <Lock size={14} /> {lockRatio ? (lang === 'ar' ? '🔒 نسبة الأبعاد مقفولة' : '🔒 Ratio locked') : (lang === 'ar' ? '🔓 نسبة الأبعاد حرة' : '🔓 Ratio free')}
        </button>
      </div>

      {limitReached && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-2xl p-4 text-center space-y-3">
          <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">⏳ {lang === 'ar' ? 'استنفدت محاولاتك!' : 'Daily limit reached!'}</p>
          <button onClick={watchAd} disabled={watching} className="mx-auto flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold disabled:opacity-60">
            <PlayCircle size={14} /> {watching ? (lang === 'ar' ? 'جاري العرض...' : 'Watching...') : (lang === 'ar' ? 'شاهد إعلاناً (+1)' : 'Watch Ad (+1)')}
          </button>
        </div>
      )}

      <button onClick={doResize} disabled={processing || limitReached || !origImg}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold text-base shadow-lg disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2">
        {processing ? <><span className="animate-spin">⚙️</span> {lang === 'ar' ? 'جاري المعالجة...' : 'Processing...'}</> : <><Download size={18} /> {lang === 'ar' ? 'حفظ بأعلى جودة' : 'Save in Max Quality'}</>}
      </button>
    </div>
  );
};

export default ImageResizer;
