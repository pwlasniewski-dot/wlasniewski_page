import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { parseGuestOrderToken, verifyGuestOrderToken } from '@/lib/galleries/guest-order-link';
import { readShopMetadata } from '@/lib/galleries/merchandise';
import { orderMoney, orderDeliveryLabel } from '@/lib/galleries/order-presentation';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow, noarchive','X-Content-Type-Options':'nosniff','Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"};
const escape=(value:unknown)=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export async function GET(_request:Request,{params}:{params:Promise<{token:string}>}){
 const {token}=await params;const parsed=parseGuestOrderToken(token);
 const missing=()=>new NextResponse('Link do zamówienia jest nieprawidłowy lub wygasł. Skontaktuj się z obsługą sklepu, podając numer zamówienia.',{status:404,headers});
 if(!parsed)return missing();
 const order=await prisma.photoOrder.findUnique({where:{id:parsed.orderId}});const metadata=readShopMetadata(order?.product_ids);
 if(!order||!metadata?.guestOwnerId||!verifyGuestOrderToken(token,metadata.guestOwnerId))return missing();
 const payment=order.payment_status==='paid'?'Opłacone':order.payment_status==='pending'?'Oczekuje na płatność':order.payment_status==='cancelled'?'Płatność anulowana':'Płatność wymaga sprawdzenia';
 const fulfillment:Record<string,string>={new:'Przyjęte',ordered:'W realizacji',received:'Przygotowywane do wysyłki',packed:'Spakowane',shipped:'Wysłane',collected:'Odebrane',cancelled:'Anulowane'};
 const rows=metadata.lines.map(line=>`<tr><td>${escape(line.title)}</td><td>${line.quantity}</td><td>${escape(orderMoney(line.unitAmount))}</td><td>${escape(orderMoney(line.lineTotal))}</td></tr>`).join('');
 return new NextResponse(`<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="no-referrer"><title>Zamówienie #${order.id}</title><style>body{margin:0;background:#f5f3ee;color:#25231f;font:16px system-ui;line-height:1.6}main{max-width:760px;margin:40px auto;padding:24px;background:white;border-radius:16px}table{width:100%;border-collapse:collapse}td,th{text-align:left;padding:12px 6px;border-bottom:1px solid #ddd}.table{overflow-x:auto}h1{font-size:28px}</style></head><body><main><p>WŁAŚNIEWSKI · FOTOGRAFIA</p><h1>Zamówienie #${order.id}</h1><p>Płatność: <strong>${payment}</strong><br>Realizacja: ${escape(fulfillment[metadata.fulfillment.status]||'W trakcie')}</p><div class="table"><table><thead><tr><th>Produkt</th><th>Ilość</th><th>Cena</th><th>Wartość</th></tr></thead><tbody>${rows}</tbody></table></div><p>Dostawa: ${escape(orderMoney(metadata.delivery.amount))}<br><strong>Razem: ${escape(orderMoney(order.total_amount))}</strong></p><p>${escape(metadata.delivery.recipientName)}<br>${escape(orderDeliveryLabel(metadata))}</p>${metadata.fulfillment.trackingNumber?`<p>Numer przesyłki: ${escape(metadata.fulfillment.trackingNumber)}</p>`:''}<p>Zachowaj ten prywatny link. Pozwala sprawdzić zamówienie bez zakładania konta.</p></main></body></html>`,{headers});
}
