export function safeReturnTo(value: unknown, fallback = '/konto'): string {
    const candidate = String(value ?? '').trim();
    if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('\\')) {
        return fallback;
    }
    const allowed = [
        /^\/konto(?:[/?#].*)?$/,
        /^\/strefa-klienta\/oferty\/\d+(?:[/?#].*)?$/,
        /^\/strefa-klienta\/umowy\/\d+(?:[/?#].*)?$/,
        /^\/strefa-klienta\/galerie(?:[/?#].*)?$/,
    ];
    return allowed.some(pattern => pattern.test(candidate)) ? candidate : fallback;
}
