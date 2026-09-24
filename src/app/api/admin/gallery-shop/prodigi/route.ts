import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { boundedJson, inspectSandbox, sandboxConfigured, SandboxError } from '@/lib/fulfillment/prodigi-sandbox';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };
export async function GET(request: NextRequest) {
  return withAuth(request, async () => NextResponse.json({
    configured: sandboxConfigured(), environment: 'sandbox', ordersEnabled: false,
  }, { headers }));
}
export async function POST(request: NextRequest) {
  return withAuth(request, async () => {
    if (request.headers.get('origin') !== request.nextUrl.origin) return NextResponse.json({ error: 'Nieprawidłowe pochodzenie żądania.' }, { status: 403, headers });
    if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return NextResponse.json({ error: 'Wymagany JSON.' }, { status: 415, headers });
    if (!rateLimit(`prodigi-sandbox:${getClientIp(request)}`, 12, 60_000).ok) return NextResponse.json({ error: 'Limit zapytań. Odczekaj minutę.' }, { status: 429, headers });
    try {
      const input = await boundedJson(request.body, 16_384);
      const result = await inspectSandbox(input);
      return NextResponse.json({ success: true, ...result }, { headers });
    } catch (error) {
      const known = error instanceof SandboxError ? error : new SandboxError('INTERNAL', 'Nie udało się sprawdzić Prodigi.');
      return NextResponse.json({ success: false, code: known.code, error: known.message }, { status: known.status, headers });
    }
  });
}
