import {NextRequest,NextResponse} from 'next/server';
import {orderClient} from '@/lib/galleries/order-account';
import {isTrustedAdminOrigin} from '@/lib/auth/admin-origin';
import {readShopGuest,createShopGuest} from './shop-guest';
import {getClientIp,rateLimit} from '@/lib/rate-limit';
import {boundedJson,SandboxError} from '@/lib/fulfillment/prodigi-sandbox';
import {ShopUploadError,requirePersonalizationEnabled,type UploadClient} from './shop-uploads';
export const uploadHeaders={'Cache-Control':'private, no-store','Vary':'Cookie, Authorization','X-Content-Type-Options':'nosniff'};
export async function withShopUpload(request:NextRequest,action:(client:UploadClient)=>Promise<NextResponse>,allowGuestCreation=false){try{
 if(request.method!=='GET'&&!isTrustedAdminOrigin(request))return NextResponse.json({success:false,error:'Nieprawidłowe pochodzenie żądania.'},{status:403,headers:uploadHeaders});
 let client:UploadClient|null=await readShopGuest(request)||await orderClient(request);
 let created:Awaited<ReturnType<typeof createShopGuest>>|undefined;
 if(!client&&allowGuestCreation&&request.method==='POST'){
  if(!rateLimit(`shop-guest-create:${getClientIp(request)}`,5,3600000).ok)return NextResponse.json({success:false,error:'Za dużo nowych sesji. Spróbuj później.'},{status:429,headers:uploadHeaders});
  await requirePersonalizationEnabled();
  created=await createShopGuest(getClientIp(request));client=created.owner;
 }
 if(!client)return NextResponse.json({success:false,error:'Sesja zdjęć wygasła. Otwórz ponownie dodawanie zdjęcia.'},{status:401,headers:uploadHeaders});
 if(!rateLimit(`shop-personalization:${client.id}:${request.method}`,request.method==='GET'?120:30,60000).ok)return NextResponse.json({success:false,error:'Za dużo prób. Odczekaj minutę.'},{status:429,headers:uploadHeaders});
 const response=await action(client);return created?created.attach(response):response;
 }catch(error){const known=error instanceof ShopUploadError||error instanceof SandboxError;return NextResponse.json({success:false,error:known?error.message:'Nie udało się obsłużyć zdjęcia. Spróbuj ponownie.'},{status:known?error.status:500,headers:uploadHeaders});}}
export async function uploadJson(request:NextRequest){if(request.headers.get('content-type')?.split(';')[0].trim()!=='application/json')throw new ShopUploadError('Wymagane dane JSON.',415);return boundedJson(request.body,8192);}
