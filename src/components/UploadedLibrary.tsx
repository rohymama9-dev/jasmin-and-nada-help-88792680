import { useEffect, useState } from 'react';
import { ExternalLink, Trash2 } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/useIsAdmin';

interface UploadRow {
  id: string;
  user_id: string;
  category: string;
  title: string;
  public_url: string;
  storage_path: string;
  mime_type: string | null;
  created_at: string;
}

interface Props {
  category: 'summary' | 'story' | 'coloring';
  reloadKey?: number;
}

const UploadedLibrary = ({ category, reloadKey = 0 }: Props) => {
  const { lang } = useLang();
  const { isAdmin } = useIsAdmin();
  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  const [items, setItems] = useState<UploadRow[]>([]);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    let active = true;
    (supabase as any)
      .from('admin_uploads')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (active) setItems((data as UploadRow[]) || []);
      });
    return () => { active = false; };
  }, [category, reloadKey]);

  const handleDelete = async (item: UploadRow) => {
    if (!isAdmin || item.user_id !== uid) return;
    if (!confirm(t('حذف هذا العنصر؟', 'Delete this item?'))) return;
    await supabase.storage.from('admin-uploads').remove([item.storage_path]);
    await (supabase as any).from('admin_uploads').delete().eq('id', item.id);
    setItems(prev => prev.filter(i => i.id !== item.id));
  };

  if (items.length === 0) return null;

  return (
    <div className="space-y-2 mb-5">
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide px-1">
        {t('محتوى منشور', 'Published')}
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {items.map(item => {
          const isImage = (item.mime_type || '').startsWith('image/');
          return (
            <div key={item.id} className="glass-card rounded-xl p-2 space-y-1 flex flex-col justify-between">
              {isImage ? (
                <img
                  src={item.public_url}
                  alt=""
                  className="w-full h-24 object-cover rounded-lg bg-secondary"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-24 rounded-lg bg-secondary flex items-center justify-center text-3xl">
                  📄
                </div>
              )}
              
              {/* تم حذف العنوان بالكامل هنا ليعرض فقط الصورة مع خيارات التحكم */}
              <div className="flex items-center gap-1 pt-1">
                <a
                  href={item.public_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 text-center text-[10px] font-semibold py-1 rounded-lg bg-primary/10 text-primary flex items-center justify-center gap-1 hover:bg-primary/20 transition-colors"
                >
                  <ExternalLink size={10} /> {t('فتح', 'Open')}
                </a>
                {isAdmin && item.user_id === uid && (
                  <button
                    onClick={() => handleDelete(item)}
                    className="p-1 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UploadedLibrary;