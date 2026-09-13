import { PORTAL_EVENT_ACTION } from './client-portal-events';

export const PORTAL_DIAGNOSTIC_RETENTION_DAYS = 30;
export const PORTAL_CLEANUP_BATCH_SIZE = 10_000;

export function expiredPortalDiagnosticsWhere(now = new Date()) {
    if (!Number.isFinite(now.getTime())) throw new Error('Invalid retention clock');
    return { action: PORTAL_EVENT_ACTION, created_at: { lt: new Date(now.getTime() - PORTAL_DIAGNOSTIC_RETENTION_DAYS * 86_400_000) } };
}

/** Only new portal diagnostics expire. Login, order, offer and incident evidence is untouched. */
export async function cleanupPortalDiagnostics(store: {
    findMany: (args: { where: ReturnType<typeof expiredPortalDiagnosticsWhere>; select: { id: true }; take: number; orderBy: { created_at: 'asc' } }) => Promise<Array<{ id: number }>>;
    deleteMany: (args: { where: ReturnType<typeof expiredPortalDiagnosticsWhere> & { id: { in: number[] } } }) => Promise<{ count: number }>;
}, now = new Date()) {
    const where = expiredPortalDiagnosticsWhere(now);
    const rows = await store.findMany({ where, select: { id: true }, take: PORTAL_CLEANUP_BATCH_SIZE, orderBy: { created_at: 'asc' } });
    if (!rows.length) return { count: 0, batchFull: false };
    const result = await store.deleteMany({ where: { ...where, id: { in: rows.map(row => row.id) } } });
    return { count: result.count, batchFull: rows.length === PORTAL_CLEANUP_BATCH_SIZE };
}
