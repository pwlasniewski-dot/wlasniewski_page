import {NextRequest,NextResponse} from 'next/server';
import {createProdigiCallback,type ProdigiCallbackIndex} from '@/lib/fulfillment/prodigi-callback';
import {notifyProdigiCustomer} from '@/lib/fulfillment/prodigi-notification-server';
import prisma from '@/lib/db/prisma';
import {acquireAdvisoryTransactionLock} from '@/lib/db/advisoryLock';
import {prepareProdigiOrder,type ProdigiPrepared} from '@/lib/fulfillment/prodigi-preflight';
import {createPrintApprovalFingerprint,evaluateProdigiRelease} from '@/lib/fulfillment/prodigi-release-gate';
import {withAuth} from '@/lib/auth/middleware';
import {getClientIp,rateLimit} from '@/lib/rate-limit';
import {isTrustedAdminOrigin} from '@/lib/auth/admin-origin';
import {readShopMetadata} from '@/lib/galleries/merchandise';
import {getPrivateS3DownloadUrl} from '@/lib/storage/s3';
import {boundedJson} from '@/lib/fulfillment/prodigi-sandbox';
import {orderEnvironment,orderCredentials,assertProdigiCheckoutEnvironment,prodigiOrderRequest,parseProviderOrder,prodigiSnapshotSchema,validProviderId,ProdigiOrderError,type ProdigiOrderState} from '@/lib/fulfillment/prodigi-orders';
export const dynamic='force-dynamic';
export const maxDuration=60;
const headers={'Cache-Control':'private, no-store'};
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string;orderId:string}>}){return withAuth(request,async(auth)=>{try{
 if(!isTrustedAdminOrigin(request))return NextResponse.json({error:'Nieprawidłowe pochodzenie żądania.'},{status:403,headers});
 if(!rateLimit(`prodigi-order:${getClientIp(request)}`,6,60000).ok)return NextResponse.json({error:'Odczekaj minutę przed kolejną operacją.'},{status:429,headers});
 const p=await params;const galleryId=Number(p.id),orderId=Number(p.orderId);
 if(!Number.isSafeInteger(galleryId)||galleryId<1||!Number.isSafeInteger(orderId)||orderId<1)throw new ProdigiOrderError('Nieprawidłowe zamówienie.',400);
 const input=await boundedJson(request.body,8192) as {action?:string;approved?:boolean;providerOrderId?:string};
 if(!['prepare','approve','create','refresh','cancel','reconcile'].includes(input?.action||''))throw new ProdigiOrderError('Nieprawidłowa operacja.',400);
 const order=await prisma.photoOrder.findFirst({where:{id:orderId,gallery_id:galleryId}});
 const metadata=readShopMetadata(order?.product_ids) as (NonNullable<ReturnType<typeof readShopMetadata>>&{providerFulfillment?:ProdigiOrderState;prodigiPrepared?:ProdigiPrepared})|null;
 if(!order||!metadata)throw new ProdigiOrderError('Nie znaleziono zamówienia.',404);
 const previous=metadata.providerFulfillment;
 const environment=previous?.environment || orderEnvironment();orderCredentials(environment);
 assertProdigiCheckoutEnvironment(environment,metadata);
 const persist=async(next:ProdigiOrderState,expected:string)=>{if(next.state==='cancelled')metadata.fulfillment={...metadata.fulfillment,status:'cancelled'};if(next.state==='accepted'){const tracking=next.shipments?.map(s=>s.trackingNumber).filter(Boolean).join(', ')||null;metadata.fulfillment={status:next.stage?.toLowerCase()==='complete'?'shipped':'ordered',trackingNumber:tracking};}const result=await prisma.photoOrder.updateMany({where:{id:order.id,gallery_id:galleryId,product_ids:expected},data:{product_ids:JSON.stringify({...metadata,providerFulfillment:next})}});if(result.count!==1)throw new ProdigiOrderError('Zamówienie zmieniło się równocześnie. Odśwież stan.');await notifyProdigiCustomer(order.id,metadata.delivery.email,next,metadata.guestOwnerId).catch(()=>{});};
 if(input.action==='reconcile'){
  if(!previous||!['submitting','unknown'].includes(previous.state))throw new ProdigiOrderError('Wyjaśnienie dotyczy tylko nieznanego wyniku.');
  const providerId=validProviderId(input.providerOrderId);
  const raw=await prodigiOrderRequest(environment,`/Orders/${providerId}`,'GET') as {order?:{idempotencyKey?:string;merchantReference?:string}};
  if(raw.order?.idempotencyKey!==previous.idempotencyKey||raw.order?.merchantReference!==`photo-order-${order.id}`)throw new ProdigiOrderError('Zamówienie Prodigi nie odpowiada tej próbie realizacji.');
  const result=parseProviderOrder(raw);if(result.orderId!==providerId)throw new ProdigiOrderError('Niezgodny identyfikator.');
  const next:ProdigiOrderState={...previous,...result,state:result.stage.toLowerCase()==='cancelled'?'cancelled':'accepted',updatedAt:new Date().toISOString()};
  await persist(next,order.product_ids!);return NextResponse.json({success:true,fulfillment:next},{headers});
 }
 if(input.action==='refresh'||input.action==='cancel'){
  if(!previous?.orderId)throw new ProdigiOrderError('Brak potwierdzonego ID Prodigi. Sprawdź panel dostawcy; nie wysyłaj ponownie.');
  const providerId=validProviderId(previous.orderId);
  if(input.action==='cancel'){
   const actions=await prodigiOrderRequest(environment,`/Orders/${providerId}/actions`,'GET') as {cancel?:{isAvailable?:string}};
   if(actions.cancel?.isAvailable!=='Yes')throw new ProdigiOrderError('Prodigi nie pozwala obecnie anulować całego zamówienia.');
  }
  const result=parseProviderOrder(await prodigiOrderRequest(environment,`/Orders/${providerId}${input.action==='cancel'?'/actions/cancel':''}`,input.action==='cancel'?'POST':'GET'));
  if(result.orderId!==providerId)throw new ProdigiOrderError('Niezgodny identyfikator odpowiedzi Prodigi.',502);
  const next:ProdigiOrderState={...previous,...result,state:result.stage.toLowerCase()==='cancelled'?'cancelled':'accepted',updatedAt:new Date().toISOString()};
  await persist(next,order.product_ids!);return NextResponse.json({success:true,fulfillment:next},{headers});
 }
 if(previous)throw new ProdigiOrderError('Zamówienie ma już próbę realizacji. Odśwież status lub wyjaśnij wynik w Prodigi; ponowna wysyłka jest zablokowana.');
 if(order.payment_status!=='paid'||!order.paid_at)throw new ProdigiOrderError('Zamówienie nie ma potwierdzonej płatności.');
 const payments=await prisma.paymentLedger.findMany({where:{resource_type:'GALLERY',resource_id:order.id,status:'COMPLETED',currency:'PLN'}});
 if(payments.reduce((sum,p)=>sum+p.amount-p.refunded_amount,0)<order.total_amount)throw new ProdigiOrderError('Potwierdzone wpłaty po zwrotach nie pokrywają zamówienia.');
 const photoIds=metadata.lines.flatMap(line=>line.kind==='product'?line.photoIds:[line.photoId]);
 const photos=await prisma.galleryPhoto.findMany({where:{gallery_id:galleryId,id:{in:photoIds}},select:{id:true,download_source_url:true}});
 if(input.action==='prepare'){
  metadata.prodigiPrepared=await prepareProdigiOrder(order,metadata,photos,undefined,environment);
  const saved=await prisma.photoOrder.updateMany({where:{id:order.id,product_ids:order.product_ids,payment_status:'paid'},data:{product_ids:JSON.stringify(metadata)}});
  if(saved.count!==1)throw new ProdigiOrderError('Zamówienie zmieniło się. Przygotuj ponownie.');
  const proofs=await Promise.all(Object.entries(metadata.prodigiPrepared.sources).map(async([lineId,source])=>({lineId,url:await getPrivateS3DownloadUrl(source.objectKey,900)})));
  return NextResponse.json({success:true,prepared:metadata.prodigiPrepared,proofs},{headers});
 }
 if(!metadata.prodigiPrepared)throw new ProdigiOrderError('Najpierw sprawdź pliki HQ i pobierz wycenę.');
 if(input.action==='approve'){
  if(input.approved!==true)throw new ProdigiOrderError('Potwierdź podgląd zdjęć, wariant i adres.');
  const prepared=metadata.prodigiPrepared;prepared.input.nowMs=Date.now();
  if(!prepared.input.quote||prepared.input.quote.expiresAtMs<=Date.now())throw new ProdigiOrderError('Wycena wygasła. Przygotuj ponownie.');
  prepared.input.lines=prepared.input.lines.map(line=>line.kind==='print'?{...line,approval:{fingerprint:createPrintApprovalFingerprint(prepared.input.orderId,prepared.input.customerId,line),approvedAtMs:Date.now()}}:line);prepared.approvedBy=auth.user!.id;
  const saved=await prisma.photoOrder.updateMany({where:{id:order.id,product_ids:order.product_ids,payment_status:'paid'},data:{product_ids:JSON.stringify(metadata)}});
  if(saved.count!==1)throw new ProdigiOrderError('Zamówienie zmieniło się. Przygotuj ponownie.');
  return NextResponse.json({success:true,prepared},{headers});
 }
 // Re-read bytes and server catalog snapshot; changed bytes invalidate the saved proof fingerprint.
 if(!metadata.prodigiPrepared.approvedBy||metadata.prodigiPrepared.input.lines.some(line=>line.kind==='print'&&!line.approval))throw new ProdigiOrderError('Najpierw zatwierdź podgląd.');
 const prepared=await prepareProdigiOrder(order,metadata,photos,metadata.prodigiPrepared,environment);

 const d=metadata.delivery;
 if(d.method!=='courier'||!d.address?.street||!/^\d{2}-\d{3}$/.test(d.address.postalCode)||!d.address.city||!d.recipientName)throw new ProdigiOrderError('Prodigi wymaga pełnego adresu kuriera w Polsce.');
 const items=[];let shippingMethod:string|undefined;
 for(const line of metadata.lines){
  if(line.kind!=='product')throw new ProdigiOrderError('Rozdziel zamówienie mieszane przed realizacją Prodigi.');
  const parsed=prodigiSnapshotSchema.safeParse((line.product as unknown as {prodigi?:unknown})?.prodigi);
  if(!parsed.success||parsed.data.environment!==environment)throw new ProdigiOrderError('Brak zatwierdzonego produkcyjnego snapshotu produktu.');
  const s=parsed.data;
  if(s.requiredAssets.length!==1||s.requiredAssets[0]!=='default'||line.photoIds.length!==1)throw new ProdigiOrderError('Ten produkt wymaga indywidualnego przygotowania pól druku.');
  if(!Number.isSafeInteger(line.quantity)||line.quantity<1||line.quantity>99)throw new ProdigiOrderError('Nieprawidłowa liczba sztuk.');
  if(shippingMethod&&shippingMethod!==s.shippingMethod)throw new ProdigiOrderError('Pozycje mają różne metody wysyłki.');shippingMethod=s.shippingMethod;
  const photo=await prisma.galleryPhoto.findFirst({where:{gallery_id:galleryId,id:line.photoIds[0]},select:{download_source_url:true}});
  if(!photo?.download_source_url)throw new ProdigiOrderError('Brak oryginału HQ w galerii.');
  const url=new URL(photo.download_source_url);const bucket=process.env.S3_BUCKET||'wlasniewski-photo-storage',region=process.env.S3_REGION||'eu-north-1';
  if(url.protocol!=='https:'||![`${bucket}.s3.${region}.amazonaws.com`,`${bucket}.s3.amazonaws.com`].includes(url.hostname)||url.username||url.password)throw new ProdigiOrderError('Oryginał musi pochodzić z magazynu tej galerii.');
  items.push({merchantReference:line.id,sku:s.sku,copies:line.quantity,sizing:'fitPrintArea',attributes:s.variant.attributes,assets:[{printArea:'default',md5Hash:prepared.sources[line.id].md5,url:await getPrivateS3DownloadUrl(prepared.sources[line.id].objectKey,7*24*3600)}]});
 }
 if(items.length===0||items.length>100)throw new ProdigiOrderError('Nieprawidłowa liczba pozycji.');
 const callback=createProdigiCallback(environment,request.headers.get('origin')||undefined);
 const now=new Date().toISOString();const state:ProdigiOrderState={environment,callbackKeyHash:callback.hash,state:'submitting',idempotencyKey:`photo-order-${order.id}-${environment}-v1`,updatedAt:now,approvedAt:new Date(metadata.prodigiPrepared.input.lines.flatMap(line=>line.kind==='print'&&line.approval?[line.approval.approvedAtMs]:[])[0]).toISOString(),approvedBy:metadata.prodigiPrepared.approvedBy!};
 // CAS is acquired before the network side effect and intentionally never automatically cleared.
 const locked=JSON.stringify({...metadata,providerFulfillment:state});
 const lock=await prisma.$transaction(async tx=>{
  await acquireAdvisoryTransactionLock(tx,`prodigi-order-${order.id}`);
  const entries=await tx.paymentLedger.findMany({where:{resource_type:'GALLERY',resource_id:order.id,status:'COMPLETED',currency:'PLN'}});
  prepared.input.payment.settledGrosze=entries.reduce((sum,p)=>sum+p.amount,0);
  prepared.input.payment.refundedGrosze=entries.reduce((sum,p)=>sum+p.refunded_amount,0);
  prepared.input.nowMs=Date.now();
  const gate=evaluateProdigiRelease(prepared.input);
  if(!gate.readyForSubmission)throw new ProdigiOrderError('Wstrzymano produkcję: '+gate.blockers.map(b=>b.code).join(', '));
  const claimed=await tx.photoOrder.updateMany({where:{id:order.id,payment_status:'paid',product_ids:order.product_ids},data:{product_ids:locked}});
  if(claimed.count===1){const index:ProdigiCallbackIndex={version:1,orderId:order.id,galleryId:galleryId,environment,idempotencyKey:state.idempotencyKey};await tx.setting.create({data:{setting_key:callback.key,setting_value:JSON.stringify(index)}});}
  return claimed;
 });
 if(lock.count!==1)throw new ProdigiOrderError('Inna operacja zmieniła zamówienie. Odśwież widok.');
 try{
  const result=parseProviderOrder(await prodigiOrderRequest(environment,'/Orders','POST',{callbackUrl:callback.url,idempotencyKey:state.idempotencyKey,merchantReference:`photo-order-${order.id}`,shippingMethod,recipient:{name:d.recipientName,email:d.email,phoneNumber:d.phone,address:{line1:d.address.street,postalOrZipCode:d.address.postalCode,townOrCity:d.address.city,countryCode:'PL'}},items}));
  const next:ProdigiOrderState={...state,...result,state:result.stage.toLowerCase()==='cancelled'?'cancelled':'accepted',updatedAt:new Date().toISOString()};await persist(next,locked);
  return NextResponse.json({success:true,fulfillment:next},{headers});
 }catch(e){await persist({...state,state:'unknown',updatedAt:new Date().toISOString()},locked).catch(()=>{});throw e;}
 }catch(e){return NextResponse.json({success:false,error:e instanceof ProdigiOrderError?e.message:'Nie udało się wykonać operacji. Sprawdź stan zamówienia.'},{status:e instanceof ProdigiOrderError?e.status:500,headers});}});}
