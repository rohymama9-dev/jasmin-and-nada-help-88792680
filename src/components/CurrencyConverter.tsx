import { useEffect, useMemo, useState } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { ArrowLeftRight } from 'lucide-react';
import { toast } from 'sonner';

type RatesResponse = {
  result: 'success' | 'error';
  base_code: string;
  time_last_update_unix?: number;
  rates?: Record<string, number>;
};

const CACHE_PREFIX = 'app-currency-rates-v1:';
const CACHE_TTL_MS = 30 * 60 * 1000;

const CurrencyConverter = () => {
  const { lang } = useLang();
  const [amount, setAmount] = useState<number>(100);
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('EGP');
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

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

  const currencyList = useMemo(() => {
    if (!rates) return [from, to].filter((v, i, a) => a.indexOf(v) === i).sort();
    const set = new Set(Object.keys(rates));
    set.add(from);
    return Array.from(set).sort();
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

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-emerald-500 via-green-500 to-lime-500 p-5 text-white text-center">
        <div className="text-4xl mb-2">💱</div>
        <h2 className="text-xl font-extrabold">{t('حاسبة العملات', 'Currency Converter')}</h2>
        <p className="text-white/85 text-xs mt-1">{t('تحويل مباشر ودقيق بدون أي مفاتيح API', 'Live, accurate conversion with no API keys')}</p>
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

          <div className="grid grid-cols-2 gap-3 items-end">
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-muted-foreground uppercase">{t('من', 'From')}</label>
              <select
                value={from}
                onChange={e => setFrom(e.target.value)}
                className="w-full bg-secondary rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 ring-emerald-400"
              >
                {currencyList.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
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
                    {c}
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
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">{t('الناتج', 'Result')}</p>
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

