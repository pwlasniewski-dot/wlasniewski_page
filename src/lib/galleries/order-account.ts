import { verifyClientReadToken } from '@/lib/auth/client-preview';
import type { NextRequest } from 'next/server';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { revalidateActiveClient } from '@/lib/auth/active-client';
import type { ShopMetadata } from './merchandise';

export async function orderClient(request: NextRequest, allowPreview = false) {
  const token = extractToken(request.headers.get('authorization')) || request.cookies.get('client_token')?.value || request.cookies.get('user_token')?.value;
  const decoded = token ? await (allowPreview ? verifyClientReadToken(token, request) : verifyToken(token)) : null;
  return decoded ? revalidateActiveClient(decoded) : null;
}
// The account identity saved at checkout is authoritative. Legacy orders require
// both gallery ownership (checked by the query) and matching recipient email.
export function ownsAccountOrder(metadata: ShopMetadata, client: {id:number;email:string}) {
  return metadata.customerId !== undefined ? metadata.customerId === client.id : metadata.delivery.email.trim().toLowerCase() === client.email.trim().toLowerCase();
}
