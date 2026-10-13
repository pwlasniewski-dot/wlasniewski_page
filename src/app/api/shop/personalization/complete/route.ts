import {NextRequest,NextResponse} from 'next/server';
import {completeShopUpload,ShopUploadError} from '@/lib/galleries/shop-uploads';
import {withShopUpload,uploadHeaders,uploadJson} from '@/lib/galleries/shop-upload-http';
export const dynamic='force-dynamic';export const maxDuration=60;
export async function POST(request:NextRequest){return withShopUpload(request,async client=>{const input=await uploadJson(request) as {uploadId?:unknown};if(!input||Object.keys(input).some(key=>key!=='uploadId'))throw new ShopUploadError('Nieprawidłowe dane zakończenia przesyłania.');return NextResponse.json({success:true,...await completeShopUpload(client,input.uploadId)},{headers:uploadHeaders});});}
