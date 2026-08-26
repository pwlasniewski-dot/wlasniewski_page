export const SLOW_LOGIN_THRESHOLD_MS = 1_500;

export type LoginTimingStage = 'parse' | 'db' | 'bcrypt' | 'audit';

export interface LoginTimingContext {
    startedAt: number;
    parseMs: number;
    dbMs: number;
    bcryptMs: number;
    auditMs: number;
}

export interface LoginTimingSnapshot {
    parseMs: number;
    dbMs: number;
    bcryptMs: number;
    auditMs: number;
    totalMs: number;
}

export function createLoginTimingContext(startedAt = performance.now()): LoginTimingContext {
    return { startedAt, parseMs: 0, dbMs: 0, bcryptMs: 0, auditMs: 0 };
}

export async function measureLoginStage<T>(
    context: LoginTimingContext,
    stage: LoginTimingStage,
    operation: () => Promise<T>,
): Promise<T> {
    const startedAt = performance.now();
    try {
        return await operation();
    } finally {
        const duration = Math.max(0, performance.now() - startedAt);
        context[`${stage}Ms`] += duration;
    }
}

export function snapshotLoginTiming(
    context: LoginTimingContext,
    endedAt = performance.now(),
): LoginTimingSnapshot {
    return {
        parseMs: context.parseMs,
        dbMs: context.dbMs,
        bcryptMs: context.bcryptMs,
        auditMs: context.auditMs,
        totalMs: Math.max(0, endedAt - context.startedAt),
    };
}

function serverTimingDuration(value: number) {
    return Math.max(0, Number.isFinite(value) ? value : 0).toFixed(1);
}

export interface LoginServerTimingOptions {
    nodeEnv?: string;
    debug?: boolean;
}

export function formatLoginServerTiming(
    timing: LoginTimingSnapshot,
    options: LoginServerTimingOptions = {},
): string {
    const nodeEnv = options.nodeEnv ?? process.env.NODE_ENV;
    const debug = options.debug ?? process.env.AUTH_TIMING_DEBUG === 'true';
    const total = `total;dur=${serverTimingDuration(timing.totalMs)}`;
    if (nodeEnv === 'production' && !debug) return total;

    return [
        `parse;dur=${serverTimingDuration(timing.parseMs)}`,
        `db;dur=${serverTimingDuration(timing.dbMs)}`,
        `bcrypt;dur=${serverTimingDuration(timing.bcryptMs)}`,
        `audit;dur=${serverTimingDuration(timing.auditMs)}`,
        total,
    ].join(', ');
}

export function isSlowLogin(totalMs: number, thresholdMs = SLOW_LOGIN_THRESHOLD_MS): boolean {
    return Number.isFinite(totalMs) && totalMs >= thresholdMs;
}
