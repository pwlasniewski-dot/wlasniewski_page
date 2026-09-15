import {NextRequest,NextResponse} from 'next/server';
import {withAuth} from '@/lib/auth/middleware';
import prisma from '@/lib/db/prisma';
import {loadGalleryShop,shopSettingKey,shopError} from '@/lib/galleries/merchandise-server';
import {validateShopConfig,readShopMetadata,ShopValidationError} from '@/lib/galleries/merchandise';
import {productsReadyToPublish} from '@/lib/galleries/shop-publication';
import {isShopQa} from '@/lib/shop-qa';
import {productEditSnapshot,validateProductEdit} from '@/lib/galleries/product-edit';
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}) {return withAuth(request,async()=>{try {
 const raw=(await params).id;const id=raw==='default'?null:Number(raw);
 if(id !== null && (!Number.isSafeInteger(id) || id<1 || !await prisma.clientGallery.findUnique({where:{id},select:{id:true}}))) throw new ShopValidationError('Nie znaleziono galerii.',404);
 const [shop,orders,nphotoAlbums]=await Promise.all([loadGalleryShop(id),id===null?Promise.resolve([]):prisma.photoOrder.findMany({where:{gallery_id:id},orderBy:{created_at:'desc'}}),prisma.nphotoAlbum.findMany({where:{is_active:true},select:{id:true,title:true,format:true,cover_image_url:true},orderBy:{title:'asc'}})]);
 const preview=process.env.CONTEXT==='deploy-preview' || [request.nextUrl.hostname,request.headers.get('x-forwarded-host'),request.headers.get('host')].some(host=>/^deploy-preview-\d+--.*\.netlify\.app$/.test((host||'').split(',')[0].trim().split(':')[0]));
 return NextResponse.json({success:true,...shop,preview,isolatedReview:isShopQa(),orders:orders.flatMap(o=>{const metadata=readShopMetadata(o.product_ids);return metadata?[{id:o.id,participant_id:o.participant_id,created_at:o.created_at,payment_status:o.payment_status,total_amount:o.total_amount,metadata}]:[];}),nphotoAlbums},{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){return shopError(e);}});}
export async function PUT(request:NextRequest,{params}:{params:Promise<{id:string}>}) {return withAuth(request,async()=>{try {
 const raw=(await params).id;const id=raw==='default'?null:Number(raw);if(id !== null && (!Number.isSafeInteger(id)||id<1||!await prisma.clientGallery.findUnique({where:{id},select:{id:true}}))) throw new ShopValidationError('Nie znaleziono galerii.',404);
 const body=await request.json().catch(()=>null);
 if(!body || typeof body!=='object' || Array.isArray(body)) throw new ShopValidationError('Nieprawidłowe dane zapisu.');
 const config=body.config===undefined ? null : validateShopConfig(body.config);
 const edits=body.productEdits ?? [];
 if(!Array.isArray(edits) || edits.length>100) throw new ShopValidationError('Zapisz maksymalnie 100 produktów jednocześnie.');
 const changes=edits.map((edit: {id?:unknown;data?:unknown;expected?:unknown})=>{
  if(!edit || !Number.isSafeInteger(edit.id) || Number(edit.id)<1 || !edit.expected || typeof edit.expected!=='object' || Array.isArray(edit.expected)) throw new ShopValidationError('Nieprawidłowe dane zmiany produktu.');
  return {id:Number(edit.id),data:validateProductEdit(edit.data),expected:productEditSnapshot(edit.expected)};
 });
 if(new Set(changes.map(change=>change.id)).size!==changes.length) throw new ShopValidationError('Produkt występuje w zapisie więcej niż raz.');
 if(!config && !changes.length) throw new ShopValidationError('Brak zmian do zapisania.');
 if(body.publishSelected===true && (id!==null || !config?.publicOffer)) throw new ShopValidationError('Publikuj produkty ze wspólnej oferty.');
 let activatedProducts=0;
 const products: Array<{id:number} & ReturnType<typeof validateProductEdit>>=[];
 const settingData=config ? {where:{setting_key:shopSettingKey(id)},create:{setting_key:shopSettingKey(id),setting_value:JSON.stringify(config)},update:{setting_value:JSON.stringify(config)}} : null;
 if(changes.length || body.publishSelected===true) {
  await prisma.$transaction(async tx=>{
   // Check every product's scope and original state before writing any changes.
   if(changes.length) {
    const existing=await tx.galleryProduct.findMany({where:{gallery_id:id,id:{in:changes.map(change=>change.id)}}});
    for(const change of changes) {
     const product=existing.find(product=>product.id===change.id);
     if(!product || product.archived_at) throw new ShopValidationError('Produkt nie należy do tej galerii.',404);
     if(JSON.stringify(productEditSnapshot(product))!==JSON.stringify(change.expected)) throw new ShopValidationError(`Produkt #${change.id} został zmieniony w innym oknie. Odśwież ofertę przed ponownym zapisem.`,409);
    }
    for(const change of changes) { await tx.galleryProduct.update({where:{id:change.id,gallery_id:id},data:change.data}); products.push({id:change.id,...change.data}); }
   }
   if(body.publishSelected===true && config?.publicOffer) {
    const selected=await tx.galleryProduct.findMany({where:{gallery_id:null,id:{in:config.publicOffer.productIds}}});
    const ready=productsReadyToPublish(config,selected);
    if(!ready.length) throw new ShopValidationError('Wybrane produkty wymagają ceny, opisu, zdjęcia i dostępnej dostawy.');
    const result=await tx.galleryProduct.updateMany({where:{id:{in:ready.map(p=>p.id)},gallery_id:null,is_active:false},data:{is_active:true}});
    activatedProducts=result.count;config.enabled=true;config.publicOffer.enabled=true;
    validateShopConfig(config);
   }
   if(config) await tx.setting.upsert({where:{setting_key:shopSettingKey(id)},create:{setting_key:shopSettingKey(id),setting_value:JSON.stringify(config)},update:{setting_value:JSON.stringify(config)}});
  },{isolationLevel:'Serializable'});
 } else if(settingData) await prisma.setting.upsert(settingData);
 return NextResponse.json({success:true,config,products,activatedProducts});
 }catch(e){return shopError(e);}});}

export async function DELETE(request:NextRequest,{params}:{params:Promise<{id:string}>}) {return withAuth(request,async()=>{try {
 const id=Number((await params).id);
 if(!Number.isSafeInteger(id)||id<1||!await prisma.clientGallery.findUnique({where:{id},select:{id:true}})) throw new ShopValidationError('Nie znaleziono galerii.',404);
 // Only remove the reversible override; products, orders and the shared offer remain intact.
 await prisma.setting.deleteMany({where:{setting_key:shopSettingKey(id)}});
 return NextResponse.json({success:true,...await loadGalleryShop(id)});
 }catch(e){return shopError(e);}});}
