import { useState, useEffect } from 'react';
import { Upload, FileText, Sticker, Palette, Trash2, ExternalLink, Lock } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

type Category = 'summary' | 'sticker' | 'coloring';

interface UploadRow {
  id: string;
  user_id: string;
  category: Category;
  title: string;
  storage_path: string;
  public_url: string;
  mime_type: string | null;
  created_at: string;
}

const catMeta: Record<Category, { ar: string; en: string; emoji: string; accept: string; icon: any }> = {
  summary: { ar: 'ملخص', en: 'Summary', emoji: '📄', accept: '.pdf,application/pdf', icon: FileText },
  sticker: { ar: 'ملصق', en: 'Sticker', emoji: '🎨', accept: '.png,image/png,image/jpeg,image/webp', icon: Sticker },
  coloring: { ar: 'صفحة تلوين', en: 'Coloring page', emoji: '🖍️', accept: '.png,image/png,image/jpeg', icon: Palette },
};

const AdminUploadForm = () => {
  const { lang } = useLang();
  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  const [authEmail, setAuthEmail] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [category, setCategory] = useState<Category>('summary');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [items, setItems] = useState<UploadRow[]>([]);
  const [filter, setFilter] = useState<Category | 'all'>('all');

  const ADMIN_EMAIL = 'yasminehassan037@gmail.com';

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? null));
    refresh();
  }, []);

  const handleAuth = () => {
    if (authEmail.trim().toLowerCase() === ADMIN_EMAIL) {
      setIsAuthorized(true);
      toast({ title: t('تم التحقق بنجاح ✅', 'Verification successful ✅') });
    } else {
      toast({ title: t('البريد غير مصرح له ❌', 'Unauthorized email ❌'), variant: 'destructive' });
    }
  };

  const refresh = async () => {
    const { data } = await supabase
      .from('admin_uploads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    setItems((data as UploadRow[]) || []);
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      toast({ title: t('الرجاء إكمال البيانات', 'Please complete the form'), variant: 'destructive' });
      return;
    }
    if (!uid) {
      toast({ title: t('يجب تسجيل الدخول', 'You must be signed in'), variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'bin';
      const path = `${uid}/${category}/${Date.now()}-${title.replace(/\s+/g, '_')}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('admin-uploads')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from('admin-uploads').getPublicUrl(path);

      const { error: insErr } = await supabase.from('admin_uploads').insert({
        user_id: uid,
        category,
        title: title.trim(),
        storage_path: path,
        public_url: pub.publicUrl,
        mime_type: file.type || null,
      });
      if (insErr) throw insErr;

      toast({ title: t('تم النشر! 🎉', 'Published! 🎉') });
      setTitle(''); setFile(null);
      refresh();
    } catch (e: any) {
      toast({ title: e.message || t('فشل الرفع', 'Upload failed'), variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (item: UploadRow) => {
    if (item.user_id !== uid) return;
    if (!confirm(t('حذف هذا العنصر؟', 'Delete this item?'))) return;
    await supabase.storage.from('admin-uploads').remove([item.storage_path]);
    await supabase.from('admin_uploads').delete().eq('id', item.id);
    refresh();
  };

  const filtered = items.filter(i => filter === 'all' || i.category === filter);

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl gradient-primary flex items-center justify-center mb-2 shadow-lg">
          <Upload size={24} className="text-primary-foreground" />
        </div>
        <h2 className="text-lg font-bold text-foreground">{t('نموذج النشر', 'Publishing Form')}</h2>
        <p className="text-xs text-muted-foreground mt-1">
          {t('ارفعي ملخصات PDF أو ملصقات أو صفحات تلوين', 'Upload PDF summaries, stickers, or coloring pages')}
        </p>
      </div>

      {/* Security Gate */}
      {!isAuthorized ? (
        <div className="glass-card rounded-2xl p-6 space-y-4 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Lock size={20} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold">{t('التحقق من الهوية', 'Security Verification')}</h3>
            <p className="text-[10px] text-muted-foreground">{t('أدخلي البريد الإلكتروني المصرح له للنشر', 'Enter authorized email to publish')}</p>
          </div>
          <input
            type="email"
            value={authEmail}
            onChange={e => setAuthEmail(e.target.value)}
            placeholder="example@gmail.com"
            className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-center"
          />
          <button
            onClick={handleAuth}
            className="w-full py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-bold active:scale-95 transition-all"
          >
            {t('تحقق', 'Verify')}
          </button>
        </div>
      ) : (
        <>
          {/* Form */}
          <div className="glass-card rounded-2xl p-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">{t('الفئة', 'Category')}</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(catMeta) as Category[]).map(c => {
                  const m = catMeta[c]; const Icon = m.icon;
                  return (
                    <button key={c} onClick={() => setCategory(c)}
                      className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all active:scale-95 ${
                        category === c ? 'gradient-primary text-primary-foreground' : 'bg-secondary/50 text-foreground'
                      }`}>
                      <Icon size={16} />
                      <span className="text-[10px] font-medium">{lang === 'ar' ? m.ar : m.en}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">{t('العنوان', 'Title')}</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder={t('عنوان واضح للمحتوى', 'Clear content title')}
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">{t('الملف', 'File')}</label>
              <input type="file" accept={catMeta[category].accept}
                onChange={e => setFile(e.target.files?.[0] ?? null)}
                className="w-full text-xs file:mr-2 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:text-xs file:font-semibold" />
              {file && <p className="text-[10px] text-muted-foreground mt-1">{file.name} • {(file.size / 1024).toFixed(0)} KB</p>}
            </div>

            <button onClick={handleUpload} disabled={uploading || !file || !title.trim()}
              className="w-full py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-bold disabled:opacity-50 transition-all">
              {uploading ? t('جاري الرفع...', 'Uploading...') : t('نشر الآن', 'Publish now')}
            </button>
          </div>

          {/* Library */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">{t('المكتبة المنشورة', 'Published Library')}</h3>
              <select value={filter} onChange={e => setFilter(e.target.value as any)}
                className="text-xs px-2 py-1 rounded-lg bg-secondary text-foreground border border-border">
                <option value="all">{t('الكل', 'All')}</option>
                <option value="summary">{t('ملخصات', 'Summaries')}</option>
                <option value="sticker">{t('ملصقات', 'Stickers')}</option>
                <option value="coloring">{t('تلوين', 'Coloring')}</option>
              </select>
            </div>
            {filtered.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-4">
                {t('لا يوجد محتوى منشور بعد', 'No published content yet')}
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              {filtered.map(item => {
                const m = catMeta[item.category];
                const isImage = (item.mime_type || '').startsWith('image/');
                return (
                  <div key={item.id} className="glass-card rounded-xl p-2 space-y-2">
                    {isImage ? (
                      <img src={item.public_url} alt={item.title}
                        className="w-full h-24 object-cover rounded-lg bg-secondary" loading="lazy" />
                    ) : (
                      <div className="w-full h-24 rounded-lg bg-secondary flex items-center justify-center text-3xl">{m.emoji}</div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-foreground truncate">{item.title}</p>
                      <p className="text-[10px] text-muted-foreground">{lang === 'ar' ? m.ar : m.en}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <a href={item.public_url} target="_blank" rel="noreferrer"
                        className="flex-1 text-center text-[10px] font-semibold py-1 rounded-lg bg-primary/10 text-primary flex items-center justify-center gap-1">
                        <ExternalLink size={10} /> {t('فتح', 'Open')}
                      </a>
                      {item.user_id === uid && (
                        <button onClick={() => handleDelete(item)}
                          className="p-1 rounded-lg bg-destructive/10 text-destructive">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminUploadForm;
