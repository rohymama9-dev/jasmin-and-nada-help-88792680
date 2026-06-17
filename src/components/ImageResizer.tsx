import { useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { usePoints } from '@/hooks/usePoints';
import { Unlock, Crop, Download, Type } from 'lucide-react';
import { toast } from 'sonner';

const UNLOCK_KEY = 'app-imageresizer-unlocked';

const ImageResizer = () => {
  const { lang } = useLang();
  const { points, subtractPoints } = usePoints();
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem(UNLOCK_KEY) === 'true');
  const [file, setFile] = useState<File | null>(null);
  const [width, setWidth] = useState<number>(1080);
  const [height, setHeight] = useState<number>(1080);
  const [unit, setUnit] = useState<'px' | 'cm'>('px');
  const [processing, setProcessing] = useState(false);

  const handleUnlock = () => {
    if (points >= 70) {
      subtractPoints(70);
      localStorage.setItem(UNLOCK_KEY, 'true');
      setUnlocked(true);
      toast.success(lang === 'ar' ? 'تم فتح أداة تغيير الحجم!' : 'Resizer unlocked!');
    } else {
      toast.error(lang === 'ar' ? 'نقاطك غير كافية' : 'Not enough points');
    }
  };

  const processResize = async () => {
    if (!file) return;
    setProcessing(true);
    
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = url; });
      
      const canvas = document.createElement('canvas');
      
      // Convert cm to px if needed (assuming 300 DPI -> ~118 px/cm)
      const targetW = unit === 'cm' ? Math.round(width * 118.11) : width;
      const targetH = unit === 'cm' ? Math.round(height * 118.11) : height;
      
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas error');
      
      // High quality smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetW, targetH);
      
      canvas.toBlob((blob) => {
        if (!blob) throw new Error('Failed');
        const dUrl = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = dUrl;
        a.download = `resized_${targetW}x${targetH}_${file.name}`;
        a.click(); URL.revokeObjectURL(dUrl);
        toast.success(lang === 'ar' ? 'تم الحفظ بأعلى جودة!' : 'Saved in high quality!');
      }, file.type, 1.0);
    } catch (e) {
      toast.error(lang === 'ar' ? 'حدث خطأ' : 'Error occurred');
    } finally {
      setProcessing(false);
    }
  };

  if (!unlocked) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center space-y-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/40 border border-orange-100 dark:border-orange-900/50">
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
          <Crop size={32} />
        </div>
        <div>
          <h3 className="font-bold text-lg text-foreground mb-1">{lang === 'ar' ? 'أداة تغيير حجم الصور (مثل كانفا)' : 'Image Resizer (Canva-like)'}</h3>
          <p className="text-sm text-muted-foreground mb-2">{lang === 'ar' ? 'تعديل المقاسات بالبكسل والسم مع حفظ بأعلى جودة.' : 'Resize by PX/CM and save in max quality.'}</p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 text-xs font-bold mb-4">
            <span className="line-through opacity-70">120 🪙</span>
            <span>🔥 {lang === 'ar' ? 'عرض: 70 نقطة فقط!' : 'Offer: 70 points only!'}</span>
          </div>
        </div>
        <button onClick={handleUnlock} className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-md">
          <Unlock size={18} className="inline mr-2" />
          {lang === 'ar' ? 'فتح الأداة (70 🪙)' : 'Unlock Tool (70 🪙)'}
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-5 space-y-5 border border-orange-100 dark:border-orange-900/30">
      <div className="flex items-center gap-2 border-b border-border/50 pb-3">
        <Crop size={18} className="text-orange-500" /> <h3 className="font-bold text-foreground">{lang === 'ar' ? 'مُعدل المقاسات الدقيق' : 'Precision Resizer'}</h3>
      </div>
      
      <div className="relative">
        <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
        <div className="border-2 border-dashed border-orange-500/30 rounded-xl p-6 text-center bg-orange-500/5">
          {file ? <div className="text-sm font-bold text-orange-500 truncate">{file.name}</div> : <div className="text-sm text-muted-foreground">{lang === 'ar' ? 'اضغط لاختيار صورة' : 'Tap to select image'}</div>}
        </div>
      </div>
      
      <div className="flex gap-2 bg-secondary p-1 rounded-xl">
        <button onClick={() => setUnit('px')} className={`flex-1 py-1 text-xs font-bold rounded-lg ${unit === 'px' ? 'bg-background text-orange-600 shadow-sm' : 'text-muted-foreground'}`}>Pixels (px)</button>
        <button onClick={() => setUnit('cm')} className={`flex-1 py-1 text-xs font-bold rounded-lg ${unit === 'cm' ? 'bg-background text-orange-600 shadow-sm' : 'text-muted-foreground'}`}>Centimeters (cm)</button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">{lang === 'ar' ? 'العرض' : 'Width'} ({unit})</label>
          <input type="number" value={width} onChange={e => setWidth(Number(e.target.value))} className="w-full text-sm bg-secondary border-none rounded-lg p-2 outline-none font-mono" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">{lang === 'ar' ? 'الطول' : 'Height'} ({unit})</label>
          <input type="number" value={height} onChange={e => setHeight(Number(e.target.value))} className="w-full text-sm bg-secondary border-none rounded-lg p-2 outline-none font-mono" />
        </div>
      </div>

      <button onClick={processResize} disabled={!file || processing} className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow disabled:opacity-50">
        {processing ? (lang === 'ar' ? 'جاري المعالجة...' : 'Processing...') : <><Download size={18} className="inline mr-2"/> {lang === 'ar' ? 'حفظ بأعلى جودة' : 'Save High Quality'}</>}
      </button>
    </div>
  );
};
export default ImageResizer;
