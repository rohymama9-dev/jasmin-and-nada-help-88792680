import { useEffect, useState, useCallback } from 'react';
import { Lock, Upload, ChevronDown, ChevronUp, Trash2, Download, FileText } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { requireGoogle } from '@/lib/requireGoogle';
import { toast } from '@/hooks/use-toast';

interface PrivateUploadInlineProps {
  /** Bucket-key written into private_uploads.category (e.g. 'sticker', 'coloring') */
  category: string;
  /** Allowed MIME / extension list for <input accept=...> */
  accept: string;
  /** Friendly section label */
  labelAr: string;
  labelEn: string;
}

interface Item {
  id: string;
  title: string;
  storage_path: string;
  mime_type: string | null;
  signedUrl?: string;
}

/**
 * Per-user private uploads. Files are stored in the `private-uploads` bucket
 * under `<uid>/<category>/...` and are only readable by the owner via
 * signed URLs. Visible to ANY signed-in user (not just admins).
 */
const PrivateUploadInline = ({ category, accept, labelAr, labelEn }: PrivateUploadInlineProps) => {
  const { lang } = useLang();
  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) setUid(data.user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setUid(s?.user?.id ?? null),
    );
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!uid) {
      setItems([]);
      return;
    }
    const { data, error } = await (supabase as any)
      .from('private_uploads')
      .select('id,title,storage_path,mime_type')
      .eq('category', category)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error || !data) {
      setItems([]);
      return;
    }
    // Sign URLs in parallel
    const signed = await Promise.all(
      (data as any[]).map(async (row: any) => {
        const { data: s } = await supabase.storage
          .from('private-uploads')
          .createSignedUrl(row.storage_path, 60 * 60);
        return { ...row, signedUrl: s?.signedUrl } as Item;
      }),
    );
    setItems(signed);
  }, [uid, category]);

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  const handleOpen = async () => {
    if (!uid) {
      requireGoogle('download');
      return;
    }
    setOpen((o) => !o);
  };

  const handleUpload = async () => {
    if (!uid) {
      requireGoogle('download');
      return;
    }
    if (!file || !title.trim()) {
      toast({ title: t('أكملي البيانات', 'Complete the form'), variant: 'destructive' });
      return;
    }
    setBusy(true);
    try {
      const ext = file.name.split('.').pop() || 'bin';
      const safeTitle =
        title.trim().replace(/[^\p{L}\p{N}_-]+/gu, '_').slice(0, 60) || 'untitled';
      const path = `${uid}/${category}/${Date.now()}-${safeTitle}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('private-uploads')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const { error: insErr } = await (supabase as any).from('private_uploads').insert({
        user_id: uid,
        category,
        title: title.trim(),
        storage_path: path,
        mime_type: file.type || null,
      });
      if (insErr) throw insErr;

      toast({ title: t('تم الحفظ بشكل خاص 🔒', 'Saved privately 🔒') });
      setTitle('');
      setFile(null);
      refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t('فشل الرفع', 'Upload failed');
      toast({ title: msg, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (item: Item) => {
    if (!confirm(t('حذف هذا الملف؟', 'Delete this file?'))) return;
    await supabase.storage.from('private-uploads').remove([item.storage_path]);
    await (supabase as any).from('private_uploads').delete().eq('id', item.id);
    refresh();
  };

  return (
    <div className="glass-card rounded-2xl p-3 border border-primary/30 mb-4">
      <button
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center justify-between text-sm font-bold text-primary"
      >
        <span className="flex items-center gap-2">
          <Lock size={14} />
          {t('ملفاتي الخاصة', 'My private files')} • {lang === 'ar' ? labelAr : labelEn}
        </span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div className="mt-3 space-y-3 animate-fade-in">
          {!uid && (
            <p className="text-[11px] text-muted-foreground">
              {t(
                'سجّلي الدخول بجوجل لحفظ ملفاتك بشكل خاص.',
                'Sign in with Google to keep files private.',
              )}
            </p>
          )}

          {uid && (
            <>
              <div className="space-y-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('العنوان', 'Title')}
                  maxLength={120}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <input
                  type="file"
                  accept={accept}
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="w-full text-xs file:mr-2 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:text-xs file:font-semibold"
                />
                {file && (
                  <p className="text-[10px] text-muted-foreground">
                    {file.name} • {(file.size / 1024).toFixed(0)} KB
                  </p>
                )}
                <button
                  onClick={handleUpload}
                  disabled={busy || !file || !title.trim()}
                  className="w-full py-2 rounded-xl gradient-primary text-primary-foreground text-xs font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  <Upload size={12} />
                  {busy ? t('جاري الرفع...', 'Uploading...') : t('رفع خاص', 'Upload privately')}
                </button>
              </div>

              {items.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <p className="text-[10px] text-muted-foreground font-semibold">
                    {t('ملفاتي', 'My files')} ({items.length})
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {items.map((it) => {
                      const isImage = it.mime_type?.startsWith('image/');
                      return (
                        <div
                          key={it.id}
                          className="rounded-xl bg-secondary/40 p-2 flex flex-col items-center gap-1"
                        >
                          {isImage && it.signedUrl ? (
                            <img
                              src={it.signedUrl}
                              alt={it.title}
                              className="w-full h-20 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-full h-20 flex items-center justify-center rounded-lg bg-background">
                              <FileText size={28} className="text-muted-foreground" />
                            </div>
                          )}
                          <p className="text-[10px] font-medium text-foreground truncate w-full text-center">
                            {it.title}
                          </p>
                          <div className="flex gap-1 w-full">
                            {it.signedUrl && (
                              <a
                                href={it.signedUrl}
                                target="_blank"
                                rel="noreferrer"
                                download={it.title}
                                className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-semibold"
                              >
                                <Download size={10} />
                                {t('فتح', 'Open')}
                              </a>
                            )}
                            <button
                              onClick={() => handleDelete(it)}
                              aria-label="delete"
                              className="px-2 py-1 rounded-lg bg-destructive/10 text-destructive"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PrivateUploadInline;
