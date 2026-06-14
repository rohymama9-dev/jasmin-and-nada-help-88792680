import { useEffect, useState } from 'react';
import { Newspaper, ChevronDown, ChevronUp, ExternalLink, Loader2 } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

interface NewsFeedProps {
  onPoints: (n: number) => void;
}

interface Article {
  id: string;
  title: string;
  description: string;
  content: string;
  url: string;
  image: string;
  publishedAt: string;
  source: string;
}

const READ_KEY = 'app-news-read-v2';
const POINTS_AWARDED = 'app-news-points-v2';

const categories = [
  { key: 'all', ar: 'الكل', en: 'All', emoji: '📰' },
  { key: 'sports', ar: 'رياضة', en: 'Sports', emoji: '⚽' },
  { key: 'tech', ar: 'تقنية', en: 'Tech', emoji: '💻' },
  { key: 'politics', ar: 'سياسة', en: 'Politics', emoji: '🏛️' },
  { key: 'science', ar: 'علوم', en: 'Science', emoji: '🔬' },
  { key: 'health', ar: 'صحة', en: 'Health', emoji: '🏥' },
  { key: 'celebrity', ar: 'مشاهير', en: 'Celebrities', emoji: '🌟' },
];

const ranges = [
  { key: '', ar: 'الأحدث', en: 'Latest', emoji: '🆕' },
  { key: 'today', ar: 'اليوم', en: 'Today', emoji: '📅' },
  { key: 'week', ar: 'هذا الأسبوع', en: 'This Week', emoji: '🗓️' },
];

