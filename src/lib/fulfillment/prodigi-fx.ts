import { z } from 'zod';

const currencySchema = z.enum(['EUR', 'USD', 'GBP']);
export type ProdigiFxCurrency = z.infer<typeof currencySchema>;
export type ProdigiFxRate = {
  available: true;
  source: 'NBP';
  currency: ProdigiFxCurrency;
  quoteCurrency: 'PLN';
  effectiveDate: string;
  tableNo: string;
  mid: string;
};
export type ProdigiFxResult = ProdigiFxRate | { available: false; source: 'NBP'; currency: ProdigiFxCurrency; reason: 'unavailable' | 'stale' };
export type ProdigiPlnCosts = Partial<Record<'items' | 'shipping' | 'branding' | 'totalCost' | 'totalTax', { amount: string; currency: 'PLN' }>>;
const decimal = /^\d{1,12}(?:\.\d{1,8})?$/;
const responseSchema = z.object({
  table: z.literal('A'), code: currencySchema,
  rates: z.array(z.object({
    no: z.string().regex(/^\d{1,3}\/A\/NBP\/\d{4}$/),
    effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    mid: z.number().positive().finite(),
  })).length(1),
});

async function readRateJson(body: ReadableStream<Uint8Array> | null): Promise<unknown> {
  if (!body) throw Error('Missing rate');
  const reader = body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 16_384) { await reader.cancel(); throw Error('Rate size'); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } finally { reader.releaseLock(); }
}

/** Latest NBP table A, for estimates only. No credential, fallback rate or price write. */
export async function fetchProdigiFx(currency: ProdigiFxCurrency, transport: typeof fetch = fetch, now = new Date()): Promise<ProdigiFxResult> {
  const unavailable = { available: false as const, source: 'NBP' as const, currency, reason: 'unavailable' as const };
  if (!currencySchema.safeParse(currency).success) return unavailable;
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 5_000);
  try {
    const response = await transport(`https://api.nbp.pl/api/exchangerates/rates/a/${currency.toLowerCase()}/?format=json`, {
      method: 'GET', redirect: 'error', cache: 'no-store', signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) { try { await response.body?.cancel(); } catch { /* no response content exposed */ } return unavailable; }
    const parsed = responseSchema.safeParse(await readRateJson(response.body));
    if (!parsed.success || parsed.data.code !== currency) return unavailable;
    const rate = parsed.data.rates[0]; const mid = String(rate.mid);
    if (!decimal.test(mid)) return unavailable;
    const effectiveTime = Date.parse(`${rate.effectiveDate}T00:00:00Z`);
    const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    if (!Number.isFinite(effectiveTime) || !Number.isFinite(today) || new Date(effectiveTime).toISOString().slice(0, 10) !== rate.effectiveDate || effectiveTime > today) return unavailable;
    if (today - effectiveTime > 7 * 86_400_000) return { ...unavailable, reason: 'stale' };
    return { available: true, source: 'NBP', currency, quoteCurrency: 'PLN', effectiveDate: rate.effectiveDate, tableNo: rate.no, mid };
  } catch { return unavailable; }
  finally { clearTimeout(timer); }
}

/** Decimal multiplication with half-up rounding to grosze; no floating point money math. */
export function prodigiAmountToPln(amount: string, mid: string): string {
  if (!decimal.test(amount) || !decimal.test(mid)) throw new RangeError('Invalid decimal amount or rate');
  const [amountWhole, amountFraction = ''] = amount.split('.');
  const [rateWhole, rateFraction = ''] = mid.split('.');
  const rateUnits = BigInt(rateWhole + rateFraction);
  if (rateUnits === BigInt(0)) throw new RangeError('Invalid rate');
  const numerator = BigInt(amountWhole + amountFraction) * rateUnits * BigInt(100);
  const denominator = BigInt(10) ** BigInt(amountFraction.length + rateFraction.length);
  const cents = (numerator + denominator / BigInt(2)) / denominator;
  return `${cents / BigInt(100)}.${String(cents % BigInt(100)).padStart(2, '0')}`;
}

export function estimateProdigiCostInPln(cost: { amount: string; currency: ProdigiFxCurrency }, fx: ProdigiFxResult) {
  if (!fx.available || cost.currency !== fx.currency) return null;
  return {
    amount: prodigiAmountToPln(cost.amount, fx.mid), currency: 'PLN' as const, indicative: true as const,
    originalAmount: cost.amount, originalCurrency: cost.currency,
    source: fx.source, effectiveDate: fx.effectiveDate, tableNo: fx.tableNo, mid: fx.mid,
  };
}
