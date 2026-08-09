import { createHmac } from 'node:crypto';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/db/prisma';

export type AnalyticsIngestReason =
  | 'accepted'
  | 'excluded'
  | 'payload_too_large'
  | 'missing_origin'
  | 'invalid_origin'
  | 'invalid_json'
  | 'empty_batch'
  | 'batch_too_large'
  | 'no_valid_events'
  | 'rate_limited'
  | 'limiter_unavailable'
  | 'storage_error';

type RateLimitRow = { event_count: number };

export type AnalyticsRateLimitStore = {
  consume: (signalHash: string, windowStart: Date, cost: number, limit: number) => Promise<number | null>;
};

export const postgresAnalyticsRateLimitStore: AnalyticsRateLimitStore = {
  async consume(signalHash, windowStart, cost, limit) {
    const rows = await prisma.$queryRaw<RateLimitRow[]>(Prisma.sql`
      WITH cleanup AS (
        DELETE FROM "analytics_rate_limits"
        WHERE "window_start" < ${windowStart} - INTERVAL '5 minutes'
      )
      INSERT INTO "analytics_rate_limits" (
        "signal_hash", "window_start", "event_count", "updated_at"
      ) VALUES (${signalHash}, ${windowStart}, ${cost}, NOW())
      ON CONFLICT ("signal_hash", "window_start") DO UPDATE
      SET "event_count" = "analytics_rate_limits"."event_count" + EXCLUDED."event_count",
          "updated_at" = NOW()
      WHERE "analytics_rate_limits"."event_count" + EXCLUDED."event_count" <= ${limit}
      RETURNING "event_count"
    `);
    return rows[0]?.event_count ?? null;
  },
};

export function analyticsRateLimitSecret() {
  const secret = process.env.ANALYTICS_RATE_LIMIT_SECRET || process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('ANALYTICS_RATE_LIMIT_SECRET (or JWT_SECRET) must contain at least 32 characters');
  }
  return secret;
}

export function hashAnalyticsSignal(signal: string, secret = analyticsRateLimitSecret()) {
  return createHmac('sha256', secret).update(signal).digest('hex');
}

export function trustedClientSignal(headers: Pick<Headers, 'get'>) {
  // Production is deployed on Netlify, which supplies this header itself.
  // Generic forwarding headers are intentionally ignored because callers can
  // forge them when a deployment is not behind a correctly configured proxy.
  return headers.get('x-nf-client-connection-ip')?.trim()
    || 'unknown';
}

export function minuteWindow(now = new Date()) {
  return new Date(Math.floor(now.getTime() / 60_000) * 60_000);
}

export async function consumeAnalyticsRateLimit(args: {
  signal: string;
  cost: number;
  limit: number;
  now?: Date;
  store?: AnalyticsRateLimitStore;
}) {
  const { signal, cost, limit, now = new Date(), store = postgresAnalyticsRateLimitStore } = args;
  if (!Number.isInteger(cost) || cost < 1 || cost > limit) return false;
  const count = await store.consume(hashAnalyticsSignal(signal), minuteWindow(now), cost, limit);
  return count !== null;
}

export async function recordAnalyticsIngestMetric(
  reasonCode: AnalyticsIngestReason,
  outcome: 'accepted' | 'rejected' | 'excluded' | 'error',
  eventCount: number,
  now = new Date(),
) {
  const bucketStart = minuteWindow(now);
  const safeEventCount = Math.max(0, Math.min(10_000, Math.trunc(eventCount) || 0));
  try {
    await prisma.$executeRaw(Prisma.sql`
      WITH cleanup AS (
        DELETE FROM "analytics_ingest_metrics"
        WHERE "bucket_start" < ${bucketStart} - INTERVAL '180 days'
      )
      INSERT INTO "analytics_ingest_metrics" (
        "bucket_start", "reason_code", "outcome", "batch_count", "event_count", "updated_at"
      ) VALUES (${bucketStart}, ${reasonCode}, ${outcome}, 1, ${safeEventCount}, NOW())
      ON CONFLICT ("bucket_start", "reason_code", "outcome") DO UPDATE
      SET "batch_count" = "analytics_ingest_metrics"."batch_count" + 1,
          "event_count" = "analytics_ingest_metrics"."event_count" + EXCLUDED."event_count",
          "updated_at" = NOW()
    `);
  } catch (error) {
    // Metrics must never turn a valid analytics request into an outage. The
    // structured fallback remains visible in serverless logs.
    console.error('[Analytics V2 ingest metric]', { reasonCode, outcome, eventCount: safeEventCount, error });
  }
}
