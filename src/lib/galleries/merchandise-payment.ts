import prisma from '@/lib/db/prisma';
import { readShopMetadata, ShopValidationError } from './merchandise';
import { sendEmail, getAdminEmail } from '@/lib/email/sender';
const escape = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
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
   const money=(n:number)=>(n/100).toFixed(2)+' zł';
   const rows=metadata.lines.map(l=>`<li>${escape(l.title)}${l.kind==='print' ? ` · ${escape(l.format?.paper)} · zdjęcie #${l.photoId}`:''} — ${l.quantity} szt. — ${money(l.lineTotal)}</li>`).join('');
   const html=`<h2>Zamówienie #${order.id} zostało opłacone</h2><ul>${rows}</ul><p>Dostawa: ${money(metadata.delivery.amount)}. Razem: ${money(order.total_amount)}.</p><p>Odbiorca: ${escape(metadata.delivery.recipientName)}.</p>`;
   // No production messages are sent by the test harness. Delivery failures do not reverse payment.
   try {await sendEmail({to:metadata.delivery.email,subject:`Potwierdzenie zamówienia #${order.id}`,html}); const admin=await getAdminEmail();if(admin) await sendEmail({to:admin,subject:`Zamówienie produktów #${order.id} do realizacji`,html});}catch(error){console.error('Gallery merchandise confirmation failed',order.id);}
  }
 } else if(event.status==='CANCELED'||event.status==='REJECTED') {
  await prisma.photoOrder.updateMany({where:{id:order.id,payment_status:{in:['initializing','pending','failed_init']}},data:{payment_status:event.status==='CANCELED'?'cancelled':'rejected',payment_id:event.orderId}});
 }
 return true;
}
