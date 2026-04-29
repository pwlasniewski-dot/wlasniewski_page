/**
 * Bezpieczny helper do wyznaczania publicznego URL strony.
 * NIGDY nie zwraca http://localhost:3000 jeżeli NODE_ENV=production.
 *
 * Kolejność źródeł:
 *   1. NEXT_PUBLIC_BASE_URL  (kanoniczne — używane przez resztę projektu)
 *   2. NEXT_PUBLIC_APP_URL   (legacy fallback)
 *   3. NEXT_PUBLIC_SITE_URL  (przyszły alias)
 *   4. URL                    (Netlify auto-set)
 *   5. https://wlasniewski.pl (twardy fallback prod)
 *   6. http://localhost:3000  (TYLKO gdy NODE_ENV !== 'production')
 *
 * Używaj WSZĘDZIE gdzie generujesz linki w mailach / SMS / pdf.
 */
export function getSiteUrl(): string {
    const candidates = [
        process.env.NEXT_PUBLIC_BASE_URL,
        process.env.NEXT_PUBLIC_APP_URL,
        process.env.NEXT_PUBLIC_SITE_URL,
        process.env.URL,
    ].map((v) => (v || '').trim()).filter(Boolean);

    for (const c of candidates) {
        // Nigdy localhost na produkcji
        if (process.env.NODE_ENV === 'production' && /localhost|127\.0\.0\.1/i.test(c)) continue;
        return c.replace(/\/$/, '');
    }

    if (process.env.NODE_ENV === 'production') return 'https://wlasniewski.pl';
    return 'http://localhost:3000';
}
