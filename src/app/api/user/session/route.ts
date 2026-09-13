import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { revalidateActiveClient } from '@/lib/auth/active-client';
import { randomUUID } from 'node:crypto';
import { recordPortalResponse } from '@/lib/client-portal-events-server';
import { clientJson } from '@/lib/client-operations';

export const dynamic = 'force-dynamic';

/** Authentication must not depend on optional vouchers, orders or document queries. */
export async function GET(request: NextRequest) {
    const headers = { 'Cache-Control': 'no-store' };
    const correlationId = randomUUID();
    const startedAt = Date.now();
    let clientId: number | null = null;
    try {
        const token = extractToken(request.headers.get('authorization')) || request.cookies.get('client_token')?.value;
        const decoded = token ? await verifyToken(token) : null;
        if (decoded?.type === 'client' && decoded.role === 'CLIENT') clientId = decoded.id;
        const client = decoded ? await revalidateActiveClient(decoded) : null;
        if (!client) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
        return NextResponse.json({ user: { id: client.id, email: client.email, name: client.name, role: client.role } }, { headers });
    } catch {
        recordPortalResponse({ clientId, module: 'session', correlationId, startedAt, httpStatus: 503 });
        console.warn('[CLIENT_SESSION] validation unavailable');
        const response = clientJson({ error: 'Nie udało się sprawdzić sesji.' }, { status: 503, correlationId });
        response.headers.set('Cache-Control', 'no-store');
        return response;
    }
}
