import { createHash } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { defaultShopConfig, validateShopConfig } from '../galleries/merchandise';
import { inspectSandbox, SandboxError, type SandboxProduct, type SandboxQuote } from './prodigi-sandbox';
import { fetchProdigiFx, estimateProdigiCostInPln } from './prodigi-fx';
import { supportsProdigiSinglePhoto } from './prodigi-catalog';

export const prodigiProductKey = (id: number) => `prodigi_product_v1_${id}`;
export const catalogRequest = z.object({
  sku: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{1,100}$/),
  attributes: z.record(z.string().min(1).max(60), z.string().min(1).max(100)),
  title: z.string().trim().min(3).max(200),
  price: z.number().int().min(1).max(100_000_000),
  shipmentMethod: z.string().min(1).max(40),
  copies: z.number().int().min(1).max(100).default(1),
}).strict();
export type CatalogInspector = (input: unknown, transport?: typeof fetch, validated?: boolean) => Promise<{ action: 'product'; product: SandboxProduct; checkedAt: string } | { action: 'quote'; quotes: SandboxQuote[]; currency: 'EUR' | 'USD' | 'GBP'; checkedAt: string }>;
export async function prepareProdigiProduct(input: unknown, inspect: CatalogInspector = inspectSandbox, fxLookup = fetchProdigiFx) {
  const parsed = catalogRequest.safeParse(input);
  if (!parsed.success) throw new SandboxError('INVALID_INPUT', 'Sprawdź SKU, wariant, nazwę, cenę PLN i dostawę.', 400);
  const request = parsed.data;
  if (!supportsProdigiSinglePhoto(request.sku)) throw new SandboxError('UNSUPPORTED_PRODUCT', 'Ten produkt wymaga osobnego konfiguratora. Obecnie obsługujemy pojedyncze fotografie Fine Art i canvas GLOBAL-FAP / GLOBAL-CAN.', 422);
  const result = await inspect({ action: 'product', sku: request.sku });
  if (result.action !== 'product') throw new SandboxError('INVALID_RESPONSE', 'Nie potwierdzono produktu.');
  const areas = Object.entries(result.product.printAreas).filter(([, value]) => value.required).map(([name]) => name);
  const canonical = (attributes: Record<string, string>) => JSON.stringify(Object.entries(attributes).sort(([a], [b]) => a.localeCompare(b)));
  const variant = result.product.variants.find(value => value.shipsTo.includes('PL') && canonical(value.attributes) === canonical(request.attributes));
  if (areas.length !== 1 || areas[0] !== 'default' || !variant?.printAreaSizes.default) throw new SandboxError('INVALID_VARIANT', 'Wybierz wariant z dostawą do Polski i jednym polem druku default.', 422);
  const quoted = await inspect({ action: 'quote', items: [{ sku: request.sku, copies: request.copies, attributes: variant.attributes, assets: [{ printArea: 'default' }] }] }, fetch, true);
  if (quoted.action !== 'quote') throw new SandboxError('INVALID_RESPONSE', 'Nie potwierdzono wyceny.');
  const quote = quoted.quotes.find(value => value.shipmentMethod === request.shipmentMethod);
  if (!quote?.costSummary.totalCost) throw new SandboxError('INVALID_QUOTE', 'Wybierz dostawę z pełnym kosztem zwróconym przez Prodigi.', 422);
  const fx = await fxLookup(quoted.currency);
  const pln = estimateProdigiCostInPln(quote.costSummary.totalCost, fx);
  if (!pln) throw new SandboxError('FX_UNAVAILABLE', 'Kurs NBP jest niedostępny. Import nie został zapisany; spróbuj ponownie.', 503);
  const plnCosts = Object.fromEntries(Object.entries(quote.costSummary).map(([name, value]) => [name, value ? estimateProdigiCostInPln(value, fx) : null]));
  return { plnCosts, request, product: result.product, variant, quote, fx, pln, checkedAt: quoted.checkedAt,
    identity: createHash('sha256').update(request.sku + ':' + canonical(variant.attributes)).digest('hex') };
}
export async function importProdigiProduct(db: Pick<PrismaClient, '$transaction'>, input: unknown, prepare = prepareProdigiProduct) {
  const validated = catalogRequest.safeParse(input);
  if (!validated.success || validated.data.copies !== 1) throw new SandboxError('SINGLE_COPY_REQUIRED', 'Import ceny jednostkowej wymaga wyceny jednej sztuki. Kalkulacja wielu sztuk służy analizie koszyka.', 422);
  const prepared = await prepare(input);
  const { request, product, variant, quote, fx, pln, checkedAt, identity } = prepared;
  return db.$transaction(async tx => {
    const indexKey = `prodigi_variant_v1_${identity}`;
    const marker = await tx.setting.findUnique({ where: { setting_key: indexKey } });
    if (marker) {
      const id = Number(marker.setting_value);
      const existing = Number.isSafeInteger(id) && id > 0 ? await tx.galleryProduct.findUnique({ where: { id } }) : null;
      if (!existing || existing.gallery_id !== null || !['prodigi_sandbox', 'prodigi_live'].includes(existing.product_type || '')) throw new SandboxError('IMPORT_CONFLICT', 'Powiązanie produktu wymaga sprawdzenia. Nie utworzono duplikatu.', 409);
      return { id, existing: true, archived: Boolean(existing.archived_at) };
    }
    const saved = await tx.setting.findUnique({ where: { setting_key: 'gallery_shop_default' } });
    let config;
    try { config = saved ? JSON.parse(saved.setting_value || '') : defaultShopConfig(); validateShopConfig(config); }
    catch { throw new SandboxError('CONFIG_CONFLICT', 'Wspólna oferta wymaga sprawdzenia. Import jej nie nadpisze.', 409); }
    const created = await tx.galleryProduct.create({ data: { gallery_id: null, title: request.title, description: product.description.slice(0, 5000), price: request.price,
      is_active: false, product_type: 'prodigi_sandbox', image_url: null, preview_images: [], sample_pages: [] } });
    config.productRules[String(created.id)] = { minPhotos: 1, maxPhotos: 1, deliveryMethods: ['courier'] };
    validateShopConfig(config);
    await tx.setting.create({ data: { setting_key: prodigiProductKey(created.id), setting_value: JSON.stringify({ version: 1, provider: 'prodigi', environment: 'sandbox',
      productId: created.id, sku: request.sku, variant: { attributes: variant.attributes, printAreaSizes: variant.printAreaSizes }, requiredAssets: ['default'],
      destination: 'PL', shippingMethod: request.shipmentMethod, ordersEnabled: false, liveQualified: false,
      checkedAt, quote: quote.costSummary, fx, estimatedCostPln: pln, priceAtImport: request.price, quotedCopies: request.copies }) } });
    await tx.setting.create({ data: { setting_key: indexKey, setting_value: String(created.id) } });
    await tx.setting.upsert({ where: { setting_key: 'gallery_shop_default' }, create: { setting_key: 'gallery_shop_default', setting_value: JSON.stringify(config) }, update: { setting_value: JSON.stringify(config) } });
    return { id: created.id, existing: false, archived: false };
  }, { isolationLevel: 'Serializable', timeout: 10_000 });
}
