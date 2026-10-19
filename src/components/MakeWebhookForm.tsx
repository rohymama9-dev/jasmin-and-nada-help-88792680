import { useEffect, useState } from 'react';
import {
  Loader2, CheckCircle, XCircle, Sparkles, Download, Trash2,
  Save, ImagePlus, Lock, Play, Crown, Minus, Plus,
  ChevronDown, ChevronUp, AlertTriangle, Send
} from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { usePoints } from '@/hooks/usePoints';
import { supabase } from '@/integrations/supabase/client';
import CombinedOrderForm from './CombinedOrderForm';
import { lsGet, lsSet, lsGetJSON, lsSetJSON } from '@/lib/userStorage';
import { toast } from '@/hooks/use-toast';

const WEBHOOK_URL = 'https://hook.eu1.make.com/w4s92px8gl6rj548jyp7isume7lqgifc';
const UNLOCK_COST = 100;
const UNLOCK_KEY = 'ai-tool-unlocked-v2';
const GALLERY_KEY = 'ai-tool-gallery-v2';
const USAGE_KEY = 'ai-tool-usage-v2';
const PREMIUM_KEY = 'ai-tool-premium-v2';
const BONUS_KEY = 'ai-tool-bonus-v2';
const FREE_QUOTA = 2;

interface GalleryItem { id: string; url: string; prompt: string; ts: number; }

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
const MakeWebhookForm = () => {
  const { lang } = useLang();
  const { points, addPoints } = usePoints();
  const [unlocked, setUnlocked] = useState<boolean>(() => lsGet(UNLOCK_KEY, '') === '1');
  const [textInput, setTextInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; imageUrl?: string } | null>(null);
  const [gallery, setGallery] = useState<GalleryItem[]>(() => lsGetJSON<GalleryItem[]>(GALLERY_KEY, []));
  const [used, setUsed] = useState<number>(() => Number(lsGet(USAGE_KEY, '0')) || 0);
  const [bonus, setBonus] = useState<number>(() => Number(lsGet(BONUS_KEY, '0')) || 0);
  const [premium, setPremium] = useState<boolean>(() => lsGet(PREMIUM_KEY, '') === '1');
  const [paywall, setPaywall] = useState(false);
  const [adRunning, setAdRunning] = useState(false);
  const [adRemain, setAdRemain] = useState(5);
  const [showOrderPanel, setShowOrderPanel] = useState(false);

  useEffect(() => { lsSet(USAGE_KEY, String(used)); }, [used]);
  useEffect(() => { lsSet(BONUS_KEY, String(bonus)); }, [bonus]);
  useEffect(() => { lsSet(PREMIUM_KEY, premium ? '1' : ''); }, [premium]);
  useEffect(() => { lsSetJSON(GALLERY_KEY, gallery); }, [gallery]);

  const allowance = FREE_QUOTA + bonus;
  const remaining = premium ? Infinity : Math.max(0, allowance - used);
  const canGenerate = premium || remaining > 0;

  useEffect(() => {
    if (!adRunning) return;
    if (adRemain <= 0) {
      setAdRunning(false);
      setBonus(b => b + 1);
      toast({ title: lang === 'ar' ? '🎁 +١ توليد إضافي' : '🎁 +1 extra generation' });
      setPaywall(false);
      return;
    }
    const t = window.setTimeout(() => setAdRemain(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [adRunning, adRemain, lang]);

  const startAd = () => { setAdRemain(5); setAdRunning(true); };
  const buyPremium = () => {
    setPremium(true);
    setPaywall(false);
    toast({ title: lang === 'ar' ? '👑 تم تفعيل المميز — توليد لا محدود' : '👑 Premium unlocked — unlimited' });
  };

  const unlock = () => {
    if (points < UNLOCK_COST) {
      toast({ title: lang === 'ar' ? `تحتاجين ${UNLOCK_COST} نقطة` : `Need ${UNLOCK_COST} points`, variant: 'destructive' });
      return;
    }
    addPoints(-UNLOCK_COST);
    setUnlocked(true);
    lsSet(UNLOCK_KEY, '1');
    toast({ title: lang === 'ar' ? 'تم الفتح ✨' : 'Unlocked ✨' });
  };

  const handleSubmit = async () => {
    if (!textInput.trim()) return;
    if (!canGenerate) { setPaywall(true); return; }
    setLoading(true);
    setResult(null);
    try {
      const enhancedPrompt = `${textInput.trim().substring(0, 4000)}, (perfect human anatomy, realistic faces/hands)`;
      const negativePrompt = "(deformed, horror, extra limbs, low quality, bad anatomy, missing fingers, extra fingers, poorly drawn hands, poorly drawn face)";
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: 'text-to-image', type: 'text',
          prompt: enhancedPrompt, negative_prompt: negativePrompt,
          quality: 'high', timestamp: new Date().toISOString(),
        }),
      });
      if (!response.ok) {
        const body = await response.text().catch(() => '');
        setResult({ success: false, message: (lang === 'ar' ? `🔌 خطأ اتصال Webhook (HTTP ${response.status})` : `🔌 Webhook error (HTTP ${response.status})`) + (body ? ` — ${body.substring(0, 120)}` : '') });
        return;
      }
      const text = await response.text();
      let imageUrl: string | undefined;
      let parseError: string | null = null;
      if (!text.trim()) parseError = 'Empty response';
      else {
        try {
          const data = JSON.parse(text);
          imageUrl = data?.imageUrl || data?.url || data?.image || data?.output;
          if (!imageUrl) parseError = `No image field. Keys: ${Object.keys(data).join(', ') || '(none)'}`;
        } catch (e) {
          if (/^https?:\/\//i.test(text.trim())) imageUrl = text.trim();
          else parseError = `JSON parse failed: ${(e as Error).message}`;
        }
      }
      if (imageUrl) {
        setResult({ success: true, message: lang === 'ar' ? '✨ تم الإنشاء' : '✨ Generated', imageUrl });
        if (!premium) setUsed(u => u + 1);
      } else {
        setResult({ success: false, message: (lang === 'ar' ? '⚠️ خطأ في تنسيق JSON — ' : '⚠️ JSON format error — ') + (parseError || '') });
      }
    } catch (err) {
      setResult({ success: false, message: (lang === 'ar' ? '🔌 فشل الاتصال: ' : '🔌 Connection failed: ') + (err as Error).message });
    } finally { setLoading(false); }
  };

  const downloadAs = async (url: string, fmt: 'png' | 'jpg' | 'webp') => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(); img.src = url; });
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      if (fmt !== 'png') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }
      ctx.drawImage(img, 0, 0);
      const mime = fmt === 'png' ? 'image/png' : fmt === 'jpg' ? 'image/jpeg' : 'image/webp';
      const out = c.toDataURL(mime, 0.95);
      const a = document.createElement('a');
      a.href = out; a.download = `ai-image-${Date.now()}.${fmt}`; a.click();
    } catch { window.open(url, '_blank'); }
  };

  const saveToGallery = (url: string, prompt: string) => {
    const item: GalleryItem = { id: `g-${Date.now()}`, url, prompt, ts: Date.now() };
    setGallery(prev => [item, ...prev].slice(0, 50));
    toast({ title: lang === 'ar' ? '💾 تم الحفظ في المعرض' : '💾 Saved to gallery' });
  };

  const deleteResult = () => { setResult(null); setTextInput(''); };

  if (!unlocked) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center">
          <Lock className="text-white" />
        </div>
        <h3 className="font-extrabold text-lg">{lang === 'ar' ? 'أداة نص إلى صورة' : 'Text → Image AI'}</h3>
        <p className="text-sm text-muted-foreground">
          {lang === 'ar' ? `لفترة محدودة! افتحي الأداة بـ 100 نقطة فقط بدلاً من 500 نقطة.` : `Limited time offer! Unlock for 100 pts instead of 500 pts.`}
        </p>
        <div className="flex items-center justify-center gap-2">
           <span className="text-xl font-bold text-rose-500 line-through decoration-2 opacity-70">500</span>
           <span className="text-2xl font-black text-primary">100 {lang === 'ar' ? 'نقطة' : 'pts'}</span>
        </div>
        <p className="text-xs">{lang === 'ar' ? `رصيدك: ${points}` : `Balance: ${points}`}</p>
        <button onClick={unlock} disabled={points < UNLOCK_COST}
          className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-bold disabled:opacity-50">
          🔓 {lang === 'ar' ? `افتحي بـ ${UNLOCK_COST} نقطة` : `Unlock for ${UNLOCK_COST} pts`}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="text-primary" />
          <h3 className="font-bold">{lang === 'ar' ? 'نص إلى صورة عالية الدقة' : 'Text → High-Res Image'}</h3>
          <span className="ms-auto text-[11px] font-bold px-2 py-0.5 rounded-full bg-secondary">
            {premium
              ? (lang === 'ar' ? '👑 مميز' : '👑 Premium')
              : (lang === 'ar' ? `مجاني: ${Math.max(0, allowance - used)}/${allowance}` : `Free: ${Math.max(0, allowance - used)}/${allowance}`)}
          </span>
        </div>

        {/* Single CTA button — opens combined order panel */}
        <button
          onClick={() => setShowOrderPanel(true)}
          className="block w-full rounded-xl p-3 bg-gradient-to-r from-fuchsia-500 to-amber-400 text-white text-xs font-extrabold text-center hover:opacity-90 transition"
        >
          🎁 {lang === 'ar' ? 'Request Discount Offer — اضغطي هنا' : 'Request Discount Offer — Click here'}
        </button>

        {/* Disabled Generator Message */}
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold">{lang === 'ar' ? 'أداة الصور مغلقة مؤقتاً للتحديث .نشكركم على تفهمكم!' : 'Image tool temporarily closed for updates. Thank you for your patience!'}</h4>
          </div>
        </div>

        {result && (
          <div className={`p-3 rounded-xl ${result.success ? 'bg-success/10' : 'bg-destructive/10'} space-y-3`}>
            <div className="flex items-center gap-2">
              {result.success ? <CheckCircle className="text-success" size={18} /> : <XCircle className="text-destructive" size={18} />}
              <p className={`text-sm font-medium ${result.success ? 'text-success' : 'text-destructive'}`}>{result.message}</p>
            </div>
            {result.imageUrl && (
              <>
                <img src={result.imageUrl} alt="Generated" className="rounded-xl w-full bg-white" />
                <div className="grid grid-cols-3 gap-2">
                  {(['png', 'jpg', 'webp'] as const).map(fmt => (
                    <button key={fmt} onClick={() => downloadAs(result.imageUrl!, fmt)}
                      className="py-2 rounded-lg bg-secondary text-xs font-bold flex items-center justify-center gap-1">
                      <Download size={12} /> {fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => saveToGallery(result.imageUrl!, textInput)}
                    className="py-2 rounded-lg bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1">
                    <Save size={12} /> {lang === 'ar' ? 'حفظ في المعرض' : 'Save to gallery'}
                  </button>
                  <button onClick={deleteResult}
                    className="py-2 rounded-lg bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-1">
                    <Trash2 size={12} /> {lang === 'ar' ? 'حذف' : 'Delete'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Combined Order / Discount Modal ── */}
      {showOrderPanel && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-start justify-center p-4 overflow-y-auto"
          onClick={() => setShowOrderPanel(false)}>
          <div className="w-full max-w-2xl bg-background rounded-2xl p-4 my-4" onClick={e => e.stopPropagation()}>
            <CombinedOrderForm onClose={() => setShowOrderPanel(false)} lang={lang} />
          </div>
        </div>
      )}

      {/* Paywall */}
      {paywall && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" onClick={() => !adRunning && setPaywall(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-background p-5 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-center space-y-1">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-fuchsia-500 to-amber-400 flex items-center justify-center">
                <Lock className="text-white" />
              </div>
              <h3 className="font-extrabold">{lang === 'ar' ? 'انتهى عدد التوليدات المجانية' : 'Free generations used up'}</h3>
              <p className="text-xs text-muted-foreground">
                {lang === 'ar' ? 'شاهدي إعلاناً قصيراً للحصول على توليد إضافي، أو اشتركي بالمميز للاستخدام اللامحدود.' : 'Watch a short ad for +1 generation, or go Premium for unlimited.'}
              </p>
            </div>
            {adRunning ? (
              <div className="rounded-xl p-4 bg-secondary text-center space-y-2">
                <p className="text-xs font-bold">{lang === 'ar' ? '📺 إعلان...' : '📺 Ad playing...'}</p>
                <p className="text-3xl font-extrabold">{adRemain}s</p>
                <div className="h-1.5 rounded-full bg-background overflow-hidden">
                  <div className="h-full gradient-primary transition-all" style={{ width: `${((5 - adRemain) / 5) * 100}%` }} />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <button onClick={startAd}
                  className="w-full py-3 rounded-xl bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-95">
                  <Play size={16} /> {lang === 'ar' ? 'شاهدي إعلان (٥ ثوانٍ → +١)' : 'Watch Ad (5s → +1)'}
                </button>
                <button onClick={buyPremium}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-95">
                  <Crown size={16} /> {lang === 'ar' ? 'اشترِ المميز (لا محدود)' : 'Buy Premium (Unlimited)'}
                </button>
                <button onClick={() => setPaywall(false)} className="w-full py-2 text-xs text-muted-foreground">
                  {lang === 'ar' ? 'لاحقاً' : 'Later'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {gallery.length > 0 && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <ImagePlus size={16} className="text-primary" />
            <h4 className="font-bold text-sm">{lang === 'ar' ? `معرضكِ (${gallery.length})` : `Your Gallery (${gallery.length})`}</h4>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {gallery.map(g => (
              <div key={g.id} className="relative group rounded-lg overflow-hidden bg-secondary">
                <img src={g.url} alt={g.prompt} className="w-full aspect-square object-cover" />
                <button onClick={() => setGallery(prev => prev.filter(x => x.id !== g.id))}
                  className="absolute top-1 right-1 p-1 rounded-full bg-rose-500 text-white opacity-0 group-hover:opacity-100 transition">
                  <Trash2 size={10} />
                </button>
                <button onClick={() => downloadAs(g.url, 'png')}
                  className="absolute bottom-1 right-1 p-1 rounded-full bg-primary text-white opacity-0 group-hover:opacity-100 transition">
                  <Download size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MakeWebhookForm;
