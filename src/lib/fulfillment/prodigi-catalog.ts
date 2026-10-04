import { z } from 'zod';
/** Qualified single-raster families only. A `default` asset alone is not a capability declaration. */
export function supportsProdigiSinglePhoto(sku: unknown): sku is string {
  return typeof sku === 'string' && /^GLOBAL-(?:FAP|CAN)-[1-9]\d{0,3}X[1-9]\d{0,3}$/.test(sku);
}
export const prodigiProductSchema = z.object({
  version: z.literal(1), provider: z.literal('prodigi'), environment: z.enum(['sandbox', 'live']),
  productId: z.number().int().positive(), sku: z.string().regex(/^[A-Z0-9_-]{1,100}$/).refine(supportsProdigiSinglePhoto),
  variant: z.object({ attributes: z.record(z.string(), z.string()), printAreaSizes: z.record(z.string(), z.object({ horizontalResolution: z.number().int().positive(), verticalResolution: z.number().int().positive() })) }),
  requiredAssets: z.array(z.string()).min(1), shippingMethod: z.string().min(1),
  ordersEnabled: z.boolean(), liveQualified: z.boolean(), destination: z.literal('PL'),
});
export type ProdigiProductConfig = z.infer<typeof prodigiProductSchema>;
/** QA can display sandbox products, but the cart and order guards still reject buying them. */
export function canDisplayProdigiProduct(spec: ProdigiProductConfig | null | undefined, productId: number, isolatedQa: boolean, liveEnabled: boolean) {
  if (!spec || spec.productId !== productId) return false;
  if (isolatedQa) return spec.environment === 'sandbox' && !spec.ordersEnabled && !spec.liveQualified && spec.requiredAssets.length === 1 && spec.requiredAssets[0] === 'default';
  return liveEnabled && spec.environment === 'live' && spec.ordersEnabled && spec.liveQualified;
}
export function readProdigiProduct(value: unknown): ProdigiProductConfig | null {
  try { const parsed = prodigiProductSchema.safeParse(typeof value === 'string' ? JSON.parse(value) : value); return parsed.success ? parsed.data : null; } catch { return null; }
}
