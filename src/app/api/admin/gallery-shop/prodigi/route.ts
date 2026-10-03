import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { isTrustedAdminOrigin } from '@/lib/auth/admin-origin';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { boundedJson, inspectSandbox, sandboxConfigured, SandboxError } from '@/lib/fulfillment/prodigi-sandbox';
import { fetchProdigiFx, estimateProdigiCostInPln } from '@/lib/fulfillment/prodigi-fx';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };
export async function GET(request: NextRequest) {
  return withAuth(request, async () => NextResponse.json({
    configured: sandboxConfigured(), environment: 'sandbox', ordersEnabled: false,
  }, { headers }));
}
export async function POST(request: NextRequest) {
  return withAuth(request, async () => {
    if (!isTrustedAdminOrigin(request)) return NextResponse.json({ error: 'Nieprawidłowe pochodzenie żądania.' }, { status: 403, headers });
    if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return NextResponse.json({ error: 'Wymagany JSON.' }, { status: 415, headers });
    if (!rateLimit(`prodigi-sandbox:${getClientIp(request)}`, 12, 60_000).ok) return NextResponse.json({ error: 'Limit zapytań. Odczekaj minutę.' }, { status: 429, headers });
    try {
      const input = await boundedJson(request.body, 16_384);
      const result = await inspectSandbox(input);
      if (result.action === 'quote') {
        const fx = await fetchProdigiFx(result.currency);
        const plnEstimates = fx.available ? result.quotes.map(quote => Object.fromEntries(
          Object.entries(quote.costSummary).filter(([, cost]) => cost !== undefined).map(([name, cost]) => [name, estimateProdigiCostInPln(cost!, fx)]),
        )) : undefined;
        return NextResponse.json({ success: true, ...result, fx, ...(plnEstimates ? { plnEstimates } : {}) }, { headers });
      }
      return NextResponse.json({ success: true, ...result }, { headers });
    } catch (error) {
      const known = error instanceof SandboxError ? error : new SandboxError('INTERNAL', 'Nie udało się sprawdzić Prodigi.');
      return NextResponse.json({ success: false, code: known.code, error: known.message, ...(known.providerStatus === undefined ? {} : { providerStatus: known.providerStatus }) }, { status: known.status, headers });
    }
  });
}
