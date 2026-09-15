import prisma from '@/lib/db/prisma';
import type { ShopMetadata } from './merchandise';
import { safeOrderImage } from './order-presentation';

/** Old orders lack product imagery. Enrich only the preview, never the paid
 * name, price, description or configuration. Missing/deleted media are optional. */
export async function orderProductImages(metadata: ShopMetadata, galleryId: number): Promise<ShopMetadata> {
  const missing = metadata.lines.flatMap(line => line.kind==='product' && line.product?.image_url === undefined ? [line.productId] : []);
  if (!missing.length) return metadata;
  try {
    const products = await prisma.galleryProduct.findMany({where:{id:{in:missing},OR:[{gallery_id:null},{gallery_id:galleryId}]},select:{id:true,image_url:true}});
    return {...metadata,lines:metadata.lines.map(line => line.kind==='product' && line.product?.image_url === undefined ? {...line,product:{title:line.title,description:null,...line.product,image_url:safeOrderImage(products.find(p=>p.id===line.productId)?.image_url)}} : line)};
  } catch { return metadata; }
}
