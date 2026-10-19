import { useEffect, useMemo, useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { ArrowDown, ArrowLeftRight, ArrowRight, ArrowUp } from 'lucide-react';
import { toast } from 'sonner';

type RatesResponse = {
  result: 'success' | 'error';
  base_code: string;
  time_last_update_unix?: number;
  rates?: Record<string, number>;
};

const CACHE_PREFIX = 'app-currency-rates-v1:';
const CACHE_TTL_MS = 30 * 60 * 1000;
const TREND_PREFIX = 'app-currency-trend-v1:';

type CurrencyMeta = {
  flag: string;
  countryEn: string;
  countryAr: string;
  currencyEn: string;
  currencyAr: string;
};

const META: Record<string, CurrencyMeta> = {
  USD: { flag: '🇺🇸', countryEn: 'United States', countryAr: 'الولايات المتحدة', currencyEn: 'US Dollar', currencyAr: 'دولار أمريكي' },
  EUR: { flag: '🇪🇺', countryEn: 'European Union', countryAr: 'الاتحاد الأوروبي', currencyEn: 'Euro', currencyAr: 'يورو' },
  EGP: { flag: '🇪🇬', countryEn: 'Egypt', countryAr: 'مصر', currencyEn: 'Egyptian Pound', currencyAr: 'جنيه مصري' },
  GBP: { flag: '🇬🇧', countryEn: 'United Kingdom', countryAr: 'المملكة المتحدة', currencyEn: 'Pound Sterling', currencyAr: 'جنيه إسترليني' },
  SAR: { flag: '🇸🇦', countryEn: 'Saudi Arabia', countryAr: 'السعودية', currencyEn: 'Saudi Riyal', currencyAr: 'ريال سعودي' },
  AED: { flag: '🇦🇪', countryEn: 'United Arab Emirates', countryAr: 'الإمارات', currencyEn: 'UAE Dirham', currencyAr: 'درهم إماراتي' },
  KWD: { flag: '🇰🇼', countryEn: 'Kuwait', countryAr: 'الكويت', currencyEn: 'Kuwaiti Dinar', currencyAr: 'دينار كويتي' },
  QAR: { flag: '🇶🇦', countryEn: 'Qatar', countryAr: 'قطر', currencyEn: 'Qatari Riyal', currencyAr: 'ريال قطري' },
  BHD: { flag: '🇧🇭', countryEn: 'Bahrain', countryAr: 'البحرين', currencyEn: 'Bahraini Dinar', currencyAr: 'دينار بحريني' },
  JOD: { flag: '🇯🇴', countryEn: 'Jordan', countryAr: 'الأردن', currencyEn: 'Jordanian Dinar', currencyAr: 'دينار أردني' },
  ILS: { flag: '🇮🇱', countryEn: 'Israel', countryAr: 'إسرائيل', currencyEn: 'Israeli Shekel', currencyAr: 'شيكل' },
  TRY: { flag: '🇹🇷', countryEn: 'Turkey', countryAr: 'تركيا', currencyEn: 'Turkish Lira', currencyAr: 'ليرة تركية' },
  MAD: { flag: '🇲🇦', countryEn: 'Morocco', countryAr: 'المغرب', currencyEn: 'Moroccan Dirham', currencyAr: 'درهم مغربي' },
  TND: { flag: '🇹🇳', countryEn: 'Tunisia', countryAr: 'تونس', currencyEn: 'Tunisian Dinar', currencyAr: 'دينار تونسي' },
  DZD: { flag: '🇩🇿', countryEn: 'Algeria', countryAr: 'الجزائر', currencyEn: 'Algerian Dinar', currencyAr: 'دينار جزائري' },
  INR: { flag: '🇮🇳', countryEn: 'India', countryAr: 'الهند', currencyEn: 'Indian Rupee', currencyAr: 'روبية هندية' },
  PKR: { flag: '🇵🇰', countryEn: 'Pakistan', countryAr: 'باكستان', currencyEn: 'Pakistani Rupee', currencyAr: 'روبية باكستانية' },
  BDT: { flag: '🇧🇩', countryEn: 'Bangladesh', countryAr: 'بنغلادش', currencyEn: 'Bangladeshi Taka', currencyAr: 'تاكا' },
  IDR: { flag: '🇮🇩', countryEn: 'Indonesia', countryAr: 'إندونيسيا', currencyEn: 'Indonesian Rupiah', currencyAr: 'روبية إندونيسية' },
  MYR: { flag: '🇲🇾', countryEn: 'Malaysia', countryAr: 'ماليزيا', currencyEn: 'Malaysian Ringgit', currencyAr: 'رينجيت' },
  SGD: { flag: '🇸🇬', countryEn: 'Singapore', countryAr: 'سنغافورة', currencyEn: 'Singapore Dollar', currencyAr: 'دولار سنغافوري' },
  CNY: { flag: '🇨🇳', countryEn: 'China', countryAr: 'الصين', currencyEn: 'Chinese Yuan', currencyAr: 'يوان' },
  JPY: { flag: '🇯🇵', countryEn: 'Japan', countryAr: 'اليابان', currencyEn: 'Japanese Yen', currencyAr: 'ين' },
  KRW: { flag: '🇰🇷', countryEn: 'South Korea', countryAr: 'كوريا الجنوبية', currencyEn: 'South Korean Won', currencyAr: 'وون' },
  AUD: { flag: '🇦🇺', countryEn: 'Australia', countryAr: 'أستراليا', currencyEn: 'Australian Dollar', currencyAr: 'دولار أسترالي' },
  CAD: { flag: '🇨🇦', countryEn: 'Canada', countryAr: 'كندا', currencyEn: 'Canadian Dollar', currencyAr: 'دولار كندي' },
  CHF: { flag: '🇨🇭', countryEn: 'Switzerland', countryAr: 'سويسرا', currencyEn: 'Swiss Franc', currencyAr: 'فرنك سويسري' },
  SEK: { flag: '🇸🇪', countryEn: 'Sweden', countryAr: 'السويد', currencyEn: 'Swedish Krona', currencyAr: 'كرونة سويدية' },
  NOK: { flag: '🇳🇴', countryEn: 'Norway', countryAr: 'النرويج', currencyEn: 'Norwegian Krone', currencyAr: 'كرونة نرويجية' },
  DKK: { flag: '🇩🇰', countryEn: 'Denmark', countryAr: 'الدنمارك', currencyEn: 'Danish Krone', currencyAr: 'كرونة دنماركية' },
  ZAR: { flag: '🇿🇦', countryEn: 'South Africa', countryAr: 'جنوب أفريقيا', currencyEn: 'South African Rand', currencyAr: 'راند' },
  NGN: { flag: '🇳🇬', countryEn: 'Nigeria', countryAr: 'نيجيريا', currencyEn: 'Nigerian Naira', currencyAr: 'نايرا' },
  KES: { flag: '🇰🇪', countryEn: 'Kenya', countryAr: 'كينيا', currencyEn: 'Kenyan Shilling', currencyAr: 'شلن كيني' },
};

const MAJOR = [
  'USD','EUR','EGP','SAR','AED','KWD','QAR','BHD','JOD','GBP','TRY','MAD','TND','DZD','ILS',
  'INR','PKR','BDT','IDR','MYR','SGD','CNY','JPY','KRW','AUD','CAD','CHF','SEK','NOK','DKK','ZAR','NGN','KES',
];

const CurrencyConverter = () => {
  const { lang } = useLang();
  const [amount, setAmount] = useState<number>(100);
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('EGP');
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [trend, setTrend] = useState<'up' | 'down' | 'same' | null>(null);
  const [trendDelta, setTrendDelta] = useState<number | null>(null);

  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  useEffect(() => {
    let cancelled = false;
    const key = `${CACHE_PREFIX}${from}`;

    const load = async () => {
      setLoading(true);
      setError(null);

      const cached = (() => {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) return null;
          const parsed = JSON.parse(raw) as { ts: number; data: RatesResponse };
          if (!parsed?.ts || !parsed?.data) return null;
          if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
          return parsed.data;
        } catch {
          return null;
        }
      })();

      if (cached?.result === 'success' && cached.rates) {
        setRates(cached.rates);
        setLastUpdated(cached.time_last_update_unix ? cached.time_last_update_unix * 1000 : null);
      }

      try {
        const res = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(from)}`, {
          cache: 'no-store',
        });
        const data = (await res.json()) as RatesResponse;
        if (cancelled) return;
        if (data.result !== 'success' || !data.rates) {
          throw new Error('Bad response');
        }
        setRates(data.rates);
        setLastUpdated(data.time_last_update_unix ? data.time_last_update_unix * 1000 : null);
        try {
          localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
        } catch {}
      } catch {
        if (cancelled) return;
        if (!cached?.rates) {
          setError(t('فشل تحميل أسعار العملات. تحقّق من الإنترنت.', 'Failed to load currency rates. Check your connection.'));
        } else {
          toast.message(t('تم استخدام آخر أسعار محفوظة.', 'Using last cached rates.'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [from, lang]);

  useEffect(() => {
    if (!rates) return;
    const r = to === from ? 1 : rates[to];
    if (!r || !Number.isFinite(r)) return;
    const pairKey = `${TREND_PREFIX}${from}:${to}`;
    const prev = (() => {
      try {
        const raw = localStorage.getItem(pairKey);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as { rate: number };
        return Number.isFinite(parsed?.rate) ? parsed.rate : null;
      } catch {
        return null;
      }
    })();
    if (prev === null) {
      try { localStorage.setItem(pairKey, JSON.stringify({ rate: r })); } catch {}
      setTrend(null);
      setTrendDelta(null);
      return;
    }
    const delta = r - prev;
    const eps = Math.abs(prev) * 1e-9 + 1e-12;
    const nextTrend = Math.abs(delta) <= eps ? 'same' : delta > 0 ? 'up' : 'down';
    setTrend(nextTrend);
    setTrendDelta(delta);
    try { localStorage.setItem(pairKey, JSON.stringify({ rate: r })); } catch {}
  }, [rates, from, to]);

  const currencyList = useMemo(() => {
    if (!rates) return [from, to].filter((v, i, a) => a.indexOf(v) === i).sort();
    const set = new Set(Object.keys(rates));
    set.add(from);
    const all = Array.from(set);
    const majorSet = new Set(MAJOR);
    const majors = all.filter(c => majorSet.has(c)).sort((a, b) => MAJOR.indexOf(a) - MAJOR.indexOf(b));
    const rest = all.filter(c => !majorSet.has(c)).sort();
    return [...majors, ...rest];
  }, [rates, from, to]);

  const converted = useMemo(() => {
    if (!rates) return null;
    if (!Number.isFinite(amount)) return null;
    const r = to === from ? 1 : rates[to];
    if (!r || !Number.isFinite(r)) return null;
    return amount * r;
  }, [amount, rates, to, from]);

  const rateLine = useMemo(() => {
    if (!rates) return null;
    const r = to === from ? 1 : rates[to];
    if (!r) return null;
    return `1 ${from} = ${r.toFixed(6)} ${to}`;
  }, [rates, from, to]);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const formatOption = (code: string) => {
    const meta = META[code];
    const flag = meta?.flag || '🌐';
    if (!meta) return `${flag} ${code}`;
    return lang === 'ar'
      ? `${flag} ${code} — ${meta.currencyAr} (${meta.countryAr})`
      : `${flag} ${code} — ${meta.currencyEn} (${meta.countryEn})`;
  };

  const todayText = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: '2-digit' });
  }, []);

  const apiDateText = useMemo(() => {
    if (!lastUpdated) return null;
    return new Date(lastUpdated).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: '2-digit' });
  }, [lastUpdated]);

  const trendNode = useMemo(() => {
    if (!rates) return null;
    if (!trend || trendDelta === null) return null;
    const r = to === from ? 1 : rates[to];
    if (!r || !Number.isFinite(r)) return null;
    const pct = (trendDelta / r) * 100;
    if (trend === 'same') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground">
          <span>•</span> {t('ثابت', 'Stable')}
        </span>
      );
    }
    const UpDownIcon = trend === 'up' ? ArrowUp : ArrowDown;
    const cls = trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-bold ${cls}`}>
        <UpDownIcon size={14} />
        {t(trend === 'up' ? 'صاعد' : 'هابط', trend === 'up' ? 'Up' : 'Down')} {Math.abs(pct).toFixed(4)}%
      </span>
    );
  }, [rates, trend, trendDelta, from, to, t]);

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-emerald-500 via-green-500 to-lime-500 p-5 text-white text-center">
        <div className="text-4xl mb-2">💱</div>
        <h2 className="text-xl font-extrabold">{t('حاسبة العملات', 'Currency Converter')}</h2>
        <p className="text-white/85 text-xs mt-1">{t('تحويل مباشر ودقيق بدون أي مفاتيح API', 'Live, accurate conversion with no API keys')}</p>
        <div className="mt-3 inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 text-[11px] font-extrabold">
          <span>{t('تاريخ اليوم', 'Today')}: {todayText}</span>
          {apiDateText && <span>• {t('تاريخ الأسعار', 'Rates date')}: {apiDateText}</span>}
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-3 text-sm text-destructive font-bold">
          {error}
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-muted-foreground uppercase">{t('المبلغ', 'Amount')}</label>
            <input
              type="number"
              inputMode="decimal"
              value={Number.isFinite(amount) ? amount : 0}
              onChange={e => setAmount(Number(e.target.value))}
              className="w-full text-center text-lg font-mono font-bold bg-secondary border-none rounded-xl p-3 outline-none focus:ring-2 ring-emerald-400"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 items-end">
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-muted-foreground uppercase">{t('من', 'From')}</label>
              <select
                value={from}
                onChange={e => setFrom(e.target.value)}
                className="w-full bg-secondary rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 ring-emerald-400"
              >
                {currencyList.map(c => (
                  <option key={c} value={c}>
                    {formatOption(c)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end justify-center pb-1">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center border border-border">
                <ArrowRight size={18} className={lang === 'ar' ? 'rotate-180' : ''} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-muted-foreground uppercase">{t('إلى', 'To')}</label>
              <select
                value={to}
                onChange={e => setTo(e.target.value)}
                className="w-full bg-secondary rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 ring-emerald-400"
              >
                {currencyList.map(c => (
                  <option key={c} value={c}>
                    {formatOption(c)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={swap}
            className="w-full py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
            disabled={loading}
          >
            <ArrowLeftRight size={16} />
            {t('تبديل', 'Swap')}
          </button>
        </div>

        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 p-4 text-center space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">{t('الناتج', 'Result')}</p>
            {trendNode}
          </div>
          <p className="text-2xl font-extrabold text-emerald-800 dark:text-emerald-200">
            {converted === null ? '—' : `${converted.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${to}`}
          </p>
          {rateLine && <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">{rateLine}</p>}
          <p className="text-[10px] text-muted-foreground font-semibold">
            {loading
              ? t('جارٍ تحديث الأسعار...', 'Updating rates...')
              : lastUpdated
                ? `${t('آخر تحديث', 'Last update')}: ${new Date(lastUpdated).toLocaleString()}`
                : t('—', '—')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CurrencyConverter;
