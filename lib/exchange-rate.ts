import { supabase } from './supabase';

export interface ExchangeRateResult {
  rate: number;
  source: 'cbn' | 'free-api' | 'manual';
  date: string;
}

const SUPPORTED_CURRENCIES = ['USD', 'GBP', 'EUR', 'CAD', 'AUD'] as const;
export type ForeignCurrency = typeof SUPPORTED_CURRENCIES[number];

function isSupported(currency: string): currency is ForeignCurrency {
  return SUPPORTED_CURRENCIES.includes(currency as ForeignCurrency);
}

const FRANKFURTER_API = 'https://api.frankfurter.app';

async function fetchFromFrankfurter(currency: string, dateStr: string): Promise<number | null> {
  try {
    const url = `${FRANKFURTER_API}/${dateStr}?from=${currency}&to=NGN`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    return data.rates?.NGN ?? null;
  } catch (err) {
    console.warn('[ExchangeRate] Failed to fetch from Frankfurter:', err);
    return null;
  }
}

function getDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function clampDate(date: Date): Date {
  const weekday = date.getDay();
  if (weekday === 0) return new Date(date.getTime() - 2 * 86400000);
  if (weekday === 6) return new Date(date.getTime() - 1 * 86400000);
  return date;
}

export async function getNairaRate(
  currency: string,
  transactionDate: Date,
): Promise<ExchangeRateResult> {
  const upper = currency.toUpperCase();

  if (upper === 'NGN') {
    return { rate: 1, source: 'manual', date: getDateStr(transactionDate) };
  }

  const clampedDate = clampDate(transactionDate);
  const dateStr = getDateStr(clampedDate);

  const { data: cached } = await supabase
    .from('exchange_rates')
    .select('rate, source')
    .eq('from_currency', upper)
    .eq('rate_date', dateStr)
    .maybeSingle();

  if (cached) {
    return { rate: cached.rate, source: cached.source, date: dateStr };
  }

  if (isSupported(upper)) {
    const apiRate = await fetchFromFrankfurter(upper, dateStr);
    if (apiRate !== null) {
      await supabase.from('exchange_rates').insert({
        from_currency: upper,
        rate: apiRate,
        rate_date: dateStr,
        source: 'free-api',
        created_at: Date.now(),
      }).maybeSingle();
      return { rate: apiRate, source: 'free-api', date: dateStr };
    }
  }

  return { rate: 0, source: 'manual', date: dateStr };
}

export function detectCurrency(text: string): string {
  const trimmed = text.trim();
  if (/^[$]/.test(trimmed) || /\bUSD\b/i.test(trimmed)) return 'USD';
  if (/^[£]/.test(trimmed) || /\bGBP\b/i.test(trimmed)) return 'GBP';
  if (/^[€]/.test(trimmed) || /\bEUR\b/i.test(trimmed)) return 'EUR';
  return 'NGN';
}

export function stripCurrencySymbol(text: string): string {
  return text.replace(/^[$£€]/, '').replace(/[,]/g, '').trim();
}

export const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: '₦',
  USD: '$',
  GBP: '£',
  EUR: '€',
  CAD: 'CAD',
  AUD: 'AUD',
};

export { SUPPORTED_CURRENCIES, isSupported };
