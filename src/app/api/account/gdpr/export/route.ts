/**
 * GET /api/account/gdpr/export
 * Eksport wszystkich danych osobowych (RODO art. 20 — prawo do przenoszenia).
 * Zwraca JSON z User + FotoMatchProfile + Photos + Bookings + Swipes + Referrals + Messages.
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { logSystem } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const token = extractToken(request.headers.get('authorization'))
        || request.cookies.get('client_token')?.value
        || request.cookies.get('user_token')?.value;
    if (!token) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    const payload = await verifyToken(token).catch(() => null);
    if (!payload?.id) return NextResponse.json({ error: 'INVALID_TOKEN' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 });

    const profile = await prisma.fotoMatchProfile.findUnique({
        where: { user_id: user.id },
        include: { photos: true },
    });

    const bookings = await prisma.booking.findMany({ where: { email: user.email } });
    const swipes = profile ? await prisma.fotoMatchSwipe.findMany({
        where: { OR: [{ from_profile_id: profile.id }, { to_profile_id: profile.id }] },
    }) : [];
    const messages = profile ? await prisma.fotoMatchMessage.findMany({
        where: { OR: [{ from_profile_id: profile.id }, { to_profile_id: profile.id }] },
    }) : [];
    const referrals = await prisma.fotoMatchReferral.findMany({
        where: { OR: [{ inviter_user_id: user.id }, { invited_user_id: user.id }] },
    }).catch(() => []);

    const data = {
        exported_at: new Date().toISOString(),
        user: {
            id: user.id, email: user.email, name: user.name, role: user.role,
            created_at: user.created_at, last_login: user.last_login,
            terms_accepted_at: (user as any).terms_accepted_at,
            gdpr_consent_at: (user as any).gdpr_consent_at,
            marketing_consent_at: (user as any).marketing_consent_at,
        },
        profile,
        bookings,
        swipes,
        messages,
        referrals,
    };

    await logSystem('INFO', 'AUTH', `GDPR_EXPORT user #${user.id}`);

    return new NextResponse(JSON.stringify(data, null, 2), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="moje-dane-${user.id}-${Date.now()}.json"`,
        },
    });
}
