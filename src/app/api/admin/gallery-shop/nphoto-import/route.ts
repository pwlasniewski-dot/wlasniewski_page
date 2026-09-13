import {NextRequest, NextResponse} from 'next/server';
import {Prisma} from '@prisma/client';
import prisma from '@/lib/db/prisma';
import {withAuth} from '@/lib/auth/middleware';
import {readShopConfig, ShopValidationError} from '@/lib/galleries/merchandise';
import {shopError, shopSettingKey} from '@/lib/galleries/merchandise-server';
import {nphotoStarters, nphotoPrintSizes} from '@/lib/nphoto/starter-catalog';

export async function POST(request:NextRequest) {return withAuth(request,async()=>{try {
 const body=await request.json().catch(()=>null);
 const starter=nphotoStarters.find(p=>p.key===body?.key);
 if(!starter) throw new ShopValidationError('Wybierz produkt z katalogu.');
 // All insertions are atomic; re-import never overwrites the owner's prices or copy.
 const result=await prisma.$transaction(async tx=>{
  const setting=await tx.setting.findUnique({where:{setting_key:shopSettingKey(null)}});
  const config=readShopConfig(setting?.setting_value);
  if(starter.key==='odbitki') {
   // Inactive drafts have no invented selling price. Validation permits zero only while inactive.
   for(const format of nphotoPrintSizes) if(!config.formats.some(f=>f.id===format.id)) config.formats.push({...format,unitAmount:0,active:false});
   await tx.setting.upsert({where:{setting_key:shopSettingKey(null)},create:{setting_key:shopSettingKey(null),setting_value:JSON.stringify(config)},update:{setting_value:JSON.stringify(config)}});
   return {kind:'prints'};
  }
  const marker=`nphoto_starter_${starter.key}`;
  const imported=await tx.setting.findUnique({where:{setting_key:marker}});
  if(imported) {
   const existing=await tx.galleryProduct.findFirst({where:{id:Number(imported.setting_value),gallery_id:null}});
   if(existing) return {kind:'product',id:existing.id,existing:true};
  }
  const product=await tx.galleryProduct.create({data:{gallery_id:null,title:starter.title,description:starter.description,price:0,is_active:false,image_url:starter.image,nphoto_url:starter.source,product_type:starter.category}});
  config.productRules[String(product.id)]={minPhotos:starter.minPhotos,maxPhotos:starter.maxPhotos};
  await tx.setting.upsert({where:{setting_key:shopSettingKey(null)},create:{setting_key:shopSettingKey(null),setting_value:JSON.stringify(config)},update:{setting_value:JSON.stringify(config)}});
  await tx.setting.upsert({where:{setting_key:marker},create:{setting_key:marker,setting_value:String(product.id)},update:{setting_value:String(product.id)}});
  return {kind:'product',id:product.id};
 },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
 return NextResponse.json({success:true,...result});
 }catch(e){return shopError(e);}});}
