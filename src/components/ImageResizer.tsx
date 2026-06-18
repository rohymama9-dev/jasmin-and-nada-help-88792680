import { useEffect, useMemo, useRef, useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Crop, Download, PlayCircle } from 'lucide-react';
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

type DragMode = 'move' | 'top' | 'bottom' | 'left' | 'right' | null;

type Rect = { x: number; y: number; w: number; h: number };

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const ImageResizer = ({ addPoints }: Props = {}) => {
  const { lang } = useLang();
  const [uses, setUses] = useState(0);
  const [maxUses, setMaxUses] = useState(DEFAULT_MAX_USES);
  const [watchingAd, setWatchingAd] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);

  const [canvasW, setCanvasW] = useState(800);
  const [canvasH, setCanvasH] = useState(800);

  const [rect, setRect] = useState<Rect>({ x: 0, y: 0, w: 0, h: 0 });
  const [dragMode, setDragMode] = useState<DragMode>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const rectStartRef = useRef<Rect | null>(null);

  useEffect(() => {
    setUses(Number(localStorage.getItem(getUsesKey()) || 0));
    setMaxUses(Number(localStorage.getItem(getMaxUsesKey()) || DEFAULT_MAX_USES));
  }, []);

  const limitReached = uses >= maxUses;

  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  const watchAd = () => {
    setWatchingAd(true);
    setTimeout(() => {
      setWatchingAd(false);
      const nm = maxUses + 1;
      setMaxUses(nm);
      localStorage.setItem(getMaxUsesKey(), nm.toString());
      toast.success(lang === 'ar' ? 'محاولة إضافية!' : '+1 use added!');
    }, 3000);
  };

  const recordUse = () => {
    const n = uses + 1;
    setUses(n);
    localStorage.setItem(getUsesKey(), n.toString());
  };

  const getCanvasPoint = (clientX: number, clientY: number) => {
    const el = canvasRef.current;
    if (!el) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    const x = ((clientX - r.left) / r.width) * canvasW;
    const y = ((clientY - r.top) / r.height) * canvasH;
    return { x, y };
  };

  const loadImage = (f: File) => {
    const url = URL.createObjectURL(f);
    const image = new Image();
    image.onload = () => {
      setImg(image);
      const w = Math.min(1000, image.width);
      const h = Math.min(1000, image.height);
      setCanvasW(w);
      setCanvasH(h);
      const pad = 24;
      const fitW = Math.max(50, w - pad * 2);
      const fitH = Math.max(50, h - pad * 2);
      setRect({ x: pad, y: pad, w: fitW, h: fitH });
    };
    image.src = url;
  };

  useEffect(() => {
    if (!img) return;
    setRect(prev => {
      const minW = 10;
      const minH = 10;
      const w = clamp(prev.w, minW, Math.max(minW, canvasW));
      const h = clamp(prev.h, minH, Math.max(minH, canvasH));
      const x = clamp(prev.x, 0, Math.max(0, canvasW - w));
      const y = clamp(prev.y, 0, Math.max(0, canvasH - h));
      return { x, y, w, h };
    });
  }, [canvasW, canvasH, img]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasW, canvasH);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasW, canvasH);
    if (!img || rect.w <= 0 || rect.h <= 0) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h);
  }, [img, rect, canvasW, canvasH]);

  const beginDrag = (mode: DragMode) => (e: React.PointerEvent) => {
    if (!img || limitReached) return;
    const pt = getCanvasPoint(e.clientX, e.clientY);
    dragStartRef.current = pt;
    rectStartRef.current = rect;
    setDragMode(mode);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragMode || !dragStartRef.current || !rectStartRef.current || !img) return;
    const cur = getCanvasPoint(e.clientX, e.clientY);
    const start = dragStartRef.current;
    const base = rectStartRef.current;
    const dx = cur.x - start.x;
    const dy = cur.y - start.y;

    const minW = 10;
    const minH = 10;

    if (dragMode === 'move') {
      const x = clamp(base.x + dx, 0, Math.max(0, canvasW - base.w));
      const y = clamp(base.y + dy, 0, Math.max(0, canvasH - base.h));
      setRect({ x, y, w: base.w, h: base.h });
      return;
    }

    if (dragMode === 'left') {
      const newX = clamp(base.x + dx, 0, base.x + base.w - minW);
      const newW = base.w + (base.x - newX);
      setRect({ x: newX, y: base.y, w: newW, h: base.h });
      return;
    }

    if (dragMode === 'right') {
      const newW = clamp(base.w + dx, minW, canvasW - base.x);
      setRect({ x: base.x, y: base.y, w: newW, h: base.h });
      return;
    }

    if (dragMode === 'top') {
      const newY = clamp(base.y + dy, 0, base.y + base.h - minH);
      const newH = base.h + (base.y - newY);
      setRect({ x: base.x, y: newY, w: base.w, h: newH });
      return;
    }

    if (dragMode === 'bottom') {
      const newH = clamp(base.h + dy, minH, canvasH - base.y);
      setRect({ x: base.x, y: base.y, w: base.w, h: newH });
      return;
    }
  };

  const endDrag = () => {
    setDragMode(null);
    dragStartRef.current = null;
    rectStartRef.current = null;
  };

  const exportPng = async () => {
    if (!img || limitReached) return;
    setProcessing(true);
    try {
      const out = document.createElement('canvas');
      out.width = canvasW;
      out.height = canvasH;
      const ctx = out.getContext('2d');
      if (!ctx) throw new Error('no ctx');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasW, canvasH);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h);
      const blob = await new Promise<Blob>((resolve, reject) => {
        out.toBlob(b => (b ? resolve(b) : reject(new Error('no blob'))), 'image/png', 1.0);
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `canvas_${canvasW}x${canvasH}_${file?.name.replace(/\.[^.]+$/, '') || 'image'}.png`;
      a.click();
      URL.revokeObjectURL(url);
      recordUse();
      addPoints?.(1);
      toast.success(t('تم الحفظ بأعلى جودة!', 'Saved in max quality!'));
    } catch {
      toast.error(t('حدث خطأ أثناء الحفظ', 'Save failed'));
    } finally {
      setProcessing(false);
    }
  };

  const rectText = useMemo(() => `${Math.round(rect.w)} × ${Math.round(rect.h)}`, [rect.w, rect.h]);

  if (!file) {
    return (
      <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 p-5 text-white text-center">
          <div className="w-14 h-14 mx-auto bg-white/20 rounded-2xl flex items-center justify-center mb-2">
            <Crop size={28} />
          </div>
          <h2 className="text-xl font-extrabold">{t('معدّل القياسات', 'Canvas Resizer')}</h2>
          <p className="text-white/80 text-xs mt-1">{t('اسحب الحواف لتغيير المقاس داخل اللوحة', 'Drag edges to resize freely inside the canvas')}</p>
          <div className="mt-2 inline-flex bg-white/20 rounded-full px-3 py-1 text-xs font-bold">
            {uses}/{maxUses} {t('محاولة اليوم', 'uses today')}
          </div>
        </div>

        {limitReached && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-2xl p-4 text-center space-y-3">
            <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">
              ⏳ {t('استنفدت محاولاتك اليوم!', 'Daily limit reached!')}
            </p>
            <button
              onClick={watchAd}
              disabled={watchingAd}
              className="mx-auto flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold disabled:opacity-60"
            >
              <PlayCircle size={14} />
              {watchingAd ? t('جاري العرض...', 'Watching...') : t('شاهد إعلاناً (+1)', 'Watch Ad (+1)')}
            </button>
          </div>
        )}

        <label className={`relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-950/20 p-10 ${limitReached ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-orange-100/40'} transition-colors`}>
          {!limitReached && (
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              onChange={e => {
                const f = e.target.files?.[0];
                if (!f) return;
                setFile(f);
                loadImage(f);
              }}
            />
          )}
          <div className="text-5xl mb-3">🖼️</div>
          <p className="font-extrabold text-orange-700 dark:text-orange-300 text-center text-base">
            {t('ارفع صورتك هنا', 'Upload your image here')}
          </p>
          <p className="text-sm text-muted-foreground mt-1">{t('JPG · PNG · WebP · GIF وأكثر', 'JPG · PNG · WebP · GIF and more')}</p>
        </label>
      </div>
    );
  }

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => { setFile(null); setImg(null); }}
          className="text-orange-600 font-bold text-sm flex items-center gap-1">
          {t('→ رجوع', '← Back')}
        </button>
        <div className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-3 py-1 rounded-full font-bold">
          {uses}/{maxUses} {t('محاولة', 'uses')}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-muted-foreground uppercase">{t('عرض اللوحة', 'Canvas Width')} (px)</label>
            <input
              type="number"
              value={canvasW}
              min={1}
              max={8000}
              onChange={e => setCanvasW(Math.max(1, Number(e.target.value)))}
              className="w-full text-center text-lg font-mono font-bold bg-secondary border-none rounded-xl p-3 outline-none focus:ring-2 ring-orange-400"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-muted-foreground uppercase">{t('طول اللوحة', 'Canvas Height')} (px)</label>
            <input
              type="number"
              value={canvasH}
              min={1}
              max={8000}
              onChange={e => setCanvasH(Math.max(1, Number(e.target.value)))}
              className="w-full text-center text-lg font-mono font-bold bg-secondary border-none rounded-xl p-3 outline-none focus:ring-2 ring-orange-400"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <p className="font-extrabold text-muted-foreground">{t('مقاس الصورة الآن', 'Image size')}</p>
          <p className="font-mono font-extrabold text-orange-600">{rectText}</p>
        </div>
      </div>

      <div className="relative rounded-2xl border border-border overflow-hidden bg-[#f0f4f8] dark:bg-slate-800">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          }}
        />

        <div className="relative" onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
          <canvas ref={canvasRef} width={canvasW} height={canvasH} className="w-full h-auto block" />

          <div className="absolute inset-0">
            <div
              className="absolute border-2 border-orange-500 bg-orange-500/10 touch-none"
              style={{
                left: `${(rect.x / canvasW) * 100}%`,
                top: `${(rect.y / canvasH) * 100}%`,
                width: `${(rect.w / canvasW) * 100}%`,
                height: `${(rect.h / canvasH) * 100}%`,
              }}
              onPointerDown={beginDrag('move')}
            >
              <div
                className="absolute left-0 top-0 w-full h-2 -translate-y-1/2 bg-orange-500/70 cursor-ns-resize"
                onPointerDown={beginDrag('top')}
              />
              <div
                className="absolute left-0 bottom-0 w-full h-2 translate-y-1/2 bg-orange-500/70 cursor-ns-resize"
                onPointerDown={beginDrag('bottom')}
              />
              <div
                className="absolute left-0 top-0 h-full w-2 -translate-x-1/2 bg-orange-500/70 cursor-ew-resize"
                onPointerDown={beginDrag('left')}
              />
              <div
                className="absolute right-0 top-0 h-full w-2 translate-x-1/2 bg-orange-500/70 cursor-ew-resize"
                onPointerDown={beginDrag('right')}
              />
            </div>
          </div>
        </div>
      </div>

      {limitReached && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-2xl p-4 text-center space-y-3">
          <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">⏳ {t('استنفدت محاولاتك!', 'Daily limit reached!')}</p>
          <button
            onClick={watchAd}
            disabled={watchingAd}
            className="mx-auto flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold disabled:opacity-60"
          >
            <PlayCircle size={14} />
            {watchingAd ? t('جاري العرض...', 'Watching...') : t('شاهد إعلاناً (+1)', 'Watch Ad (+1)')}
          </button>
        </div>
      )}

      <button
        onClick={exportPng}
        disabled={processing || limitReached || !img}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold text-base shadow-lg disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        {processing ? (
          <span>{t('جاري الحفظ...', 'Saving...')}</span>
        ) : (
          <>
            <Download size={18} /> {t('تحميل بأعلى جودة', 'Download Max Quality')}
          </>
        )}
      </button>
    </div>
  );
};

export default ImageResizer;
