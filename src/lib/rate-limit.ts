/**
 * In-memory rate limiter (per process). Best-effort dla pojedynczego serverless instance.
 * Dla SaaS przeniesc do Upstash Redis.
 */
type Bucket = { count: number; reset: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; remaining: number; resetMs: number } {
    const now = Date.now();
    const b = buckets.get(key);
    if (!b || b.reset < now) {
        buckets.set(key, { count: 1, reset: now + windowMs });
        return { ok: true, remaining: limit - 1, resetMs: windowMs };
    }
    if (b.count >= limit) {
        return { ok: false, remaining: 0, resetMs: b.reset - now };
    }
    b.count++;
    return { ok: true, remaining: limit - b.count, resetMs: b.reset - now };
}

export function getClientIp(req: Request | { headers: Headers }): string {
    const h = (req as any).headers as Headers;
    return (
        h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        h.get('x-real-ip') ||
        h.get('cf-connecting-ip') ||
        'unknown'
    );
}
