export const DEFAULT_FLOATING_FACEBOOK = {
    floating_facebook_enabled: true,
    floating_facebook_label: 'Facebook',
    floating_facebook_url: 'https://www.facebook.com/przemyslawwlasniewskiphoto/',
};

export function validFacebookUrl(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    try {
        const url = new URL(value);
        return url.protocol === 'https:' && ['facebook.com', 'www.facebook.com'].includes(url.hostname)
            && !url.username && !url.password && !url.port;
    } catch { return false; }
}

export function readFloatingFacebook(config: unknown) {
    const data = typeof config === 'object' && config !== null ? config as Record<string, unknown> : {};
    return {
        enabled: data.floating_facebook_enabled !== false,
        label: typeof data.floating_facebook_label === 'string' && data.floating_facebook_label.trim()
            ? data.floating_facebook_label.trim().slice(0, 32) : DEFAULT_FLOATING_FACEBOOK.floating_facebook_label,
        url: data.floating_facebook_url === undefined ? DEFAULT_FLOATING_FACEBOOK.floating_facebook_url
            : validFacebookUrl(data.floating_facebook_url) ? data.floating_facebook_url as string : '',
    };
}

export function validFloatingFacebookConfig(data: Record<string, unknown>): boolean {
    return (data.floating_facebook_enabled === undefined || typeof data.floating_facebook_enabled === 'boolean')
        && (data.floating_facebook_label === undefined || (typeof data.floating_facebook_label === 'string' && data.floating_facebook_label.trim().length > 0 && data.floating_facebook_label.length <= 32))
        && (data.floating_facebook_url === undefined || validFacebookUrl(data.floating_facebook_url));
}

export function hideFloatingContact(pathname: string | null): boolean {
    if (!pathname) return true;
    return ['/admin', '/galeria', '/galerie', '/strefa-klienta', '/konto', '/checkout', '/koszyk',
        '/rezerwacja', '/b2b', '/foto-match', '/foto-wyzwanie', '/platnosc', '/zamowienie']
        .some(route => pathname === route || pathname.startsWith(`${route}/`));
}
