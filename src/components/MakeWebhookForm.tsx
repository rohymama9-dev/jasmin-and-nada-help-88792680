import { useEffect, useState } from 'react';
import {
  Loader2, CheckCircle, XCircle, Sparkles, Download, Trash2,
  Save, ImagePlus, Lock, Play, Crown, Minus, Plus,
  ChevronDown, ChevronUp, AlertTriangle, Send
} from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { usePoints } from '@/hooks/usePoints';
import { lsGet, lsSet, lsGetJSON, lsSetJSON } from '@/lib/userStorage';
import { toast } from '@/hooks/use-toast';

const WEBHOOK_URL = 'https://hook.eu1.make.com/w4s92px8gl6rj548jyp7isume7lqgifc';
const UNLOCK_COST = 500;
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
          {lang === 'ar' ? `افتحي الأداة بـ ${UNLOCK_COST} نقطة. توليد صور عالية الدقة.` : `Unlock for ${UNLOCK_COST} points. High-resolution generation.`}
        </p>
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

        <textarea value={textInput} onChange={e => setTextInput(e.target.value)}
          placeholder={lang === 'ar' ? 'صفِ الصورة بالتفصيل... (مثال: قطة فضائية ترتدي بدلة فضاء، فن رقمي، 4k)' : 'Describe the image in detail... (e.g. astronaut cat, digital art, 4k)'}
          className="w-full px-3 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[110px] resize-none"
          maxLength={5000} />

        <button onClick={handleSubmit} disabled={loading || !textInput.trim()}
          className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95">
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
          {loading ? (lang === 'ar' ? 'جاري الإنشاء...' : 'Generating...') : (lang === 'ar' ? '✨ إنشاء صورة' : '✨ Generate Image')}
        </button>

        {loading && (
          <div className="rounded-2xl p-5 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-indigo-500/10 border border-primary/20">
            <div className="flex items-center gap-3">
              <Loader2 className="animate-spin text-primary" />
              <p className="text-sm font-bold">{lang === 'ar' ? 'الذكاء الاصطناعي يرسم...' : 'AI is drawing...'}</p>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div className="h-full w-3/5 bg-gradient-to-r from-pink-500 via-fuchsia-500 to-indigo-500 animate-pulse" />
            </div>
          </div>
        )}

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

// ─────────────────────────────────────────────
// COMBINED ORDER + DISCOUNT FORM
// ─────────────────────────────────────────────
const REGULAR_SERVICES = [
  { id: 'watermark',     arName: 'إزالة العلامة المائيةعلي حسب حجمه ومكانه',    enName: 'Watermark Removal',      price: '$5' },
  { id: 'img_upscale',   arName: 'رفع جودة 3 الصور',           enName: 'Image Upscaling',         price: '$5' },
  { id: 'vid_upscale',   arName: 'رفع جودة الفيديو القصير',         enName: 'Video Upscaling',         price: '$8' },
  { id: 'translation',   arName: 'ترجمة ',                    enName: 'Translation',             price: '$5+' },
  { id: 'rewriting',     arName: 'إعادة صياغة المحتوى',      enName: 'Content Rewriting',       price: '$5+' },
  { id: 'transcription', arName: 'تفريغ صوتي',               enName: 'Audio Transcription',     price: '$5+' },
  { id: 'logo',          arName: 'تصميم شعار',               enName: 'Logo Design',             price: '$10' },
  { id: 'logo_anim',     arName: 'تحريك شعار',               enName: 'Logo Animation',          price: '$15' },
  { id: 'short_vid',     arName: 'فيديو قصير',               enName: 'Short Video Creation',    price: '$10-$20' },
  { id: 'animation',     arName: 'أنيميشن',                  enName: 'Animation',               price: 'تسعير مخصص / Custom' },
];

const OFFER_SERVICES = [
  { id: 'offer_img', arName: 'تعديل صورتين بالذكاء الاصطناعي مع دمجهم مع الصور القديمةوتحسين جودتهم', enName: 'AI Image Editing (2 images)', price: '$3 بدل $5 / $3 nstead of $5' },
  { id: 'offer_pdf', arName: 'تحويل ملفين Word/PDF',            enName: 'Word/PDF Conversion (2 files)', price: '$3 بدل $5 / $3 instead of $5' },
];

