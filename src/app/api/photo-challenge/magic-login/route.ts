/**
 * GET /api/photo-challenge/magic-login?token=...
 *
 * Konsumuje magic-link token, w razie potrzeby zapewnia istnienie ChallengeUser
 * (np. zaproszony nigdy się nie rejestrował), wystawia długoterminowy `client_token`
 * (challenge_user JWT) i zwraca JSON do strony pośredniczącej.
 *
 * Zwraca:
 *   200 { success: true, token, user: {id,email,name}, redirectTo }
 *   401 { success: false, error }
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyMagicLinkToken } from '@/lib/photo-challenge/magic-link';
import { createUserToken } from '@/lib/photo-challenge/auth';

export async function GET(request: NextRequest) {
    const token = request.nextUrl.searchParams.get('token');
    if (!token) {
        return NextResponse.json({ success: false, error: 'Brak tokenu' }, { status: 400 });
    }

    const payload = await verifyMagicLinkToken(token);
    if (!payload) {
        return NextResponse.json({ success: false, error: 'Link wygasł lub jest nieprawidłowy' }, { status: 401 });
    }

    // Upewnij się że User istnieje (mógł zostać usunięty)
    let user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
        // Może został odtworzony pod innym id? spróbuj po emailu
        user = await prisma.user.findUnique({ where: { email: payload.email } });
    }
    if (!user) {
        return NextResponse.json({ success: false, error: 'Konto nie istnieje' }, { status: 404 });
    }

    // Aktualizuj last_login
    try {
        await prisma.user.update({
            where: { id: user.id },
            data: { last_login: new Date() },
        });
    } catch {}

    const sessionToken = await createUserToken(user.id, user.email);

    // Decyzja o targecie: jeśli challengeId podany — od razu do panelu (i tak panel pokaże listę)
    const redirectTo = '/foto-wyzwanie/panel';

    return NextResponse.json({
        success: true,
        token: sessionToken,
        user: { id: user.id, email: user.email, name: user.name },
        redirectTo,
    });
}
