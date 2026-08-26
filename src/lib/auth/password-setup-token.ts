import prisma from '@/lib/db/prisma';
import { newPasswordSetupToken } from '@/lib/crm/delivery';

type PasswordTokenState = {
    id: number;
    reset_token: string | null;
    reset_token_expires: Date | null;
};

/** Reuses a still-valid link and issues a replacement with compare-and-swap only
 * after expiry. Concurrent deliveries therefore converge on one token. */
export async function ensurePasswordSetupToken(user: PasswordTokenState, ttlMs = 72 * 60 * 60 * 1000) {
    const now = new Date();
    if (user.reset_token && user.reset_token_expires && user.reset_token_expires > now) return user.reset_token;

    const issued = newPasswordSetupToken(now.getTime());
    issued.expiresAt = new Date(now.getTime() + ttlMs);
    const updated = await prisma.user.updateMany({
        where: {
            id: user.id,
            reset_token: user.reset_token,
            reset_token_expires: user.reset_token_expires,
        },
        data: { reset_token: issued.token, reset_token_expires: issued.expiresAt },
    });
    if (updated.count === 1) return issued.token;

    const winner = await prisma.user.findUnique({
        where: { id: user.id },
        select: { reset_token: true, reset_token_expires: true },
    });
    if (winner?.reset_token && winner.reset_token_expires && winner.reset_token_expires > now) return winner.reset_token;
    throw new Error('Nie udało się bezpiecznie przygotować tokenu ustawienia hasła');
}
