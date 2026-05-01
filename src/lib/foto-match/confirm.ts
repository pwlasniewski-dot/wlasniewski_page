// Współdzielona logika potwierdzania tokenu waitlist Foto-Match.
// Używana zarówno przez SSR page /foto-match/zapis-potwierdzony
// (bezpośrednio, bez self-fetch) jak i przez API GET /api/foto-match/waitlist/confirm.

import prisma from '@/lib/db/prisma';

export type ConfirmResult =
    | { ok: true; status: 'confirmed' | 'already'; email: string }
    | { ok: false; error: 'INVALID_TOKEN' | 'TOKEN_NOT_FOUND' | 'TOKEN_EXPIRED' | 'DB_ERROR'; message: string };

export async function confirmWaitlistToken(token: string | null | undefined): Promise<ConfirmResult> {
    if (!token || token.length < 32) {
        return { ok: false, error: 'INVALID_TOKEN', message: 'Brak lub błędny token potwierdzający.' };
    }

    let record;
    try {
        record = await prisma.fotoMatchWaitlist.findUnique({ where: { confirm_token: token } });
    } catch (e) {
        console.error('[foto-match/confirm] DB findUnique error:', e);
        return { ok: false, error: 'DB_ERROR', message: 'Tymczasowy problem z bazą — spróbuj za chwilę.' };
    }

    if (!record) {
        return { ok: false, error: 'TOKEN_NOT_FOUND', message: 'Link nieprawidłowy lub już wykorzystany.' };
    }

    if (record.confirmed_at) {
        return { ok: true, status: 'already', email: record.email };
    }

    if (record.confirm_token_expires && new Date() > record.confirm_token_expires) {
        return { ok: false, error: 'TOKEN_EXPIRED', message: 'Link wygasł — zapisz się ponownie.' };
    }

    try {
        await prisma.fotoMatchWaitlist.update({
            where: { id: record.id },
            data: {
                confirmed_at: new Date(),
                confirm_token: null,
                confirm_token_expires: null,
            },
        });
    } catch (e) {
        console.error('[foto-match/confirm] DB update error:', e);
        return { ok: false, error: 'DB_ERROR', message: 'Nie udało się zapisać potwierdzenia — spróbuj jeszcze raz.' };
    }

    return { ok: true, status: 'confirmed', email: record.email };
}
