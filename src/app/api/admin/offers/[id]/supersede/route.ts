import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';
import { type AuthenticatedRequest, requireAdminAuth } from '@/lib/auth/middleware';
import { recordAdminIncidentSafely } from '@/lib/admin-incidents';
import { jsonWithCorrelation } from '@/lib/http/correlation';
import { normalizeOfferStatus } from '@/lib/offers/status';

export const dynamic = 'force-dynamic';

class OfferSupersedeConflict extends Error {}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const correlationId = randomUUID();
    let offerId: number | null = null;
    try {
        const authError = await requireAdminAuth(request);
        if (authError) return authError;

        const resolved = await params;
        offerId = Number(resolved.id);
        const body = await request.json().catch(() => ({}));
        const replacementOfferId = Number(body.replacement_offer_id);
        const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
        const expectedUpdatedAt = typeof body.expected_updated_at === 'string'
            ? new Date(body.expected_updated_at)
            : null;

        if (!Number.isInteger(offerId) || offerId <= 0
            || !Number.isInteger(replacementOfferId) || replacementOfferId <= 0
            || replacementOfferId === offerId) {
            return jsonWithCorrelation({ error: 'Wskaż inną, prawidłową ofertę zastępującą.' }, correlationId, 400);
        }
        if (reason.length < 10 || reason.length > 500) {
            return jsonWithCorrelation({ error: 'Powód zastąpienia musi mieć od 10 do 500 znaków.' }, correlationId, 400);
        }
        if (!expectedUpdatedAt || Number.isNaN(expectedUpdatedAt.getTime())) {
            return jsonWithCorrelation({ error: 'Odśwież ofertę przed wykonaniem tej operacji.' }, correlationId, 400);
        }

        const result = await prisma.$transaction(async tx => {
            const [source, replacement] = await Promise.all([
                tx.offer.findUnique({ where: { id: offerId! } }),
                tx.offer.findUnique({ where: { id: replacementOfferId } }),
            ]);
            if (!source || !replacement) throw new OfferSupersedeConflict('Nie znaleziono jednej z ofert.');

            if (normalizeOfferStatus(source.status) === 'superseded') {
                if (source.superseded_by_offer_id === replacementOfferId) {
                    return { source, replacement, alreadySuperseded: true };
                }
                throw new OfferSupersedeConflict('Ta oferta została już zastąpiona inną ofertą.');
            }
            if (!['sent', 'open', 'accepted'].includes(normalizeOfferStatus(replacement.status))) {
                throw new OfferSupersedeConflict('Oferta zastępująca musi być wysłana, otwarta albo zaakceptowana.');
            }
            if (replacement.superseded_by_offer_id === offerId) {
                throw new OfferSupersedeConflict('Nie można utworzyć cyklicznego zastąpienia ofert.');
            }

            const updated = await tx.offer.updateMany({
                where: {
                    id: offerId!,
                    status: source.status,
                    updated_at: expectedUpdatedAt,
                    superseded_by_offer_id: null,
                },
                data: {
                    status: 'superseded',
                    superseded_by_offer_id: replacementOfferId,
                    superseded_at: new Date(),
                    superseded_reason: reason,
                },
            });
            if (updated.count !== 1) {
                throw new OfferSupersedeConflict('Oferta zmieniła się w międzyczasie. Odśwież widok i sprawdź dane.');
            }

            const admin = (request as AuthenticatedRequest).user;
            await tx.crmActivity.create({
                data: {
                    client_id: source.client_id,
                    client_email: source.client_email,
                    action: 'offer_superseded',
                    entity_type: 'offer',
                    entity_id: offerId,
                    details: JSON.stringify({
                        previous_status: source.status,
                        replacement_offer_id: replacementOfferId,
                        replacement_offer_number: replacement.offerNumber,
                        reason,
                        admin_id: admin?.id || null,
                        admin_email: admin?.email || null,
                        correlation_id: correlationId,
                    }),
                    ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
                    user_agent: request.headers.get('user-agent')?.slice(0, 500) || null,
                },
            });

            return { source, replacement, alreadySuperseded: false };
        });

        return jsonWithCorrelation({
            success: true,
            already_superseded: result.alreadySuperseded,
            offer_id: offerId,
            replacement_offer_id: result.replacement.id,
            replacement_offer_number: result.replacement.offerNumber,
        }, correlationId);
    } catch (error) {
        if (error instanceof OfferSupersedeConflict) {
            return jsonWithCorrelation({ error: error.message }, correlationId, 409);
        }
        await recordAdminIncidentSafely({
            severity: 'P1',
            category: 'ADMIN_WRITE',
            reasonCode: 'ADMIN_OFFER_SUPERSEDE_FAILED',
            summary: 'Nie udało się oznaczyć starej oferty jako zastąpionej',
            entityType: 'offer',
            entityId: offerId,
            correlationId,
            details: { error: error instanceof Error ? error.message : String(error) },
        });
        return jsonWithCorrelation({ error: 'Nie udało się zastąpić oferty. Sprawdź incydent administratora.' }, correlationId, 500);
    }
}
