import { z } from 'zod';
export const prodigiProductSchema = z.object({
  version: z.literal(1), provider: z.literal('prodigi'), environment: z.enum(['sandbox', 'live']),
  productId: z.number().int().positive(), sku: z.string().regex(/^[A-Z0-9_-]{1,100}$/),
  variant: z.object({ attributes: z.record(z.string(), z.string()), printAreaSizes: z.record(z.string(), z.object({ horizontalResolution: z.number().int().positive(), verticalResolution: z.number().int().positive() })) }),
  requiredAssets: z.array(z.string()).min(1), shippingMethod: z.string().min(1),
  ordersEnabled: z.boolean(), liveQualified: z.boolean(), destination: z.literal('PL'),
});
export type ProdigiProductConfig = z.infer<typeof prodigiProductSchema>;
export function readProdigiProduct(value: unknown): ProdigiProductConfig | null {
  try { const parsed = prodigiProductSchema.safeParse(typeof value === 'string' ? JSON.parse(value) : value); return parsed.success ? parsed.data : null; } catch { return null; }
}
