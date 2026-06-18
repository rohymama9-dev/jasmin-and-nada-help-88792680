import { useState, useEffect, useRef, useCallback } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Download, X, PlayCircle, Crop, ZoomIn, ZoomOut } from 'lucide-react';
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

interface Props {
  points?: number;
  addPoints?: (n: number) => void;
}

const ImageResizer = ({ points, addPoints }: Props = {}) => {
  const { lang } = useLang();
  const [uses, setUses] = useState(0);
  const [maxUses, setMaxUses] = useState(DEFAULT_MAX_USES);
  const [file, setFile] = useState<File | null>(null);
  const [originalImg, setOriginalImg] = useState<HTMLImageElement | null>(null);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(800);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);
  const [watchingAd, setWatchingAd] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

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

  const handleFileChange = (f: File) => {
    const url = URL.createObjectURL(f);
    setFile(f);
    const img = new Image();
    img.onload = () => {
      setOriginalImg(img);
      setWidth(Math.min(800, img.width));
      setHeight(Math.min(800, img.height));
      setScale(1);
      setPosition({ x: 0, y: 0 });
    };
    img.src = url;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!originalImg) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !originalImg) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const reset = () => {
    if (!originalImg) return;
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const doResize = async () => {
    if (!originalImg || uses >= maxUses) return;
    setProcessing(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Calculate the drawing dimensions
      const drawWidth = originalImg.width * scale;
      const drawHeight = originalImg.height * scale;
      const drawX = (width / 2) - (drawWidth / 2) + position.x;
      const drawY = (height / 2) - (drawHeight / 2) + position.y;

      ctx.drawImage(originalImg, drawX, drawY, drawWidth, drawHeight);

      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error(lang === 'ar' ? 'حدث خطأ' : 'Error occurred');
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `resized_${width}x${height}_${file?.name.replace(/\.[^.]+$/, '') || 'image'}.png`;
        a.click();
        URL.revokeObjectURL(url);
        recordUse();
        addPoints?.(1);
        toast.success(lang === 'ar' ? 'تم الحفظ بأعلى جودة! ✨' : 'Saved in high quality! ✨');
        setProcessing(false);
      }, 'image/png', 1.0);
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

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => { setFile(null); setOriginalImg(null); }}
          className="text-orange-600 font-bold text-sm flex items-center gap-1">
          {lang === 'ar' ? '→ رجوع' : '← Back'}
        </button>
        <div className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-3 py-1 rounded-full font-bold">
          {uses}/{maxUses} {lang === 'ar' ? 'محاولة' : 'uses'}
        </div>
      </div>

      {/* Interactive Canvas Preview */}
      <div
        ref={previewRef}
        className="bg-[#f0f4f8] dark:bg-slate-800 rounded-2xl border border-border relative overflow-hidden flex items-center justify-center"
        style={{ width: '100%', aspectRatio: '1/1', minHeight: 300 }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Checkerboard background for transparency */}
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' }}
        />

        {/* Crop frame indicator */}
        <div className="absolute border-4 border-orange-500 rounded-lg pointer-events-none" style={{ width: Math.min(300, width/2), height: Math.min(300, height/2) }} />

        {/* Image overlay */}
        {originalImg && (
          <img
            src={originalImg.src}
            alt="preview"
            draggable={false}
            className="pointer-events-none select-none shadow-xl"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              maxWidth: 'none',
              maxHeight: 'none'
            }}
          />
        )}

        {isDragging && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-bold">
            {lang === 'ar' ? 'جارِ السحب...' : 'Dragging...'}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-muted-foreground uppercase">{lang === 'ar' ? 'العرض' : 'Width'} (px)</label>
            <input type="number" value={width} min={1} max={5000}
              onChange={e => setWidth(Math.max(1, Number(e.target.value)))}
              className="w-full text-center text-lg font-mono font-bold bg-secondary border-none rounded-xl p-3 outline-none focus:ring-2 ring-orange-400" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-muted-foreground uppercase">{lang === 'ar' ? 'الطول' : 'Height'} (px)</label>
            <input type="number" value={height} min={1} max={5000}
              onChange={e => setHeight(Math.max(1, Number(e.target.value)))}
              className="w-full text-center text-lg font-mono font-bold bg-secondary border-none rounded-xl p-3 outline-none focus:ring-2 ring-orange-400" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-extrabold text-muted-foreground">{lang === 'ar' ? 'المقياس' : 'Scale'}: {Math.round(scale * 100)}%</span>
            <div className="flex gap-2">
              <button onClick={() => setScale(Math.max(0.1, scale - 0.1))} className="p-1.5 rounded-lg bg-secondary hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
                <ZoomOut size={18} />
              </button>
              <button onClick={() => setScale(Math.min(5, scale + 0.1))} className="p-1.5 rounded-lg bg-secondary hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
                <ZoomIn size={18} />
              </button>
              <button onClick={reset} className="px-3 py-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-bold transition-colors">
                {lang === 'ar' ? 'إعادة ضبط' : 'Reset'}
              </button>
            </div>
          </div>
          <input type="range" min={0.1} max={5} step={0.05} value={scale}
            onChange={e => setScale(Number(e.target.value))}
            className="w-full accent-orange-500"
          />
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
