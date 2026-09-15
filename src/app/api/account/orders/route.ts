import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { clientOwnershipWhere } from '@/lib/auth/document-access';
import { orderClient, ownsAccountOrder } from '@/lib/galleries/order-account';
import { readShopMetadata } from '@/lib/galleries/merchandise';
import { orderPhotoIds, safeOrderImage } from '@/lib/galleries/order-presentation';
import { orderProductImages } from '@/lib/galleries/order-product-images';

export async function GET(request: NextRequest) {
  const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
  try {
    const client = await orderClient(request);
    if (!client) return json({ error: 'Zaloguj się, aby zobaczyć zamówienia.' }, 401);
    const requested = request.nextUrl.searchParams.get('order');
    if (requested !== null && !/^[1-9]\d{0,9}$/.test(requested)) return json({error:'Nieprawidłowy numer zamówienia.'},400);
    const cursor = request.nextUrl.searchParams.get('before');
    if (cursor !== null && !/^[1-9]\d{0,9}$/.test(cursor)) return json({error:'Nieprawidłowa strona.'},400);
    const rows = await prisma.photoOrder.findMany({
      where: { participant_id: null, gallery: { OR: clientOwnershipWhere(client) }, product_ids: { contains: '"gallery_merchandise"' }, ...(requested ? {id:Number(requested)} : cursor ? {id:{lt:Number(cursor)}} : {}) },
      orderBy: {id:'desc'}, take:51,
    });
    const orders = await Promise.all(rows.slice(0,50).flatMap(order => {
      const metadata = readShopMetadata(order.product_ids);
      if (!metadata || !ownsAccountOrder(metadata, client)) return [];
      return [(async () => {
        const photos = await prisma.galleryPhoto.findMany({where:{gallery_id:order.gallery_id,id:{in:orderPhotoIds(metadata)}},select:{id:true,thumbnail_url:true}});
        return {id:order.id,createdAt:order.created_at,paymentStatus:order.payment_status,total:order.total_amount,metadata:await orderProductImages(metadata,order.gallery_id),photos:photos.map(p=>({id:p.id,url:safeOrderImage(p.thumbnail_url)}))};
      })()];
    }));
    if (requested && !orders.length) return json({error:'Nie znaleziono zamówienia na tym koncie.'},404);
    return json({orders,nextCursor:!requested && rows.length>50 ? rows[49].id : null});
  } catch { return json({error:'Nie udało się pobrać zamówień. Spróbuj ponownie.'},500); }
}
