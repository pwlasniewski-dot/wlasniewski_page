import {NextRequest,NextResponse} from 'next/server';
import {withAuth} from '@/lib/auth/middleware';
import prisma from '@/lib/db/prisma';
import {loadGalleryShop,shopSettingKey,shopError} from '@/lib/galleries/merchandise-server';
import {validateShopConfig,readShopMetadata,ShopValidationError} from '@/lib/galleries/merchandise';
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}) {return withAuth(request,async()=>{try {
 const id=Number((await params).id);
 if(!Number.isSafeInteger(id) || id<1 || !await prisma.clientGallery.findUnique({where:{id},select:{id:true}})) throw new ShopValidationError('Nie znaleziono galerii.',404);
 const [shop,orders,nphotoAlbums]=await Promise.all([loadGalleryShop(id),prisma.photoOrder.findMany({where:{gallery_id:id},orderBy:{created_at:'desc'}}),prisma.nphotoAlbum.findMany({where:{is_active:true},select:{id:true,title:true,format:true},orderBy:{title:'asc'}})]);
 return NextResponse.json({success:true,...shop,orders:orders.flatMap(o=>{const metadata=readShopMetadata(o.product_ids);return metadata?[{id:o.id,participant_id:o.participant_id,created_at:o.created_at,payment_status:o.payment_status,total_amount:o.total_amount,metadata}]:[];}),nphotoAlbums},{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){return shopError(e);}});}
export async function PUT(request:NextRequest,{params}:{params:Promise<{id:string}>}) {return withAuth(request,async()=>{try {
 const id=Number((await params).id);if(!Number.isSafeInteger(id)||id<1||!await prisma.clientGallery.findUnique({where:{id},select:{id:true}})) throw new ShopValidationError('Nie znaleziono galerii.',404);
 const body=await request.json().catch(()=>null);const config=validateShopConfig(body?.config);
 await prisma.setting.upsert({where:{setting_key:shopSettingKey(id)},create:{setting_key:shopSettingKey(id),setting_value:JSON.stringify(config)},update:{setting_value:JSON.stringify(config)}});
 return NextResponse.json({success:true,config});
 }catch(e){return shopError(e);}});}
