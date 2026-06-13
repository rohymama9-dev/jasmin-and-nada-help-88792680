import { useState } from 'react';
import { Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AdminUploadInlineProps {
  /** Category bucket key written into admin_uploads.category */
  category: 'summary' | 'story' | 'coloring';
  /** Allowed MIME / extension list for <input accept=...> */
  accept: string;
  /** Friendly section label for the toggle button */
  labelAr: string;
  labelEn: string;
  /** Called after a successful publish so the parent can refresh its list */
  onUploaded?: () => void;
}

/**
 * Compact admin-only inline uploader rendered INSIDE Book Summaries,
 * Kids Stories and Coloring Studio. Hidden for non-admin users.
 */
const AdminUploadInline = ({ category, accept, labelAr, labelEn, onUploaded }: AdminUploadInlineProps) => {
  const { lang } = useLang();
  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  const [authEmail, setAuthEmail] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const ADMIN_EMAIL = 'yasminehassan037@gmail.com';

  const handleAuth = () => {
    if (authEmail.trim().toLowerCase() === ADMIN_EMAIL) {
      setIsAuthorized(true);
      toast({ title: t('تم التحقق ✅', 'Verified ✅') });
    } else {
      toast({ title: t('غير مصرح ❌', 'Unauthorized ❌'), variant: 'destructive' });
    }
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      toast({ title: t('أكملي البيانات', 'Complete the form'), variant: 'destructive' });
      return;
    }
    setBusy(true);
    try {
      // Owner uploads are name-based — no Google / Supabase auth required.
      // We tag each row with a stable "anon-owner" UUID; storage path includes
      // the saved name for human-readable bookkeeping.
      const ANON_OWNER = '00000000-0000-0000-0000-000000000001';
      const owner = (typeof window !== 'undefined'
        ? localStorage.getItem('app-guest-name') || 'owner'
        : 'owner').trim().replace(/[^\p{L}\p{N}_-]+/gu, '_').slice(0, 30) || 'owner';

      const ext = file.name.split('.').pop() || 'bin';
      const safeTitle = title.trim().replace(/[^\p{L}\p{N}_-]+/gu, '_').slice(0, 60) || 'untitled';
      const path = `${owner}/${category}/${Date.now()}-${safeTitle}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('admin-uploads')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from('admin-uploads').getPublicUrl(path);

      const { error: insErr } = await supabase.from('admin_uploads').insert({
        user_id: ANON_OWNER,
        category,
        title: title.trim(),
        storage_path: path,
        public_url: pub.publicUrl,
        mime_type: file.type || null,
      });
      if (insErr) throw insErr;

      toast({ title: t('تم النشر! 🎉', 'Published! 🎉') });
      setTitle(''); setFile(null); setOpen(false);
      onUploaded?.();
    } catch (e: any) {
      toast({ title: e.message || t('فشل الرفع', 'Upload failed'), variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-3 border border-primary/30 mb-4">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between text-sm font-bold text-primary"
      >
        <span className="flex items-center gap-2">
          <Upload size={16} />
          {t('نشر من جهازي', 'Publish from device')} • {lang === 'ar' ? labelAr : labelEn}
        </span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div className="mt-3 space-y-3 animate-fade-in">
          {!isAuthorized ? (
            <div className="space-y-2 border-t border-primary/10 pt-3">
              <p className="text-[10px] text-muted-foreground text-center mb-1">
                {t('أدخلي البريد الإلكتروني للمتابعة', 'Enter email to continue')}
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="flex-1 px-3 py-1.5 rounded-lg bg-background border border-border text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
                <button
                  onClick={handleAuth}
                  className="px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground text-xs font-bold active:scale-95"
                >
                  {t('تحقق', 'Verify')}
                </button>
              </div>
            </div>
          ) : (
            <>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={t('العنوان (مثلاً: ملخص كتاب...)', 'Title (e.g. Book Summary...)')}
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                type="file"
                accept={accept}
                onChange={e => setFile(e.target.files?.[0] ?? null)}
                className="w-full text-[10px] file:mr-2 file:px-2 file:py-1 file:rounded-md file:border-0 file:bg-primary/10 file:text-primary file:font-semibold"
              />
              <button
                onClick={handleUpload}
                disabled={busy || !file || !title.trim()}
                className="w-full py-2 rounded-xl gradient-primary text-primary-foreground text-xs font-bold disabled:opacity-50 transition-all active:scale-95"
              >
                {busy ? t('جاري النشر...', 'Publishing...') : t('تأكيد النشر', 'Confirm Publish')}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminUploadInline;
