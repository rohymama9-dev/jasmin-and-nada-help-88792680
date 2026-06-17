import { useState, useRef, useEffect } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { usePoints } from '@/hooks/usePoints';
import { Lock, Unlock, Image as ImageIcon, Film, File as FileIcon, Download, PlayCircle, Settings2 } from 'lucide-react';
import { toast } from 'sonner';

const UNLOCK_KEY = 'app-fileconverter-unlocked';
const getUsesKey = () => {
  const d = new Date();
  return `app-fileconverter-uses-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};
const getMaxUsesKey = () => {
  const d = new Date();
  return `app-fileconverter-maxuses-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

const DEFAULT_MAX_USES = 5;

const FileConverter = () => {
  const { lang } = useLang();
  const { points, subtractPoints } = usePoints();
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem(UNLOCK_KEY) === 'true');
  const [uses, setUses] = useState(0);
  const [maxUses, setMaxUses] = useState(DEFAULT_MAX_USES);
  const [activeTab, setActiveTab] = useState<'image' | 'video' | 'file'>('image');
  const [file, setFile] = useState<File | null>(null);
  const [converting, setConverting] = useState(false);
  const [format, setFormat] = useState('image/webp');
  const [quality, setQuality] = useState(0.8);
  const [watchingAd, setWatchingAd] = useState(false);

  useEffect(() => {
    setUses(Number(localStorage.getItem(getUsesKey()) || 0));
    setMaxUses(Number(localStorage.getItem(getMaxUsesKey()) || DEFAULT_MAX_USES));
  }, []);

  const handleUnlock = () => {
    if (points >= 50) {
      subtractPoints(50);
      localStorage.setItem(UNLOCK_KEY, 'true');
      setUnlocked(true);
      toast.success(lang === 'ar' ? 'تم فتح الأداة بنجاح!' : 'Tool unlocked successfully!');
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
      toast.success(lang === 'ar' ? 'تم إضافة محاولة جديدة!' : 'Added a new attempt!');
    }, 3000);
  };

  const recordUse = () => {
    const newUses = uses + 1;
    setUses(newUses);
    localStorage.setItem(getUsesKey(), newUses.toString());
  };

  const handleImageConvert = async () => {
    if (!file) return;
    if (uses >= maxUses) return toast.error(lang === 'ar' ? 'استنفدت محاولاتك اليوم' : 'Daily limit reached');
    setConverting(true);
    
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (!blob) throw new Error('Conversion failed');
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        const ext = format.split('/')[1];
        a.download = `${file.name.split('.')[0]}_converted.${ext}`;
        a.click();
        URL.revokeObjectURL(downloadUrl);
        recordUse();
      }, format, quality);
    } catch (err) {
      toast.error(lang === 'ar' ? 'حدث خطأ أثناء التحويل' : 'Conversion error');
    } finally {
      setConverting(false);
    }
  };

  const handleFileCompress = async () => {
    if (!file) return;
    if (uses >= maxUses) return toast.error(lang === 'ar' ? 'استنفدت محاولاتك اليوم' : 'Daily limit reached');
    setConverting(true);
    try {
      if (!('CompressionStream' in window)) {
        toast.error(lang === 'ar' ? 'متصفحك لا يدعم ضغط الملفات' : 'Browser does not support compression');
        setConverting(false);
        return;
      }
      const stream = file.stream().pipeThrough(new (window as any).CompressionStream('gzip'));
      const compressedStream = new Response(stream);
      const blob = await compressedStream.blob();
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name}.gz`;
      a.click();
      URL.revokeObjectURL(url);
      recordUse();
    } catch (e) {
      toast.error(lang === 'ar' ? 'حدث خطأ' : 'Error occurred');
    } finally {
      setConverting(false);
    }
  };

  const processFile = () => {
    if (activeTab === 'image') handleImageConvert();
    else if (activeTab === 'file') handleFileCompress();
    else {
      // Mock video conversion due to client-side limits
      toast.error(lang === 'ar' ? 'تحويل الفيديو يتطلب خادم، قريباً!' : 'Video conversion needs a server, coming soon!');
    }
  };

  if (!unlocked) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center space-y-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-100 dark:border-indigo-900/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 mb-2">
          <Settings2 size={32} />
        </div>
        <div>
          <h3 className="font-bold text-lg text-foreground mb-1">
            {lang === 'ar' ? 'أداة ضغط وتحويل الملفات' : 'File Compressor & Converter'}
          </h3>
          <p className="text-sm text-muted-foreground mb-2">
            {lang === 'ar' 
              ? 'تحويل الصور وضغط الملفات بجودة عالية وبدون إنترنت.' 
              : 'Convert images and compress files offline with high quality.'}
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-bold mb-4">
            <span className="line-through opacity-70">100 🪙</span>
            <span>🔥 {lang === 'ar' ? 'عرض: 50 نقطة فقط!' : 'Offer: 50 points only!'}</span>
          </div>
        </div>
        <button
          onClick={handleUnlock}
          className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-bold shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <Unlock size={18} />
          {lang === 'ar' ? 'فتح الأداة الآن (50 🪙)' : 'Unlock Tool Now (50 🪙)'}
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-5 space-y-5 relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
            <Settings2 size={18} />
          </div>
          <h3 className="font-bold text-foreground">{lang === 'ar' ? 'محول الملفات' : 'File Converter'}</h3>
        </div>
        <div className="text-xs font-semibold px-2 py-1 bg-secondary rounded-md">
          {uses} / {maxUses} {lang === 'ar' ? 'محاولات' : 'Uses'}
        </div>
      </div>

      {uses >= maxUses && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-center space-y-3">
          <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
            {lang === 'ar' ? 'استنفدت المحاولات المجانية اليوم!' : 'Daily free attempts reached!'}
          </p>
          {watchingAd ? (
            <div className="text-xs text-amber-700 animate-pulse">{lang === 'ar' ? 'جاري عرض الإعلان...' : 'Watching Ad...'}</div>
          ) : (
            <button onClick={watchAd} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 mx-auto transition-colors">
              <PlayCircle size={14} /> {lang === 'ar' ? 'شاهد إعلاناً لمحاولة إضافية' : 'Watch Ad for +1 Use'}
            </button>
          )}
        </div>
      )}

      <div className="flex bg-secondary p-1 rounded-xl">
        {[
          { id: 'image', icon: ImageIcon, label: lang === 'ar' ? 'صور' : 'Images' },
          { id: 'file', icon: FileIcon, label: lang === 'ar' ? 'ملفات' : 'Files' },
          { id: 'video', icon: Film, label: lang === 'ar' ? 'فيديو' : 'Video' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => { setActiveTab(t.id as any); setFile(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === t.id ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <div className="relative">
          <input
            type="file"
            accept={activeTab === 'image' ? 'image/*' : activeTab === 'video' ? 'video/*' : '*/*'}
            onChange={e => setFile(e.target.files?.[0] || null)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="border-2 border-dashed border-primary/30 rounded-xl p-6 text-center bg-primary/5">
            {file ? (
              <div className="text-sm font-bold text-primary truncate px-4">{file.name}</div>
            ) : (
              <div className="text-sm text-muted-foreground font-medium">
                {lang === 'ar' ? 'اضغط لاختيار ملف' : 'Tap to select file'}
              </div>
            )}
          </div>
        </div>

        {activeTab === 'image' && file && (
          <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">{lang === 'ar' ? 'الصيغة' : 'Format'}</label>
              <select value={format} onChange={e => setFormat(e.target.value)} className="w-full text-sm bg-secondary border-none rounded-lg p-2 focus:ring-2 ring-primary outline-none">
                <option value="image/webp">WEBP (Best)</option>
                <option value="image/jpeg">JPEG</option>
                <option value="image/png">PNG</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">{lang === 'ar' ? 'الجودة' : 'Quality'}</label>
              <input type="range" min="0.1" max="1" step="0.1" value={quality} onChange={e => setQuality(parseFloat(e.target.value))} className="w-full accent-primary" />
              <div className="text-center text-[10px] font-bold">{Math.round(quality * 100)}%</div>
            </div>
          </div>
        )}

        <button
          onClick={processFile}
          disabled={!file || converting || uses >= maxUses}
          className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-bold shadow disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {converting ? (
            <span className="animate-pulse">{lang === 'ar' ? 'جاري المعالجة...' : 'Processing...'}</span>
          ) : (
            <>
              <Download size={18} />
              {activeTab === 'image' ? (lang === 'ar' ? 'تحويل وحفظ' : 'Convert & Save') :
               activeTab === 'file' ? (lang === 'ar' ? 'ضغط الملف' : 'Compress File') :
               (lang === 'ar' ? 'تحويل الفيديو' : 'Convert Video')}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default FileConverter;
