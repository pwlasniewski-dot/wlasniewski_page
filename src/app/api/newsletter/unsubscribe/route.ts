import { NextResponse } from 'next/server';

import prisma from '@/lib/db/prisma';
import { withdrawNewsletterConsent } from '@/lib/newsletter';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
    if (!rateLimit(`newsletter-unsubscribe:${getClientIp(request)}`, 10, 15 * 60_000).ok) {
        return NextResponse.json(
            { error: 'Zbyt wiele prób. Spróbuj ponownie później.' },
            { status: 429 },
        );
    }

    const body: unknown = await request.json().catch(() => null);
    const token = body && typeof body === 'object' && 'token' in body
        ? String((body as { token?: unknown }).token || '').trim()
        : '';

    if (!token || token.length > 64) {
        return NextResponse.json({ error: 'Nieprawidłowy link rezygnacji.' }, { status: 400 });
    }

    await withdrawNewsletterConsent(prisma, { token });

    // Odpowiedź jest taka sama dla istniejącego i nieistniejącego tokenu,
    // aby endpoint nie ujawniał listy subskrybentów.
    return NextResponse.json({ success: true });
}
