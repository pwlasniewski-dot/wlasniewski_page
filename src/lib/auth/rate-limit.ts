// Simple in-memory rate limiter for public endpoints
// Prevents brute-force attacks on access codes

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const limiter = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of limiter.entries()) {
      if (entry.resetAt < now) {
        limiter.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Check if request should be rate limited
 * @param identifier - IP address or unique identifier
 * @param maxRequests - max requests allowed in window
 * @param windowMs - time window in milliseconds
 * @returns true if allowed, false if rate limited
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = limiter.get(identifier);

  if (!entry || entry.resetAt < now) {
    // First request or window expired
    const resetAt = now + windowMs;
    limiter.set(identifier, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Extract client IP from request headers
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  return 'unknown';
}
