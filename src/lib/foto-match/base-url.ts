/**
 * Foto-Match — kanoniczny URL modułu.
 *
 * MVP: moduł działa jako podstrona wlasniewski.pl (/foto-match).
 * Migracja na osobną domenę (foto-match.pl) wymaga JEDNEJ zmiany ENV
 * w Netlify/Vercel — bez ruszania kodu:
 *
 *   NEXT_PUBLIC_FOTO_MATCH_URL=https://foto-match.pl
 *
 * Wszystkie linki w mailach, canonical, OG, sitemap odwołują się do tego
 * helpera. Domyślnie wraca na getSiteUrl() (czyli wlasniewski.pl).
 */
import { getSiteUrl } from '@/lib/site-url';

export function getFotoMatchBaseUrl(): string {
    const explicit = (process.env.NEXT_PUBLIC_FOTO_MATCH_URL || '').trim();
    if (explicit) {
        // nigdy localhost na produkcji
        if (process.env.NODE_ENV === 'production' && /localhost|127\.0\.0\.1/i.test(explicit)) {
            return getSiteUrl();
        }
        return explicit.replace(/\/$/, '');
    }
    return getSiteUrl();
}

/**
 * Bazowa ścieżka do modułu — zwraca '' jeśli moduł działa na własnej domenie
 * (foto-match.pl), albo '/foto-match' jeśli jest podstroną wlasniewski.pl.
 *
 * Używaj do budowy linków:
 *   const url = `${getFotoMatchBaseUrl()}${getFotoMatchPathPrefix()}/zapis-potwierdzony?t=${token}`;
 */
export function getFotoMatchPathPrefix(): string {
    return process.env.NEXT_PUBLIC_FOTO_MATCH_URL ? '' : '/foto-match';
}
