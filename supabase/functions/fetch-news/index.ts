// deno-lint-ignore-file
// Live news proxy. Uses gnews.io with the project's fixed API key.
// Public endpoint — verify_jwt = false (see supabase/config.toml).

const GNEWS_KEY = Deno.env.get("GNEWS_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

// Map our friendly category keys to gnews topics.
const TOPIC_MAP: Record<string, string> = {
  all: "breaking-news",
  sports: "sports",
  tech: "technology",
  politics: "world",
  science: "science",
  health: "health",
};

// Search queries for the celebrity vertical (kept for backward compat).
const CELEB_Q: Record<string, string> = {
  ar: "مشاهير OR فنانين OR نجوم",
  en: "celebrity OR celebrities OR Hollywood OR star",
};

// Generic search queries per topic (used when a time window is requested).
const SEARCH_Q_AR: Record<string, string> = {
  all: "أخبار",
  sports: "رياضة",
  tech: "تقنية OR تكنولوجيا",
  politics: "سياسة",
  science: "علوم",
  health: "صحة",
};
const SEARCH_Q_EN: Record<string, string> = {
  all: "news",
  sports: "sports",
  tech: "technology",
  politics: "politics",
  science: "science",
  health: "health",
};

const LANG_MAP: Record<string, { lang: string; country: string }> = {
  ar: { lang: "ar", country: "eg" },
  en: { lang: "en", country: "us" },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!GNEWS_KEY) {
      return new Response(
        JSON.stringify({ error: "news service not configured", articles: [] }),
        { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } },
      );
    }
    const url = new URL(req.url);
    const rawCat = url.searchParams.get("category") || "all";
    const range = (url.searchParams.get("range") || "").toLowerCase(); // "today" | "week" | ""
    const langKey = url.searchParams.get("lang") || "en";
    const { lang, country } = LANG_MAP[langKey] || LANG_MAP.en;

    // Backward compat: legacy keys "celebrity-today" / "celebrity-week"
    let cat = rawCat;
    let timeRange = range;
    if (rawCat === "celebrity-today") { cat = "celebrity"; timeRange = "today"; }
    if (rawCat === "celebrity-week") { cat = "celebrity"; timeRange = "week"; }

    let api: string;
    if (cat === "celebrity" || timeRange === "today" || timeRange === "week") {
      const days = timeRange === "week" ? 7 : 1;
      const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const q = cat === "celebrity"
        ? CELEB_Q[lang] || CELEB_Q.en
        : (lang === "ar" ? SEARCH_Q_AR[cat] || SEARCH_Q_AR.all : SEARCH_Q_EN[cat] || SEARCH_Q_EN.all);
      api =
        `https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}` +
        `&lang=${lang}&country=${country}&from=${from}&sortby=publishedAt&max=20&apikey=${GNEWS_KEY}`;
    } else {
      const topic = TOPIC_MAP[cat] || "breaking-news";
      api =
        `https://gnews.io/api/v4/top-headlines?topic=${topic}` +
        `&lang=${lang}&country=${country}&max=20&apikey=${GNEWS_KEY}`;
    }

    const r = await fetch(api);
    const json = await r.json();

    if (!r.ok) {
      return new Response(
        JSON.stringify({ error: json?.errors?.[0] || "news upstream failed", articles: [] }),
        { status: 502, headers: { ...corsHeaders, "content-type": "application/json" } },
      );
    }

    // Deduplicate by URL and by normalized title to avoid repetitions.
    const seenUrl = new Set<string>();
    const seenTitle = new Set<string>();
    const articles: any[] = [];
    for (const a of (json.articles || [])) {
      const url = (a.url || "").trim();
      const titleKey = (a.title || "").toLowerCase().replace(/\s+/g, " ").trim().slice(0, 120);
      if (!url && !titleKey) continue;
      if (url && seenUrl.has(url)) continue;
      if (titleKey && seenTitle.has(titleKey)) continue;
      if (url) seenUrl.add(url);
      if (titleKey) seenTitle.add(titleKey);
      articles.push({
        id: `${a.publishedAt || ""}-${url.slice(-16) || titleKey.slice(0, 16)}`,
        title: a.title || "",
        description: a.description || "",
        content: a.content || "",
        url,
        image: a.image || "",
        publishedAt: a.publishedAt || "",
        source: a.source?.name || "",
      });
    }

    return new Response(JSON.stringify({ articles }), {
      headers: {
        ...corsHeaders,
        "content-type": "application/json",
        "cache-control": "public, max-age=300",
      },
    });
  } catch (e) {
    console.error("[fetch-news]", (e as Error).message);
    return new Response(
      JSON.stringify({ error: "failed to fetch news", articles: [] }),
      { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } },
    );
  }
});
