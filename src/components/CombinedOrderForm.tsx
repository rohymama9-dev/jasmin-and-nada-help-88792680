import { toast } from 'sonner';
import React, { useState } from 'react';
import { Minus, Plus, ChevronDown, ChevronUp, Send, Loader2, AlertTriangle } from 'lucide-react';

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
  { id: 'offer_img', arName: 'تعديل صورتين بالذكاء الاصطناعي مع دمجهم مع الصور القديمة وتحسين جودتهم', enName: 'AI Image Editing (2 images)', price: '$3', arPrice: '$3 بدل $5', enPrice: '$3 instead of $5' },
  { id: 'offer_pdf', arName: 'تحويل ملفين Word/PDF',            enName: 'Word/PDF Conversion (2 files)', price: '$3', arPrice: '$3 بدل $5', enPrice: '$3 instead of $5' },
  { id: 'offer_bg10', arName: 'إزالة خلفية 10 صور مع تحسين جودتهم مع اضافتهم للقديمه وعدم عرضهم في معرض صوري', enName: 'Remove BG & upscale 10 images (Private)', price: '$10' },
  { id: 'offer_vid_compress3', arName: 'باقة ترجمة 3 فيديوهات', enName: 'translate 3 videos bundle', price: '$15', arPrice: '15 دولار بدلاً من 30', enPrice: '$15 instead of $30' },
  { id: 'offer_mp4_to_mp3', arName: 'باقة تحويل15 فيديو إلى صوت (MP4 to MP3)', enName: 'MP4 to MP3 conversion 15 videos', price: '$20', arPrice: '20 دولار', enPrice: '$20' },
  { id: 'offer_hide_gallery', arName: 'عرض الخصم الهائل: عدم عرض الصور في معرضي الخاص', enName: 'Hide photos from private gallery', price: '$3', arPrice: '3 دولار بدلاً من 20 دولار', enPrice: '$3 instead of $20' },
  { id: 'offer_restore_10', arName: 'باقة ترميم10 وتلوين الصور وتحسين الجودة', enName: 'Restore 10 images bundle', price: '$15', arPrice: '15 دولار بدلاً من 30', enPrice: '$15 instead of $30' },
];

export default function CombinedOrderForm({ onClose, lang, hideOffers }: { onClose: () => void; lang: string; hideOffers?: boolean }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showOffers, setShowOffers] = useState(false);
  const [deliveryDays, setDeliveryDays] = useState(2);
  const [details, setDetails] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [sending, setSending] = useState(false);

  const updateQty = (id: string, delta: number) =>
    setQuantities(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }));

  const handleSubmit = async () => {
    const chosen = [...REGULAR_SERVICES, ...(hideOffers ? [] : OFFER_SERVICES)]
      .filter(s => (quantities[s.id] || 0) > 0)
      .map(s => `${lang === 'ar' ? s.arName : s.enName} x${quantities[s.id]} (${s.price})`);

    if (chosen.length === 0) {
      toast.error(lang === 'ar' ? 'الرجاء اختيار خدمة واحدة على الأقل' : 'Please select at least one service');
      return;
    }
    if (!clientPhone.trim()) {
      toast.error(lang === 'ar' ? 'الرجاء إدخال رقم التواصل' : 'Please enter contact info');
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
      toast.success(lang === 'ar'
        ? 'تم إرسال طلبك بنجاح! سنتواصل معك قريباً'
        : 'Your order was sent successfully! We will contact you soon.');
      onClose();
    } catch (e) {
      console.error(e);
      toast.error(lang === 'ar' ? 'فشل الإرسال' : 'Failed to send');
    } finally { setSending(false); }
  };

  return (
    <div className="space-y-5 max-h-[85vh] overflow-y-auto px-1">
      <h3 className="text-lg font-extrabold text-center text-foreground">
        {lang === 'ar' ? '🛒 طلب خدمات' : '🛒 Order Services'}
      </h3>

      <div className="text-center text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 py-2 px-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
        💡 {lang === 'ar' ? 'معلومة: يمكن التعامل بالجنيه المصري مباشرة ويتم التحويل حتى بمحفظة كاش (مثل فودافون كاش).' : 'Note: You can pay directly in Egyptian Pounds via Cash Wallets.'}
      </div>

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
      {!hideOffers && (
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
                    <p className="text-xs font-bold text-rose-500">{lang === 'ar' ? s.arPrice || s.price : s.enPrice || s.price}</p>
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
      )}

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
