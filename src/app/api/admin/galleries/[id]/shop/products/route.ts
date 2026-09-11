import {NextRequest,NextResponse} from 'next/server';
import {Prisma} from '@prisma/client';
import {withAuth} from '@/lib/auth/middleware';
import prisma from '@/lib/db/prisma';
import {shopError} from '@/lib/galleries/merchandise-server';
import {ShopValidationError} from '@/lib/galleries/merchandise';
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}) {return withAuth(request,async()=>{try {
 const galleryId=Number((await params).id);const body=await request.json().catch(()=>null);
 if(!Number.isSafeInteger(galleryId)||galleryId<1||!body||!Number.isSafeInteger(body.nphotoAlbumId)||!Number.isSafeInteger(body.price)||body.price<1||body.price>10000000) throw new ShopValidationError('Wybierz produkt i podaj własną cenę.');
 const [gallery,album]=await Promise.all([prisma.clientGallery.findUnique({where:{id:galleryId},select:{id:true}}),prisma.nphotoAlbum.findUnique({where:{id:body.nphotoAlbumId}})]);
 if(!gallery||!album||!album.is_active) throw new ShopValidationError('Galeria lub produkt nie istnieje.',404);
 const product=await prisma.galleryProduct.create({data:{gallery_id:galleryId,title:album.title,description:album.description,price:body.price,image_url:album.cover_image_url,is_active:false,nphoto_product_id:album.nphoto_product_id,nphoto_url:album.nphoto_shop_url,product_type:album.category,preview_images:album.preview_images ?? Prisma.JsonNull,sample_pages:album.sample_pages ?? Prisma.JsonNull}});
 return NextResponse.json({success:true,product},{status:201});
 }catch(e){return shopError(e);}});}