const NewsFeed = ({ onPoints }: NewsFeedProps) => {
  const { lang } = useLang();
  const [cat, setCat] = useState('all');
  const [range, setRange] = useState<'' | 'today' | 'week'>('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readIds, setReadIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(READ_KEY) || '[]'); } catch { return []; }
  });
  const [awardedIds, setAwardedIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(POINTS_AWARDED) || '[]'); } catch { return []; }
  });

  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true); setError(null);
      try {
        const TOPIC_MAP: Record<string, string> = {
          all: "breaking-news", sports: "sports", tech: "technology",
          politics: "world", science: "science", health: "health",
        };
        const CELEB_Q: Record<string, string> = {
          ar: "مشاهير OR فنانين OR نجوم", en: "celebrity OR celebrities OR Hollywood OR star",
        };
        const SEARCH_Q_AR: Record<string, string> = {
          all: "أخبار", sports: "رياضة", tech: "تقنية OR تكنولوجيا",
          politics: "سياسة", science: "علوم", health: "صحة",
        };
        const SEARCH_Q_EN: Record<string, string> = {
          all: "news", sports: "sports", tech: "technology",
          politics: "politics", science: "science", health: "health",
        };
        const LANG_MAP: Record<string, { lang: string; country: string }> = {
          ar: { lang: "ar", country: "eg" }, en: { lang: "en", country: "us" },
        };

        const { lang: apiLang, country } = LANG_MAP[lang] || LANG_MAP.en;
        
        let api: string;
        if (cat === "celebrity" || range === "today" || range === "week") {
          const days = range === "week" ? 7 : 1;
          const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
          const q = cat === "celebrity"
            ? (CELEB_Q[apiLang] || CELEB_Q.en)
            : (apiLang === "ar" ? (SEARCH_Q_AR[cat] || SEARCH_Q_AR.all) : (SEARCH_Q_EN[cat] || SEARCH_Q_EN.all));
          api = `/api/news/v4/search?q=${encodeURIComponent(q)}&lang=${apiLang}&country=${country}&from=${from}&sortby=publishedAt&max=20&apikey=11da12c8c08db9d912fe59c560f651f5`;
        } else {
          const topic = TOPIC_MAP[cat] || "breaking-news";
          api = `/api/news/v4/top-headlines?topic=${topic}&lang=${apiLang}&country=${country}&max=20&apikey=11da12c8c08db9d912fe59c560f651f5`;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(api, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!active) return;
        if (!res.ok) throw new Error('API Request Failed');

        const json = await res.json();
        if (json.errors) throw new Error(json.errors[0]);

        // Deduplicate
        const seenUrl = new Set<string>();
        const seenTitle = new Set<string>();
        const finalArticles: Article[] = [];
        for (const a of (json.articles || [])) {
          const articleUrl = (a.url || "").trim();
          const titleKey = (a.title || "").toLowerCase().replace(/\s+/g, " ").trim().slice(0, 120);
          if (!articleUrl && !titleKey) continue;
          if (articleUrl && seenUrl.has(articleUrl)) continue;
          if (titleKey && seenTitle.has(titleKey)) continue;
          if (articleUrl) seenUrl.add(articleUrl);
          if (titleKey) seenTitle.add(titleKey);
          finalArticles.push({
            id: `${a.publishedAt || ""}-${articleUrl.slice(-16) || titleKey.slice(0, 16)}`,
            title: a.title || "",
            description: a.description || "",
            content: a.content || "",
            url: articleUrl,
            image: a.image || "",
            publishedAt: a.publishedAt || "",
            source: a.source?.name || "",
          });
        }
        
        setArticles(finalArticles);
      } catch (e: any) {
        if (!active) return;
        console.error('[NewsFeed] Error fetching news:', e);
        setError(lang === 'ar' ? 'عذراً، تعذر الاتصال بخدمة الأخبار' : 'Sorry, could not connect to news service');
        setArticles([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [cat, range, lang, retryCount]);

  const handleRead = (a: Article) => {
    if (expanded === a.id) { setExpanded(null); return; }
    setExpanded(a.id);
    if (!readIds.includes(a.id)) {
      const next = [...readIds, a.id];
      setReadIds(next);
      localStorage.setItem(READ_KEY, JSON.stringify(next));
    }
    // Award points only when user reads the FULL article (expands & has content)
    if (!awardedIds.includes(a.id) && (a.content || a.description)) {
      const next = [...awardedIds, a.id];
      setAwardedIds(next);
      localStorage.setItem(POINTS_AWARDED, JSON.stringify(next));
      onPoints(3);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-5 animate-slide-up space-y-4">
      <div className="flex items-center gap-2">
        <Newspaper size={18} className="text-primary" />
        <h3 className="font-semibold text-foreground">{lang === 'ar' ? 'الأخبار المباشرة' : 'Live News'}</h3>
        <span className="text-[10px] text-muted-foreground ml-auto">
          +3⭐ {lang === 'ar' ? 'لقراءة المقال' : 'per full read'}
        </span>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {categories.map(c => (
          <button key={c.key} onClick={() => setCat(c.key)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all ${
              cat === c.key ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
            }`}>
            {c.emoji} {lang === 'ar' ? c.ar : c.en}
          </button>
        ))}
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {ranges.map(r => (
          <button key={r.key || 'latest'} onClick={() => setRange(r.key as '' | 'today' | 'week')}
            className={`px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all ${
              range === r.key ? 'bg-primary/20 text-primary ring-1 ring-primary' : 'bg-secondary/60 text-secondary-foreground'
            }`}>
            {r.emoji} {lang === 'ar' ? r.ar : r.en}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-6">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-4 space-y-2">
          <p className="text-xs text-destructive">{error}</p>
          <button 
            onClick={() => setRetryCount(prev => prev + 1)}
            className="text-[10px] font-bold text-primary hover:underline"
          >
            {lang === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
          </button>
        </div>
      )}

      <div className="space-y-2 max-h-[28rem] overflow-y-auto">
        {!loading && articles.map(a => {
          const isRead = readIds.includes(a.id);
          const isExpanded = expanded === a.id;
          return (
            <div key={a.id} className={`glass-card rounded-xl p-3 transition-all ${isRead ? 'opacity-80' : ''}`}>
              <button onClick={() => handleRead(a)} className="w-full text-start">
                <div className="flex items-start gap-2">
                  {a.image && (
                    <img src={a.image} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" loading="lazy" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground leading-snug">{a.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{a.source}</p>
                  </div>
                  {isExpanded
                    ? <ChevronUp size={14} className="text-muted-foreground flex-shrink-0" />
                    : <ChevronDown size={14} className="text-muted-foreground flex-shrink-0" />}
                </div>
                {isExpanded && (
                  <div className="mt-3 space-y-2 animate-slide-up">
                    <p className="text-xs text-foreground leading-relaxed">{a.description}</p>
                    {a.content && <p className="text-xs text-muted-foreground leading-relaxed">{a.content}</p>}
                  </div>
                )}
              </button>
              {isExpanded && a.url && (
                <a href={a.url} target="_blank" rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-[10px] text-primary hover:underline">
                  <ExternalLink size={10} />
                  {lang === 'ar' ? 'اقرأ المصدر' : 'Read source'}
                </a>
              )}
            </div>
          );
        })}
        {!loading && !error && articles.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">
            {lang === 'ar' ? 'لا توجد أخبار حالياً' : 'No news available'}
          </p>
        )}
      </div>
    </div>
  );
};

export default NewsFeed;
