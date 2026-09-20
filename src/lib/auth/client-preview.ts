import type { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyToken } from './jwt';

const readPaths = new Set([
 '/api/user/action-summary', '/api/user/me', '/api/user/workshops',
 '/api/galleries/client', '/api/photo-challenge/client/challenges',
 '/api/account/orders', '/api/client/offer-addons', '/api/style-guide/client',
]);
/** Explicit read-only allowlist; mutation handlers and other routes reject preview tokens. */
export async function verifyClientReadToken(token:string, request:NextRequest) {
 const identity = await verifyToken(token, {allowAdminPreview:true});
 if (!identity?.previewAdminId) return identity;
 if (request.method !== 'GET' || !readPaths.has(request.nextUrl.pathname)) return null;
 const admin = await prisma.adminUser.findUnique({where:{id:identity.previewAdminId},select:{role:true}});
 if (admin?.role !== 'ADMIN') return null;
 return identity;
}