function CombinedOrderForm({ onClose, lang }: { onClose: () => void; lang: string }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showOffers, setShowOffers] = useState(false);
  const [deliveryDays, setDeliveryDays] = useState(2);
  const [details, setDetails] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [sending, setSending] = useState(false);

  const updateQty = (id: string, delta: number) =>
    setQuantities(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }));

  const handleSubmit = async () => {
    const chosen = [...REGULAR_SERVICES, ...OFFER_SERVICES]
      .filter(s => (quantities[s.id] || 0) > 0)
      .map(s => `${lang === 'ar' ? s.arName : s.enName} x${quantities[s.id]} (${s.price})`);

    if (chosen.length === 0) {
      alert(lang === 'ar' ? 'الرجاء اختيار خدمة واحدة على الأقل' : 'Please select at least one service');
      return;
    }
    if (!clientPhone.trim()) {
      alert(lang === 'ar' ? 'الرجاء إدخال رقم التواصل' : 'Please enter contact info');
      return;
    }

    setSending(true);
    try {
      const fastNote = deliveryDays < 2 ? ' ⚡ (طلب سريع — قد يزيد السعر)' : '';
      const message =
        `<b>📦 New Service Order</b>\n` +
        `📞 Contact: ${clientPhone}\n` +
        `🛒 Services:\n${chosen.join('\n')}\n` +
        `🕐 Delivery: ${deliveryDays} day(s)${fastNote}\n` +
        `📝 Details: ${details || '—'}`;
      const { supabase } = await import('@/integrations/supabase/client');
      await supabase.functions.invoke('send-telegram', { body: { message } });
      alert(lang === 'ar'
        ? 'تم إرسال طلبك بنجاح! سنتواصل معك قريباً'
        : 'Your order was sent successfully! We will contact you soon.');
      onClose();
    } catch (e) {
      console.error(e);
      alert(lang === 'ar' ? 'فشل الإرسال' : 'Failed to send');
    } finally { setSending(false); }
  };

  return (
    <div className="space-y-5 max-h-[85vh] overflow-y-auto px-1">
      <h3 className="text-lg font-extrabold text-center text-foreground">
        {lang === 'ar' ? '🛒 طلب خدمات وخصومات الذكاء الاصطناعي' : '🛒 Order AI Services & Discounts'}
      </h3>

      {/* ── Regular services ── */}
      <div className="space-y-2 bg-white/60 dark:bg-white/5 p-4 rounded-2xl border border-border">
        <h4 className="font-bold text-sm text-foreground mb-2">
          {lang === 'ar' ? 'الخدمات المتاحة:' : 'Available Services:'}
        </h4>
        {REGULAR_SERVICES.map(s => (
          <div key={s.id} className="flex items-center justify-between gap-2 py-2 border-b border-border/40 last:border-0">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground leading-snug">
                {lang === 'ar' ? s.arName : s.enName}
              </p>
              <p className="text-xs font-bold text-primary">{s.price}</p>
            </div>
            <div className="flex items-center gap-2 bg-secondary rounded-xl px-2 py-1 shrink-0">
              <button type="button" onClick={() => updateQty(s.id, -1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-background transition">
                <Minus size={14} />
              </button>
              <span className="w-5 text-center text-sm font-bold">{quantities[s.id] || 0}</span>
              <button type="button" onClick={() => updateQty(s.id, 1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-background transition">
                <Plus size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Offer services (collapsible) ── */}
      <div className="rounded-2xl border border-primary/30 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowOffers(v => !v)}
          className="w-full p-4 flex items-center justify-between font-bold text-primary hover:bg-primary/5 transition"
        >
          <span>🎁 {lang === 'ar' ? 'عروض الخدمات الخاصة' : 'Special Service Offers'}</span>
          {showOffers ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {showOffers && (
          <div className="px-4 pb-4 space-y-2 bg-primary/5">
            {OFFER_SERVICES.map(s => (
              <div key={s.id} className="flex items-center justify-between gap-2 py-2 border-b border-primary/10 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground leading-snug">
                    {lang === 'ar' ? s.arName : s.enName}
                  </p>
                  <p className="text-xs font-bold text-rose-500">{s.price}</p>
                </div>
                <div className="flex items-center gap-2 bg-secondary rounded-xl px-2 py-1 shrink-0">
                  <button type="button" onClick={() => updateQty(s.id, -1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-background transition">
                    <Minus size={14} />
                  </button>
                  <span className="w-5 text-center text-sm font-bold">{quantities[s.id] || 0}</span>
                  <button type="button" onClick={() => updateQty(s.id, 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-background transition">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Delivery time ── */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">
          {lang === 'ar' ? 'وقت التسليم (بالأيام) — الافتراضي: يومان' : 'Delivery time (days) — default: 2 days'}
        </label>
        <input
          type="number" min={1} value={deliveryDays}
          onChange={e => setDeliveryDays(Number(e.target.value))}
          className="w-full px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {deliveryDays < 2 && (
          <p className="text-xs text-rose-500 font-medium">
            ⚡ {lang === 'ar' ? 'التسليم السريع (أقل من يومين) قد يزيد التكلفة.' : 'Rush delivery (under 2 days) may increase the cost.'}
          </p>
        )}
      </div>

      {/* ── Contact ── */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">
          {lang === 'ar' ? 'رقم التواصل (واتساب / تليجرام)' : 'Contact number (WhatsApp / Telegram)'}
        </label>
        <input
          type="text" dir="ltr" placeholder="01xxxxxxxxx"
          value={clientPhone} onChange={e => setClientPhone(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {/* ── Details ── */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">
          {lang === 'ar' ? 'تفاصيل إضافية للطلب' : 'Additional order details'}
        </label>
        <textarea
          rows={3} value={details} onChange={e => setDetails(e.target.value)}
          placeholder={lang === 'ar' ? 'اكتب هنا أي تفاصيل، روابط، أو متطلبات خاصة...' : 'Write any details, links, or special requirements...'}
          className="w-full px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
        />
      </div>

      {/* ── Legal warning ── */}
      <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 p-3 rounded-xl flex items-start gap-3 text-sm">
        <AlertTriangle size={18} className="shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p><strong>⚠️ تحذير قانوني:</strong> أي إساءة أو سوء سلوك سيؤدي إلى الإبلاغ الفوري وحظر الحساب والملاحقة القانونية.</p>
          <p><strong>⚠️ Legal Warning:</strong> Any abuse or misconduct will result in immediate reporting, account ban, and legal action.</p>
        </div>
      </div>

      {/* ── Submit ── */}
      <button
        onClick={handleSubmit} disabled={sending}
        className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition active:scale-[0.98] disabled:opacity-60"
      >
        {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        {sending
          ? (lang === 'ar' ? 'جاري الإرسال...' : 'Sending...')
          : (lang === 'ar' ? 'إرسال الطلب' : 'Send Order')}
      </button>

      {/* ── Why Choose Me box ── */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div dir="rtl" className="border-b md:border-b-0 md:border-l border-white/20 pb-4 md:pb-0 md:pl-4">
            <h4 className="font-extrabold text-lg border-b border-white/20 pb-2 mb-3">لماذا تختارني؟</h4>
            <ul className="space-y-2 text-sm font-medium">
              <li>✨ دقة عالية</li>
              <li>⏱️ التزام كامل بالمواعيد</li>
              <li>💼 جودة احترافية بسعر مناسب</li>
              <li>🎁 عروض مميزة عند طلب أكثر من خدمة</li>
              <li>📞 تواصل سريع وتعديلات مرنة</li>
            </ul>
          </div>
          <div dir="ltr">
            <h4 className="font-extrabold text-lg border-b border-white/20 pb-2 mb-3">Why Choose Me?</h4>
            <ul className="space-y-2 text-sm font-medium">
              <li>✨ High Accuracy</li>
              <li>⏱️ Reliable Delivery</li>
              <li>💼 Professional Quality</li>
              <li>🎁 Bundle Discounts</li>
              <li>📞 Fast Communication & Revisions</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Cancel */}
      <button onClick={onClose} className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition">
        {lang === 'ar' ? 'إغلاق' : 'Close'}
      </button>
    </div>
  );
}

export default MakeWebhookForm;
