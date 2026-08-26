import { createHmac, timingSafeEqual } from 'node:crypto';

export function galleryShareSessionType(
    galleryId: number,
    password: string,
    secret = process.env.JWT_SECRET,
) {
    if (!secret || secret.length < 32) {
        throw new Error('[SECURITY] JWT_SECRET is required for gallery share sessions');
    }
    const fingerprint = createHmac('sha256', secret)
        .update(`gallery-share:v1:${galleryId}:${password}`)
        .digest('base64url')
        .slice(0, 32);
    return `gallery-share:v1:${galleryId}:${fingerprint}`;
}

export function matchesGalleryShareSession(actual: string | undefined, expected: string) {
    if (!actual || actual.length !== expected.length) return false;
    return timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}
