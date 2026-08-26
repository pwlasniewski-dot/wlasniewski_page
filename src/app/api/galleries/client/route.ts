import { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyToken, extractToken } from '@/lib/auth/jwt';
import { revalidateActiveClient } from '@/lib/auth/active-client';
import { clientOwnershipWhere } from '@/lib/auth/document-access';
import { beginClientOperation, clientJson, recordSlowClientOperation } from '@/lib/client-operations';
import { recordAdminIncidentSafely } from '@/lib/admin-incidents';

export async function GET(req: NextRequest) {
    const operation = beginClientOperation();
    let clientId: number | null = null;
    let clientEmail: string | null = null;
    try {
        const authHeader = req.headers.get('Authorization');
        const token = extractToken(authHeader) || req.cookies.get('client_token')?.value;

        if (!token) {
            return clientJson({ error: 'Unauthorized' }, { status: 401, correlationId: operation.correlationId });
        }

        const decoded = await verifyToken(token);
        if (!decoded) {
            return clientJson({ error: 'Invalid token' }, { status: 401, correlationId: operation.correlationId });
        }

        const user = await revalidateActiveClient(decoded);
        if (!user) {
            return clientJson({ error: 'Unauthorized' }, { status: 401, correlationId: operation.correlationId });
        }
        clientId = user.id;
        clientEmail = user.email;

        // A populated client_id is authoritative; email is legacy fallback only.
        const galleries = await prisma.clientGallery.findMany({
            where: {
                is_active: true,
                OR: clientOwnershipWhere(user),
                AND: [{ OR: [{ expires_at: null }, { expires_at: { gte: new Date() } }] }],
            },
            include: {
                _count: {
                    select: { photos: true }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        await recordSlowClientOperation({
            operation: 'gallery_list', startedAt: operation.startedAt, correlationId: operation.correlationId,
            clientId, clientEmail, entityType: 'gallery', outcome: 'success',
        });
        return clientJson({
            success: true,
            galleries: galleries.map(g => ({
                id: g.id,
                access_code: g.access_code,
                client_name: g.client_name,
                standard_count: g.standard_count,
                photo_count: g._count.photos,
                expires_at: g.expires_at,
                created_at: g.created_at
            }))
        }, { correlationId: operation.correlationId });

    } catch (error) {
        console.error('Fetch client galleries error:', { correlationId: operation.correlationId, error });
        await recordAdminIncidentSafely({
            severity: 'P1', category: 'GALLERY', reasonCode: 'GALLERY_LIST_FAILED',
            summary: 'Nie udało się załadować listy galerii klienta', clientId, clientEmail,
            entityType: 'gallery', correlationId: operation.correlationId,
            details: { error: error instanceof Error ? error.message : String(error) },
        });
        return clientJson({ error: 'Nie udało się załadować galerii.' }, { status: 500, correlationId: operation.correlationId });
    }
}
