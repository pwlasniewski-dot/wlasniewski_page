import { z } from 'zod';
import { boundedJson, productSchema, quoteSchema, sandboxRequest, SandboxError } from './prodigi-sandbox';
import type { CatalogInspector } from './prodigi-catalog-import';
/** Read/quote only. Live order submission belongs to the separately gated order adapter. */
export const inspectLiveCatalog: CatalogInspector = async (input, transport = fetch) => {
  const parsed = sandboxRequest.safeParse(input);
  if (!parsed.success) throw new SandboxError('INVALID_INPUT', 'Nieprawidłowe dane kwalifikacji.', 400);
  const key = process.env.PRODIGI_API_KEY?.trim();
  if (!key) throw new SandboxError('LIVE_NOT_CONFIGURED', 'Brak PRODIGI_API_KEY dla środowiska live na serwerze. Sandbox nie zastępuje kwalifikacji live.', 503);
  const request = parsed.data; const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await transport(`https://api.prodigi.com/v4.0${request.action === 'product' ? `/products/${encodeURIComponent(request.sku)}` : '/quotes'}`, {
      method: request.action === 'product' ? 'GET' : 'POST', cache: 'no-store', redirect: 'error', signal: controller.signal,
      headers: { 'X-API-Key': key, 'Content-Type': 'application/json' },
      ...(request.action === 'quote' ? { body: JSON.stringify({ destinationCountryCode: 'PL', items: request.items }) } : {}),
    });
    if (!response.ok) { try { await response.body?.cancel(); } catch {} throw new SandboxError('LIVE_PROVIDER_ERROR', `Prodigi live HTTP ${response.status}: nie potwierdzono kwalifikacji.`, 502); }
    const envelope = z.object({ outcome: z.enum(['Ok', 'Created']), issues: z.array(z.unknown()).max(0).nullish() }).passthrough().safeParse(await boundedJson(response.body, 1_048_576));
    if (!envelope.success) throw new SandboxError('INVALID_RESPONSE', 'Live zwróciło niepotwierdzony wynik.');
    const checkedAt = new Date().toISOString();
    if (request.action === 'product') {
      const product = productSchema.safeParse(envelope.data.product);
      if (!product.success || product.data.sku.toUpperCase() !== request.sku.toUpperCase()) throw new SandboxError('INVALID_RESPONSE', 'Live nie potwierdziło SKU.');
      return { action: 'product', product: product.data, checkedAt };
    }
    const quotes = z.array(quoteSchema).min(1).max(10).safeParse(envelope.data.quotes);
    if (!quotes.success) throw new SandboxError('INVALID_RESPONSE', 'Live nie potwierdziło kosztów.');
    const currency = quotes.data[0].costSummary.items.currency;
    if (!quotes.data.every(quote => Object.values(quote.costSummary).every(cost => !cost || cost.currency === currency))) throw new SandboxError('INVALID_RESPONSE', 'Koszty live mają różne waluty.');
    return { action: 'quote', quotes: quotes.data, currency, checkedAt };
  } catch (error) { if (error instanceof SandboxError) throw error; throw new SandboxError('LIVE_TRANSPORT', 'Nie udało się sprawdzić Prodigi live.'); }
  finally { clearTimeout(timeout); }
};
