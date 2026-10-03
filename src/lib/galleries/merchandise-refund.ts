import prisma from '@/lib/db/prisma';
import { acquireAdvisoryTransactionLock } from '@/lib/db/advisoryLock';
import { readShopMetadata, ShopValidationError } from './merchandise';

/** Signed PayU callbacks only; refund IDs are cumulative and replay-safe. */
export async function handleMerchandiseRefund(input: unknown): Promise<boolean> {
 const event = input as { orderId?: string; extOrderId?: string; refund?: { refundId?: string; amount?: string; currencyCode?: string; status?: string } };
 if (!event?.refund) return false;
 const match = /^GALLERY_(\d+)_\d+$/.exec(event.extOrderId || '');
 if (!match) return false;
 const orderId = Number(match[1]);
 return prisma.$transaction(async tx => {
  await acquireAdvisoryTransactionLock(tx, `prodigi-order-${orderId}`);
  const order = await tx.photoOrder.findUnique({where:{id:orderId}});
  if (!order || !readShopMetadata(order.product_ids)) return false;
  const r = event.refund!;
  if (!event.orderId || order.payment_id !== event.orderId || r.currencyCode !== 'PLN' || !r.refundId || !/^[A-Za-z0-9_-]{1,100}$/.test(r.refundId) || !['FINALIZED','CANCELED'].includes(r.status || '') || !/^\d+$/.test(String(r.amount))) throw new ShopValidationError('Nieprawidłowe potwierdzenie zwrotu.',400);
  const amount = Number(r.amount);
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > order.total_amount) throw new ShopValidationError('Nieprawidłowa kwota zwrotu.',400);
  if (r.status === 'CANCELED') return true;
  const payment = await tx.paymentLedger.findUnique({where:{provider_provider_payment_id:{provider:'PAYU',provider_payment_id:event.orderId}}});
  if (!payment || payment.resource_type !== 'GALLERY' || payment.resource_id !== orderId || payment.currency !== 'PLN' || payment.amount !== order.total_amount) throw new ShopValidationError('Płatność wymaga uzgodnienia przed zwrotem.',409);
  const key = `merchandise_refund_${event.orderId}_${r.refundId}`;
  const previous = await tx.setting.findUnique({where:{setting_key:key}});
  if (previous) {
   if (previous.setting_value !== String(amount)) throw new ShopValidationError('Niezgodne ponowienie zwrotu.',409);
   return true;
  }
  const refunded = payment.refunded_amount + amount;
  if (refunded > payment.amount) throw new ShopValidationError('Suma zwrotów wymaga uzgodnienia.',409);
  await tx.setting.create({data:{setting_key:key,setting_value:String(amount)}});
  await tx.paymentLedger.update({where:{id:payment.id},data:{refunded_amount:refunded,refunded_at:new Date()}});
  // An incoming completion replay must never restore this order to paid.
  await tx.photoOrder.update({where:{id:orderId},data:{payment_status:refunded === payment.amount ? 'refunded' : 'partially_refunded'}});
  return true;
 });
}
