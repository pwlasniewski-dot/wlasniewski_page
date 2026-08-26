import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { generateToken, verifyPassword } from '@/lib/auth/jwt';
import { failedAttemptLimiter, getClientIp } from '@/lib/rate-limit';
import { recordAdminIncident } from '@/lib/admin-incidents';
import {
    createLoginTimingContext,
    formatLoginServerTiming,
    isSlowLogin,
    measureLoginStage,
    snapshotLoginTiming,
} from '@/lib/auth/login-observability';

type LoginSource = 'primary' | 'client-legacy';
type LoginPhase = 'parse' | 'rate-limit' | 'db' | 'bcrypt' | 'audit' | 'token';

// A real bcrypt cost-10 hash keeps unknown/blocked-account timing close to a
// normal password check without ever comparing against an account hash.
const DUMMY_PASSWORD_HASH = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.';

function metadata(value: Record<string, unknown>) {
    return JSON.stringify(value);
}

export async function handleClientLogin(request: NextRequest, source: LoginSource) {
    const correlationId = randomUUID();
    const timing = createLoginTimingContext();
    let phase: LoginPhase = 'parse';
    let normalizedEmail = '';
    let clientId: number | null = null;
    const ip = getClientIp(request);
    const userAgent = (request.headers.get('user-agent') || '').slice(0, 500);
    const limiterWindowMs = 15 * 60_000;
    const ipLimiterKey = `client-login:ip:${ip}`;
    let emailLimiterKey = '';
    const recordFailedAttempt = () => {
        failedAttemptLimiter.recordFailure(ipLimiterKey, limiterWindowMs);
        if (emailLimiterKey) failedAttemptLimiter.recordFailure(emailLimiterKey, limiterWindowMs);
    };

    const incident = async (input: Parameters<typeof recordAdminIncident>[0]) => {
        await measureLoginStage(timing, 'audit', () => recordAdminIncident(input));
    };
    const auditFailure = async (message: string, extra: Record<string, unknown> = {}) => {
        await measureLoginStage(timing, 'audit', () => prisma.systemLog.create({
            data: {
                level: 'WARN', module: 'AUTH', message,
                metadata: metadata({
                    correlation_id: correlationId, source, ip, email: normalizedEmail || null,
                    user_id: clientId, user_agent: userAgent,
                    total_ms: snapshotLoginTiming(timing).totalMs,
                    timings_ms: snapshotLoginTiming(timing),
                    ...extra,
                }),
            },
        }));
    };
    let slowIncidentRecorded = false;
    const respond = async (
        body: Record<string, unknown>,
        status = 200,
        recordSlowIncident = true,
    ) => {
        const completedTiming = snapshotLoginTiming(timing);
        if (recordSlowIncident && !slowIncidentRecorded && isSlowLogin(completedTiming.totalMs)) {
            slowIncidentRecorded = true;
            await incident({
                severity: 'P2',
                category: 'PERFORMANCE',
                reasonCode: 'SLOW_LOGIN',
                summary: 'Logowanie klienta przekroczyło 1500 ms',
                clientId,
                clientEmail: normalizedEmail || null,
                correlationId,
                details: { source, ip, http_status: status, timings_ms: { ...completedTiming } },
            });
        }
        const response = NextResponse.json(body, { status });
        response.headers.set('Server-Timing', formatLoginServerTiming(snapshotLoginTiming(timing)));
        response.headers.set('X-Correlation-ID', correlationId);
        return response;
    };

    try {
        const body = await measureLoginStage(timing, 'parse', async () => {
            try {
                return await request.json() as { email?: unknown; password?: unknown };
            } catch {
                return null;
            }
        });
        normalizedEmail = String(body?.email || '').trim().toLowerCase();
        emailLimiterKey = normalizedEmail ? `client-login:email:${normalizedEmail}` : '';
        const password = typeof body?.password === 'string' ? body.password : '';

        if (!normalizedEmail || !password) {
            await auditFailure('CLIENT_LOGIN_FAIL_INVALID_REQUEST');
            return respond({ error: 'Email and password are required' }, 400);
        }

        phase = 'rate-limit';
        const ipLimit = failedAttemptLimiter.check(ipLimiterKey, 20, limiterWindowMs);
        const emailLimit = failedAttemptLimiter.check(emailLimiterKey, 5, limiterWindowMs);
        if (!ipLimit.ok || !emailLimit.ok) {
            await incident({
                severity: 'P1',
                category: 'AUTH',
                reasonCode: 'RATE_LIMIT',
                summary: 'Przekroczono limit prób logowania klienta',
                clientEmail: normalizedEmail,
                correlationId,
                details: {
                    source,
                    scope: !ipLimit.ok ? 'IP' : 'EMAIL',
                    ip,
                    user_agent: userAgent,
                    ip_reset_ms: ipLimit.resetMs,
                    email_reset_ms: emailLimit.resetMs,
                    limiter_backend: failedAttemptLimiter.backend,
                    timings_ms: snapshotLoginTiming(timing),
                },
            });
            await auditFailure('CLIENT_LOGIN_FAIL_RATE_LIMIT', { limiter_backend: failedAttemptLimiter.backend });
            return respond({
                error: 'RATE_LIMITED',
                message: 'Zbyt wiele prób logowania. Spróbuj ponownie za 15 minut.',
            }, 429);
        }

        phase = 'db';
        const user = await measureLoginStage(timing, 'db', () => prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: {
                id: true,
                email: true,
                name: true,
                password_hash: true,
                password_reset_required: true,
                deleted_at: true,
                role: true,
                is_active: true,
            },
        }));
        clientId = user?.id ?? null;

        if (!user) {
            phase = 'bcrypt';
            await measureLoginStage(timing, 'bcrypt', () => verifyPassword(password, DUMMY_PASSWORD_HASH));
            phase = 'audit';
            await measureLoginStage(timing, 'audit', () => prisma.systemLog.create({
                data: {
                    level: 'WARN',
                    module: 'AUTH',
                    message: 'CLIENT_LOGIN_FAIL_UNKNOWN_ACCOUNT',
                    metadata: metadata({
                        correlation_id: correlationId, source, ip, email: normalizedEmail, user_agent: userAgent,
                        total_ms: snapshotLoginTiming(timing).totalMs,
                        timings_ms: snapshotLoginTiming(timing),
                    }),
                },
            }));
            recordFailedAttempt();
            return respond({ error: 'Invalid credentials' }, 401);
        }

        const blockedReason = user.deleted_at
            ? 'DELETED'
            : !user.is_active
                ? 'INACTIVE'
                : user.role !== 'CLIENT'
                    ? 'INVALID_ROLE'
                    : null;
        if (blockedReason) {
            phase = 'bcrypt';
            await measureLoginStage(timing, 'bcrypt', () => verifyPassword(password, DUMMY_PASSWORD_HASH));
            phase = 'audit';
            await incident({
                severity: blockedReason === 'INVALID_ROLE' ? 'P1' : 'P2',
                category: 'AUTH',
                reasonCode: blockedReason,
                summary: 'Zablokowana próba logowania na niedostępne konto klienta',
                clientId: user.id,
                clientEmail: user.email,
                correlationId,
                details: { source, ip, user_agent: userAgent, role: user.role, timings_ms: snapshotLoginTiming(timing) },
            });
            await auditFailure('CLIENT_LOGIN_FAIL_BLOCKED_ACCOUNT', { blocked_reason: blockedReason });
            recordFailedAttempt();
            return respond({ error: 'Invalid credentials' }, 401);
        }

        if (user.password_reset_required) {
            phase = 'bcrypt';
            await measureLoginStage(timing, 'bcrypt', () => verifyPassword(password, DUMMY_PASSWORD_HASH));
            phase = 'audit';
            await incident({
                severity: 'P2',
                category: 'AUTH',
                reasonCode: 'RESET_REQUIRED',
                summary: 'Logowanie zablokowane do czasu ustawienia nowego hasła',
                clientId: user.id,
                clientEmail: user.email,
                correlationId,
                details: { source, ip, user_agent: userAgent, timings_ms: snapshotLoginTiming(timing) },
            });
            await auditFailure('CLIENT_LOGIN_FAIL_RESET_REQUIRED');
            recordFailedAttempt();
            return respond({
                error: 'PASSWORD_RESET_REQUIRED',
                message: 'Twoje hasło wymaga ponownego ustawienia.',
            }, 403);
        }

        phase = 'bcrypt';
        const validPassword = await measureLoginStage(timing, 'bcrypt', () => (
            verifyPassword(password, user.password_hash)
        ));
        if (!validPassword) {
            phase = 'audit';
            const failedAt = new Date();
            await measureLoginStage(timing, 'audit', () => prisma.$transaction([
                prisma.user.update({
                    where: { id: user.id },
                    data: { last_failed_login: failedAt },
                }),
                prisma.systemLog.create({
                    data: {
                        level: 'WARN',
                        module: 'AUTH',
                        message: 'CLIENT_LOGIN_FAIL_BAD_PASSWORD',
                        metadata: metadata({
                            correlation_id: correlationId,
                            source,
                            ip,
                            email: normalizedEmail,
                            user_id: user.id,
                            user_agent: userAgent,
                            total_ms: snapshotLoginTiming(timing).totalMs,
                            timings_ms: snapshotLoginTiming(timing),
                        }),
                    },
                }),
            ]));
            recordFailedAttempt();
            return respond({ error: 'Invalid credentials' }, 401);
        }

        phase = 'token';
        const token = await generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
            type: 'client',
        });

        phase = 'audit';
        const loggedInAt = new Date();
        await measureLoginStage(timing, 'audit', () => prisma.$transaction([
            prisma.user.update({
                where: { id: user.id },
                data: { last_login: loggedInAt },
            }),
            prisma.systemLog.create({
                data: {
                    level: 'INFO',
                    module: 'AUTH',
                    message: 'CLIENT_LOGIN_SUCCESS',
                    metadata: metadata({
                        correlation_id: correlationId,
                        source,
                        ip,
                        email: normalizedEmail,
                        user_id: user.id,
                        user_agent: userAgent,
                        total_ms: snapshotLoginTiming(timing).totalMs,
                        timings_ms: snapshotLoginTiming(timing),
                    }),
                },
            }),
            prisma.crmActivity.create({
                data: {
                    client_id: user.id,
                    client_email: user.email,
                    action: 'login',
                    details: metadata({
                        name: user.name, correlation_id: correlationId, source,
                        total_ms: snapshotLoginTiming(timing).totalMs,
                        timings_ms: snapshotLoginTiming(timing),
                    }),
                    ip_address: ip,
                    user_agent: userAgent,
                },
            }),
        ]));
        failedAttemptLimiter.clear(emailLimiterKey);

        const response = await respond({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                last_login: loggedInAt,
            },
        });
        response.cookies.set('client_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60,
        });
        return response;
    } catch (error) {
        const reasonCode = phase === 'db' || phase === 'audit' ? 'DB_ERROR' : 'SERVER_ERROR';
        try {
            await incident({
                severity: 'P0',
                category: 'AUTH',
                reasonCode,
                summary: 'Błąd serwera podczas logowania klienta',
                clientId,
                clientEmail: normalizedEmail || null,
                correlationId,
                details: {
                    source,
                    phase,
                    ip,
                    error: error instanceof Error ? error.message : String(error),
                    timings_ms: snapshotLoginTiming(timing),
                },
            });
        } catch (incidentError) {
            // Persistence failure is made explicit in the platform log. The
            // request still receives a generic response and its correlation ID.
            console.error('[client-login] critical incident persistence failed', {
                correlationId,
                reasonCode,
                incidentError,
            });
        }
        console.error('[client-login] request failed', { correlationId, phase, error });
        return respond({ error: 'Server error' }, 500, false);
    }
}
