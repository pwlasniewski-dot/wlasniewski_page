import prisma from '../../src/lib/db/prisma';
import { cleanupPortalDiagnostics } from '../../src/lib/client-portal-retention';

// Netlify scheduled function, not a public HTTP cleanup endpoint.
export const handler = async () => {
    try {
        const result = await cleanupPortalDiagnostics(prisma.crmActivity);
        console.info('[PORTAL_RETENTION]', result);
        if (result.batchFull) console.warn('[PORTAL_RETENTION] cleanup batch full; check backlog');
        return { statusCode: 200, body: JSON.stringify(result) };
    } catch {
        console.warn('[PORTAL_RETENTION] cleanup unavailable');
        return { statusCode: 500, body: JSON.stringify({ error: 'cleanup_unavailable' }) };
    }
};
