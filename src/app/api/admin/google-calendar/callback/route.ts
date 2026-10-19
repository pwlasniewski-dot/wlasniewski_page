import { NextRequest,NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import prisma from '@/lib/db/prisma';
import { AuthenticatedRequest } from '@/lib/auth/middleware';
import { googleAdminGuard } from '@/lib/calendar/google-routes';
import { GOOGLE_REDIRECT, OAUTH_COOKIE, verifyGoogleOAuth, googleTokenRequest, googleRequest, encryptGoogleSecret } from '@/lib/calendar/google-security';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest) {
 const redirect=(result:string)=>{
  const response=NextResponse.redirect(`https://wlasniewski.pl/admin/dashboard?google_calendar=${result}`);
  response.cookies.set(OAUTH_COOKIE,'',{path:'/api/admin/google-calendar',maxAge:0,httpOnly:true,secure:true,sameSite:'lax'});
  response.headers.set('Cache-Control','no-store');response.headers.set('Referrer-Policy','no-referrer');return response;
 };
 let lease:string|null=null;
 try {
  if(await googleAdminGuard(request))return redirect('auth_required');
  const params=request.nextUrl.searchParams;
  const verifier=verifyGoogleOAuth(request.cookies.get(OAUTH_COOKIE)?.value||'',params.get('state')||'',(request as AuthenticatedRequest).user!.id);
  if(params.has('error')||!params.get('code'))return redirect('cancelled');
  lease=randomUUID();
  const claimed=await prisma.googleCalendarIntegration.updateMany({where:{id:1,OR:[{lease_until:null},{lease_until:{lt:new Date()}}]},data:{lease_token:lease,lease_until:new Date(Date.now()+120000)}});
  if(!claimed.count){lease=null;return redirect('busy');}
  const token=await googleTokenRequest({grant_type:'authorization_code',code:params.get('code')!,redirect_uri:GOOGLE_REDIRECT,code_verifier:verifier});
  if(!token.refresh_token||!token.access_token||!String(token.scope||'').split(' ').includes('https://www.googleapis.com/auth/calendar.events.owned'))return redirect('permission_required');
  const user=await googleRequest('https://openidconnect.googleapis.com/v1/userinfo',{headers:{Authorization:`Bearer ${token.access_token}`}});
  if(!user.sub||!user.email||!user.email_verified)return redirect('identity_error');
  await prisma.googleCalendarIntegration.updateMany({where:{id:1,lease_token:lease},data:{connected:true,account_id:String(user.sub),email:String(user.email),refresh_token:encryptGoogleSecret(token.refresh_token),revision:{increment:1},last_error:null,last_sync_at:null,stats:undefined}});
  return redirect('connected');
 }catch{return redirect('connection_error');}
 finally{if(lease)await prisma.googleCalendarIntegration.updateMany({where:{id:1,lease_token:lease},data:{lease_token:null,lease_until:null}}).catch(()=>undefined);}
}
