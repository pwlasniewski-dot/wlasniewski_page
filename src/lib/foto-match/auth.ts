/**
 * Foto-Match: auth helper.
 * Wyciąga JWT (Authorization Bearer lub cookie `client_token`),
 * weryfikuje, dolicza User i opcjonalnie FotoMatchProfile.
 *
 * Zwraca discriminated union:
 *   { ok: true, user, profile? }   — zalogowany; profile może być null
 *   { ok: false, status, error }   — 401/403
 */
import { NextRequest } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth/jwt';
import prisma from '@/lib/db/prisma';

export type FmAuthOk = {
    ok: true;
    user: {
        id: number;
        email: string;
        name: string | null;
        is_active: boolean;
    };
    profile: Awaited<ReturnType<typeof prisma.fotoMatchProfile.findUnique>> | null;
};
export type FmAuthFail = {
    ok: false;
    status: 401 | 403;
    error: string;
};
export type FmAuthResult = FmAuthOk | FmAuthFail;

export async function getFotoMatchAuth(
    request: NextRequest,
    opts: { requireProfile?: boolean; requireActive?: boolean } = {}
): Promise<FmAuthResult> {
    const token =
        extractToken(request.headers.get('authorization')) ||
        request.cookies.get('client_token')?.value ||
        request.cookies.get('user_token')?.value ||
        null;

    if (!token) {
        return { ok: false, status: 401, error: 'NO_TOKEN' };
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.id) {
        return { ok: false, status: 401, error: 'INVALID_TOKEN' };
    }

    const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, name: true, is_active: true },
    });

    if (!user) {
        return { ok: false, status: 401, error: 'USER_NOT_FOUND' };
    }
    if (!user.is_active) {
        return { ok: false, status: 403, error: 'USER_DISABLED' };
    }

    const profile = await prisma.fotoMatchProfile.findUnique({
        where: { user_id: user.id },
    });

    if (opts.requireProfile && !profile) {
        return { ok: false, status: 403, error: 'NO_FOTO_MATCH_PROFILE' };
    }
    if (opts.requireActive && (!profile || profile.status !== 'ACTIVE' || !profile.is_active)) {
        return { ok: false, status: 403, error: 'PROFILE_NOT_ACTIVE' };
    }

    return { ok: true, user, profile };
}
