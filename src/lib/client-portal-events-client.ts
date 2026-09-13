import type { PortalClientEvent } from './client-portal-events';
import { isPortalUuid, parsePortalClientEvent, PORTAL_EVENT_LIMIT_PER_MINUTE } from './client-portal-events';

export type PortalObservation = Omit<PortalClientEvent, 'sessionId' | 'sequence'>;

type ReporterOptions = {
    token: string;
    fetcher?: typeof fetch;
    now?: () => number;
    createSessionId?: () => string;
};

/** Short-lived, best-effort operational diagnostics. No persistent browser identifier. */
export function createPortalEventReporter(options: ReporterOptions) {
    let sessionId: string | undefined;
    let sequence = 0;
    let windowStartedAt: number | undefined;
    let windowCount = 0;
    let inFlight = 0;

    return {
        track(observation: PortalObservation): void {
            // Diagnostics must never throw into navigation, payment, or data loading.
            try {
                const now = (options.now || Date.now)();
                if (windowStartedAt === undefined || now - windowStartedAt >= 60_000) {
                    windowStartedAt = now;
                    windowCount = 0;
                }
                if (windowCount >= PORTAL_EVENT_LIMIT_PER_MINUTE || inFlight >= 6) return;
                sessionId ||= (options.createSessionId || (() => crypto.randomUUID()))();
                windowCount += 1;
                sequence += 1;

                // Enumerate fields, rather than spreading a runtime object that might contain a URL/token.
                const payload: PortalClientEvent = {
                    event: observation.event,
                    sessionId,
                    sequence,
                    section: observation.section,
                    module: observation.module,
                    action: observation.action,
                    durationMs: observation.durationMs,
                    correlationId: observation.correlationId,
                    httpStatus: observation.httpStatus,
                };
                if (!parsePortalClientEvent(payload)) return;
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 2_000);
                inFlight += 1;
                try {
                    void (options.fetcher || fetch)('/api/user/events', {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${options.token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                        cache: 'no-store',
                        credentials: 'omit',
                        keepalive: true,
                        signal: controller.signal,
                    }).catch(() => undefined).finally(() => {
                        clearTimeout(timeout);
                        inFlight -= 1;
                    });
                } catch {
                    clearTimeout(timeout);
                    inFlight -= 1;
                }
            } catch {
                // Unsupported crypto, a full keepalive queue, or a failed logger cannot block the portal.
            }
        },
    };
}

export function portalResponseDiagnostics(response: Response, data?: unknown) {
    const headerCorrelationId = response.headers.get('X-Correlation-ID');
    const bodyCorrelationId = data && typeof data === 'object'
        ? ('correlationId' in data ? data.correlationId : 'caseCode' in data ? data.caseCode : undefined)
        : undefined;
    const candidate = isPortalUuid(headerCorrelationId) ? headerCorrelationId : bodyCorrelationId;
    return {
        httpStatus: response.status,
        correlationId: isPortalUuid(candidate) ? candidate : undefined,
    };
}
