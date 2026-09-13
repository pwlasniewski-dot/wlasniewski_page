import {NextRequest, NextResponse} from 'next/server';
import {Prisma} from '@prisma/client';
import prisma from '@/lib/db/prisma';
import {withAuth} from '@/lib/auth/middleware';
import {readShopConfig, validateShopConfig, ShopValidationError} from '@/lib/galleries/merchandise';
import {shopError, shopSettingKey} from '@/lib/galleries/merchandise-server';
import {nphotoStarters, nphotoPrintSizes, nphotoLaunchKeys} from '@/lib/nphoto/starter-catalog';

export const runtime = 'nodejs';

/** Earlier imports accepted www and a trailing slash. These identify the same source. */
function sourceAliases(source:string) {
 const path=new URL(source).pathname.replace(/\/+$/, '');
 return [`https://nphoto.com${path}`,`https://nphoto.com${path}/`,`https://www.nphoto.com${path}`,`https://www.nphoto.com${path}/`];
}

export async function POST(request:NextRequest) {
 return withAuth(request,async()=>{
  try {
   const body=await request.json().catch(()=>null);
   const keys:string[]=body?.key==='launch-five'?[...nphotoLaunchKeys]:[body?.key];
   const starters=keys.map(key=>nphotoStarters.find(item=>item.key===key));
   if(starters.some(item=>!item)) throw new ShopValidationError('Wybierz produkt z katalogu.');
   if(body?.mediaRightsConfirmed!==undefined&&typeof body.mediaRightsConfirmed!=='boolean') throw new ShopValidationError('Nieprawidłowe potwierdzenie użycia zdjęć produktowych.');
   const includeMedia=body?.mediaRightsConfirmed===true;
   // No supplier orders, payments, automatic activation, or guessed selling prices.
   const result=await prisma.$transaction(async tx=>{
    const setting=await tx.setting.findUnique({where:{setting_key:shopSettingKey(null)}});
    let config=readShopConfig(null);
    if(setting) {
     try {config=validateShopConfig(JSON.parse(setting.setting_value??''));}
     catch {throw new ShopValidationError('Istniejąca wspólna oferta wymaga sprawdzenia. Import jej nie nadpisze.',409);}
    }
    let configChanged=false;
    const counts={createdProducts:0,existingProducts:0,createdFormats:0,existingFormats:0};
    const items:Array<{key:string;kind:'prints'|'product';id?:number;existing:boolean}>=[];
    for(const entry of starters) {
     const starter=entry!;
     if(starter.printFormatIds) {
      let created=0;
      for(const format of nphotoPrintSizes.filter(format=>starter.printFormatIds!.includes(format.id))) {
       if(config.formats.some(existing=>existing.id===format.id)) {counts.existingFormats++;continue;}
       config.formats.push({...format,unitAmount:0,active:false});
       configChanged=true;created++;counts.createdFormats++;
      }
      items.push({key:starter.key,kind:'prints',existing:created===0});
      continue;
     }
     const marker=`nphoto_starter_${starter.key}`;
     const imported=await tx.setting.findUnique({where:{setting_key:marker}});
     const markerId=Number(imported?.setting_value);
     const marked=Number.isSafeInteger(markerId)&&markerId>0
      ?await tx.galleryProduct.findFirst({where:{id:markerId,gallery_id:null}}):null;
     const existing=marked??await tx.galleryProduct.findFirst({where:{gallery_id:null,nphoto_url:{in:sourceAliases(starter.source)}}});
     if(existing) {
      counts.existingProducts++;
      items.push({key:starter.key,kind:'product',id:existing.id,existing:true});
      continue;
     }
     const product=await tx.galleryProduct.create({data:{
      gallery_id:null,title:starter.title,description:starter.description,price:0,is_active:false,
      image_url:includeMedia?starter.image:null,preview_images:includeMedia?[...(starter.previewImages??[starter.image])]:[],
      nphoto_url:starter.source,product_type:starter.category,
     }});
     config.productRules[String(product.id)]={minPhotos:starter.minPhotos,maxPhotos:starter.maxPhotos,...(starter.deliveryMethods?{deliveryMethods:[...starter.deliveryMethods]}:{})};
     configChanged=true;counts.createdProducts++;
     await tx.setting.upsert({where:{setting_key:marker},create:{setting_key:marker,setting_value:String(product.id)},update:{setting_value:String(product.id)}});
     items.push({key:starter.key,kind:'product',id:product.id,existing:false});
    }
    // A repeated import is read-only: existing config and records remain byte-for-byte intact.
    if(configChanged) {
     validateShopConfig(config);
     await tx.setting.upsert({where:{setting_key:shopSettingKey(null)},create:{setting_key:shopSettingKey(null),setting_value:JSON.stringify(config)},update:{setting_value:JSON.stringify(config)}});
    }
    const first=items[0];
    return {
     kind:body.key==='launch-five'?'batch':first.kind,
     ...(items.length===1?{id:first.id,existing:first.existing}:{}),
     created:counts.createdProducts+counts.createdFormats,
     existingCount:counts.existingProducts+counts.existingFormats,
     counts,items,
    };
   },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
   return NextResponse.json({success:true,...result},{headers:{'Cache-Control':'private, no-store'}});
  } catch(error) {
   if((error as {code?:string})?.code==='P2034') return shopError(new ShopValidationError('Oferta została równocześnie zmieniona. Odśwież panel i ponów import.',409));
   return shopError(error);
  }
 });
}
