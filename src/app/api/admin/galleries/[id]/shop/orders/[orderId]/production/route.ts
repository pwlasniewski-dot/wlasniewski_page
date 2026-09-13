import {NextRequest,NextResponse} from 'next/server';
import {PassThrough} from 'node:stream';
import {randomUUID} from 'node:crypto';
import archiver from 'archiver';
import sharp from 'sharp';
import prisma from '@/lib/db/prisma';
import {withAuth} from '@/lib/auth/middleware';
import {readShopMetadata,ShopValidationError} from '@/lib/galleries/merchandise';
import {shopError} from '@/lib/galleries/merchandise-server';
import {getPrivateS3DownloadUrl,uploadStreamToS3,deleteFromS3} from '@/lib/storage/s3';
export const maxDuration=60;

export async function POST(request:NextRequest,{params}:{params:Promise<{id:string;orderId:string}>}) {return withAuth(request,async()=>{try {
 const p=await params; const galleryId=Number(p.id),orderId=Number(p.orderId);
 if(!Number.isSafeInteger(galleryId)||galleryId<1||!Number.isSafeInteger(orderId)||orderId<1)throw new ShopValidationError('Nieprawidłowe zamówienie.');
 const order=await prisma.photoOrder.findFirst({where:{id:orderId,gallery_id:galleryId,payment_status:'paid'}});
 const metadata=readShopMetadata(order?.product_ids);if(!order||!metadata)throw new ShopValidationError('Najpierw potwierdź opłacenie zamówienia.',409);
 const ids=[...new Set(metadata.lines.flatMap(l=>l.kind==='print'?[l.photoId]:l.photoIds))];
 const photos=await prisma.galleryPhoto.findMany({where:{gallery_id:galleryId,id:{in:ids}},select:{id:true,download_source_url:true,file_url:true}});
 if(photos.length!==ids.length)throw new ShopValidationError('Brakuje zdjęć z zamówienia. Uzupełnij galerię przed eksportem.',409);
 if(photos.some(p=>!p.download_source_url))throw new ShopValidationError('Brakuje oryginałów HQ do realizacji. Uzupełnij pliki HQ w galerii przed eksportem.',409);
 const bucket=process.env.S3_BUCKET||'wlasniewski-photo-storage',region=process.env.S3_REGION||'eu-north-1';
 const key=`temp-zips/production/${galleryId}/${orderId}-${randomUUID()}.zip`;
 const archive=archiver('zip',{zlib:{level:0}});const stream=new PassThrough();archive.on('error',e=>stream.destroy(e));archive.pipe(stream);
 const upload=uploadStreamToS3(stream,key,'application/zip',`attachment; filename="zamowienie-${orderId}-produkcja.zip"`);
 // Observe rejection immediately while files are being prepared.
 void upload.catch(()=>archive.abort());
 try {
  archive.append(JSON.stringify({orderId,lines:metadata.lines},null,2),{name:'zamowienie.json'});
  archive.append('ODBITKI: gotowe pliki JPG 300 dpi, pełny kadr z marginesami. Liczba sztuk w nazwie pliku.\nPRODUKTY: wybrane zdjęcia do projektu; specyfikacja i kolejność w zamowienie.json. Album i kalendarz wymagają opracowania projektu przed drukiem.\nTo pakiet produkcyjny, nie potwierdzenie przekazania zamówienia do nPhoto.\n',{name:'CZYTAJ.txt'});
  let bytes=0;
  for(const photo of photos) {
   const raw=new URL(photo.download_source_url!);
   if(raw.protocol!=='https:'||![`${bucket}.s3.${region}.amazonaws.com`,`${bucket}.s3.amazonaws.com`].includes(raw.hostname))throw new ShopValidationError('Plik źródłowy musi pochodzić z magazynu zdjęć galerii.',409);
   const source=await getPrivateS3DownloadUrl(decodeURIComponent(raw.pathname.slice(1)));
   const response=await fetch(source,{signal:AbortSignal.timeout(20000),redirect:'error'});
   if(!response.ok)throw new ShopValidationError('Nie udało się pobrać oryginału zdjęcia '+photo.id+'.',502);
   const chunks:Uint8Array[]=[];let size=0;
   for await(const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {size+=chunk.byteLength;bytes+=chunk.byteLength;if(size>60*1024*1024||bytes>600*1024*1024)throw new ShopValidationError('Pakiet jest zbyt duży dla jednego eksportu.',413);chunks.push(chunk);}
   const input=Buffer.concat(chunks);const image=sharp(input,{limitInputPixels:120000000});
   const info=await image.metadata();
   if(!info.width||!info.height)throw new ShopValidationError('Nieprawidłowy plik zdjęcia '+photo.id+'.');
   for(const [index,line] of metadata.lines.entries()) {
    if(line.kind==='print'&&line.photoId===photo.id&&line.format) {
     if(line.crop.mode!=='fit')throw new ShopValidationError('Ten eksport obsługuje pełny kadr. Sprawdź kadrowanie zamówienia.',409);
     const landscape=(info.orientation&&info.orientation>=5?info.height:info.width)>(info.orientation&&info.orientation>=5?info.width:info.height);
     const short=Math.round(Math.min(line.format.widthMm,line.format.heightMm)/25.4*300),long=Math.round(Math.max(line.format.widthMm,line.format.heightMm)/25.4*300);
     if(long*short>50000000)throw new ShopValidationError('Format przekracza limit eksportu.',413);
     const jpg=await sharp(input).rotate().resize(landscape?long:short,landscape?short:long,{fit:'contain',background:'#fff'}).toColourspace('srgb').withMetadata({density:300}).jpeg({quality:100,chromaSubsampling:'4:4:4'}).toBuffer();
     const format=line.format.label.replace(/[^a-zA-Z0-9×_-]/g,'_');
     archive.append(jpg,{name:`odbitki/${index+1}_${format}_${line.quantity}szt_foto-${photo.id}.jpg`});
    }else if(line.kind==='product'&&line.photoIds.includes(photo.id)) {
     const jpg=await sharp(input).rotate().toColourspace('srgb').jpeg({quality:100,chromaSubsampling:'4:4:4'}).toBuffer();
     archive.append(jpg,{name:`produkty/pozycja-${index+1}/${String(line.photoIds.indexOf(photo.id)+1).padStart(3,'0')}_${photo.id===line.coverPhotoId?'okladka_':''}foto-${photo.id}.jpg`});
    }
   }
  }
  await archive.finalize();const url=await upload;
  return NextResponse.json({success:true,url},{headers:{'Cache-Control':'private, no-store'}});
 }catch(error){archive.abort();stream.destroy();await upload.catch(()=>{});await deleteFromS3(key).catch(()=>{});throw error;}
 }catch(e){return shopError(e);}});}
