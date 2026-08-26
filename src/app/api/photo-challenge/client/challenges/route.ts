import { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { revalidateActiveClient } from '@/lib/auth/active-client';
import { beginClientOperation, clientJson, recordSlowClientOperation } from '@/lib/client-operations';
import { recordAdminIncidentSafely } from '@/lib/admin-incidents';

export async function GET(request: NextRequest) {
    const operation = beginClientOperation();
    let clientId: number | null = null;
    let clientEmail: string | null = null;
    try {
        const token = extractToken(request.headers.get('authorization')) || request.cookies.get('client_token')?.value;
        const identity = token ? await verifyToken(token) : null;
        if (!identity) return clientJson({ success: false, error: 'Unauthorized' }, { status: 401, correlationId: operation.correlationId });
        const client = await revalidateActiveClient(identity);
        if (!client) return clientJson({ success: false, error: 'Unauthorized' }, { status: 401, correlationId: operation.correlationId });
        clientId = client.id;
        clientEmail = client.email;

        const challenges = await prisma.photoChallenge.findMany({
            where: {
                OR: [
                    { invitee_user_id: client.id },
                    { inviter_user_id: client.id },
                    { invitee_user_id: null, invitee_contact: client.email },
                    { inviter_user_id: null, inviter_email: client.email },
                    { inviter_user_id: null, inviter_contact: client.email },
                ],
            },
            include: {
                package: true,
                location: true,
                gallery: { select: { is_published: true } },
            },
            orderBy: { created_at: 'desc' },
        });
        const enriched = challenges.map(challenge => ({
            ...challenge,
            role: challenge.invitee_user_id === client.id
                || (challenge.invitee_user_id === null && challenge.invitee_contact.toLowerCase() === client.email.toLowerCase())
                ? 'invitee'
                : 'inviter',
        }));
        await recordSlowClientOperation({
            operation: 'challenge_list', startedAt: operation.startedAt, correlationId: operation.correlationId,
            clientId, clientEmail, entityType: 'photo_challenge', outcome: 'success',
        });
        return clientJson({ success: true, user: client, challenges: enriched }, { correlationId: operation.correlationId });
    } catch (error) {
        console.error('[PHOTO_CHALLENGE_LIST] Failed', { correlationId: operation.correlationId, error });
        await recordAdminIncidentSafely({
            severity: 'P1', category: 'PORTAL', reasonCode: 'PHOTO_CHALLENGE_LIST_FAILED',
            summary: 'Nie udało się załadować wyzwań klienta', clientId, clientEmail,
            entityType: 'photo_challenge', correlationId: operation.correlationId,
            details: { error: error instanceof Error ? error.message : String(error) },
        });
        return clientJson({ success: false, error: 'Nie udało się załadować wyzwań.' }, { status: 500, correlationId: operation.correlationId });
    }
}
