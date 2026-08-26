import { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { revalidateActiveClient } from '@/lib/auth/active-client';
import { clientOwnershipWhere, contractOwnershipWhere } from '@/lib/auth/document-access';
import { CLIENT_ACTIONABLE_OFFER_STATUS_VALUES, CLIENT_VISIBLE_OFFER_STATUS_VALUES } from '@/lib/offers/status';
import { CLIENT_ACTIONABLE_CONTRACT_STATUS_VALUES, CLIENT_VISIBLE_CONTRACT_STATUS_VALUES } from '@/lib/contracts/status';
import { beginClientOperation, clientJson, clientOperationTotalMs, recordSlowClientOperation } from '@/lib/client-operations';
import { recordAdminIncidentSafely } from '@/lib/admin-incidents';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const operation = beginClientOperation();
    let clientId: number | null = null;
    let clientEmail: string | null = null;
    try {
        const token = extractToken(request.headers.get('authorization')) || request.cookies.get('client_token')?.value;
        const decoded = token ? await verifyToken(token) : null;
        if (!decoded) return clientJson({ error: 'Unauthorized' }, { status: 401, correlationId: operation.correlationId });
        const client = await revalidateActiveClient(decoded);
        if (!client) return clientJson({ error: 'Unauthorized' }, { status: 401, correlationId: operation.correlationId });
        clientId = client.id;
        clientEmail = client.email;
        const now = new Date();

        const [offer, contract, gallery, challenge, offerCount, contractCount, galleryCount, challengeCount, bookingCount, giftCardCount] = await Promise.all([
            prisma.offer.findFirst({
                where: {
                    OR: clientOwnershipWhere(client),
                    status: { in: CLIENT_ACTIONABLE_OFFER_STATUS_VALUES },
                    AND: [{ OR: [{ valid_until: null }, { valid_until: { gte: now } }] }],
                },
                orderBy: { created_at: 'desc' },
                select: { id: true, title: true, status: true, valid_until: true },
            }),
            prisma.contract.findFirst({
                where: { OR: contractOwnershipWhere(client), status: { in: CLIENT_ACTIONABLE_CONTRACT_STATUS_VALUES } },
                orderBy: { created_at: 'desc' },
                select: { id: true, contract_number: true, status: true },
            }),
            prisma.clientGallery.findFirst({
                where: {
                    OR: clientOwnershipWhere(client),
                    is_active: true,
                    photos: { some: {} },
                    AND: [{ OR: [{ expires_at: null }, { expires_at: { gte: now } }] }],
                },
                orderBy: { created_at: 'desc' },
                select: { id: true, access_code: true, client_name: true },
            }),
            prisma.photoChallenge.findFirst({
                where: {
                    OR: [
                        { invitee_user_id: client.id },
                        { invitee_user_id: null, invitee_contact: client.email },
                    ],
                    status: { in: ['sent', 'viewed'] },
                    AND: [{ OR: [{ acceptance_deadline: null }, { acceptance_deadline: { gte: now } }] }],
                },
                orderBy: { created_at: 'desc' },
                select: { id: true, unique_link: true, inviter_name: true },
            }),
            prisma.offer.count({
                where: { OR: clientOwnershipWhere(client), status: { in: CLIENT_VISIBLE_OFFER_STATUS_VALUES } },
            }),
            prisma.contract.count({
                where: { OR: contractOwnershipWhere(client), status: { in: CLIENT_VISIBLE_CONTRACT_STATUS_VALUES } },
            }),
            prisma.clientGallery.count({
                where: {
                    OR: clientOwnershipWhere(client),
                    is_active: true,
                    AND: [{ OR: [{ expires_at: null }, { expires_at: { gte: now } }] }],
                },
            }),
            prisma.photoChallenge.count({
                where: {
                    OR: [
                        { invitee_user_id: client.id },
                        { inviter_user_id: client.id },
                        { invitee_user_id: null, invitee_contact: client.email },
                        { inviter_user_id: null, inviter_email: client.email },
                        { inviter_user_id: null, inviter_contact: client.email },
                    ],
                },
            }),
            prisma.booking.count({ where: { email: client.email, status: { not: 'archived' } } }),
            prisma.giftCard.count({ where: { owner_id: client.id } }),
        ]);

        const nextAction = offer ? {
            kind: 'offer',
            label: offer.title,
            statusLabel: 'Oferta czeka na decyzję',
            ctaLabel: 'Otwórz ofertę i zdecyduj',
            href: `/strefa-klienta/oferty/${offer.id}`,
        } : contract ? {
            kind: 'contract',
            label: contract.contract_number || `Umowa #${contract.id}`,
            statusLabel: 'Umowa czeka na podpis',
            ctaLabel: 'Otwórz i podpisz umowę',
            href: `/strefa-klienta/umowy/${contract.id}`,
        } : gallery ? {
            kind: 'gallery',
            label: gallery.client_name || 'Galeria zdjęć',
            statusLabel: 'Galeria jest dostępna',
            ctaLabel: 'Otwórz galerię',
            href: `/galeria/${gallery.access_code}`,
        } : challenge ? {
            kind: 'challenge',
            label: `Zaproszenie od: ${challenge.inviter_name}`,
            statusLabel: 'Zaproszenie czeka na decyzję',
            ctaLabel: 'Otwórz zaproszenie',
            href: `/foto-wyzwanie/invite/${challenge.unique_link}`,
        } : null;

        const totalMs = clientOperationTotalMs(operation.startedAt);
        await recordSlowClientOperation({
            operation: 'action_summary', startedAt: operation.startedAt, correlationId: operation.correlationId,
            clientId, clientEmail, entityType: 'client_portal', outcome: 'success',
        });
        return clientJson({
            success: true,
            nextAction,
            counts: { offers: offerCount, contracts: contractCount, galleries: galleryCount, challenges: challengeCount, bookings: bookingCount, giftCards: giftCardCount },
            modules: {
                workshops: client.workshops_enabled,
                galleries: client.permissions && typeof client.permissions === 'object'
                    ? (client.permissions as Record<string, unknown>).galleries !== false
                    : true,
            },
            total_ms: totalMs,
        }, { correlationId: operation.correlationId });
    } catch (error) {
        console.error('[ACTION_SUMMARY] Failed', { correlationId: operation.correlationId, error });
        await recordAdminIncidentSafely({
            severity: 'P1', category: 'PORTAL', reasonCode: 'ACTION_SUMMARY_FAILED',
            summary: 'Nie udało się załadować następnego działania klienta', clientId, clientEmail,
            entityType: 'client_portal', correlationId: operation.correlationId,
            details: { error: error instanceof Error ? error.message : String(error) },
        });
        return clientJson({ error: 'Nie udało się załadować panelu.' }, { status: 500, correlationId: operation.correlationId });
    }
}
