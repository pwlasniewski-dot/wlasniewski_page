/**
 * Accept-token dla Foto Wyzwania.
 *
 * Cel: zaproszony (i tylko zaproszony) może zaakceptować wyzwanie.
 * Token wysyłany jest mailem na invitee_contact w momencie utworzenia wyzwania.
 * Bez ważnego tokena endpoint /accept zwraca 401.
 *
 * Bezpieczeństwo:
 *  - JWT HS256 (JWT_SECRET)
 *  - scope='challenge_accept' (nie da się użyć tokena z magic-loginu jako accept token)
 *  - payload: challengeId, inviteeEmail, inviteeUserId
 *  - TTL: 90d (zwykle deadline akceptacji jest krótszy, ale token może żyć dłużej)
 */
import { SignJWT, jwtVerify } from 'jose';

const SCOPE = 'challenge_accept';

function secret(): Uint8Array {
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET missing');
    return new TextEncoder().encode(process.env.JWT_SECRET);
}

export async function createAcceptToken(opts: {
    challengeId: number;
    inviteeEmail: string;
    inviteeUserId: number;
    ttl?: string;
}): Promise<string> {
    return new SignJWT({
        challengeId: opts.challengeId,
        inviteeEmail: opts.inviteeEmail,
        inviteeUserId: opts.inviteeUserId,
        scope: SCOPE,
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(opts.ttl || '90d')
        .sign(secret());
}

export interface AcceptTokenPayload {
    challengeId: number;
    inviteeEmail: string;
    inviteeUserId: number;
    scope: string;
    iat: number;
    exp: number;
}

export async function verifyAcceptToken(token: string): Promise<AcceptTokenPayload | null> {
    try {
        const { payload } = await jwtVerify(token, secret());
        if ((payload as any).scope !== SCOPE) return null;
        return payload as unknown as AcceptTokenPayload;
    } catch {
        return null;
    }
}
