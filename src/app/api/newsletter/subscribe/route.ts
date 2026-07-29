import { NextResponse } from 'next/server';

import prisma from '@/lib/db/prisma';
import { grantNewsletterConsent, normalizeNewsletterEmail } from '@/lib/newsletter';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
    if (!rateLimit(`newsletter-subscribe:${getClientIp(request)}`, 5, 15 * 60_000).ok) {
        return NextResponse.json(
            { error: 'Zbyt wiele prób. Spróbuj ponownie później.' },
            { status: 429 },
        );
    }

    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
        return NextResponse.json({ error: 'Nieprawidłowe dane.' }, { status: 400 });
    }

    const { email: rawEmail, consent, source } = body as {
        email?: unknown;
        consent?: unknown;
        source?: unknown;
    };
    const email = normalizeNewsletterEmail(rawEmail);
    if (!email || consent !== true) {
        return NextResponse.json(
            { error: 'Podaj poprawny e-mail i potwierdź dobrowolną zgodę.' },
            { status: 400 },
        );
    }

    await grantNewsletterConsent(prisma, {
        email,
        source: typeof source === 'string' ? source : 'newsletter-form',
        request,
    });

    return NextResponse.json({ success: true });
}
