import prisma from '../../src/lib/db/prisma';
import { cleanupPortalDiagnostics } from '../../src/lib/client-portal-retention';

// Netlify scheduled function, not a public HTTP cleanup endpoint.
export default async () => {
    try {
        const result = await cleanupPortalDiagnostics(prisma.crmActivity);
        console.info('[PORTAL_RETENTION]', result);
        if (result.batchFull) console.warn('[PORTAL_RETENTION] cleanup batch full; check backlog');
        return Response.json(result);
    } catch {
        console.warn('[PORTAL_RETENTION] cleanup unavailable');
        return Response.json({ error: 'cleanup_unavailable' }, { status: 500 });
    }
};
