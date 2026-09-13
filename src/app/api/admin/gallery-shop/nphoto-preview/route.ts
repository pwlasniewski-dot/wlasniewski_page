import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { shopError } from '@/lib/galleries/merchandise-server';
import { fetchNphotoOffer, readNphotoRequestBody } from '@/lib/nphoto/offer-import-server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  return withAuth(request, async () => {
    try {
      const body = await readNphotoRequestBody(request) as {url?: unknown} | null;
      const draft = await fetchNphotoOffer(body?.url);
      return NextResponse.json({success:true, draft}, {headers:{'Cache-Control':'private, no-store'}});
    } catch (error) { return shopError(error); }
  });
}
