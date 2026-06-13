import { useRef, useState, useEffect, useCallback } from 'react';
import { Heart, Palette, Eraser, Undo2, Trash2, Minus, Plus, ArrowLeft, ArrowRight, Download, Upload } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

//coloring i made themed line art
type Drawing = {
  id: string;
  nameAr: string;
  nameEn: string;
  emoji: string;
  paths?: string[];
  imageUrl?: string;
  source?: 'builtin' | 'device' | 'cloud';
};

const drawings: Drawing[] = [
  { id: 'img1', nameAr: 'رسمة 1', nameEn: 'Drawing 1', emoji: '🎨', source: 'builtin', imageUrl: '/images/coloring studio/c1.png' },
  { id: 'img2', nameAr: 'رسمة 2', nameEn: 'Drawing 2', emoji: '🎨', source: 'builtin', imageUrl: '/images/coloring studio/c2.png' },
  { id: 'img3', nameAr: 'رسمة 3', nameEn: 'Drawing 3', emoji: '🎨', source: 'builtin', imageUrl: '/images/coloring studio/c3.png' },
  { id: 'img4', nameAr: 'رسمة 4', nameEn: 'Drawing 4', emoji: '🎨', source: 'builtin', imageUrl: '/images/coloring studio/c4.png' },
  { id: 'img5', nameAr: 'رسمة 5', nameEn: 'Drawing 5', emoji: '🎨', source: 'builtin', imageUrl: '/images/coloring studio/c5.png' },
  { id: 'img6', nameAr: 'رسمة 6', nameEn: 'Drawing 6', emoji: '🎨', source: 'builtin', imageUrl: '/images/coloring studio/c6.png' },
  { id: 'img7', nameAr: 'رسمة 7', nameEn: 'Drawing 7', emoji: '🎨', source: 'builtin', imageUrl: '/images/coloring studio/c7.png' },
  { id: 'img8', nameAr: 'رسمة 8', nameEn: 'Drawing 8', emoji: '🎨', source: 'builtin', imageUrl: '/images/coloring studio/c8.png' },
  { id: 'img9', nameAr: 'رسمة 9', nameEn: 'Drawing 9', emoji: '🎨', source: 'builtin', imageUrl: '/images/coloring studio/c9.png' }
];

const COLORS = [
  '#E74C3C', '#E91E63', '#FF9800', '#FFC107',
  '#4CAF50', '#00BCD4', '#2196F3', '#3F51B5',
  '#9C27B0', '#795548', '#607D8B', '#000000',
  '#FFFFFF', '#FFB6C1', '#FFDAB9', '#B0E0E6',
];

interface UploadedPage {
  id: string;
  title: string;
  url: string;
  source: 'cloud' | 'device';
}

const LOCAL_KEY = 'coloring-device-pages-v1';
const HIDDEN_BUILTIN_KEY = 'coloring-hidden-builtin';
const HIDDEN_CLOUD_KEY = 'coloring-hidden-cloud';

// معامل تكبير الجودة (Retina Scale) لحل مشكلة البكسلة
const CANVAS_SCALE = 3;
const CANVAS_WIDTH = 400 * CANVAS_SCALE;  // 1200px internally
const CANVAS_HEIGHT = 450 * CANVAS_SCALE; // 1350px internally

interface LongPressEvents {
  onMouseDown: () => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onTouchStart: () => void;
  onTouchEnd: () => void;
  onTouchCancel: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

const useLongPress = (callback: () => void, ms = 3000): LongPressEvents => {
  const timerRef = useRef<any>(null);

  const start = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setTimeout(() => {
      callback();
      timerRef.current = null;
    }, ms);
  }, [callback, ms]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
    onTouchCancel: stop,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  };
};

