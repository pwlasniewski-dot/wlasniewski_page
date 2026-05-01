/**
 * Foto-Match: globalne ustawienia (toggle).
 * Cache 5s — wystarczająco krótki żeby toggling przez admina był odczuwalny w ciągu kilku sekund
 * we wszystkich lambdach (każda ma własny in-memory cache, brak shared store).
 * 5s ≈ 12× mniej zapytań niż no-cache i akceptowalna niespójność.
 */
import prisma from '@/lib/db/prisma';

let cache: { value: boolean; fetchedAt: number } | null = null;
const TTL_MS = 5_000;

export async function isFotoMatchEnabled(): Promise<boolean> {
    if (cache && Date.now() - cache.fetchedAt < TTL_MS) {
        return cache.value;
    }
    const setting = await prisma.setting.findFirst({
        orderBy: { id: 'asc' },
        select: { foto_match_enabled: true },
    });
    const value = !!setting?.foto_match_enabled;
    cache = { value, fetchedAt: Date.now() };
    return value;
}

export function invalidateFotoMatchEnabledCache() {
    cache = null;
}
