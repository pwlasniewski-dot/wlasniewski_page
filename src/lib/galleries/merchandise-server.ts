import { verifyParcelPoint } from '@/lib/shipping/inpost-point';
import { readProductImages, isProductVideoUrl } from './product-media';
import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { authorizeIndividualGallery } from './individual-access';
import { verifyParentToken, extractTokenFromHeader } from '@/lib/auth/parent-jwt';
import { createPayUOrder, extractClientIpv4 } from '@/lib/payu';
import { priceShopCart, readShopConfig, readShopMetadata, ShopValidationError, type ShopCatalog, type ShopMetadata } from './merchandise';
export const shopSettingKey = (id: number | null) => id === null ? 'gallery_shop_default' : `gallery_shop_${id}`;
export async function loadGalleryShop(galleryId: number | null) {
 const [setting, globalSetting, products] = await Promise.all([
  prisma.setting.findUnique({where:{setting_key:shopSettingKey(galleryId)}}),
  galleryId === null ? Promise.resolve(null) : prisma.setting.findUnique({where:{setting_key:shopSettingKey(null)}}),
  prisma.galleryProduct.findMany({where:galleryId === null ? {gallery_id:null} : {OR:[{gallery_id:galleryId},{gallery_id:null}]},orderBy:[{sort_order:'asc'},{id:'asc'}]})
 ]);
 const inherited = galleryId !== null && !setting;
 const config=readShopConfig((setting || globalSetting)?.setting_value);
 const globalConfig = galleryId === null ? config : readShopConfig(globalSetting?.setting_value);
 const catalog: ShopCatalog={galleryId:galleryId ?? 0,enabled:config.enabled,title:config.title,introduction:config.introduction,buttonLabel:config.buttonLabel,formats:config.formats.filter(f=>f.active),delivery:config.delivery,products:products.filter(p=>!p.archived_at && p.is_active && p.price>0).map(p=>{
  const globalRule = p.gallery_id === null ? globalConfig.productRules[String(p.id)] : undefined;
  const rule = config.productRules[String(p.id)] || globalRule || {minPhotos:1,maxPhotos:50};
  // A local photo-count override cannot relax a shared product's shipping constraints.
  const deliveryMethods = globalRule?.deliveryMethods ? globalRule.deliveryMethods.filter(method => !rule.deliveryMethods || rule.deliveryMethods.includes(method)) : rule.deliveryMethods;
  return {id:p.id,title:p.title,description:p.description,price:p.price,image_url:p.image_url,preview_images:readProductImages(p.preview_images),video_url:isProductVideoUrl(p.video_url)?p.video_url:null,sample_pages:readProductImages(p.sample_pages),product_type:p.product_type,nphoto_product_id:p.nphoto_product_id,nphoto_url:p.nphoto_url,...rule,...(deliveryMethods ? {deliveryMethods} : {})};
 }).filter(product => !product.deliveryMethods || product.deliveryMethods.some(method => config.delivery[method].enabled))};
 catalog.enabled = config.enabled && (catalog.formats.length > 0 || catalog.products.length > 0);
 const editableProducts = products.filter(p=>!p.archived_at).map(p => ({...p, preview_images:readProductImages(p.preview_images),video_url:p.video_url,sample_pages:readProductImages(p.sample_pages)}));
 return {config,catalog,inherited,archivedProducts:products.filter(p=>p.gallery_id===galleryId && p.archived_at).map(p=>({id:p.id,title:p.title})),products:editableProducts.filter(p=>p.gallery_id===galleryId),sharedProducts:galleryId===null?[]:editableProducts.filter(p=>p.gallery_id===null)};
}
export async function authorizeShop(request: NextRequest, scope: {accessCode:string} | {participantId:number}) {
 let participantId: number | null=null;
 let gallery;
 if ('participantId' in scope) {
  const token=extractTokenFromHeader(request.headers.get('authorization'));
  const payload=token ? await verifyParentToken(token):null;
  if(!payload || payload.participant_id!==scope.participantId) throw new ShopValidationError('Zaloguj się jako uczestnik tej galerii.',401);
  const participant=await prisma.galleryParticipant.findUnique({where:{id:scope.participantId},include:{gallery:true}});
  if(!participant || participant.gallery_id!==payload.gallery_id || participant.gallery.gallery_mode!=='GROUP') throw new ShopValidationError('Nie znaleziono galerii.',404);
  // Physical merchandise is enabled by its own catalog, independently of digital extras.
  participantId=participant.id; gallery=participant.gallery;
 } else {
  gallery=await prisma.clientGallery.findUnique({where:{access_code:scope.accessCode}});
  if(!gallery) throw new ShopValidationError('Nie znaleziono galerii.',404);
  const access=await authorizeIndividualGallery(request,gallery);
  if(!access.allowed) throw new ShopValidationError('Brak dostępu do galerii.',401);
 }
 if(!gallery.is_active || (gallery.expires_at && gallery.expires_at < new Date())) throw new ShopValidationError('Galeria nie jest aktywna.',410);
 return {gallery,participantId};
}
export function shopError(error: unknown) {return NextResponse.json({success:false,error:error instanceof ShopValidationError ? error.message:'Nie udało się obsłużyć sklepu. Spróbuj ponownie.'},{status:error instanceof ShopValidationError ? error.status:500});}
export async function getShop(request: NextRequest, scope: {accessCode:string} | {participantId:number}) {try {const {gallery}=await authorizeShop(request,scope); const {catalog}=await loadGalleryShop(gallery.id); return NextResponse.json({success:true,catalog},{headers:{'Cache-Control':'private, no-store'}});}catch(error){return shopError(error);}}
function canonical(value: unknown): string {if(Array.isArray(value)) return '['+value.map(canonical).join(',')+']'; if(value && typeof value==='object') return '{'+Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>JSON.stringify(k)+':'+canonical(v)).join(',')+'}'; return JSON.stringify(value);}
export function shopCheckoutFingerprint(galleryId:number, participantId:number|null, body:unknown) {return createHash('sha256').update(canonical({galleryId,participantId,body})).digest('hex');}
export async function postShopOrder(request:NextRequest,scope:{accessCode:string}|{participantId:number}) {
 try {
  const {gallery,participantId}=await authorizeShop(request,scope);
  const key=request.headers.get('idempotency-key');
  if(!key || !/^[A-Za-z0-9_-]{16,128}$/.test(key)) throw new ShopValidationError('Brak poprawnego identyfikatora zamówienia.');
  const body=await request.json().catch(()=>null);
  if(!body || !Number.isSafeInteger(body.expectedTotal)) throw new ShopValidationError('Nieprawidłowe zamówienie.');
  const fingerprint=shopCheckoutFingerprint(gallery.id,participantId,{lines:body.lines,delivery:body.delivery,expectedTotal:body.expectedTotal});
  const existingResponse=(order:{id:number;gallery_id:number;participant_id:number|null;checkout_fingerprint:string|null;payment_status:string;payment_url:string|null})=> {
   if(order.gallery_id!==gallery.id || order.participant_id!==participantId || order.checkout_fingerprint!==fingerprint) throw new ShopValidationError('Ten identyfikator dotyczy innego zamówienia.',409);
   if(order.payment_status==='paid') return NextResponse.json({success:true,orderId:order.id,paid:true});
   if(order.payment_status==='pending' && order.payment_url) return NextResponse.json({success:true,orderId:order.id,paymentUrl:order.payment_url});
   return NextResponse.json({success:false,orderId:order.id,code:order.payment_status==='initializing'?'ORDER_IN_PROGRESS':'PAYMENT_REVIEW',error:order.payment_status==='initializing'?'Zamówienie jest przygotowywane. Spróbuj ponownie za chwilę.':'Płatność wymaga sprawdzenia przez obsługę. Nie twórz ponownie tego zamówienia.'},{status:409});
  };
  const existing=await prisma.photoOrder.findUnique({where:{idempotency_key:key}});
  if(existing) return existingResponse(existing);
  const {catalog}=await loadGalleryShop(gallery.id);
  const photos=await prisma.galleryPhoto.findMany({where:{gallery_id:gallery.id},select:{id:true,is_standard:true}});
  let allowed=photos.map(p=>p.id);
  if(participantId===null) {
   const paid=await prisma.photoOrder.findMany({where:{gallery_id:gallery.id,payment_status:'paid'},select:{photo_ids:true}});
   const paidIds=new Set<number>(paid.flatMap(o=>{try {const ids=JSON.parse(o.photo_ids);return Array.isArray(ids)?ids.filter((id:unknown)=>typeof id==='number'):[];}catch{return [];}}));
   allowed=photos.filter(p=>p.is_standard || paidIds.has(p.id)).map(p=>p.id);
  }
  const priced=priceShopCart(catalog,body.lines,body.delivery,allowed);
  if(priced.total!==body.expectedTotal) return NextResponse.json({success:false,code:'PRICE_CHANGED',error:'Cennik się zmienił. Sprawdź aktualne podsumowanie przed płatnością.',catalog,total:priced.total},{status:409});
  if(priced.delivery.method==='locker') await verifyParcelPoint(priced.delivery.pointCode!);
  const metadata:ShopMetadata={kind:'gallery_merchandise',version:1,lines:priced.lines,delivery:priced.delivery,fulfillment:{status:'new',trackingNumber:null}};
  let order;
  try {order=await prisma.photoOrder.create({data:{gallery_id:gallery.id,participant_id:participantId,photo_ids:'[]',photo_count:priced.lines.filter(l=>l.kind==='print').reduce((sum,l)=>sum+l.quantity,0),product_ids:JSON.stringify(metadata),total_amount:priced.total,payment_status:'initializing',idempotency_key:key,checkout_fingerprint:fingerprint}});}catch(error){if((error as {code?:string})?.code!=='P2002') throw error; const raced=await prisma.photoOrder.findUnique({where:{idempotency_key:key}});if(!raced) throw error;return existingResponse(raced);}
  try {
   const origin=new URL(request.url).origin;
   const result=await createPayUOrder({description:`Zamówienie odbitek i produktów #${order.id}`,currencyCode:'PLN',totalAmount:priced.total,extOrderId:`GALLERY_${order.id}_${Date.now()}`,buyer:{email:priced.delivery.email,firstName:priced.delivery.recipientName.split(' ')[0],lastName:priced.delivery.recipientName.split(' ').slice(1).join(' ') || '-',language:'pl'},products:[...priced.lines.map(l=>({name:l.title,unitPrice:l.unitAmount,quantity:l.quantity})),...(priced.delivery.amount ? [{name:'Dostawa',unitPrice:priced.delivery.amount,quantity:1}]:[])],continueUrl:participantId ? `${origin}/galeria/grupowa?shopOrder=${order.id}`:`${origin}/galeria/${gallery.access_code}?shopOrder=${order.id}`},extractClientIpv4(request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')));
   await prisma.photoOrder.updateMany({where:{id:order.id,payment_status:'initializing'},data:{payment_status:'pending',payment_id:result.orderId,payment_url:result.redirectUri}});
   return NextResponse.json({success:true,orderId:order.id,paymentUrl:result.redirectUri});
  } catch {
   // Keep the idempotency record: a timeout can occur after the provider accepted the order.
   await prisma.photoOrder.updateMany({where:{id:order.id,payment_status:'initializing'},data:{payment_status:'failed_init'}});
   return NextResponse.json({success:false,orderId:order.id,code:'PAYMENT_REVIEW',error:'Nie udało się potwierdzić rozpoczęcia płatności. Skontaktuj się z obsługą, podając numer zamówienia '+order.id+'. Koszyk został zachowany.'},{status:502});
  }
 } catch(error){return shopError(error);}
}
export { readShopMetadata };
export async function getShopOrder(request:NextRequest,scope:{accessCode:string}|{participantId:number},orderId:number) {try {
 const {gallery,participantId}=await authorizeShop(request,scope);
 if(!Number.isSafeInteger(orderId)||orderId<1) throw new ShopValidationError('Nieprawidłowe zamówienie.');
 const order=await prisma.photoOrder.findFirst({where:{id:orderId,gallery_id:gallery.id,participant_id:participantId}});
 const metadata=readShopMetadata(order?.product_ids);
 if(!order||!metadata) throw new ShopValidationError('Nie znaleziono zamówienia.',404);
 if(participantId===null && request.headers.get('x-shop-order-key')!==order.idempotency_key) throw new ShopValidationError('Szczegóły zamówienia są dostępne w sesji, w której zostało złożone.',403);
 return NextResponse.json({success:true,order:{id:order.id,payment_status:order.payment_status,total_amount:order.total_amount,paymentUrl:order.payment_status==='pending'?order.payment_url:null,metadata}},{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){return shopError(e);}}
