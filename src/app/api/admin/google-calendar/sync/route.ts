import { NextRequest,NextResponse } from 'next/server';
import { googleAdminGuard,googleRouteError } from '@/lib/calendar/google-routes';
import { syncGoogleCalendar } from '@/lib/calendar/google-sync';
export const dynamic='force-dynamic';
export async function POST(request:NextRequest) {
 const auth=await googleAdminGuard(request,true);if(auth)return auth;
 try{return NextResponse.json(await syncGoogleCalendar({force:true}),{headers:{'Cache-Control':'no-store'}});}
 catch(e){return googleRouteError(e);}
}
