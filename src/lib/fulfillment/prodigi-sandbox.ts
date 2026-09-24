import { z } from 'zod';
import { isProdigiPilotSku } from './prodigi-pilot';

// Phase one is deliberately read/quote only. Never accept a host or API key from a caller.
const HOST = 'https://api.sandbox.prodigi.com/v4.0';
const sku = z.string().trim().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);
const attributes = z.record(z.string().min(1).max(60), z.string().min(1).max(100));
const printArea = z.string().min(1).max(60).regex(/^[a-zA-Z0-9_-]+$/);
export const sandboxRequest = z.discriminatedUnion('action', [
  z.object({ action: z.literal('product'), sku }).strict(),
  z.object({ action: z.literal('quote'), items: z.array(z.object({
    sku, copies: z.number().int().min(1).max(100), attributes,
    assets: z.array(z.object({ printArea }).strict()).min(1).max(8),
  }).strict()).min(1).max(10) }).strict(),
]);
const dimensions = z.record(z.string(), z.object({
  horizontalResolution: z.number().int().positive(), verticalResolution: z.number().int().positive(),
}));
const productSchema = z.object({
  sku: z.string(), description: z.string(),
  attributes: z.record(z.string(), z.array(z.string())),
  printAreas: z.record(z.string(), z.object({ required: z.boolean() })),
  variants: z.array(z.object({ attributes, shipsTo: z.array(z.string()), printAreaSizes: dimensions })),
});
const cost = z.object({ amount: z.string().regex(/^\d{1,12}(\.\d{1,6})?$/), currency: z.literal('PLN') });
const quoteSchema = z.object({
  shipmentMethod: z.string().min(1), costSummary: z.object({ items: cost.refine(value => Number(value.amount) > 0), shipping: cost }),
  issues: z.array(z.unknown()).max(0).optional(),
  shipments: z.array(z.object({
    carrier: z.object({ name: z.string().min(1), service: z.string().min(1) }),
    fulfillmentLocation: z.object({ countryCode: z.string().regex(/^[A-Z]{2}$/), labCode: z.string().min(1) }),
  })).min(1),
});
export type SandboxProduct = z.infer<typeof productSchema>;
export type SandboxQuote = z.infer<typeof quoteSchema>;
export class SandboxError extends Error {
  constructor(public code: string, message: string, public status = 502) { super(message); }
}
export function sandboxConfigured() { return Boolean(process.env.PRODIGI_SANDBOX_API_KEY?.trim()); }

export async function boundedJson(body: ReadableStream<Uint8Array> | null, maxBytes: number): Promise<unknown> {
  if (!body) throw new SandboxError('INVALID_JSON', 'Brak danych JSON.', 400);
  const reader = body.getReader(); const chunks: Uint8Array[] = []; let bytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) { await reader.cancel(); throw new SandboxError('BODY_LIMIT', 'Przekroczono limit danych.', 413); }
      chunks.push(value);
    }
    const all = new Uint8Array(bytes); let offset = 0;
    for (const chunk of chunks) { all.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(all));
  } catch (error) {
    if (error instanceof SandboxError) throw error;
    throw new SandboxError('INVALID_JSON', 'Nieprawidłowe dane JSON.', 400);
  } finally { reader.releaseLock(); }
}

export async function inspectSandbox(input: unknown, transport: typeof fetch = fetch) {
  const parsed = sandboxRequest.safeParse(input);
  if (!parsed.success) throw new SandboxError('INVALID_INPUT', 'Sprawdź SKU, ilości, opcje i pola druku.', 400);
  const key = process.env.PRODIGI_SANDBOX_API_KEY?.trim();
  if (!key) throw new SandboxError('NOT_CONFIGURED', 'Brak klucza Prodigi Sandbox na serwerze.', 503);
  const request = parsed.data;
  if (request.action === 'quote' && request.items.some(item => !isProdigiPilotSku(item.sku) || item.assets.length !== 1 || item.assets[0].printArea !== 'default')) {
    throw new SandboxError('NOT_IN_PILOT', 'Wycena pilota obejmuje tylko GLOBAL-CAN-10X10 i GLOBAL-FAP-10X10 z jednym polem default, bez dodatków.', 422);
  }
  const path = request.action === 'product' ? `/products/${encodeURIComponent(request.sku)}` : '/quotes';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await transport(`${HOST}${path}`, {
      method: request.action === 'product' ? 'GET' : 'POST', redirect: 'error', cache: 'no-store',
      headers: { 'X-API-Key': key, 'Content-Type': 'application/json' }, signal: controller.signal,
      ...(request.action === 'quote' ? { body: JSON.stringify({ destinationCountryCode: 'PL', currencyCode: 'PLN', items: request.items }) } : {}),
    });
    if (!response.ok) {
      await response.body?.cancel();
      if ([401, 403].includes(response.status)) throw new SandboxError('CREDENTIALS', 'Prodigi odrzuciło klucz piaskownicy. Sprawdź konfigurację serwera.');
      if (response.status === 429) throw new SandboxError('RATE_LIMIT', 'Prodigi ograniczyło liczbę zapytań. Spróbuj później.', 429);
      throw new SandboxError('PROVIDER_ERROR', 'Prodigi nie potwierdziło wyniku. Sprawdź SKU i wariant lub spróbuj później.');
    }
    let raw: unknown;
    try { raw = await boundedJson(response.body, 1_048_576); }
    catch { throw new SandboxError('INVALID_RESPONSE', 'Nieprawidłowa odpowiedź Prodigi. Wynik nie został przyjęty.'); }
    const envelope = z.object({ outcome: z.enum(['Ok', 'Created']), issues: z.array(z.unknown()).max(0).optional() }).passthrough().safeParse(raw);
    if (!envelope.success) throw new SandboxError('PROVIDER_ISSUES', 'Prodigi zwróciło ostrzeżenie lub niepotwierdzony wynik. Wymagana weryfikacja.');
    const base = { environment: 'sandbox' as const, checkedAt: new Date().toISOString(), destination: 'PL', currency: 'PLN' };
    if (request.action === 'product') {
      const product = productSchema.safeParse(envelope.data.product);
      if (!product.success || product.data.sku.toUpperCase() !== request.sku.toUpperCase()) throw new SandboxError('INVALID_RESPONSE', 'Nieprawidłowe dane produktu Prodigi.');
      return { ...base, action: 'product' as const, product: product.data };
    }
    const quotes = z.array(quoteSchema).min(1).max(10).safeParse(envelope.data.quotes);
    if (!quotes.success) throw new SandboxError('INVALID_RESPONSE', 'Brak kompletnych wycen w PLN. Nie przyjęto kosztu zerowego.');
    return { ...base, action: 'quote' as const, quotes: quotes.data };
  } catch (error) {
    if (error instanceof SandboxError) throw error;
    throw new SandboxError('TRANSPORT', 'Nie udało się połączyć z piaskownicą Prodigi. Spróbuj ponownie.');
  } finally { clearTimeout(timer); }
}
