/**
 * Magic-link tokens dla Foto Wyzwania.
 *
 * Po co:
 *   - klient nie ma hasła (ChallengeUser.password_hash bywa null)
 *   - chcemy 1-kliknięcie z maila → panel /foto-wyzwanie/panel zalogowany
 *
 * Bezpieczeństwo:
 *   - token podpisany JWT (HS256, JWT_SECRET)
 *   - waży w sobie userId, email, scope='challenge_magic'
 *   - krótki TTL (default 14 dni — wystarcza między „zdjęcia gotowe" a kliknięciem)
 *   - jednokrotnie konsumowany NIE jest (klient może kliknąć kilka razy) — ale podmiana JWT_SECRET unieważnia wszystkie
 */
import { SignJWT, jwtVerify } from 'jose';

const SCOPE = 'challenge_magic';

function secret(): Uint8Array {
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET missing');
    return new TextEncoder().encode(process.env.JWT_SECRET);
}

export async function createMagicLinkToken(opts: {
    userId: number;
    email: string;
    challengeId?: number;
    ttl?: string;
}): Promise<string> {
    return new SignJWT({
        userId: opts.userId,
        email: opts.email,
        challengeId: opts.challengeId,
        scope: SCOPE,
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(opts.ttl || '14d')
        .sign(secret());
}

export interface MagicLinkPayload {
    userId: number;
    email: string;
    challengeId?: number;
    scope: string;
    iat: number;
    exp: number;
}

export async function verifyMagicLinkToken(token: string): Promise<MagicLinkPayload | null> {
    try {
        const { payload } = await jwtVerify(token, secret());
        if ((payload as any).scope !== SCOPE) return null;
        return payload as unknown as MagicLinkPayload;
    } catch {
        return null;
    }
}
