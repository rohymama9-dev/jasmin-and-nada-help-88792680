import { useEffect, useMemo, useRef, useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { usePoints } from '@/hooks/usePoints';
import { Crop, Download, PlayCircle, Unlock, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';

const getUsesKey = () => { const d = new Date(); return `app-imageresizer-uses-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };
const getMaxUsesKey = () => { const d = new Date(); return `app-imageresizer-maxuses-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };
const UNLOCK_KEY = 'app-imageresizer-unlocked';
const DEFAULT_MAX_USES = 3;

type DragMode = 'move' | 'top' | 'bottom' | 'left' | 'right' | 'tl' | 'tr' | 'bl' | 'br' | null;
type Rect = { x: number; y: number; w: number; h: number };

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const ImageResizer = () => {
  const { lang } = useLang();
  const { points, addPoints } = usePoints();
  const [uses, setUses] = useState(0);
  const [maxUses, setMaxUses] = useState(DEFAULT_MAX_USES);
  const [watchingAd, setWatchingAd] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Globally store unlock state
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem(UNLOCK_KEY) === 'true');

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

  const handleUnlock = () => {
    if (points >= 80) {
      addPoints(-80);
      localStorage.setItem(UNLOCK_KEY, 'true');
      setUnlocked(true);
      toast.success(t('تم فتح الأداة بنجاح! 🌟', 'Unlocked successfully! 🌟'));
    } else {
      toast.error(t('نقاطك غير كافية', 'Not enough points'));
    }
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
      setCanvasW(w); setCanvasH(h);
      const pad = 24;
      setRect({ x: pad, y: pad, w: Math.max(50, w - pad * 2), h: Math.max(50, h - pad * 2) });
    };
    image.src = url;
  };

  useEffect(() => {
    if (!img) return;
    setRect(prev => {
      const minW = 10; const minH = 10;
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
    const minW = 10; const minH = 10;

    let newX = base.x; let newY = base.y; let newW = base.w; let newH = base.h;

    if (dragMode === 'move') {
      newX = clamp(base.x + dx, 0, Math.max(0, canvasW - base.w));
      newY = clamp(base.y + dy, 0, Math.max(0, canvasH - base.h));
    } else {
      if (dragMode.includes('l')) { newX = clamp(base.x + dx, 0, base.x + base.w - minW); newW = base.w + (base.x - newX); }
      if (dragMode.includes('r')) { newW = clamp(base.w + dx, minW, canvasW - base.x); }
      if (dragMode.includes('t')) { newY = clamp(base.y + dy, 0, base.y + base.h - minH); newH = base.h + (base.y - newY); }
      if (dragMode.includes('b')) { newH = clamp(base.h + dy, minH, canvasH - base.y); }
    }
    setRect({ x: newX, y: newY, w: newW, h: newH });
  };

  const endDrag = () => { setDragMode(null); dragStartRef.current = null; rectStartRef.current = null; };

  const exportPng = async () => {
    if (!img || limitReached) return;
    setProcessing(true);
    try {
      const out = document.createElement('canvas');
      out.width = canvasW; out.height = canvasH;
      const ctx = out.getContext('2d');
      if (!ctx) throw new Error('no ctx');
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvasW, canvasH);
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h);
      const blob = await new Promise<Blob>((res, rej) => out.toBlob(b => (b ? res(b) : rej(new Error('no blob'))), 'image/png', 1.0));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `resized_${file?.name || 'image'}.png`; a.click();
      URL.revokeObjectURL(url);
      
      const n = uses + 1;
      setUses(n); localStorage.setItem(getUsesKey(), n.toString());
      toast.success(t('تم تحميل الصورة!', 'Image downloaded!'));
    } catch (e) {
      toast.error(t('فشل حفظ الصورة', 'Failed to save image'));
    }
    setProcessing(false);
  };

  const updateDimension = (type: 'w' | 'h', delta: number) => {
    if (type === 'w') setCanvasW(prev => Math.max(50, prev + delta));
    else setCanvasH(prev => Math.max(50, prev + delta));
  };

  if (!unlocked) {
    return (
      <div className="w-full max-w-md mx-auto mt-10 p-6 glass-card rounded-3xl text-center space-y-4">
        <Lock size={48} className="mx-auto text-primary" />
        <h2 className="text-xl font-bold">{t('تغيير أبعاد الصورة بدقة', 'Precision Image Resizer')}</h2>
        <p className="text-sm text-muted-foreground">{t('تحتاج إلى فتح هذه الأداة للوصول إلى دقة لا نهائية وتحديد مقاسات القماش بالبيكسل.', 'Unlock to get infinite precision and pixel-perfect canvas sizing.')}</p>
        <button onClick={handleUnlock} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:scale-105 transition-transform flex justify-center items-center gap-2">
          <PlayCircle /> {t('فتح بـ 80 نقطة', 'Unlock for 80 points')}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 animate-in fade-in zoom-in-95 duration-500">
      <div className="glass-card rounded-3xl p-6 shadow-sm border border-border relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
        <div className="flex items-center gap-3 mb-6 border-b border-border/50 pb-4">
          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground shadow-sm">
            <Crop size={20} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-foreground tracking-tight">{t('التحكم الدقيق (Canvas)', 'Precision Canvas')}</h2>
            <p className="text-sm text-muted-foreground">{t('تغيير حجم الإطار أو الصورة نفسها بحرية', 'Resize the canvas or the image freely')}</p>
          </div>
        </div>

        {!img ? (
          <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:bg-secondary/30 transition-colors group">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Download className="w-10 h-10 text-muted-foreground mb-3 group-hover:text-primary transition-colors" />
              <p className="mb-2 text-sm text-muted-foreground font-bold">{t('اضغط أو اسحب الصورة هنا', 'Click or drag image here')}</p>
            </div>
            <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
          </label>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4 items-end bg-secondary/20 p-4 rounded-2xl border border-border">
              <div className="flex-1 min-w-[120px] space-y-1 relative">
                <label className="text-xs font-medium text-muted-foreground">{t('العرض (px)', 'Width (px)')}</label>
                <div className="relative flex items-center">
                  <button onClick={() => updateDimension('w', -10)} className="absolute left-1 p-1 hover:bg-secondary rounded-lg"><ArrowDown size={14}/></button>
                  <input type="number" value={canvasW} onChange={e => setCanvasW(Number(e.target.value))} className="w-full bg-background border border-border rounded-xl px-8 py-2 text-sm font-bold text-center" />
                  <button onClick={() => updateDimension('w', 10)} className="absolute right-1 p-1 hover:bg-secondary rounded-lg"><ArrowUp size={14}/></button>
                </div>
              </div>
              <div className="flex-1 min-w-[120px] space-y-1 relative">
                <label className="text-xs font-medium text-muted-foreground">{t('الارتفاع (px)', 'Height (px)')}</label>
                <div className="relative flex items-center">
                  <button onClick={() => updateDimension('h', -10)} className="absolute left-1 p-1 hover:bg-secondary rounded-lg"><ArrowDown size={14}/></button>
                  <input type="number" value={canvasH} onChange={e => setCanvasH(Number(e.target.value))} className="w-full bg-background border border-border rounded-xl px-8 py-2 text-sm font-bold text-center" />
                  <button onClick={() => updateDimension('h', 10)} className="absolute right-1 p-1 hover:bg-secondary rounded-lg"><ArrowUp size={14}/></button>
                </div>
              </div>
              <button onClick={() => setImg(null)} className="py-2 px-4 rounded-xl border border-border text-xs font-bold hover:bg-secondary hover:text-foreground">
                {t('تغيير الصورة', 'Change Image')}
              </button>
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-inner flex items-center justify-center relative touch-none bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3ne1/sMwGoBgNIwGACw1aH7k+O4mAAaHwTAYDIORQAYiDQB0kCI1E61wHAAAAABJRU5ErkJggg==')]">
              <div className="relative shadow-2xl" style={{ width: '100%', maxWidth: '100%', aspectRatio: `${canvasW}/${canvasH}`, maxHeight: '60vh' }}>
                <canvas ref={canvasRef} width={canvasW} height={canvasH} className="w-full h-full block bg-white" />
                <div className="absolute inset-0 z-10 touch-none" onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
                  <div 
                    className="absolute border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] cursor-move touch-none"
                    style={{ left: `${(rect.x/canvasW)*100}%`, top: `${(rect.y/canvasH)*100}%`, width: `${(rect.w/canvasW)*100}%`, height: `${(rect.h/canvasH)*100}%` }}
                    onPointerDown={beginDrag('move')}
                  >
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                       <div className="border-r border-b border-white mix-blend-difference" /><div className="border-r border-b border-white mix-blend-difference" /><div className="border-b border-white mix-blend-difference" />
                       <div className="border-r border-b border-white mix-blend-difference" /><div className="border-r border-b border-white mix-blend-difference" /><div className="border-b border-white mix-blend-difference" />
                       <div className="border-r border-white mix-blend-difference" /><div className="border-r border-white mix-blend-difference" /><div />
                    </div>
                    {/* Handles */}
                    <div className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-primary rounded-full cursor-nwse-resize" onPointerDown={e => { e.stopPropagation(); beginDrag('tl')(e); }} />
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-primary rounded-full cursor-ns-resize" onPointerDown={e => { e.stopPropagation(); beginDrag('top')(e); }} />
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-primary rounded-full cursor-nesw-resize" onPointerDown={e => { e.stopPropagation(); beginDrag('tr')(e); }} />
                    <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-primary rounded-full cursor-ew-resize" onPointerDown={e => { e.stopPropagation(); beginDrag('right')(e); }} />
                    <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-primary rounded-full cursor-nwse-resize" onPointerDown={e => { e.stopPropagation(); beginDrag('br')(e); }} />
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-primary rounded-full cursor-ns-resize" onPointerDown={e => { e.stopPropagation(); beginDrag('bottom')(e); }} />
                    <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-primary rounded-full cursor-nesw-resize" onPointerDown={e => { e.stopPropagation(); beginDrag('bl')(e); }} />
                    <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-primary rounded-full cursor-ew-resize" onPointerDown={e => { e.stopPropagation(); beginDrag('left')(e); }} />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setFile(null); setImg(null); }} className="flex-1 py-3 bg-secondary text-foreground rounded-xl font-bold btn-interactive">
                {t('إلغاء', 'Cancel')}
              </button>
              <button onClick={exportPng} disabled={processing} className="flex-[2] py-3 bg-primary text-primary-foreground rounded-xl font-bold flex justify-center items-center gap-2 btn-interactive disabled:opacity-50">
                <Download size={18} /> {processing ? t('جاري الحفظ...', 'Saving...') : t('تحميل الصورة', 'Download')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageResizer;
