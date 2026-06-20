import { useEffect, useRef, useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { Crop, Download } from 'lucide-react';
import { toast } from 'sonner';

/**
 * ImageResizer — simple & crash-free.
 * User uploads an image, sets desired Width/Height via number inputs,
 * preview updates instantly, then downloads the resized PNG.
 * The complex canvas-drag overlay has been removed to prevent crashes.
 */
const ImageResizer = () => {
  const { lang } = useLang();
  const [file, setFile] = useState<File | null>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [origW, setOrigW] = useState(0);
  const [origH, setOrigH] = useState(0);
  const [outW, setOutW] = useState(800);
  const [outH, setOutH] = useState(800);
  const [keepAspect, setKeepAspect] = useState(true);
  const [processing, setProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  // Load image when file changes
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      imgRef.current = image;
      setOrigW(image.naturalWidth);
      setOrigH(image.naturalHeight);
      setOutW(Math.min(1920, image.naturalWidth));
      setOutH(Math.min(1920, image.naturalHeight));
      setImgSrc(url);
    };
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Draw canvas whenever output size changes
  useEffect(() => {
    const c = canvasRef.current;
    const img = imgRef.current;
    if (!c || !img || !imgSrc) return;
    c.width = outW;
    c.height = outH;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, outW, outH);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, outW, outH);
  }, [outW, outH, imgSrc]);

  const handleWidthChange = (val: number) => {
    const w = Math.max(1, Math.min(9999, val || 1));
    setOutW(w);
    if (keepAspect && origW > 0 && origH > 0) {
      setOutH(Math.round((w / origW) * origH));
    }
  };

  const handleHeightChange = (val: number) => {
    const h = Math.max(1, Math.min(9999, val || 1));
    setOutH(h);
    if (keepAspect && origW > 0 && origH > 0) {
      setOutW(Math.round((h / origH) * origW));
    }
  };

  const downloadPng = async () => {
    const c = canvasRef.current;
    if (!c || !imgRef.current) return;
    setProcessing(true);
    try {
      const blob = await new Promise<Blob>((res, rej) =>
        c.toBlob(b => (b ? res(b) : rej(new Error('no blob'))), 'image/png', 1.0)
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resized_${outW}x${outH}_${file?.name || 'image'}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('تم تحميل الصورة! 🎉', 'Image downloaded! 🎉'));
    } catch {
      toast.error(t('فشل حفظ الصورة', 'Failed to save image'));
    }
    setProcessing(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 animate-in fade-in zoom-in-95 duration-500">
      <div className="glass-card rounded-3xl p-6 shadow-lg border border-border relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />

        {/* Header */}
        <div className="flex items-center gap-3 mb-6 border-b border-border/50 pb-4">
          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground shadow-sm">
            <Crop size={20} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-foreground tracking-tight">
              {t('معدّل المقاسات الدقيق', 'Precision Image Resizer')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('غيّري العرض والارتفاع وحمّلي الصورة بالحجم المطلوب', 'Set width & height, then download')}
            </p>
          </div>
        </div>

        {!imgSrc ? (
          /* ── Upload zone ── */
          <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:bg-primary/5 transition-colors group">
            <div className="flex flex-col items-center justify-center gap-3">
              <Download className="w-10 h-10 text-muted-foreground group-hover:text-primary transition-colors" />
              <p className="text-sm text-muted-foreground font-bold">{t('اضغط أو اسحب الصورة هنا', 'Click or drag image here')}</p>
              <p className="text-xs text-muted-foreground/60">PNG, JPG, WebP, GIF…</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={e => e.target.files?.[0] && setFile(e.target.files[0])}
            />
          </label>
        ) : (
          <div className="space-y-5">
            {/* ── Size controls ── */}
            <div className="grid grid-cols-2 gap-4 bg-secondary/30 rounded-2xl p-4 border border-border">
              {/* Width */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground block">
                  {t('العرض (px)', 'Width (px)')}
                </label>
                <input
                  id="resizer-width"
                  type="number"
                  min={1}
                  max={9999}
                  value={outW}
                  onChange={e => handleWidthChange(parseInt(e.target.value) || 1)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              {/* Height */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground block">
                  {t('الارتفاع (px)', 'Height (px)')}
                </label>
                <input
                  id="resizer-height"
                  type="number"
                  min={1}
                  max={9999}
                  value={outH}
                  onChange={e => handleHeightChange(parseInt(e.target.value) || 1)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              {/* Keep aspect ratio toggle */}
              <div className="col-span-2 flex items-center gap-2">
                <button
                  onClick={() => setKeepAspect(p => !p)}
                  className={`w-10 h-5 rounded-full transition-colors duration-200 relative ${keepAspect ? 'bg-primary' : 'bg-muted'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${keepAspect ? 'left-5' : 'left-0.5'}`} />
                </button>
                <span className="text-xs font-medium text-muted-foreground">
                  {t('الحفاظ على النسبة', 'Keep aspect ratio')}
                </span>
                {origW > 0 && (
                  <span className="text-xs text-muted-foreground/60 mr-auto">
                    {t('الحجم الأصلي', 'Original')}: {origW}×{origH}
                  </span>
                )}
              </div>
            </div>

            {/* ── Canvas preview ── */}
            <div className="rounded-2xl overflow-hidden border border-border bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3ne1/sMwGoBgNIwGACw1aH7k+O4mAAaHwTAYDIORQAYiDQB0kCI1E61wHAAAAABJRU5ErkJggg==')] flex items-center justify-center p-2">
              <canvas
                ref={canvasRef}
                style={{ maxWidth: '100%', maxHeight: '50vh', display: 'block' }}
                className="rounded-xl shadow-md"
              />
            </div>

            {/* ── Output info ── */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span className="px-2 py-1 bg-secondary rounded-lg font-mono font-bold">{outW} × {outH} px</span>
              <span>PNG</span>
            </div>

            {/* ── Actions ── */}
            <div className="flex gap-3">
              <button
                onClick={() => { setFile(null); setImgSrc(null); imgRef.current = null; }}
                className="flex-1 py-3 bg-secondary text-foreground rounded-xl font-bold btn-interactive active:scale-95 transition-all"
              >
                {t('تغيير الصورة', 'Change Image')}
              </button>
              <button
                onClick={downloadPng}
                disabled={processing}
                className="flex-[2] py-3 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl font-bold flex justify-center items-center gap-2 btn-interactive active:scale-95 transition-all shadow-lg disabled:opacity-50"
              >
                <Download size={18} />
                {processing ? t('جاري الحفظ...', 'Saving...') : t('تحميل PNG', 'Download PNG')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageResizer;
