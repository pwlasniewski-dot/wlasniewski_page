import {NextRequest,NextResponse} from 'next/server';
import prisma from '@/lib/db/prisma';
import {withAuth} from '@/lib/auth/middleware';
import {readShopMetadata} from '@/lib/galleries/merchandise';
import {shopError} from '@/lib/galleries/merchandise-server';
export async function GET(request:NextRequest) {return withAuth(request,async()=>{try {
 const cursor=Number(request.nextUrl.searchParams.get('before'));
 const orders=await prisma.photoOrder.findMany({where:{product_ids:{contains:'"gallery_merchandise"'},...(Number.isSafeInteger(cursor)&&cursor>0?{id:{lt:cursor}}:{})},orderBy:{id:'desc'},take:51});
 const visible=orders.slice(0,50);
 return NextResponse.json({success:true,orders:visible.flatMap(o=>{const metadata=readShopMetadata(o.product_ids);return metadata?[{id:o.id,galleryId:o.gallery_id,createdAt:o.created_at,total:o.total_amount,paymentStatus:o.payment_status,metadata}]:[]}),nextCursor:orders.length>50?visible.at(-1)?.id:null},{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){return shopError(e);}});}
