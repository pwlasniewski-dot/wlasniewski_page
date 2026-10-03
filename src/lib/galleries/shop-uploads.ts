import {createHash,randomBytes,randomUUID} from 'node:crypto';
import sharp from 'sharp';
import {z} from 'zod';
import prisma from '@/lib/db/prisma';
import {acquireAdvisoryTransactionLock} from '@/lib/db/advisoryLock';
import {createPrivateShopUploadUrl,headPrivateShopUpload,getPrivateS3Object,uploadToS3,deleteFromS3} from '@/lib/storage/s3';
import {readShopConfig} from './merchandise';
import {hasExpectedMagicBytes} from '@/lib/uploads/magic-bytes';
export const shopUploadLimits={fileBytes:20*1024*1024,totalBytes:50*1024*1024,photos:100,maxPixels:60_000_000,minDimension:100};
export class ShopUploadError extends Error{constructor(message:string,public status=400){super(message);}}
export type UploadClient={id:number;email:string;name:string|null};
const requestSchema=z.object({fileName:z.string().min(1).max(180),contentType:z.enum(['image/jpeg','image/png']),size:z.number().int().min(1).max(shopUploadLimits.fileBytes),sha256:z.string().regex(/^[a-fA-F0-9]{64}$/)}).strict();
export type ShopUploadRecord={version:1;clientId:number;galleryId:number;uploadId:string;state:'pending'|'processing'|'complete'|'failed';size:number;contentType:'image/jpeg'|'image/png';sha256:string;expiresAt:number;createdAt:number;stageKey:string;claim?:string;claimedAt?:number;photoId?:number;storedBytes?:number;hqKey?:string;thumbnailKey?:string;normalizedSha256?:string};
const markerKey=(clientId:number)=>`shop_personalization_gallery_v1_${clientId}`;
const prefix=(clientId:number)=>`shop_personalization_upload_v1_${clientId}_`;
const uploadKey=(clientId:number,uploadId:string)=>prefix(clientId)+uploadId;
const photoKey=(photoId:number)=>`shop_personalization_photo_v1_${photoId}`;
function validId(value:unknown):asserts value is string{if(typeof value!=='string'||! /^[a-f0-9-]{36}$/.test(value))throw new ShopUploadError('Nieprawidłowy identyfikator przesyłania.');}
function parseRecord(raw:string|null|undefined):ShopUploadRecord{try{const value=JSON.parse(raw||'');if(value.version!==1||!Number.isSafeInteger(value.clientId)||!Number.isSafeInteger(value.galleryId)||!Number.isSafeInteger(value.size)||!['pending','processing','complete','failed'].includes(value.state)||!Number.isFinite(value.expiresAt)||!Number.isFinite(value.createdAt))throw Error();validId(value.uploadId);if(value.clientId<1||value.galleryId<1||value.size<1||value.size>shopUploadLimits.fileBytes||!['image/jpeg','image/png'].includes(value.contentType)||typeof value.sha256!=='string'||! /^[a-f0-9]{64}$/.test(value.sha256))throw Error();if(value.state==='complete'&&(!Number.isSafeInteger(value.photoId)||value.photoId<1||!Number.isSafeInteger(value.storedBytes)||value.storedBytes<1))throw Error();if(value.stageKey!==`shop-personalization/staging/${value.clientId}/${value.uploadId}`)throw Error();return value;}catch{throw new ShopUploadError('Zapis pliku wymaga sprawdzenia.',409);}}
export function requirePrivateShopStorage(){if(process.env.SHOP_UPLOADS_PRIVATE_STORAGE_CONFIRMED!=='true')throw new ShopUploadError('Dodawanie własnych zdjęć nie jest jeszcze skonfigurowane. Skontaktuj się z fotografem.',503);}
export function publicUploadPhoto(photo:{id:number;width:number|null;height:number|null}){return{id:photo.id,previewUrl:`/api/shop/personalization/photos/${photo.id}`,width:photo.width,height:photo.height};}
export async function requirePersonalizationEnabled(){const setting=await prisma.setting.findUnique({where:{setting_key:'gallery_shop_default'}});const config=readShopConfig(setting?.setting_value);if(!config.enabled||config.publicOffer?.personalizationEnabled!==true)throw new ShopUploadError('Dodawanie własnych zdjęć jest obecnie wyłączone.',404);}
export async function personalizationSession(client:UploadClient){
 await requirePersonalizationEnabled();
 const gallery=await prisma.$transaction(async tx=>{
  await acquireAdvisoryTransactionLock(tx,`shop-personalization-${client.id}`);
  const marker=await tx.setting.findUnique({where:{setting_key:markerKey(client.id)}});
  if(marker){const galleryId=Number(marker.setting_value);const existing=await tx.clientGallery.findFirst({where:{id:galleryId,client_id:client.id,is_active:true,terms_source:'SHOP_UPLOAD'}});if(!existing)throw new ShopUploadError('Galeria własnych zdjęć jest niedostępna.',409);return existing;}
  const created=await tx.clientGallery.create({data:{client_id:client.id,client_email:client.email,client_name:client.name||client.email,description:'Prywatne zdjęcia do personalizacji produktów',access_code:randomBytes(32).toString('hex'),terms_source:'SHOP_UPLOAD',gallery_mode:'INDIVIDUAL',is_active:true,price_per_premium:0,allow_extra_photo_purchase:false}});
  await tx.setting.create({data:{setting_key:markerKey(client.id),setting_value:String(created.id)}});return created;
 });
 const photos=await prisma.galleryPhoto.findMany({where:{gallery_id:gallery.id},select:{id:true,width:true,height:true},orderBy:{id:'desc'},take:shopUploadLimits.photos});
 return {galleryId:gallery.id,accessCode:gallery.access_code,photos:photos.map(publicUploadPhoto),limits:shopUploadLimits};
}
async function ownedGallery(client:UploadClient){const marker=await prisma.setting.findUnique({where:{setting_key:markerKey(client.id)}});const galleryId=Number(marker?.setting_value);if(!Number.isSafeInteger(galleryId)||galleryId<1)throw new ShopUploadError('Najpierw otwórz personalizację produktu.',409);const gallery=await prisma.clientGallery.findFirst({where:{id:galleryId,client_id:client.id,is_active:true,terms_source:'SHOP_UPLOAD'}});if(!gallery)throw new ShopUploadError('Galeria jest niedostępna.',404);return gallery;}
function occupied(records:ShopUploadRecord[],now:number,exclude?:string){const active=records.filter(r=>r.uploadId!==exclude&&(r.state==='complete'||r.state==='processing'||r.state==='pending'&&r.expiresAt>now));return {count:active.length,bytes:active.reduce((sum,r)=>sum+(r.state==='complete'?r.storedBytes??r.size:r.size),0)};}
export async function beginShopUpload(client:UploadClient,input:unknown){
 await requirePersonalizationEnabled();requirePrivateShopStorage();const parsed=requestSchema.safeParse(input);if(!parsed.success)throw new ShopUploadError('Wybierz JPEG lub PNG do 20 MB. Plik HEIC zapisz najpierw jako JPEG.');
 const data=parsed.data,gallery=await ownedGallery(client),now=Date.now(),uploadId=randomUUID();
 const record:ShopUploadRecord={version:1,clientId:client.id,galleryId:gallery.id,uploadId,state:'pending',size:data.size,contentType:data.contentType,sha256:data.sha256.toLowerCase(),createdAt:now,expiresAt:now+10*60*1000,stageKey:`shop-personalization/staging/${client.id}/${uploadId}`};
 await prisma.$transaction(async tx=>{await acquireAdvisoryTransactionLock(tx,`shop-personalization-${client.id}`);const rows=await tx.setting.findMany({where:{setting_key:{startsWith:prefix(client.id)}}});const records=rows.map(row=>parseRecord(row.setting_value));const used=occupied(records,now);if(used.count>=shopUploadLimits.photos||used.bytes+data.size>shopUploadLimits.totalBytes)throw new ShopUploadError('Limit własnych zdjęć wynosi 100 plików i 50 MB.',413);if(records.filter(r=>r.createdAt>now-24*3600*1000).length>=200)throw new ShopUploadError('Dzienny limit prób przesyłania został wykorzystany.',429);await tx.setting.create({data:{setting_key:uploadKey(client.id,uploadId),setting_value:JSON.stringify(record)}});});
 try{const signed=await createPrivateShopUploadUrl(record.stageKey,record.contentType,record.size,record.sha256);return{uploadId,method:'PUT' as const,...signed,expiresAt:new Date(record.expiresAt).toISOString()};}catch{await prisma.setting.updateMany({where:{setting_key:uploadKey(client.id,uploadId),setting_value:JSON.stringify(record)},data:{setting_value:JSON.stringify({...record,state:'failed'})}});throw new ShopUploadError('Nie udało się przygotować przesyłania zdjęcia.',503);}
}
export async function normalizeShopImage(bytes:Buffer,mime:'image/jpeg'|'image/png',expectedSha256:string){
 if(bytes.length>shopUploadLimits.fileBytes||!hasExpectedMagicBytes(bytes,mime))throw new ShopUploadError('Zawartość pliku nie odpowiada JPEG/PNG albo plik przekracza 20 MB.');
 if(createHash('sha256').update(bytes).digest('hex')!==expectedSha256)throw new ShopUploadError('Suma kontrolna zdjęcia nie zgadza się. Prześlij plik ponownie.');
 try{
  const image=sharp(bytes,{limitInputPixels:shopUploadLimits.maxPixels,failOn:'warning',animated:false}),meta=await image.metadata();
  if(!['jpeg','png'].includes(meta.format||'')||(meta.pages||1)!==1)throw new ShopUploadError('Wybierz pojedyncze zdjęcie JPEG lub PNG.');
  const width=meta.autoOrient?.width||meta.width||0,height=meta.autoOrient?.height||meta.height||0;
  if(width<shopUploadLimits.minDimension||height<shopUploadLimits.minDimension||width*height>shopUploadLimits.maxPixels)throw new ShopUploadError('Zdjęcie ma nieprawidłową rozdzielczość (minimum 100×100, maksimum 60 megapikseli).');
  // Default sharp output drops EXIF/XMP/IPTC; rotate normalizes orientation before the proof is shown.
  const hq=await image.rotate().flatten({background:'#ffffff'}).toColourspace('srgb').jpeg({quality:95,chromaSubsampling:'4:4:4'}).toBuffer();
  if(hq.length>shopUploadLimits.fileBytes)throw new ShopUploadError('Przygotowane zdjęcie przekracza 20 MB. Zmniejsz plik.');
  const thumbnail=await sharp(hq).resize(640,640,{fit:'inside',withoutEnlargement:true}).jpeg({quality:82}).toBuffer();
  return {hq,thumbnail,width,height,sha256:createHash('sha256').update(hq).digest('hex')};
 }catch(e){if(e instanceof ShopUploadError)throw e;throw new ShopUploadError('Nie można odczytać obrazu. Wybierz poprawny plik JPEG lub PNG.');}
}
export async function completeShopUpload(client:UploadClient,uploadId:unknown){
 await requirePersonalizationEnabled();requirePrivateShopStorage();validId(uploadId);const gallery=await ownedGallery(client),key=uploadKey(client.id,uploadId);
 const row=await prisma.setting.findUnique({where:{setting_key:key}});if(!row)throw new ShopUploadError('Nie znaleziono przesłanego zdjęcia.',404);
 const record=parseRecord(row.setting_value);if(record.clientId!==client.id||record.galleryId!==gallery.id)throw new ShopUploadError('Nie znaleziono przesłanego zdjęcia.',404);
 if(record.state==='complete'){const photo=await prisma.galleryPhoto.findFirst({where:{id:record.photoId,gallery_id:gallery.id},select:{id:true,width:true,height:true}});if(!photo)throw new ShopUploadError('Zdjęcie zostało usunięte.',410);return {photo:publicUploadPhoto(photo),galleryId:gallery.id,accessCode:gallery.access_code};}
 if(record.expiresAt<Date.now()||record.state==='failed')throw new ShopUploadError('Przesyłanie wygasło. Wybierz zdjęcie ponownie.',409);
 if(record.state==='processing'&&Date.now()-(record.claimedAt||0)<5*60*1000)throw new ShopUploadError('Zdjęcie jest już przetwarzane. Odczekaj chwilę.',409);
 const claimed:ShopUploadRecord={...record,state:'processing',claim:randomUUID(),claimedAt:Date.now()};const claimedRaw=JSON.stringify(claimed);
 const claim=await prisma.setting.updateMany({where:{setting_key:key,setting_value:row.setting_value},data:{setting_value:claimedRaw}});if(claim.count!==1)throw new ShopUploadError('Zdjęcie jest już przetwarzane. Odśwież widok.',409);
 const base=`shop-personalization/${client.id}/final/${uploadId}`,hqKey=`${base}.jpg`,thumbnailKey=`${base}-thumb.jpg`;
 try{
  const head=await headPrivateShopUpload(record.stageKey);if(head.size!==record.size||head.size>shopUploadLimits.fileBytes||head.contentType!==record.contentType)throw new ShopUploadError('Rozmiar lub typ przesłanego pliku nie zgadza się.');
  const object=await getPrivateS3Object(record.stageKey);const chunks:Uint8Array[]=[];let size=0;for await(const chunk of object.body as AsyncIterable<Uint8Array>){size+=chunk.byteLength;if(size>record.size||size>shopUploadLimits.fileBytes)throw new ShopUploadError('Przesłany plik przekracza dozwolony rozmiar.');chunks.push(chunk);}if(size!==record.size)throw new ShopUploadError('Plik jest niekompletny.');
  const image=await normalizeShopImage(Buffer.concat(chunks),record.contentType,record.sha256);const storedBytes=image.hq.length+image.thumbnail.length;
  await uploadToS3(image.hq,hqKey,'image/jpeg',{access:'private'});await uploadToS3(image.thumbnail,thumbnailKey,'image/jpeg',{access:'private'});
  const photo=await prisma.$transaction(async tx=>{
   await acquireAdvisoryTransactionLock(tx,`shop-personalization-${client.id}`);
   const current=await tx.setting.findUnique({where:{setting_key:key}});if(current?.setting_value!==claimedRaw)throw new ShopUploadError('Stan pliku zmienił się. Odśwież widok.',409);
   const rows=await tx.setting.findMany({where:{setting_key:{startsWith:prefix(client.id)}}});const used=occupied(rows.map(r=>parseRecord(r.setting_value)),Date.now(),uploadId);
   if(used.count>=shopUploadLimits.photos||used.bytes+storedBytes>shopUploadLimits.totalBytes)throw new ShopUploadError('Brak miejsca w limicie 50 MB własnych zdjęć.',413);
   const active=await tx.clientGallery.findFirst({where:{id:gallery.id,client_id:client.id,is_active:true,terms_source:'SHOP_UPLOAD'}});if(!active)throw new ShopUploadError('Galeria jest niedostępna.',404);
   const bucket=process.env.S3_BUCKET||'wlasniewski-photo-storage',region=process.env.S3_REGION||'eu-north-1';
   const created=await tx.galleryPhoto.create({data:{gallery_id:gallery.id,file_url:'',thumbnail_url:null,download_source_url:`https://${bucket}.s3.${region}.amazonaws.com/${hqKey}`,file_size:image.hq.length,width:image.width,height:image.height,download_source_width:image.width,download_source_height:image.height,is_standard:true}});
   const photoUrl=`/api/shop/personalization/photos/${created.id}`;
   const updated=await tx.galleryPhoto.update({where:{id:created.id},data:{file_url:photoUrl,thumbnail_url:photoUrl,thumbnail_source_url:photoUrl}});
   const completed:ShopUploadRecord={...claimed,state:'complete',photoId:created.id,storedBytes,hqKey,thumbnailKey,normalizedSha256:image.sha256};
   await tx.setting.update({where:{setting_key:key},data:{setting_value:JSON.stringify(completed)}});await tx.setting.create({data:{setting_key:photoKey(created.id),setting_value:JSON.stringify({version:1,clientId:client.id,galleryId:gallery.id,uploadId,hqKey,thumbnailKey})}});return updated;
  });
  await deleteFromS3(record.stageKey).catch(()=>{});return {photo:publicUploadPhoto(photo),galleryId:gallery.id,accessCode:gallery.access_code};
 }catch(error){const failed=await prisma.setting.updateMany({where:{setting_key:key,setting_value:claimedRaw},data:{setting_value:JSON.stringify({...claimed,state:'failed'})}});if(failed.count===1)await Promise.allSettled([deleteFromS3(record.stageKey),deleteFromS3(hqKey),deleteFromS3(thumbnailKey)]);if(error instanceof ShopUploadError)throw error;throw new ShopUploadError('Nie udało się przygotować zdjęcia. Wybierz plik ponownie.',502);}
}
export async function readPersonalizationPhoto(client:UploadClient,id:number){
 if(!Number.isSafeInteger(id)||id<1)throw new ShopUploadError('Nie znaleziono zdjęcia.',404);
 const photo=await prisma.galleryPhoto.findFirst({where:{id,gallery:{client_id:client.id,is_active:true,terms_source:'SHOP_UPLOAD'}},select:{gallery_id:true}});if(!photo)throw new ShopUploadError('Nie znaleziono zdjęcia.',404);
 const marker=await prisma.setting.findUnique({where:{setting_key:photoKey(id)}});let parsed;try{parsed=JSON.parse(marker?.setting_value||'');}catch{throw new ShopUploadError('Nie znaleziono zdjęcia.',404);}
 validId(parsed.uploadId);
 if(parsed.version!==1||parsed.clientId!==client.id||parsed.galleryId!==photo.gallery_id||parsed.thumbnailKey!==`shop-personalization/${client.id}/final/${parsed.uploadId}-thumb.jpg`)throw new ShopUploadError('Nie znaleziono zdjęcia.',404);
 return getPrivateS3Object(parsed.thumbnailKey);
}
