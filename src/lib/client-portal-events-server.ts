import { after } from 'next/server';
import prisma from '@/lib/db/prisma';
import { isPortalUuid, PORTAL_EVENT_ACTION, type PortalClientEvent, type PortalModule } from './client-portal-events';

export async function storePortalClientEvent(clientId: number, event: PortalClientEvent) {
    await prisma.crmActivity.create({ data: {
        client_id: clientId, action: PORTAL_EVENT_ACTION, entity_type: 'client_portal',
        details: JSON.stringify({ ...event, source: 'browser', version: 1 }),
    } });
}

export function recordPortalVoucherResponse(input: {
    clientId: number | null; offerId: number | null; correlationId: string; startedAt: number; httpStatus: number;
}) {
    if (!input.clientId || !input.offerId) return; // Never attribute an administrator's preview to the client.
    try {
        after(async () => {
            try {
                await prisma.crmActivity.create({ data: {
                    client_id: input.clientId, action: PORTAL_EVENT_ACTION, entity_type: 'offer', entity_id: input.offerId,
                    details: JSON.stringify({ version: 1, source: 'server',
                        event: input.httpStatus === 200 ? 'voucher_pdf_generated' : 'voucher_pdf_failed',
                        correlationId: input.correlationId, httpStatus: input.httpStatus,
                        durationMs: Math.max(0, Math.min(600_000, Date.now() - input.startedAt)),
                    }),
                } });
            } catch { console.warn('[PORTAL_EVENT] voucher storage unavailable'); }
        });
    } catch { console.warn('[PORTAL_EVENT] voucher scheduling unavailable'); }
}

/** Server-only evidence, scheduled after response; diagnostics cannot break a client request. */
export function recordPortalResponse(input: {
    clientId: number | null; module: PortalModule; correlationId: string;
    startedAt: number; httpStatus: number; errorCode?: unknown;
}) {
    if (!input.clientId || !isPortalUuid(input.correlationId)) return;
    const details = {
        version: 1, source: 'server',
        event: input.httpStatus >= 400 ? 'request_failed' : 'request_succeeded',
        module: input.module, correlationId: input.correlationId, httpStatus: input.httpStatus,
        durationMs: Math.max(0, Math.min(600_000, Date.now() - input.startedAt)),
        errorCode: typeof input.errorCode === 'string' && /^P\d{4}$/.test(input.errorCode) ? input.errorCode : undefined,
    };
    try {
        after(async () => {
            try {
                await prisma.crmActivity.create({ data: {
                    client_id: input.clientId, action: PORTAL_EVENT_ACTION, entity_type: 'client_portal',
                    details: JSON.stringify(details),
                } });
            } catch { console.warn('[PORTAL_EVENT] server storage unavailable'); }
        });
    } catch { console.warn('[PORTAL_EVENT] scheduling unavailable'); }
}
