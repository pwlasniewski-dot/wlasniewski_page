import assert from 'node:assert/strict';
import test from 'node:test';
import {
  consumeAnalyticsRateLimit,
  hashAnalyticsSignal,
  minuteWindow,
  trustedClientSignal,
  type AnalyticsRateLimitStore,
} from '../../src/lib/analytics/ingestGuard';

class AtomicMemoryStore implements AnalyticsRateLimitStore {
  private counts = new Map<string, number>();
  seenKeys: string[] = [];

  async consume(signalHash: string, windowStart: Date, cost: number, limit: number) {
    // The synchronous compare-and-set models the single atomic PostgreSQL UPSERT.
    const key = `${signalHash}:${windowStart.toISOString()}`;
    this.seenKeys.push(key);
    const current = this.counts.get(key) || 0;
    if (current + cost > limit) return null;
    const next = current + cost;
    this.counts.set(key, next);
    return next;
  }
}

const SECRET = 'analytics-test-secret-at-least-32-characters';

test('shared limiter admits only the configured aggregate event cost under concurrency', async () => {
  const previous = process.env.ANALYTICS_RATE_LIMIT_SECRET;
  process.env.ANALYTICS_RATE_LIMIT_SECRET = SECRET;
  try {
    const store = new AtomicMemoryStore();
    const now = new Date('2026-08-09T10:23:45.000Z');
    const attempts = await Promise.all(Array.from({ length: 30 }, () => consumeAnalyticsRateLimit({
      signal: '203.0.113.7', cost: 5, limit: 120, now, store,
    })));

    assert.equal(attempts.filter(Boolean).length, 24);
    assert.equal(attempts.filter(value => !value).length, 6);
  } finally {
    if (previous === undefined) delete process.env.ANALYTICS_RATE_LIMIT_SECRET;
    else process.env.ANALYTICS_RATE_LIMIT_SECRET = previous;
  }
});

test('limiter stores an HMAC digest, never the raw network signal', async () => {
  const previous = process.env.ANALYTICS_RATE_LIMIT_SECRET;
  process.env.ANALYTICS_RATE_LIMIT_SECRET = SECRET;
  try {
    const store = new AtomicMemoryStore();
    await consumeAnalyticsRateLimit({
      signal: '198.51.100.9', cost: 1, limit: 120,
      now: new Date('2026-08-09T10:23:45.000Z'), store,
    });
    assert.equal(store.seenKeys.length, 1);
    assert.doesNotMatch(store.seenKeys[0], /198\.51\.100\.9/);
    assert.match(store.seenKeys[0], /^[a-f0-9]{64}:/);
  } finally {
    if (previous === undefined) delete process.env.ANALYTICS_RATE_LIMIT_SECRET;
    else process.env.ANALYTICS_RATE_LIMIT_SECRET = previous;
  }
});

test('limiter fails closed when its server secret is unavailable', async () => {
  const rateSecret = process.env.ANALYTICS_RATE_LIMIT_SECRET;
  const jwtSecret = process.env.JWT_SECRET;
  delete process.env.ANALYTICS_RATE_LIMIT_SECRET;
  delete process.env.JWT_SECRET;
  try {
    await assert.rejects(
      consumeAnalyticsRateLimit({ signal: 'unknown', cost: 1, limit: 120, store: new AtomicMemoryStore() }),
      /must contain at least 32 characters/,
    );
  } finally {
    if (rateSecret !== undefined) process.env.ANALYTICS_RATE_LIMIT_SECRET = rateSecret;
    if (jwtSecret !== undefined) process.env.JWT_SECRET = jwtSecret;
  }
});

test('client signal prefers the Netlify-owned connection header over forwarded metadata', () => {
  const headers = new Headers({
    'x-nf-client-connection-ip': '203.0.113.10',
    'x-forwarded-for': '198.51.100.2, 10.0.0.1',
  });
  assert.equal(trustedClientSignal(headers), '203.0.113.10');
});

test('minute windows are stable and hashes are deterministic but secret-dependent', () => {
  assert.equal(minuteWindow(new Date('2026-08-09T10:23:59.999Z')).toISOString(), '2026-08-09T10:23:00.000Z');
  assert.equal(hashAnalyticsSignal('signal', SECRET), hashAnalyticsSignal('signal', SECRET));
  assert.notEqual(hashAnalyticsSignal('signal', SECRET), hashAnalyticsSignal('signal', `${SECRET}-other`));
});
