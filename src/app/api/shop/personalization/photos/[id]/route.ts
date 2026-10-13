import {NextRequest,NextResponse} from 'next/server';
import {readPersonalizationPhoto,ShopUploadError} from '@/lib/galleries/shop-uploads';
import {withShopUpload,uploadHeaders} from '@/lib/galleries/shop-upload-http';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){return withShopUpload(request,async client=>{
 const {id}=await params;const object=await readPersonalizationPhoto(client,Number(id));let size=0;const chunks:Uint8Array[]=[];
 for await(const chunk of object.body as AsyncIterable<Uint8Array>){size+=chunk.byteLength;if(size>2*1024*1024)throw new ShopUploadError('Nie można wyświetlić miniatury.',502);chunks.push(chunk);}
 return new NextResponse(new Uint8Array(Buffer.concat(chunks)),{headers:{...uploadHeaders,'Content-Type':'image/jpeg','Content-Length':String(size),'Content-Disposition':'inline'}});
 });}
