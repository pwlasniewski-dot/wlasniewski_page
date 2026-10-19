import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/middleware';
import { isTrustedAdminOrigin } from '@/lib/auth/admin-origin';
import { GoogleCalendarError } from './google-security';
export async function googleAdminGuard(request:NextRequest, mutation=false) {
 const error=await requireAdminAuth(request); if(error)return error;
 if(mutation&&!isTrustedAdminOrigin(request))return NextResponse.json({error:'invalid_origin'},{status:403});
 return null;
}
export function googleRouteError(error:unknown) {
 return NextResponse.json({error:error instanceof GoogleCalendarError?error.code:'integration_unavailable'},{status:error instanceof GoogleCalendarError&&error.status===409?409:503,headers:{'Cache-Control':'no-store'}});
}
