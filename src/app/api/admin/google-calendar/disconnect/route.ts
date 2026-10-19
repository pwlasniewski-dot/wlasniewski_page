import { NextRequest,NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import prisma from '@/lib/db/prisma';
import { googleAdminGuard,googleRouteError } from '@/lib/calendar/google-routes';
import { decryptGoogleSecret,googleConfigured,GoogleCalendarError,googleRequest } from '@/lib/calendar/google-security';
export const dynamic='force-dynamic';
export async function POST(request:NextRequest) {
 const auth=await googleAdminGuard(request,true);if(auth)return auth;
 const lease=randomUUID();let claimed=false;
 try {
  const result=await prisma.googleCalendarIntegration.updateMany({where:{id:1,OR:[{lease_until:null},{lease_until:{lt:new Date()}}]},data:{lease_token:lease,lease_until:new Date(Date.now()+120000)}});
  if(!result.count)throw new GoogleCalendarError('sync_busy',409);claimed=true;
  const row=await prisma.googleCalendarIntegration.findUnique({where:{id:1}});
  // Disconnect immediately even if Google is unavailable; no events/mappings are removed.
  await prisma.googleCalendarIntegration.updateMany({where:{id:1,lease_token:lease},data:{connected:false,refresh_token:null,last_error:null}});
  let revoked=false;
  if(row?.refresh_token&&googleConfigured())try{
   await googleRequest('https://oauth2.googleapis.com/revoke',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({token:decryptGoogleSecret(row.refresh_token)})});revoked=true;
  }catch{/* Local disconnection still stops all synchronization. */}
  return NextResponse.json({success:true,revoked},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return googleRouteError(e);}
 finally{if(claimed)await prisma.googleCalendarIntegration.updateMany({where:{id:1,lease_token:lease},data:{lease_token:null,lease_until:null}});}
}
