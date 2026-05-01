import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

/**
 * GET /api/foto-match/waitlist/confirm?t=<token>
 *
 * Potwierdza zapis na waitlist Foto-Match (link z double opt-in maila).
 * Idempotent: kolejne kliknięcia na ten sam token zwracają 200 + status='already'.
 */
export async function GET(request: NextRequest) {
    const token = request.nextUrl.searchParams.get('t');
    if (!token || token.length < 32) {
        return NextResponse.json(
            { success: false, error: 'INVALID_TOKEN', message: 'Brak lub błędny token potwierdzający.' },
            { status: 400 },
        );
    }

    const record = await prisma.fotoMatchWaitlist.findUnique({
        where: { confirm_token: token },
    }).catch(() => null);

    if (!record) {
        return NextResponse.json(
            { success: false, error: 'TOKEN_NOT_FOUND', message: 'Link nieprawidłowy lub już wykorzystany.' },
            { status: 404 },
        );
    }

    if (record.confirmed_at) {
        return NextResponse.json({ success: true, status: 'already', email: record.email });
    }

    if (record.confirm_token_expires && new Date() > record.confirm_token_expires) {
        return NextResponse.json(
            { success: false, error: 'TOKEN_EXPIRED', message: 'Link wygasł — zapisz się ponownie.' },
            { status: 410 },
        );
    }

    await prisma.fotoMatchWaitlist.update({
        where: { id: record.id },
        data: {
            confirmed_at: new Date(),
            // Token jednorazowy — kasujemy po użyciu.
            confirm_token: null,
            confirm_token_expires: null,
        },
    });

    return NextResponse.json({ success: true, status: 'confirmed', email: record.email });
}
