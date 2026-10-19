import { createHash } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { isProductImageUrl } from '../galleries/product-media';
import { readProdigiProduct } from './prodigi-catalog';
import { prepareProdigiProduct, prodigiProductKey } from './prodigi-catalog-import';
import { inspectLiveCatalog } from './prodigi-live-catalog';
import { SandboxError } from './prodigi-sandbox';
const requestSchema = z.object({ productId: z.number().int().positive(), approve: z.boolean().default(false), reviewHash: z.string().regex(/^[a-f0-9]{64}$/).optional() }).strict();
export async function qualifyProdigiProduct(db: Pick<PrismaClient, 'galleryProduct' | 'setting' | '$transaction'>, input: unknown, prepare: typeof prepareProdigiProduct = prepareProdigiProduct) {
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) throw new SandboxError('INVALID_INPUT', 'Wybierz zapisany produkt do kwalifikacji.', 400);
  const request = parsed.data;
  const product = await db.galleryProduct.findUnique({ where: { id: request.productId } });
  const saved = await db.setting.findUnique({ where: { setting_key: prodigiProductKey(request.productId) } });
  const config = readProdigiProduct(saved?.setting_value);
  if (!product || product.gallery_id !== null || product.archived_at || !['prodigi_sandbox', 'prodigi_live'].includes(product.product_type || '') || config?.productId !== product.id) throw new SandboxError('INVALID_PRODUCT', 'Nie znaleziono wspólnego produktu Prodigi.', 404);
  if (!Number.isSafeInteger(product.price) || product.price <= 0 || !product.title.trim() || !product.description?.trim() || !isProductImageUrl(product.image_url)) throw new SandboxError('NOT_READY', 'Zapisz nazwę, opis, zdjęcie i dodatnią cenę PLN przed kwalifikacją.', 422);
  const prepared = await prepare({ sku: config.sku, attributes: config.variant.attributes, title: product.title, price: product.price, shipmentMethod: config.shippingMethod, copies: 1 }, inspectLiveCatalog);
  const review = { productId: product.id, title: product.title, price: product.price, image: product.image_url, updatedAt: product.updated_at.toISOString(), sku: config.sku, variant: prepared.variant, requiredAssets: ['default'], shippingMethod: config.shippingMethod, quote: prepared.quote.costSummary, fx: prepared.fx, pln: prepared.pln };
  const reviewHash = createHash('sha256').update(JSON.stringify(review)).digest('hex');
  if (!request.approve) return { qualified: false, reviewHash, review };
  if (request.reviewHash !== reviewHash) throw new SandboxError('REVIEW_CHANGED', 'Produkt, koszt lub kurs zmienił się. Ponownie sprawdź i zaakceptuj kwalifikację.', 409);
  await db.$transaction(async tx => {
    const current = await tx.galleryProduct.findUnique({ where: { id: product.id } });
    const currentSetting = await tx.setting.findUnique({ where: { setting_key: prodigiProductKey(product.id) } });
    if (!current || current.updated_at.getTime() !== product.updated_at.getTime() || currentSetting?.setting_value !== saved?.setting_value) throw new SandboxError('IMPORT_CONFLICT', 'Produkt został równocześnie zmieniony. Ponów kwalifikację.', 409);
    await tx.setting.update({ where: { setting_key: prodigiProductKey(product.id) }, data: { setting_value: JSON.stringify({ ...config, environment: 'live', liveQualified: true, ordersEnabled: true, variant: { attributes: prepared.variant.attributes, printAreaSizes: prepared.variant.printAreaSizes }, requiredAssets: ['default'], quote: prepared.quote.costSummary, fx: prepared.fx, estimatedCostPln: prepared.pln, checkedAt: prepared.checkedAt, approvedAt: new Date().toISOString(), priceAtQualification: product.price }) } });
    await tx.galleryProduct.update({ where: { id: product.id }, data: { product_type: 'prodigi_live', is_active: false } });
  }, { isolationLevel: 'Serializable', timeout: 10_000 });
  return { qualified: true, reviewHash, review };
}
