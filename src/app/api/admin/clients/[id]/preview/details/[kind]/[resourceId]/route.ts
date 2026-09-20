import {NextRequest,NextResponse} from 'next/server';
import prisma from '@/lib/db/prisma';
import {extractToken} from '@/lib/auth/jwt';
import {verifyAdminClientPreviewToken} from '@/lib/auth/client-preview';
import {isClientRecordOwner,isContractRecordOwner} from '@/lib/auth/document-access';
import {isClientVisibleOfferStatus} from '@/lib/offers/status';
import {isClientVisibleContractStatus} from '@/lib/contracts/status';
import {ownsAccountOrder} from '@/lib/galleries/order-account';
import {readShopMetadata} from '@/lib/galleries/merchandise';
import {orderPhotoIds,safeOrderImage} from '@/lib/galleries/order-presentation';
import {orderProductImages} from '@/lib/galleries/order-product-images';

type Kind='offer'|'contract'|'gallery'|'order'|'gift-card';
const kinds=new Set<Kind>(['offer','contract','gallery','order','gift-card']);
const response=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow'}});

export async function GET(request:NextRequest,{params}:{params:Promise<{id:string;kind:string;resourceId:string}>}) {
 const values=await params;
 const clientId=Number(values.id),resourceId=Number(values.resourceId),kind=values.kind as Kind;
 if(!Number.isSafeInteger(clientId)||clientId<1||!Number.isSafeInteger(resourceId)||resourceId<1||!kinds.has(kind)) return response({error:'Nieprawidłowy zasób podglądu.'},400);
 const token=extractToken(request.headers.get('authorization'));
 const client=token ? await verifyAdminClientPreviewToken(token,request,clientId) : null;
 if(!client) return response({error:'Podgląd wygasł albo administrator utracił uprawnienia.'},401);

 if(kind==='offer') {
  const offer=await prisma.offer.findUnique({where:{id:resourceId},include:{sections:{include:{items:true},orderBy:{order:'asc'}},negotiations:{orderBy:{created_at:'asc'}},contract:{select:{id:true,status:true,contract_number:true}}}});
  if(!offer||!isClientRecordOwner(offer,client)||!isClientVisibleOfferStatus(offer.status)) return response({error:'Oferta nie jest dostępna na tym koncie.'},404);
  return response({kind,offer});
 }
 if(kind==='contract') {
  const contract=await prisma.contract.findUnique({where:{id:resourceId},include:{offer:{select:{id:true,title:true,total_price:true,offerNumber:true,client_id:true,client_email:true}},user:{select:{id:true,name:true,email:true}}}});
  if(!contract||!isContractRecordOwner(contract,client)||!isClientVisibleContractStatus(contract.status)) return response({error:'Umowa nie jest dostępna na tym koncie.'},404);
  const bank=await prisma.setting.findFirst({select:{bank_account_number:true,bank_account_holder:true,bank_name:true,bank_swift:true}}).catch(()=>null);
  const content=(contract.content||'').replace(/\{\{contractNumber\}\}/g,contract.contract_number||'').replace(/\{\{currentDate\}\}/g,new Date().toLocaleDateString('pl-PL')).replace(/\{\{clientName\}\}/g,client.name||client.email).replace(/\{\{clientEmail\}\}/g,client.email).replace(/\{\{offerTitle\}\}/g,contract.offer?.title||'Umowa Samodzielna');
  return response({kind,contract:{...contract,content},bank});
 }
 if(kind==='gallery') {
  const gallery=await prisma.clientGallery.findUnique({where:{id:resourceId},include:{photos:{orderBy:{order_index:'asc'},select:{id:true,file_url:true,thumbnail_url:true,is_standard:true,file_size:true,width:true,height:true,order_index:true}},products:{where:{is_active:true},orderBy:{sort_order:'asc'}},participants:{orderBy:{created_at:'asc'},select:{id:true,name:true,avatar:true,parent_identifier:true,max_selections:true,selection_status:true,selection_submitted_at:true,_count:{select:{selections:true}}}}}});
  if(!gallery||!isClientRecordOwner(gallery,client)||!gallery.is_active||(gallery.expires_at&&gallery.expires_at<new Date())) return response({error:'Galeria nie jest dostępna na tym koncie.'},404);
  const paid=await prisma.photoOrder.findMany({where:{gallery_id:gallery.id,payment_status:'paid'},select:{photo_ids:true}});
  const paidPhotoIds=[...new Set(paid.flatMap(row=>{try{return JSON.parse(row.photo_ids) as number[];}catch{return [];}}))];
  const {group_password:_,...safeGallery}=gallery;
  return response({kind,gallery:{...safeGallery,paid_photo_ids:paidPhotoIds}});
 }
 if(kind==='order') {
  const order=await prisma.photoOrder.findUnique({where:{id:resourceId},include:{gallery:true}});
  const metadata=order ? readShopMetadata(order.product_ids) : null;
  if(!order||!metadata||!isClientRecordOwner(order.gallery,client)||!ownsAccountOrder(metadata,client)) return response({error:'Zamówienie nie jest dostępne na tym koncie.'},404);
  const photos=await prisma.galleryPhoto.findMany({where:{gallery_id:order.gallery_id,id:{in:orderPhotoIds(metadata)}},select:{id:true,thumbnail_url:true}});
  return response({kind,order:{id:order.id,createdAt:order.created_at,paymentStatus:order.payment_status,total:order.total_amount,metadata:await orderProductImages(metadata,order.gallery_id),photos:photos.map(photo=>({id:photo.id,url:safeOrderImage(photo.thumbnail_url)})),gallery:{id:order.gallery.id,client_name:order.gallery.client_name,gallery_mode:order.gallery.gallery_mode}}});
 }
 const card=await prisma.giftCard.findUnique({where:{id:resourceId},include:{orders:{where:{payment_status:'completed'},orderBy:{created_at:'desc'},take:1,select:{id:true,order_number:true,customer_name:true,customer_email:true,recipient_name:true,sender_name:true,message:true,amount_paid:true,currency:true,created_at:true,paid_at:true}}}});
 if(!card||card.owner_id!==client.id) return response({error:'Voucher nie jest dostępny na tym koncie.'},404);
 return response({kind,card});
}
