/**
 * In-memory rate limiter (per process). Best-effort dla pojedynczego serverless instance.
 * Dla SaaS przeniesc do Upstash Redis.
 */
type Bucket = { count: number; reset: number };
const buckets = new Map<string, Bucket>();

export const FAILED_ATTEMPT_LIMITER_BACKEND = 'memory-fallback' as const;

export interface FailedAttemptLimitResult {
    ok: boolean;
    remaining: number;
    resetMs: number;
    backend: typeof FAILED_ATTEMPT_LIMITER_BACKEND;
}

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

/**
 * Shared failed-attempt limiter contract. `check` never increments, so a valid
 * login cannot consume the budget. This process-local implementation is an
 * explicit serverless memory fallback and can later be replaced behind the
 * same interface by a durable adapter.
 */
export const failedAttemptLimiter = {
    backend: FAILED_ATTEMPT_LIMITER_BACKEND,
    check(key: string, limit: number, windowMs: number): FailedAttemptLimitResult {
        const now = Date.now();
        const bucket = buckets.get(key);
        if (!bucket || bucket.reset < now) {
            return { ok: true, remaining: limit, resetMs: windowMs, backend: FAILED_ATTEMPT_LIMITER_BACKEND };
        }
        return {
            ok: bucket.count < limit,
            remaining: Math.max(0, limit - bucket.count),
            resetMs: Math.max(0, bucket.reset - now),
            backend: FAILED_ATTEMPT_LIMITER_BACKEND,
        };
    },
    recordFailure(key: string, windowMs: number) {
        const now = Date.now();
        const bucket = buckets.get(key);
        if (!bucket || bucket.reset < now) {
            buckets.set(key, { count: 1, reset: now + windowMs });
            return;
        }
        bucket.count += 1;
    },
    clear(key: string) {
        buckets.delete(key);
    },
};

export function getClientIp(req: Request | { headers: Headers }): string {
    const h = (req as any).headers as Headers;
    return (
        h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        h.get('x-real-ip') ||
        h.get('cf-connecting-ip') ||
        'unknown'
    );
}
