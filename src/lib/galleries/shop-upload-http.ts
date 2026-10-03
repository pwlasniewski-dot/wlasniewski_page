import {NextRequest,NextResponse} from 'next/server';
import {orderClient} from '@/lib/galleries/order-account';
import {isTrustedAdminOrigin} from '@/lib/auth/admin-origin';
import {rateLimit} from '@/lib/rate-limit';
import {boundedJson,SandboxError} from '@/lib/fulfillment/prodigi-sandbox';
import {ShopUploadError,type UploadClient} from './shop-uploads';
export const uploadHeaders={'Cache-Control':'private, no-store','Vary':'Cookie, Authorization','X-Content-Type-Options':'nosniff'};
export async function withShopUpload(request:NextRequest,action:(client:UploadClient)=>Promise<NextResponse>){try{
 const client=await orderClient(request);if(!client)return NextResponse.json({success:false,error:'Zaloguj się na aktywne konto klienta.'},{status:401,headers:uploadHeaders});
 if(request.method!=='GET'&&!isTrustedAdminOrigin(request))return NextResponse.json({success:false,error:'Nieprawidłowe pochodzenie żądania.'},{status:403,headers:uploadHeaders});
 if(!rateLimit(`shop-personalization:${client.id}:${request.method}`,request.method==='GET'?120:30,60000).ok)return NextResponse.json({success:false,error:'Za dużo prób. Odczekaj minutę.'},{status:429,headers:uploadHeaders});
 return await action(client);
 }catch(error){const known=error instanceof ShopUploadError||error instanceof SandboxError;return NextResponse.json({success:false,error:known?error.message:'Nie udało się obsłużyć zdjęcia. Spróbuj ponownie.'},{status:known?error.status:500,headers:uploadHeaders});}}
export async function uploadJson(request:NextRequest){if(request.headers.get('content-type')?.split(';')[0].trim()!=='application/json')throw new ShopUploadError('Wymagane dane JSON.',415);return boundedJson(request.body,8192);}
