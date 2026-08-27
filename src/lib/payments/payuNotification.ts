import { createHash, timingSafeEqual } from 'node:crypto';

const CANONICAL_NOTIFY_PATH = '/api/payu/notify';

export function verifyPayUNotificationSignature(signatureHeader: string | null, body: string, secondKey: string | null | undefined) {
    if (!signatureHeader || !secondKey) return false;

    const parts = new Map(
        signatureHeader
            .split(';')
            .map(part => part.trim())
            .filter(Boolean)
            .map(part => {
                const separator = part.indexOf('=');
                return separator > 0
                    ? [part.slice(0, separator).trim().toLowerCase(), part.slice(separator + 1).trim()]
                    : ['', ''];
            }),
    );
    const algorithm = String(parts.get('algorithm') || '').toUpperCase();
    const signature = String(parts.get('signature') || '').toLowerCase();
    if (algorithm !== 'MD5' || !/^[a-f0-9]{32}$/.test(signature)) return false;

    const expected = createHash('md5').update(body + secondKey, 'utf8').digest('hex');
    const receivedBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expected, 'hex');
    return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
}

export function resolvePayUNotifyUrl(configuredUrl?: string | null, appUrl?: string | null) {
    const fallbackBase = (() => {
        try {
            return new URL(appUrl || 'https://wlasniewski.pl');
        } catch {
            return new URL('https://wlasniewski.pl');
        }
    })();
    const fallback = new URL(CANONICAL_NOTIFY_PATH, fallbackBase);
    fallback.search = '';
    fallback.hash = '';

    try {
        const configured = new URL(String(configuredUrl || ''));
        if (configured.protocol === 'https:' && configured.pathname.replace(/\/$/, '') === CANONICAL_NOTIFY_PATH) {
            configured.search = '';
            configured.hash = '';
            return configured.toString();
        }
    } catch {
        // Missing or legacy setting: use the application's canonical handler.
    }

    return fallback.toString();
}
