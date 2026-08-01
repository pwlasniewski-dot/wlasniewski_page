const PUBLIC_MEDIA_HOST = 'wlasniewski-photo-storage.s3.eu-north-1.amazonaws.com';
const LOCAL_MEDIA_PREFIXES = ['/uploads/', '/api/media/', '/images/'];

/**
 * Shared contract for images returned by MediaPicker: an application-local
 * absolute path or an HTTPS object from the configured S3 bucket.
 */
export function isAllowedPublicMediaUrl(value: unknown): value is string {
    if (typeof value !== 'string') return false;
    const candidate = value.trim();
    if (!candidate || candidate.length > 2048 || /[\u0000-\u001f\u007f\\]/.test(candidate)) return false;

    if (candidate.startsWith('/')) {
        if (candidate.startsWith('//')) return false;
        try {
            const parsed = new URL(candidate, 'https://application.local');
            return parsed.origin === 'https://application.local'
                && LOCAL_MEDIA_PREFIXES.some((prefix) => parsed.pathname.startsWith(prefix))
                && !parsed.pathname.split('/').includes('..');
        } catch {
            return false;
        }
    }

    try {
        const parsed = new URL(candidate);
        return parsed.protocol === 'https:'
            && parsed.hostname === PUBLIC_MEDIA_HOST
            && parsed.pathname.length > 1
            && !parsed.username
            && !parsed.password;
    } catch {
        return false;
    }
}
