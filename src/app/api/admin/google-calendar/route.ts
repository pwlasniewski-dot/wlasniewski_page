import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { googleConfigured } from '@/lib/calendar/google-security';
import { googleAdminGuard, googleRouteError } from '@/lib/calendar/google-routes';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest) {
 const auth=await googleAdminGuard(request);if(auth)return auth;
 try {
  const configured=googleConfigured();
  if(!configured)return NextResponse.json({configured:false,connected:false,email:null,last_sync_at:null,last_error:null,stats:null,pending:false},{headers:{'Cache-Control':'no-store'}});
  const row=await prisma.googleCalendarIntegration.findUnique({where:{id:1},select:{connected:true,email:true,last_sync_at:true,last_error:true,stats:true,revision:true,synced_revision:true}});
  return NextResponse.json({configured,connected:row?.connected||false,email:row?.email||null,last_sync_at:row?.last_sync_at||null,last_error:row?.last_error||null,stats:row?.stats||null,pending:!!row?.connected&&row.revision!==row.synced_revision},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return googleRouteError(e);}
}
