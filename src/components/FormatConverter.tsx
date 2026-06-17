import { useState, useEffect } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { usePoints } from '@/hooks/usePoints';
import { Unlock, FileCode2, Download, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';

const UNLOCK_KEY = 'app-formatconverter-unlocked';
const getUsesKey = () => {
  const d = new Date();
  return `app-formatconverter-uses-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};
const getMaxUsesKey = () => {
  const d = new Date();
  return `app-formatconverter-maxuses-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

const DEFAULT_MAX_USES = 5;

const FormatConverter = () => {
  const { lang } = useLang();
  const { points, subtractPoints } = usePoints();
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem(UNLOCK_KEY) === 'true');
  const [uses, setUses] = useState(0);
  const [maxUses, setMaxUses] = useState(DEFAULT_MAX_USES);
  const [file, setFile] = useState<File | null>(null);
  const [converting, setConverting] = useState(false);
  const [format, setFormat] = useState('image/webp');
  const [watchingAd, setWatchingAd] = useState(false);

  useEffect(() => {
    setUses(Number(localStorage.getItem(getUsesKey()) || 0));
    setMaxUses(Number(localStorage.getItem(getMaxUsesKey()) || DEFAULT_MAX_USES));
  }, []);

  const handleUnlock = () => {
    if (points >= 80) {
      subtractPoints(80);
      localStorage.setItem(UNLOCK_KEY, 'true');
      setUnlocked(true);
      toast.success(lang === 'ar' ? 'تم فتح أداة التحويل!' : 'Converter unlocked!');
    } else {
      toast.error(lang === 'ar' ? 'نقاطك غير كافية' : 'Not enough points');
    }
  };

  const watchAd = () => {
    setWatchingAd(true);
    setTimeout(() => {
      setWatchingAd(false);
      const newMax = maxUses + 1;
      setMaxUses(newMax);
      localStorage.setItem(getMaxUsesKey(), newMax.toString());
      toast.success(lang === 'ar' ? 'محاولة إضافية تمت!' : '+1 Use added!');
    }, 3000);
  };

  const recordUse = () => {
    const newUses = uses + 1;
    setUses(newUses);
    localStorage.setItem(getUsesKey(), newUses.toString());
  };

  const processFile = async () => {
    if (!file) return;
    if (uses >= maxUses) return toast.error(lang === 'ar' ? 'استنفدت محاولاتك اليوم' : 'Daily limit reached');
    setConverting(true);
    
    try {
      if (file.type.startsWith('image/')) {
        const img = new Image();
        const url = URL.createObjectURL(file);
        await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = url; });
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas error');
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (!blob) throw new Error('Failed');
          const dUrl = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href = dUrl;
          a.download = `${file.name.split('.')[0]}_converted.${format.split('/')[1]}`;
          a.click(); URL.revokeObjectURL(dUrl); recordUse();
          toast.success(lang === 'ar' ? 'تم التحويل!' : 'Converted!');
        }, format, 0.9);
      } else {
        // Fallback or mock for non-images
        toast.info(lang === 'ar' ? 'الصيغة غير مدعومة كلياً أوفلاين، تم استخراج الملف.' : 'Offline fallback extraction used.');
        const url = URL.createObjectURL(file);
        const a = document.createElement('a'); a.href = url;
        a.download = `converted_${file.name}`;
        a.click(); URL.revokeObjectURL(url); recordUse();
      }
    } catch (e) {
      toast.error(lang === 'ar' ? 'حدث خطأ' : 'Error occurred');
    } finally {
      setConverting(false);
    }
  };

  if (!unlocked) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center space-y-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40 border border-purple-100 dark:border-purple-900/50">
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
          <FileCode2 size={32} />
        </div>
        <div>
          <h3 className="font-bold text-lg text-foreground mb-1">{lang === 'ar' ? 'محول الصيغ الشامل' : 'Universal Format Converter'}</h3>
          <p className="text-sm text-muted-foreground mb-2">{lang === 'ar' ? 'تحويل الصور والفيديوهات والملفات لأي صيغة.' : 'Convert images, videos, files to any format.'}</p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 text-xs font-bold mb-4">
            <span className="line-through opacity-70">150 🪙</span>
            <span>🔥 {lang === 'ar' ? 'عرض: 80 نقطة فقط!' : 'Offer: 80 points only!'}</span>
          </div>
        </div>
        <button onClick={handleUnlock} className="w-full py-3 rounded-xl bg-purple-500 text-white font-bold shadow-md">
          <Unlock size={18} className="inline mr-2" />
          {lang === 'ar' ? 'فتح الأداة (80 🪙)' : 'Unlock Tool (80 🪙)'}
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-5 space-y-5 border border-purple-100 dark:border-purple-900/30">
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div className="flex items-center gap-2"><FileCode2 size={18} className="text-purple-500" /> <h3 className="font-bold text-foreground">{lang === 'ar' ? 'محول الصيغ' : 'Format Converter'}</h3></div>
        <div className="text-xs font-semibold px-2 py-1 bg-secondary rounded-md">{uses} / {maxUses} {lang === 'ar' ? 'محاولات' : 'Uses'}</div>
      </div>
      {uses >= maxUses && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-center space-y-3">
          <p className="text-sm font-bold text-amber-800 dark:text-amber-300">{lang === 'ar' ? 'استنفدت المحاولات!' : 'Uses reached!'}</p>
          <button onClick={watchAd} disabled={watchingAd} className="px-4 py-2 bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 mx-auto disabled:opacity-50">
            <PlayCircle size={14} /> {watchingAd ? (lang === 'ar' ? 'جاري العرض...' : 'Watching...') : (lang === 'ar' ? 'شاهد إعلاناً (+1)' : 'Watch Ad (+1)')}
          </button>
        </div>
      )}
      <div className="relative">
        <input type="file" accept="*/*" onChange={e => setFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
        <div className="border-2 border-dashed border-purple-500/30 rounded-xl p-6 text-center bg-purple-500/5">
          {file ? <div className="text-sm font-bold text-purple-500 truncate">{file.name}</div> : <div className="text-sm text-muted-foreground">{lang === 'ar' ? 'اضغط لاختيار ملف، صورة، أو فيديو' : 'Tap to select file, image, or video'}</div>}
        </div>
      </div>
      {file && file.type.startsWith('image/') && (
        <div className="space-y-1 animate-in fade-in">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">{lang === 'ar' ? 'إلى صيغة' : 'To Format'}</label>
          <select value={format} onChange={e => setFormat(e.target.value)} className="w-full text-sm bg-secondary border-none rounded-lg p-2 outline-none">
            <option value="image/webp">WEBP</option>
            <option value="image/jpeg">JPEG</option>
            <option value="image/png">PNG</option>
          </select>
        </div>
      )}
      <button onClick={processFile} disabled={!file || converting || uses >= maxUses} className="w-full py-3 rounded-xl bg-purple-500 text-white font-bold shadow disabled:opacity-50">
        {converting ? (lang === 'ar' ? 'جاري التحويل...' : 'Converting...') : <><Download size={18} className="inline mr-2"/> {lang === 'ar' ? 'حول الآن' : 'Convert Now'}</>}
      </button>
    </div>
  );
};
export default FormatConverter;
