import prisma from '@/lib/db/prisma';
import { readShopMetadata, ShopValidationError } from './merchandise';
import { sendEmail, getAdminEmail } from '@/lib/email/sender';
import { renderOrderEmail } from './order-email';
import { orderAccountPath, orderPhotoIds, safeOrderImage } from './order-presentation';
import { orderOrigin } from './order-origin';
import { orderProductImages } from './order-product-images';
/** Called only after the existing PayU signature verification. Leaves legacy orders untouched. */
export async function handleMerchandisePayment(event: {extOrderId:string;orderId:string;status:string;totalAmount:string|number;currencyCode:string}) {
 const match=/^GALLERY_(\d+)_\d+$/.exec(event.extOrderId || '');
 if(!match) return false;
 const order=await prisma.photoOrder.findUnique({where:{id:Number(match[1])}});
 const metadata=readShopMetadata(order?.product_ids);
 if(!order || !metadata) return false;
 if(event.currencyCode!=='PLN'||Number(event.totalAmount)!==order.total_amount||!event.orderId||(order.payment_id && order.payment_id!==event.orderId)) throw new ShopValidationError('Powiadomienie nie odpowiada zamówieniu.',400);
 if(event.status==='COMPLETED') {
  await prisma.paymentLedger.upsert({where:{provider_provider_payment_id:{provider:'PAYU',provider_payment_id:event.orderId}},create:{provider:'PAYU',provider_payment_id:event.orderId,external_order_id:event.extOrderId,resource_type:'GALLERY',resource_id:order.id,payment_kind:'FULL',amount:order.total_amount,currency:'PLN',status:'COMPLETED',paid_at:new Date(),metadata:{source:'gallery_merchandise'}},update:{status:'COMPLETED'}});
  const updated=await prisma.photoOrder.updateMany({where:{id:order.id,payment_status:{not:'paid'}},data:{payment_status:'paid',paid_at:new Date(),payment_id:event.orderId}});
  if(updated.count===1) {
   // Image lookup is optional: it must not block the payment or confirmation.
   let photos: Array<{id:number;url:string|null}> = [];
   try {
    const rows = await prisma.galleryPhoto.findMany({where:{gallery_id:order.gallery_id,id:{in:orderPhotoIds(metadata)}},select:{id:true,thumbnail_url:true}});
    photos = rows.map(p=>({id:p.id,url:safeOrderImage(p.thumbnail_url)}));
   } catch { console.error('Order preview lookup failed',order.id); }
   const origin=orderOrigin();
   const customerUrl=order.participant_id ? `${origin}/galeria/grupowa?shopOrder=${order.id}` : `${origin}${orderAccountPath(order.id)}`;
   const presentation = await orderProductImages(metadata,order.gallery_id);
   const customer = renderOrderEmail({id:order.id,total:order.total_amount,metadata:presentation,photos,url:customerUrl});
   const adminMessage = renderOrderEmail({id:order.id,total:order.total_amount,metadata:presentation,photos,admin:true,url:`${origin}/admin/bookings/orders?order=GL-${order.id}`});
   // Independent sends: one recipient failure must not suppress the other.
   try { await sendEmail({to:metadata.delivery.email,subject:`Potwierdzenie zamówienia #${order.id}`,...customer}); } catch { console.error('Gallery customer confirmation failed',order.id); }
   try { const admin=await getAdminEmail(); if(admin) await sendEmail({to:admin,subject:`Zamówienie produktów #${order.id} do realizacji`,...adminMessage}); } catch { console.error('Gallery admin confirmation failed',order.id); }
  }
 } else if(event.status==='CANCELED'||event.status==='REJECTED') {
  await prisma.photoOrder.updateMany({where:{id:order.id,payment_status:{in:['initializing','pending','failed_init']}},data:{payment_status:event.status==='CANCELED'?'cancelled':'rejected',payment_id:event.orderId}});
 }
 return true;
}
