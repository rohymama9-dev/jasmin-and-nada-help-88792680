import { useState, useEffect, useRef, useCallback } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Download, X, PlayCircle, Crop, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
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
  const [canvasWidth, setCanvasWidth] = useState(800);
  const [canvasHeight, setCanvasHeight] = useState(800);
  const [imageX, setImageX] = useState(0);
  const [imageY, setImageY] = useState(0);
  const [imageScale, setImageScale] = useState(1);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isResizingCanvas, setIsResizingCanvas] = useState<'tl' | 'tr' | 'bl' | 'br' | 't' | 'r' | 'b' | 'l' | null>(null);
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
      // Fit image to canvas initially
      const scale = Math.min(800 / img.width, 800 / img.height, 1);
      setCanvasWidth(800);
      setCanvasHeight(800);
      setImageScale(scale);
      setImageX((800 - img.width * scale) / 2);
      setImageY((800 - img.height * scale) / 2);
    };
    img.src = url;
  };

  const handleImageMouseDown = (e: React.MouseEvent) => {
    if (!originalImg) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(true);
    setDragStart({
      x: e.clientX - imageX,
      y: e.clientY - imageY
    });
  };

  const handleCanvasMouseDown = (handle: 'tl' | 'tr' | 'bl' | 'br' | 't' | 'r' | 'b' | 'l') => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingCanvas(handle);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingImage) {
      setImageX(e.clientX - dragStart.x);
      setImageY(e.clientY - dragStart.y);
    } else if (isResizingCanvas) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      
      switch(isResizingCanvas) {
        case 'br':
          setCanvasWidth(Math.max(100, canvasWidth + dx));
          setCanvasHeight(Math.max(100, canvasHeight + dy));
          break;
        case 'bl':
          setCanvasWidth(Math.max(100, canvasWidth - dx));
          setCanvasHeight(Math.max(100, canvasHeight + dy));
          setImageX(imageX + dx);
          break;
        case 'tr':
          setCanvasWidth(Math.max(100, canvasWidth + dx));
          setCanvasHeight(Math.max(100, canvasHeight - dy));
          setImageY(imageY + dy);
          break;
        case 'tl':
          setCanvasWidth(Math.max(100, canvasWidth - dx));
          setCanvasHeight(Math.max(100, canvasHeight - dy));
          setImageX(imageX + dx);
          setImageY(imageY + dy);
          break;
        case 'r':
          setCanvasWidth(Math.max(100, canvasWidth + dx));
          break;
        case 'l':
          setCanvasWidth(Math.max(100, canvasWidth - dx));
          setImageX(imageX + dx);
          break;
        case 'b':
          setCanvasHeight(Math.max(100, canvasHeight + dy));
          break;
        case 't':
          setCanvasHeight(Math.max(100, canvasHeight - dy));
          setImageY(imageY + dy);
          break;
      }
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDraggingImage(false);
    setIsResizingCanvas(null);
  };

  const handleMouseLeave = () => {
    setIsDraggingImage(false);
    setIsResizingCanvas(null);
  };

  const doResize = async () => {
    if (!originalImg || uses >= maxUses) return;
    setProcessing(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      ctx.drawImage(
        originalImg,
        imageX,
        imageY,
        originalImg.width * imageScale,
        originalImg.height * imageScale
      );

      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error(lang === 'ar' ? 'حدث خطأ' : 'Error occurred');
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `resized_${canvasWidth}x${canvasHeight}_${file?.name.replace(/\.[^.]+$/, '') || 'image'}.png`;
        a.click();
        URL.revokeObjectURL(url);
        recordUse();
        addPoints?.(1);
        toast.success(lang === 'ar' ? 'تم الحفظ بأعلى جودة! 🎉' : 'Saved in max quality! 🎉');
        setProcessing(false);
      }, 'image/png', 1.0);
    } catch {
      toast.error(lang === 'ar' ? 'حدث خطأ' : 'Error occurred');
      setProcessing(false);
    }
  };

  const reset = () => {
    if (!originalImg) return;
    const scale = Math.min(canvasWidth / originalImg.width, canvasHeight / originalImg.height, 1);
    setImageScale(scale);
    setImageX((canvasWidth - originalImg.width * scale) / 2);
    setImageY((canvasHeight - originalImg.height * scale) / 2);
  };

  const fitToCanvas = () => {
    if (!originalImg) return;
    const scale = Math.min(canvasWidth / originalImg.width, canvasHeight / originalImg.height, 1);
    setImageScale(scale);
    setImageX((canvasWidth - originalImg.width * scale) / 2);
    setImageY((canvasHeight - originalImg.height * scale) / 2);
  };

  const limitReached = uses >= maxUses;

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
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-2xl p-3 text-center space-y-3">
            <p className="font-bold text-amber-700 dark:text-amber-300 text-sm">
              ⏳ {lang === 'ar' ? 'استنفدت محاولاتك اليوم!' : 'Daily limit reached!'}
            </p>
            <button onClick={watchAd} disabled={watchingAd}
              className="mx-auto flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold disabled:opacity-60">
              <PlayCircle size={14} />
              {watchingAd ? (lang === 'ar' ? 'جارٍ العرض...' : 'Watching...') : (lang === 'ar' ? 'شاهد إعلاناً (+1)' : 'Watch Ad (+1)')}
            </button>
          </div>
        )}

        <label className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-950/20 p-8 ${limitReached ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-orange-100/40'} transition-colors`}>
          {!limitReached && <input type="file" accept="image/*" className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            onChange={e => e.target.files?.[0] && handleFileChange(e.target.files[0])} />}
          <div className="text-5xl mb-2">🖼️</div>
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
    <div 
      dir={lang === 'ar' ? 'rtl' : 'ltr'} 
      className="space-y-4"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center justify-between">
        <button onClick={() => { setFile(null); setOriginalImg(null); }}
          className="text-orange-600 font-bold text-sm flex items-center gap-1">
          {lang === 'ar' ? '→ رجوع' : '← Back'}
        </button>
        <div className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-3 py-1 rounded-full font-bold">
          {uses}/{maxUses} {lang === 'ar' ? 'محاولة' : 'uses'}
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex justify-center items-center min-h-[400px] bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 border border-border">
        <div 
          ref={previewRef}
          className="relative bg-white shadow-xl"
          style={{ width: canvasWidth, height: canvasHeight }}
        >
          {/* Grid Background */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(45deg, #eee 25%, transparent 25%), linear-gradient(-45deg, #eee 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #eee 75%), linear-gradient(-45deg, transparent 75%, #eee 75%)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
            opacity: 0.5
          }} />

          {/* Image */}
          {originalImg && (
            <div
              onMouseDown={handleImageMouseDown}
              style={{
                position: 'absolute',
                left: imageX,
                top: imageY,
                width: originalImg.width * imageScale,
                height: originalImg.height * imageScale,
                cursor: isDraggingImage ? 'grabbing' : 'grab',
                userSelect: 'none'
              }}
            >
              <img
                src={originalImg.src}
                alt="Preview"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  pointerEvents: 'none'
                }}
              />
            </div>
          )}

          {/* Resize Handles */}
          <div
            onMouseDown={handleCanvasMouseDown('tl')}
            className="absolute -top-2 -left-2 w-4 h-4 bg-orange-500 rounded-full border-2 border-white cursor-nwse-resize hover:scale-125 transition-transform shadow-md"
          />
          <div
            onMouseDown={handleCanvasMouseDown('tr')}
            className="absolute -top-2 -right-2 w-4 h-4 bg-orange-500 rounded-full border-2 border-white cursor-nesw-resize hover:scale-125 transition-transform shadow-md"
          />
          <div
            onMouseDown={handleCanvasMouseDown('bl')}
            className="absolute -bottom-2 -left-2 w-4 h-4 bg-orange-500 rounded-full border-2 border-white cursor-nesw-resize hover:scale-125 transition-transform shadow-md"
          />
          <div
            onMouseDown={handleCanvasMouseDown('br')}
            className="absolute -bottom-2 -right-2 w-4 h-4 bg-orange-500 rounded-full border-2 border-white cursor-nwse-resize hover:scale-125 transition-transform shadow-md"
          />
          <div
            onMouseDown={handleCanvasMouseDown('t')}
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-orange-500 rounded-full border-2 border-white cursor-ns-resize hover:scale-125 transition-transform shadow-md"
          />
          <div
            onMouseDown={handleCanvasMouseDown('b')}
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-orange-500 rounded-full border-2 border-white cursor-ns-resize hover:scale-125 transition-transform shadow-md"
          />
          <div
            onMouseDown={handleCanvasMouseDown('l')}
            className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-orange-500 rounded-full border-2 border-white cursor-ew-resize hover:scale-125 transition-transform shadow-md"
          />
          <div
            onMouseDown={handleCanvasMouseDown('r')}
            className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-orange-500 rounded-full border-2 border-white cursor-ew-resize hover:scale-125 transition-transform shadow-md"
          />

          {/* Dimensions Label */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-black/80 text-white px-2 py-1 rounded text-xs font-mono whitespace-nowrap">
            {Math.round(canvasWidth)} × {Math.round(canvasHeight)} px
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-muted-foreground uppercase">{lang === 'ar' ? 'العرض' : 'Width'} (px)</label>
            <input type="number" value={Math.round(canvasWidth)} min={100} max={5000}
              onChange={e => setCanvasWidth(Math.max(100, Number(e.target.value)))}
              className="w-full text-center text-lg font-mono font-bold bg-secondary border-none rounded-xl p-3 outline-none focus:ring-2 ring-orange-400" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-muted-foreground uppercase">{lang === 'ar' ? 'الطول' : 'Height'} (px)</label>
            <input type="number" value={Math.round(canvasHeight)} min={100} max={5000}
              onChange={e => setCanvasHeight(Math.max(100, Number(e.target.value)))}
              className="w-full text-center text-lg font-mono font-bold bg-secondary border-none rounded-xl p-3 outline-none focus:ring-2 ring-orange-400" />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => setImageScale(Math.max(0.1, imageScale - 0.1))}
            className="p-2 rounded-xl bg-secondary hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors flex items-center justify-center"
          >
            <ZoomOut size={18} />
          </button>
          <button
            onClick={() => setImageScale(Math.min(5, imageScale + 0.1))}
            className="p-2 rounded-xl bg-secondary hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors flex items-center justify-center"
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={reset}
            className="p-2 rounded-xl bg-secondary hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors flex items-center justify-center"
          >
            <X size={18} />
          </button>
          <button
            onClick={fitToCanvas}
            className="p-2 rounded-xl bg-secondary hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors flex items-center justify-center"
          >
            <Maximize2 size={18} />
          </button>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          {lang === 'ar' ? 'اسحب الصورة للتحريك، اسحب الأزرار البرتقالية لتغيير حجم اللوحة' : 'Drag the image to move, drag orange handles to resize canvas'}
        </div>
      </div>

      {limitReached && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-2xl p-3 text-center space-y-3">
          <p className="font-bold text-amber-700 dark:text-amber-300 text-sm">
            ⏳ {lang === 'ar' ? 'استنفدت محاولاتك!' : 'Daily limit reached!'}
          </p>
          <button onClick={watchAd} disabled={watchingAd}
            className="mx-auto flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold disabled:opacity-60">
            <PlayCircle size={14} />
            {watchingAd ? (lang === 'ar' ? 'جارٍ العرض...' : 'Watching...') : (lang === 'ar' ? 'شاهد إعلاناً (+1)' : 'Watch Ad (+1)')}
          </button>
        </div>
      )}

      <button onClick={doResize} disabled={processing || limitReached || !originalImg}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold text-base shadow-lg disabled:opacity-60 active:scale-95 transition-all flex items-center justify-center gap-2">
        {processing
          ? <><span className="animate-spin">⚙️</span> {lang === 'ar' ? 'جارٍ المعالجة...' : 'Processing...'}</>
          : <><Download size={18} /> {lang === 'ar' ? 'حفظ بأعلى جودة' : 'Save in Max Quality'}</>}
      </button>
    </div>
  );
};

export default ImageResizer;
