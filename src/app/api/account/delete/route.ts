/**
 * POST /api/account/delete
 * Soft-delete: anonimizacja email, oznaczenie deleted_at, dezaktywacja profilu Foto-Match.
 * Body: { confirm: true, password: string } — wymaga ponownej autoryzacji hasłem.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';
import { extractToken, verifyToken, verifyPassword } from '@/lib/auth/jwt';
import { logSystem } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({ confirm: z.literal(true), password: z.string().min(1) });

export async function POST(request: NextRequest) {
    const token = extractToken(request.headers.get('authorization'))
        || request.cookies.get('client_token')?.value
        || request.cookies.get('user_token')?.value;
    if (!token) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    const payload = await verifyToken(token).catch(() => null);
    if (!payload?.id) return NextResponse.json({ error: 'INVALID_TOKEN' }, { status: 401 });

    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 }); }
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_FAILED' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 });

    const valid = await verifyPassword(parsed.data.password, user.password_hash);
    if (!valid) return NextResponse.json({ error: 'INVALID_PASSWORD' }, { status: 401 });

    // Sprawdź czy są aktywne rezerwacje
    const activeBookings = await prisma.booking.count({
        where: { email: user.email, status: { in: ['confirmed', 'deposit_paid', 'pending'] }, date: { gte: new Date() } },
    });
    if (activeBookings > 0) {
        return NextResponse.json({
            error: 'ACTIVE_BOOKINGS',
            message: `Nie można usunąć konta — masz ${activeBookings} aktywnych rezerwacji. Anuluj je lub poczekaj na zakończenie.`,
        }, { status: 409 });
    }

    const now = new Date();
    const anonEmail = `deleted_${user.id}_${now.getTime()}@deleted.local`;

    await prisma.$transaction(async (tx) => {
        await tx.user.update({
            where: { id: user.id },
            data: {
                email: anonEmail,
                name: 'Konto usunięte',
                deleted_at: now,
                deletion_requested_at: now,
                is_active: false,
            } as any,
        });
        // Foto-Match profile: ukryj
        await tx.fotoMatchProfile.updateMany({
            where: { user_id: user.id },
            data: { is_active: false, status: 'DELETED', display_name: 'Użytkownik usunięty', bio: null, instagram_handle: null, phone: null } as any,
        });
        // Wymaż dane wrażliwe (id_doc_url, identyfikator dokumentu)
        await tx.fotoMatchProfile.updateMany({
            where: { user_id: user.id },
            data: { id_doc_url: null, id_doc_type: null } as any,
        });
    });

    await logSystem('INFO', 'AUTH', `ACCOUNT_DELETED user #${user.id}`, { anonEmail });

    return NextResponse.json({ ok: true, deleted_at: now.toISOString() });
}
