import {hasProdigiPrintResolution} from './prodigi-image-size';
import {z} from 'zod';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import type {ShopMetadata} from '@/lib/galleries/merchandise';
import {getPrivateS3DownloadUrl,uploadToS3} from '@/lib/storage/s3';
import {readProdigiProduct} from './prodigi-catalog';
import {ProdigiOrderError,prodigiOrderRequest} from './prodigi-orders';
import {fetchProdigiFx,estimateProdigiCostInPln} from './prodigi-fx';
import {createReleaseQuoteFingerprint,type ProdigiReleaseInput} from './prodigi-release-gate';
export type ProdigiPrepared={input:ProdigiReleaseInput;sources:Record<string,{photoId:number;url:string;sha256:string;md5:string;objectKey:string}>;preparedAt:string;economics?:{revenueGrosze:number;customerShippingGrosze:number;supplierTotal:{amount:string;currency:string};conversion:NonNullable<ReturnType<typeof estimateProdigiCostInPln>>;beforeFeesAndTaxGrosze:number;indicative:true};approvedBy?:number};
export async function prepareProdigiOrder(order:{id:number;total_amount:number;gallery_id:number},metadata:ShopMetadata,photos:Array<{id:number;download_source_url:string|null}>,previous?:ProdigiPrepared){
 const d=metadata.delivery;
 if(d.method!=='courier'||!d.address)throw new ProdigiOrderError('Prodigi wymaga dostawy kurierem pod adres klienta.');
 const now=Date.now(),customerId=String(metadata.customerId||`gallery-${order.gallery_id}`),sources:ProdigiPrepared['sources']={};
 const lines:ProdigiReleaseInput['lines']=[];let shippingMethod:string|undefined;
 for(const line of metadata.lines){
  if(line.kind!=='product')throw new ProdigiOrderError('Koszyk mieszany wymaga osobnej realizacji.');
  const config=readProdigiProduct(line.product?.prodigi);
  if(!config||config.environment!=='live'||!config.liveQualified||!config.ordersEnabled)throw new ProdigiOrderError('Produkt nie ma kwalifikacji do realizacji live.');
  if(config.requiredAssets.length!==1||config.requiredAssets[0]!=='default'||line.photoIds.length!==1)throw new ProdigiOrderError('Obsługiwane są produkty z jednym zdjęciem i polem default.');
  if(shippingMethod&&shippingMethod!==config.shippingMethod)throw new ProdigiOrderError('Pozycje wymagają różnych metod dostawy.');shippingMethod=config.shippingMethod;
  const photo=photos.find(p=>p.id===line.photoIds[0]);
  if(!photo?.download_source_url)throw new ProdigiOrderError(`Zdjęcie #${line.photoIds[0]} nie ma oryginału HQ.`);
  const url=new URL(photo.download_source_url),bucket=process.env.S3_BUCKET||'wlasniewski-photo-storage',region=process.env.S3_REGION||'eu-north-1';
  if(url.protocol!=='https:'||url.username||url.password||![`${bucket}.s3.${region}.amazonaws.com`,`${bucket}.s3.amazonaws.com`].includes(url.hostname))throw new ProdigiOrderError('Oryginał musi pochodzić z magazynu galerii.');
  const signed=await getPrivateS3DownloadUrl(decodeURIComponent(url.pathname.slice(1)),3600);
  const response=await fetch(signed,{signal:AbortSignal.timeout(20000),redirect:'error',cache:'no-store'});
  if(!response.ok||!response.body)throw new ProdigiOrderError('Nie można pobrać pliku HQ.',502);
  const chunks:Uint8Array[]=[];let size=0;
  for await(const chunk of response.body as unknown as AsyncIterable<Uint8Array>){size+=chunk.byteLength;if(size>60*1024*1024)throw new ProdigiOrderError('Plik HQ przekracza 60 MB.');chunks.push(chunk);}
  const bytes=Buffer.concat(chunks),sha256=createHash('sha256').update(bytes).digest('hex');
  const info=await sharp(bytes,{limitInputPixels:120000000}).metadata();const required=config.variant.printAreaSizes.default;
  const width=info.autoOrient?.width || info.width || 0,height=info.autoOrient?.height || info.height || 0;
  if(!required||!width||!height||!['jpeg','png'].includes(info.format||''))throw new ProdigiOrderError('Plik produkcyjny musi być JPEG/PNG o poprawnych wymiarach.');
  if(!hasProdigiPrintResolution(width,height,required))throw new ProdigiOrderError(`Zdjęcie #${photo.id} ma za małą rozdzielczość do produktu.`);
  const objectKey=`prodigi-production/${order.gallery_id}/${order.id}/${sha256}.${info.format==='png'?'png':'jpg'}`;
  await uploadToS3(bytes,objectKey,info.format==='png'?'image/png':'image/jpeg',{access:'private'});
  sources[line.id]={photoId:photo.id,url:photo.download_source_url,sha256,md5:createHash('md5').update(bytes).digest('hex'),objectKey};
  lines.push({id:line.id,kind:'print',amountGrosze:line.lineTotal,sku:config.sku,attributes:config.variant.attributes,quantity:line.quantity,printArea:'default',crop:{x:0,y:0,width:1,height:1},asset:{id:String(photo.id),sha256,orderId:String(order.id),customerId,kind:'final',preflight:'passed'},approval:previous?.input.lines.find(l=>l.id===line.id&&l.kind==='print')?.kind==='print'?(previous.input.lines.find(l=>l.id===line.id) as Extract<ProdigiReleaseInput['lines'][number],{kind:'print'}>).approval:null});
 }
 if(!lines.length||lines.length>10)throw new ProdigiOrderError('Realizacja obsługuje od 1 do 10 pozycji.');
 // This endpoint only fulfills already selected gallery photo products, never session/service bundles.
 // Final HQ bytes and an explicit administrator proof approval are required for every line.
 const input:ProdigiReleaseInput={orderId:String(order.id),customerId,currency:'PLN',nowMs:now,cancelled:false,submission:'not_submitted',session:'not_required',lines,shippingGrosze:d.amount,payment:{settledGrosze:0,refundedGrosze:0,requiredGrosze:order.total_amount,disputed:false},delivery:{recipient:d.recipientName,addressLine1:d.address.street,city:d.address.city,postalCode:d.address.postalCode,countryCode:'PL',service:shippingMethod!},quote:null};
 const rawQuote=await prodigiOrderRequest('live','/Quotes','POST',{destinationCountryCode:'PL',items:lines.map(l=>{if(l.kind!=='print')throw new Error();return{sku:l.sku,copies:l.quantity,attributes:l.attributes,assets:[{printArea:'default'}]};})});
 const quoteSchema=z.object({outcome:z.enum(['Created','Ok']),issues:z.array(z.unknown()).max(0).nullish(),quotes:z.array(z.object({shipmentMethod:z.string(),issues:z.array(z.unknown()).max(0).nullish(),costSummary:z.object({totalCost:z.object({amount:z.string().regex(/^\d{1,12}(\.\d{1,6})?$/),currency:z.enum(['EUR','GBP','USD'])})})}))});
 const quoteParsed=quoteSchema.safeParse(rawQuote);if(!quoteParsed.success)throw new ProdigiOrderError('Prodigi nie potwierdziło poprawnej wyceny.',502);
 const quote=quoteParsed.data;
 const total=quote.quotes?.find(q=>q.shipmentMethod===shippingMethod)?.costSummary?.totalCost;
 if(!total||!['EUR','GBP','USD'].includes(total.currency)||!/^\d+(\.\d+)?$/.test(total.amount))throw new ProdigiOrderError('Brak pełnej wyceny wybranej dostawy.',502);
 const fx=await fetchProdigiFx(total.currency as 'EUR'|'GBP'|'USD');const converted=estimateProdigiCostInPln(total as {amount:string;currency:'EUR'|'GBP'|'USD'},fx);
 if(!converted)throw new ProdigiOrderError('Brak aktualnego kursu do kosztu produkcji.',502);
 const grosze=Number(converted.amount.replace('.',''));if(!Number.isSafeInteger(grosze)||grosze<1)throw new ProdigiOrderError('Niepoprawna wartość wyceny.',502);
 if(previous?.input.quote&&grosze>previous.input.quote.providerCostGrosze)throw new ProdigiOrderError('Koszt produkcji wzrósł. Przygotuj i zatwierdź nową wycenę.');
 input.quote={fingerprint:createReleaseQuoteFingerprint(input),obtainedAtMs:now,expiresAtMs:now+15*60*1000,providerCostGrosze:grosze,currency:'PLN'};
 return {input,sources,preparedAt:new Date(now).toISOString(),economics:{revenueGrosze:order.total_amount,customerShippingGrosze:d.amount,supplierTotal:total,conversion:converted,beforeFeesAndTaxGrosze:order.total_amount-grosze,indicative:true}} satisfies ProdigiPrepared;
}
