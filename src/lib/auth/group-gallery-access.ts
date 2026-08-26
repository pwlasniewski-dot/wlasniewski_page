import { SignJWT, jwtVerify } from 'jose';

const AUDIENCE = 'group-gallery-entry';

function secret(): Uint8Array {
    const value = process.env.JWT_SECRET;
    if (!value || value.length < 32) {
        throw new Error('[SECURITY] JWT_SECRET must contain at least 32 characters.');
    }
    return new TextEncoder().encode(value);
}

export async function generateGroupGalleryAccessToken(galleryId: number): Promise<string> {
    return new SignJWT({ gallery_id: galleryId, scope: 'group_gallery_access' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('2h')
        .setAudience(AUDIENCE)
        .sign(secret());
}

export async function verifyGroupGalleryAccessToken(token: string | null, galleryId: number): Promise<boolean> {
    if (!token) return false;
    try {
        const { payload } = await jwtVerify(token, secret(), { audience: AUDIENCE });
        return payload.scope === 'group_gallery_access' && payload.gallery_id === galleryId;
    } catch {
        return false;
    }
}

export function bearerToken(header: string | null): string | null {
    const match = header?.match(/^Bearer\s+([^\s]+)$/i);
    return match?.[1] || null;
}
