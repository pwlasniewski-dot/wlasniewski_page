import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { isTrustedAdminOrigin } from '@/lib/auth/admin-origin';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { boundedJson, SandboxError, inspectSandbox } from '@/lib/fulfillment/prodigi-sandbox';
import { importProdigiProduct, prepareProdigiProduct } from '@/lib/fulfillment/prodigi-catalog-import';
import { qualifyProdigiProduct } from '@/lib/fulfillment/prodigi-qualification';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };
export async function POST(request: NextRequest) {
  return withAuth(request, async () => {
    if (!isTrustedAdminOrigin(request)) return NextResponse.json({ error: 'Nieprawidłowe pochodzenie żądania.' }, { status: 403, headers });
    if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return NextResponse.json({ error: 'Wymagany JSON.' }, { status: 415, headers });
    if (!rateLimit(`prodigi-import:${getClientIp(request)}`, 4, 60_000).ok) return NextResponse.json({ error: 'Odczekaj minutę przed kolejnym importem.' }, { status: 429, headers });
    try {
      const body = await boundedJson(request.body, 8192) as { action?: string; input?: unknown };
      if (body?.action === 'qualify') return NextResponse.json({ success: true, ...await qualifyProdigiProduct(prisma, body.input) }, { headers });
      if (body?.action === 'product') return NextResponse.json({ success: true, ...await inspectSandbox(body.input) }, { headers });
      if (body?.action === 'quote') return NextResponse.json({ success: true, ...await prepareProdigiProduct(body.input) }, { headers });
      if (body?.action !== 'import') throw new SandboxError('INVALID_INPUT', 'Nieprawidłowa operacja.', 400);
      return NextResponse.json({ success: true, ...await importProdigiProduct(prisma, body.input) }, { headers });
    }
    catch (error) {
      const conflict = ['P2034', 'P2002'].includes((error as { code?: string })?.code || '');
      const known = error instanceof SandboxError ? error : new SandboxError(conflict ? 'IMPORT_CONFLICT' : 'INTERNAL', conflict ? 'Oferta została równocześnie zmieniona. Odśwież i ponów import.' : 'Nie udało się zapisać produktu.', conflict ? 409 : 500);
      return NextResponse.json({ success: false, code: known.code, error: known.message }, { status: known.status, headers });
    }
  });
}
