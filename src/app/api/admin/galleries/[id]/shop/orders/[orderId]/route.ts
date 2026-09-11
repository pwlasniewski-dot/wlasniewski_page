import {NextRequest,NextResponse} from 'next/server';
import {withAuth} from '@/lib/auth/middleware';
import prisma from '@/lib/db/prisma';
import {shopError} from '@/lib/galleries/merchandise-server';
import {ShopValidationError,readShopMetadata} from '@/lib/galleries/merchandise';
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string;orderId:string}>}) {return withAuth(request,async()=>{try {
 const p=await params;const galleryId=Number(p.id);const orderId=Number(p.orderId);const body=await request.json().catch(()=>null);
 const statuses=['new','ordered','received','packed','shipped'];
 if(!Number.isSafeInteger(galleryId)||galleryId<1||!Number.isSafeInteger(orderId)||orderId<1||!body||!statuses.includes(body.status)||body.trackingNumber!=null&&(typeof body.trackingNumber!=='string'||body.trackingNumber.length>100)) throw new ShopValidationError('Nieprawidłowy etap realizacji.');
 const order=await prisma.photoOrder.findFirst({where:{id:orderId,gallery_id:galleryId}});const metadata=readShopMetadata(order?.product_ids);
 if(!order||!metadata) throw new ShopValidationError('Nie znaleziono zamówienia.',404);
 if(order.payment_status!=='paid') throw new ShopValidationError('Realizację można zmieniać po potwierdzeniu płatności.',409);
 const next=statuses.indexOf(body.status),previous=statuses.indexOf(metadata.fulfillment.status);
 if(next!==previous && next!==previous+1) throw new ShopValidationError('Zapisuj kolejne etapy: zamówione, odebrane, spakowane, wysłane.',409);
 const tracking=body.trackingNumber?.trim() || metadata.fulfillment.trackingNumber;
 if(body.status==='shipped'&&!tracking) throw new ShopValidationError('Podaj numer przesyłki przed oznaczeniem wysyłki.');
 metadata.fulfillment={status:body.status,trackingNumber:tracking};
 const updated=await prisma.photoOrder.updateMany({where:{id:orderId,gallery_id:galleryId,payment_status:'paid',product_ids:order.product_ids},data:{product_ids:JSON.stringify(metadata)}});
 if(updated.count!==1) throw new ShopValidationError('Zamówienie zmieniło się. Odśwież widok.',409);
 return NextResponse.json({success:true,metadata});
 }catch(e){return shopError(e);}});}
