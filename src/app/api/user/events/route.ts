import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { revalidateActiveClient } from '@/lib/auth/active-client';
import { consumeAnalyticsRateLimit } from '@/lib/analytics/ingestGuard';
import { PORTAL_EVENT_LIMIT_PER_MINUTE } from '@/lib/client-portal-events';
import { ingestPortalEvent } from '@/lib/client-portal-events-ingest';
import { storePortalClientEvent } from '@/lib/client-portal-events-server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    const status = await ingestPortalEvent(request, {
        authenticate: async () => {
            const token = extractToken(request.headers.get('authorization')) || request.cookies.get('client_token')?.value;
            const decoded = token ? await verifyToken(token) : null;
            const client = decoded ? await revalidateActiveClient(decoded) : null;
            return client?.id ?? null;
        },
        rateLimit: clientId => consumeAnalyticsRateLimit({ signal: `portal-client:${clientId}`, cost: 1, limit: PORTAL_EVENT_LIMIT_PER_MINUTE }),
        store: storePortalClientEvent,
    });
    return new NextResponse(null, { status, headers: { 'Cache-Control': 'no-store' } });
}