const ColoringBook = () => {
  const { t, lang, dir } = useLang();
  const colorCanvasRef = useRef<HTMLCanvasElement>(null);
  const outlineCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedColor, setSelectedColor] = useState('#E74C3C');
  const [brushSize, setBrushSize] = useState(8);
  const [isEraser, setIsEraser] = useState(false);
  const [selectedDrawing, setSelectedDrawing] = useState<Drawing>(drawings[0]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [showPicker, setShowPicker] = useState(true);
  const [uploaded, setUploaded] = useState<UploadedPage[]>([]);
  
  const [isEditMode, setIsEditMode] = useState(false);

  const [hiddenBuiltin, setHiddenBuiltin] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(HIDDEN_BUILTIN_KEY) || '[]'); } catch { return []; }
  });
  const BackArrow = dir === 'rtl' ? ArrowRight : ArrowLeft;

  useEffect(() => {
    try {
      const local = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') as UploadedPage[];
      setUploaded(local);
    } catch { /* ignore */ }
    let active = true;
    supabase
      .from('admin_uploads')
      .select('id,title,public_url,mime_type')
      .eq('category', 'coloring')
      .order('created_at', { ascending: false })
      .limit(40)
      .then(({ data }) => {
        if (!active || !data) return;
        let hidden: string[] = [];
        try { hidden = JSON.parse(localStorage.getItem(HIDDEN_CLOUD_KEY) || '[]'); } catch { /* ignore */ }
        const cloud: UploadedPage[] = data
          .filter(d => (d.mime_type || '').startsWith('image/'))
          .filter(d => !hidden.includes(d.id))
          .map(d => ({ id: d.id, title: d.title, url: d.public_url, source: 'cloud' }));
        setUploaded(prev => {
          const localOnly = prev.filter(p => p.source === 'device');
          return [...cloud, ...localOnly];
        });
      });
    return () => { active = false; };
  }, []);

  const persistDevice = (next: UploadedPage[]) => {
    const deviceOnly = next.filter(p => p.source === 'device');
    localStorage.setItem(LOCAL_KEY, JSON.stringify(deviceOnly));
  };

  const handleDeviceUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      const item: UploadedPage = {
        id: `dev-${Date.now()}`,
        title: file.name.replace(/\.[^.]+$/, ''),
        url,
        source: 'device',
      };
      setUploaded(prev => {
        const next = [item, ...prev];
        persistDevice(next);
        return next;
      });
      toast({ title: lang === 'ar' ? 'تمت إضافة الصورة بنجاح 🎨' : 'Page added 🎨' });
    };
    reader.readAsDataURL(file);
  };

  const removeDevicePage = (id: string) => {
    setUploaded(prev => {
      const next = prev.filter(p => p.id !== id);
      persistDevice(next);
      return next;
    });
    toast({ title: lang === 'ar' ? 'تم الحذف' : 'Deleted' });
  };

  const drawOutline = useCallback((drawing: Drawing) => {
    const canvas = outlineCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (drawing.imageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const cw = canvas.width, ch = canvas.height;
        const ratio = Math.min(cw / img.width, ch / img.height);
        const w = img.width * ratio, h = img.height * ratio;
        const x = (cw - w) / 2, y = (ch - h) / 2;
        ctx.drawImage(img, x, y, w, h);
      };
      img.src = drawing.imageUrl;
      return;
    }
    if (!drawing.paths) return;
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2.5 * CANVAS_SCALE; // تكبير عرض الخط ليتناسب مع الدقة الجديدة
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    drawing.paths.forEach(pathStr => {
      const path = new Path2D(pathStr);
      ctx.stroke(path);
    });
  }, []);

  const resetColorCanvas = useCallback(() => {
    const canvas = colorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
  }, []);

  const initCanvas = useCallback(() => {
    resetColorCanvas();
    drawOutline(selectedDrawing);
  }, [selectedDrawing, drawOutline, resetColorCanvas]);

  useEffect(() => { initCanvas(); }, [initCanvas]);

  const saveState = () => {
    const canvas = colorCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    setHistory(prev => [...prev.slice(-20), ctx.getImageData(0, 0, canvas.width, canvas.height)]);
  };

  const undo = () => {
    if (history.length <= 1) return;
    const ctx = colorCanvasRef.current?.getContext('2d');
    if (!ctx) return;
    const newHistory = history.slice(0, -1);
    ctx.putImageData(newHistory[newHistory.length - 1], 0, 0);
    setHistory(newHistory);
  };

  const handleDownload = () => {
    const color = colorCanvasRef.current;
    const outline = outlineCanvasRef.current;
    if (!color || !outline) return;
    const out = document.createElement('canvas');
    out.width = color.width;
    out.height = color.height;
    const octx = out.getContext('2d');
    if (!octx) return;
    octx.fillStyle = '#FFFFFF';
    octx.fillRect(0, 0, out.width, out.height);
    octx.drawImage(color, 0, 0);
    octx.globalCompositeOperation = 'multiply';
    octx.drawImage(outline, 0, 0);
    octx.globalCompositeOperation = 'source-over';
    const url = out.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `coloring-${Date.now()}.png`;
    a.click();
  };

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = colorCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const touch = e.touches[0];
      return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const applyMode = (ctx: CanvasRenderingContext2D) => {
    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = brushSize * 2 * CANVAS_SCALE; // تكبير الممحاة
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = brushSize * CANVAS_SCALE; // تكبير الفرشاة
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const ctx = colorCanvasRef.current?.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const pos = getPos(e);
    applyMode(ctx);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(pos.x + 0.1, pos.y + 0.1);
    ctx.stroke();
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = colorCanvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    applyMode(ctx);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveState();
    }
  };

  const allPages: Drawing[] = [
    ...drawings.filter(d => !hiddenBuiltin.includes(d.id)),
    ...uploaded.map<Drawing>(u => ({
      id: u.id,
      nameAr: u.title,
      nameEn: u.title,
      emoji: u.source === 'device' ? '📱' : '☁️',
      imageUrl: u.url,
      source: u.source,
    })),
  ];

  const removePage = (drawing: Drawing) => {
    if (drawing.source === 'device') {
      removeDevicePage(drawing.id);
      return;
    }
    if (drawing.source === 'cloud') {
      setUploaded(prev => prev.filter(p => p.id !== drawing.id));
      try {
        const hidden = JSON.parse(localStorage.getItem(HIDDEN_CLOUD_KEY) || '[]') as string[];
        if (!hidden.includes(drawing.id)) {
          localStorage.setItem(HIDDEN_CLOUD_KEY, JSON.stringify([...hidden, drawing.id]));
        }
      } catch { /* ignore */ }
      toast({ title: lang === 'ar' ? 'تم الحذف' : 'Deleted' });
      return;
    }
    setHiddenBuiltin(prev => {
      const next = prev.includes(drawing.id) ? prev : [...prev, drawing.id];
      localStorage.setItem(HIDDEN_BUILTIN_KEY, JSON.stringify(next));
      return next;
    });
    toast({ title: lang === 'ar' ? 'تم الإخفاء' : 'Hidden' });
  };

  const heartLongPress = useLongPress(() => {
    setIsEditMode(prev => {
      const newState = !prev;
      toast({ 
        title: lang === 'ar' 
          ? (newState ? 'تم تفعيل خيار المسح 🔓' : 'تم إخفاء خيار المسح 🔒') 
          : (newState ? 'Delete option unlocked 🔓' : 'Delete option hidden 🔒') 
      });
      return newState;
    });
  }, 3000);

  if (showPicker) {
    return (
      <div className="pb-4">
        <div className="flex items-center gap-3 mb-5 px-1">
          <Palette size={24} className="text-primary" />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">{t('coloringBook')}</h2>
          </div>
          
          {/* زر الرفع ظاهر دائماً */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-xl bg-primary/5 text-primary border border-primary/20 active:scale-95 transition-all"
            aria-label="Upload"
          >
            <Upload size={18} />
          </button>

          {/* القلب يظهر فقط للتحكم في خيار الحذف (علامة ×) */}
          <button 
            {...heartLongPress}
            className={`p-1 transition-colors active:scale-90 touch-none select-none ${isEditMode ? 'text-red-500' : 'text-primary hover:text-red-500'}`}
            aria-label="Secret Heart Gate"
          >
            <Heart size={22} className="fill-current" />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleDeviceUpload(f);
            e.target.value = '';
          }}
        />

        <div className="grid grid-cols-2 gap-3">
          {allPages.map(drawing => (
            <div key={drawing.id} className="relative">
              <button 
                onClick={() => { setSelectedDrawing(drawing); setShowPicker(false); }}
                className="w-full glass-card rounded-2xl p-4 flex flex-col items-center justify-center min-h-[110px] hover:bg-primary/5 transition-all active:scale-95"
              >
                {drawing.imageUrl ? (
                  <img src={drawing.imageUrl} alt="" className="w-20 h-20 object-contain rounded-lg bg-white" loading="lazy" />
                ) : (
                  <span className="text-4xl">{drawing.emoji}</span>
                )}
              </button>
              
              {/* خيار الحذف يظهر فقط بعد الضغط المطول */}
              {isEditMode && (
                <button
                  onClick={(e) => { e.stopPropagation(); removePage(drawing); }}
                  aria-label="remove"
                  className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-sm shadow z-10 hover:bg-red-600 transition-colors animate-fade-in"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <div className="flex items-center gap-3 mb-3">
        <button onClick={() => setShowPicker(true)} className="text-primary"><BackArrow size={20} /></button>
        <Palette size={20} className="text-primary" />
        <h2 className="text-lg font-bold text-foreground">{lang === 'ar' ? selectedDrawing.nameAr : selectedDrawing.nameEn}</h2>
      </div>

      <div className="glass-card rounded-2xl p-2 mb-3">
        <div className="relative w-full rounded-xl bg-white overflow-hidden" style={{ aspectRatio: '400/450' }}>
          {/* تم تعديل أبعاد الـ Canvas الداخلية هنا مع بقاء حجم الشاشة كما هو */}
          <canvas
            ref={colorCanvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="absolute inset-0 w-full h-full touch-none"
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
          />
          <canvas
            ref={outlineCanvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ mixBlendMode: 'multiply' }}
          />
        </div>
      </div>

      <div className="glass-card rounded-2xl p-3 mb-3">
        <div className="flex flex-wrap gap-2 justify-center">
          {COLORS.map(color => (
            <button key={color} onClick={() => { setSelectedColor(color); setIsEraser(false); }}
              className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === color && !isEraser ? 'border-foreground scale-110' : 'border-border'}`}
              style={{ backgroundColor: color }} />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 justify-center flex-wrap">
        <button onClick={() => setIsEraser(!isEraser)}
          className={`p-2.5 rounded-xl transition-all ${isEraser ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
          <Eraser size={18} />
        </button>
        <button onClick={() => setBrushSize(Math.max(2, brushSize - 2))} className="p-2.5 rounded-xl bg-secondary text-secondary-foreground">
          <Minus size={18} />
        </button>
        <span className="text-xs text-muted-foreground w-8 text-center">{brushSize}</span>
        <button onClick={() => setBrushSize(Math.min(30, brushSize + 2))} className="p-2.5 rounded-xl bg-secondary text-secondary-foreground">
          <Plus size={18} />
        </button>
        <button onClick={undo} className="p-2.5 rounded-xl bg-secondary text-secondary-foreground"><Undo2 size={18} /></button>
        <button onClick={initCanvas} className="p-2.5 rounded-xl bg-secondary text-secondary-foreground"><Trash2 size={18} /></button>
        <button onClick={handleDownload}
          aria-label={lang === 'ar' ? 'تحميل' : 'Download'}
          className="p-2.5 rounded-xl gradient-primary text-primary-foreground">
          <Download size={18} />
        </button>
      </div>
    </div>
  );
};

export default ColoringBook;