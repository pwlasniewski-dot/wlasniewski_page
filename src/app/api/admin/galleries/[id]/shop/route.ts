import {NextRequest,NextResponse} from 'next/server';
import {withAuth} from '@/lib/auth/middleware';
import prisma from '@/lib/db/prisma';
import {loadGalleryShop,shopSettingKey,shopError} from '@/lib/galleries/merchandise-server';
import {validateShopConfig,readShopMetadata,ShopValidationError} from '@/lib/galleries/merchandise';
import {productsReadyToPublish} from '@/lib/galleries/shop-publication';
import {isShopQa} from '@/lib/shop-qa';
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}) {return withAuth(request,async()=>{try {
 const raw=(await params).id;const id=raw==='default'?null:Number(raw);
 if(id !== null && (!Number.isSafeInteger(id) || id<1 || !await prisma.clientGallery.findUnique({where:{id},select:{id:true}}))) throw new ShopValidationError('Nie znaleziono galerii.',404);
 const [shop,orders,nphotoAlbums]=await Promise.all([loadGalleryShop(id),id===null?Promise.resolve([]):prisma.photoOrder.findMany({where:{gallery_id:id},orderBy:{created_at:'desc'}}),prisma.nphotoAlbum.findMany({where:{is_active:true},select:{id:true,title:true,format:true,cover_image_url:true},orderBy:{title:'asc'}})]);
 const preview=process.env.CONTEXT==='deploy-preview' || [request.nextUrl.hostname,request.headers.get('x-forwarded-host'),request.headers.get('host')].some(host=>/^deploy-preview-\d+--.*\.netlify\.app$/.test((host||'').split(',')[0].trim().split(':')[0]));
 return NextResponse.json({success:true,...shop,preview,isolatedReview:isShopQa(),orders:orders.flatMap(o=>{const metadata=readShopMetadata(o.product_ids);return metadata?[{id:o.id,participant_id:o.participant_id,created_at:o.created_at,payment_status:o.payment_status,total_amount:o.total_amount,metadata}]:[];}),nphotoAlbums},{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){return shopError(e);}});}
export async function PUT(request:NextRequest,{params}:{params:Promise<{id:string}>}) {return withAuth(request,async()=>{try {
 const raw=(await params).id;const id=raw==='default'?null:Number(raw);if(id !== null && (!Number.isSafeInteger(id)||id<1||!await prisma.clientGallery.findUnique({where:{id},select:{id:true}}))) throw new ShopValidationError('Nie znaleziono galerii.',404);
 const body=await request.json().catch(()=>null);const config=validateShopConfig(body?.config);
 let activatedProducts=0;
 const saveConfig=()=>prisma.setting.upsert({where:{setting_key:shopSettingKey(id)},create:{setting_key:shopSettingKey(id),setting_value:JSON.stringify(config)},update:{setting_value:JSON.stringify(config)}});
 if(body.publishSelected===true) {
  await prisma.$transaction(async tx=>{
   if(id!==null || !config.publicOffer) throw new ShopValidationError('Publikuj produkty ze wspólnej oferty.');
   const products=await tx.galleryProduct.findMany({where:{gallery_id:null,id:{in:config.publicOffer.productIds}}});
   const ready=productsReadyToPublish(config,products);
   if(!ready.length) throw new ShopValidationError('Wybrane produkty wymagają ceny, opisu, zdjęcia i dostępnej dostawy.');
   const result=await tx.galleryProduct.updateMany({where:{id:{in:ready.map(p=>p.id)},gallery_id:null,is_active:false},data:{is_active:true}});
   activatedProducts=result.count; config.enabled=true;config.publicOffer.enabled=true;
   validateShopConfig(config);
   await tx.setting.upsert({where:{setting_key:shopSettingKey(id)},create:{setting_key:shopSettingKey(id),setting_value:JSON.stringify(config)},update:{setting_value:JSON.stringify(config)}});
  },{isolationLevel:'Serializable'});
 } else await saveConfig();
 return NextResponse.json({success:true,config,activatedProducts});
 }catch(e){return shopError(e);}});}

export async function DELETE(request:NextRequest,{params}:{params:Promise<{id:string}>}) {return withAuth(request,async()=>{try {
 const id=Number((await params).id);
 if(!Number.isSafeInteger(id)||id<1||!await prisma.clientGallery.findUnique({where:{id},select:{id:true}})) throw new ShopValidationError('Nie znaleziono galerii.',404);
 // Only remove the reversible override; products, orders and the shared offer remain intact.
 await prisma.setting.deleteMany({where:{setting_key:shopSettingKey(id)}});
 return NextResponse.json({success:true,...await loadGalleryShop(id)});
 }catch(e){return shopError(e);}});}
