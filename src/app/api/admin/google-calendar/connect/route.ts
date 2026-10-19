import { NextRequest, NextResponse } from 'next/server';
import { AuthenticatedRequest } from '@/lib/auth/middleware';
import { createGoogleOAuth, googleConfigured, OAUTH_COOKIE } from '@/lib/calendar/google-security';
import { googleAdminGuard,googleRouteError } from '@/lib/calendar/google-routes';
export const dynamic='force-dynamic';
export async function POST(request:NextRequest) {
 const auth=await googleAdminGuard(request,true);if(auth)return auth;
 if(request.headers.get('origin')!=='https://wlasniewski.pl')return NextResponse.json({error:'canonical_site_required'},{status:400});
 if(!googleConfigured())return NextResponse.json({error:'not_configured'},{status:503});
 try {
  const {cookie,url}=createGoogleOAuth((request as AuthenticatedRequest).user!.id);
  const response=NextResponse.json({url},{headers:{'Cache-Control':'no-store'}});
  response.cookies.set(OAUTH_COOKIE,cookie,{httpOnly:true,secure:true,sameSite:'lax',path:'/api/admin/google-calendar',maxAge:600});
  return response;
 }catch(e){return googleRouteError(e);}
}
