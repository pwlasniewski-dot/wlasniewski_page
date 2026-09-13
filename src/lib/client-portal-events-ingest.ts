import { parsePortalClientEvent, PORTAL_EVENT_MAX_BYTES, type PortalClientEvent } from './client-portal-events';

type Dependencies = {
    authenticate: () => Promise<number | null>;
    rateLimit: (clientId: number) => Promise<boolean>;
    store: (clientId: number, event: PortalClientEvent) => Promise<void>;
};

/** Bounded streaming read, including when Content-Length is absent or forged. */
async function readEvent(request: Request) {
    if (Number(request.headers.get('content-length')) > PORTAL_EVENT_MAX_BYTES) return { status: 413 } as const;
    if (!request.body) return { status: 400 } as const;
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    try {
        for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            bytes += value.byteLength;
            if (bytes > PORTAL_EVENT_MAX_BYTES) { await reader.cancel(); return { status: 413 } as const; }
            chunks.push(value);
        }
    } finally { reader.releaseLock(); }
    const buffer = new Uint8Array(bytes);
    let offset = 0;
    for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.byteLength; }
    try {
        const event = parsePortalClientEvent(JSON.parse(new TextDecoder().decode(buffer)));
        return event ? { status: 200, event } as const : { status: 400 } as const;
    } catch { return { status: 400 } as const; }
}

export async function ingestPortalEvent(request: Request, dependencies: Dependencies): Promise<number> {
    try {
        // Only our same-origin authenticated browser. Never accept a target client ID in the body.
        const origin = request.headers.get('origin');
        if (!origin || origin !== new URL(request.url).origin || request.headers.get('sec-fetch-site') === 'cross-site') return 403;
        if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') return 415;
        const clientId = await dependencies.authenticate();
        if (!clientId) return 401;
        if (!await dependencies.rateLimit(clientId)) return 429;
        const parsed = await readEvent(request);
        if (parsed.status !== 200) return parsed.status;
        await dependencies.store(clientId, parsed.event);
        return 204;
    } catch {
        // Do not log incoming bodies, headers, tokens or exception messages.
        console.warn('[PORTAL_EVENT] ingest unavailable');
        return 503;
    }
}
