/**
 * API: Klient zglasza zainteresowanie albumem z poziomu panelu klienta.
 * Zapisuje w CrmActivity + wysyla maila do fotografa - klient zostaje w panelu.
 */
import { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';
import { sendEmail } from '@/lib/email/sender';
import { logSystem } from '@/lib/logger';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { revalidateActiveClient } from '@/lib/auth/active-client';
import { isClientRecordOwner } from '@/lib/auth/document-access';
import { CLIENT_ACTIONABLE_OFFER_STATUS_VALUES, isClientActionableOfferStatus } from '@/lib/offers/status';
import { recordAdminIncidentSafely } from '@/lib/admin-incidents';
import { beginClientOperation, clientJson, clientOperationTotalMs, recordSlowClientOperation } from '@/lib/client-operations';

export const dynamic = 'force-dynamic';

const escapeHtml = (value: unknown) => String(value ?? '').replace(
    /[&<>'"]/g,
    character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]!)
);

export async function POST(request: NextRequest) {
    const operation = beginClientOperation();
    let clientId: number | null = null;
    let clientEmail: string | null = null;
    let incidentOfferId: number | null = null;
    try {
        const body = await request.json();
        const { offer_id, album_id, message, intent } = body;
        const isAddToOffer = intent === 'add_to_offer';

        if (!offer_id || !album_id) {
            return clientJson({ error: 'Missing offer_id or album_id' }, { status: 400, correlationId: operation.correlationId });
        }
        if (typeof message === 'string' && message.length > 2000) {
            return clientJson({ error: 'Message too long' }, { status: 400, correlationId: operation.correlationId });
        }

        const token = extractToken(request.headers.get('authorization'))
            || request.cookies.get('client_token')?.value
            || request.cookies.get('user_token')?.value;
        const decoded = token ? await verifyToken(token) : null;
        if (!decoded) {
            return clientJson({ error: 'Unauthorized' }, { status: 401, correlationId: operation.correlationId });
        }
        const client = await revalidateActiveClient(decoded);
        if (!client) return clientJson({ error: 'Unauthorized' }, { status: 401, correlationId: operation.correlationId });
        clientId = client.id;
        clientEmail = client.email;
        incidentOfferId = Number(offer_id);

        const album = await prisma.nphotoAlbum.findUnique({ where: { id: Number(album_id) } });
        const offer = await prisma.offer.findUnique({
            where: { id: Number(offer_id) },
            include: { user: true }
        });

        if (!album || !offer) {
            return clientJson({ error: 'Not found' }, { status: 404, correlationId: operation.correlationId });
        }
        if (!isClientRecordOwner(offer, client) || !isClientActionableOfferStatus(offer.status)) {
            return clientJson({ error: 'Not found' }, { status: 404, correlationId: operation.correlationId });
        }
        const stillActionable = await prisma.offer.count({
            where: {
                id: offer.id,
                client_id: client.id,
                updated_at: offer.updated_at,
                status: { in: CLIENT_ACTIONABLE_OFFER_STATUS_VALUES },
            },
        });
        if (stillActionable !== 1) {
            return clientJson({ error: 'Oferta została zmieniona. Odśwież stronę.' }, { status: 409, correlationId: operation.correlationId });
        }

        const offerEmail = client.email;
        const safeAlbumTitle = escapeHtml(album.title);
        const safeOfferTitle = escapeHtml(offer.title);
        const safeEmail = escapeHtml(offerEmail);
        const safeMessage = escapeHtml(message);

        const totalMs = clientOperationTotalMs(operation.startedAt);
        try {
            await prisma.crmActivity.create({
                data: {
                    client_id: client.id,
                    client_email: client.email,
                    action: isAddToOffer ? 'album_add_to_offer' : 'album_interest',
                    entity_type: 'offer',
                    entity_id: offer.id,
                    details: JSON.stringify({ album_id: album.id, album_title: album.title, album_price: album.price, message: message || null, intent: intent || 'interest', correlation_id: operation.correlationId, total_ms: totalMs }),
                }
            });
        } catch (e) {
            await logSystem('WARN', 'SYSTEM', 'CrmActivity album_interest failed', { error: String(e) });
            await recordAdminIncidentSafely({
                severity: 'P1', category: 'AUDIT', reasonCode: 'ALBUM_INTEREST_AUDIT_FAILED',
                summary: 'Nie udało się zapisać audytu zainteresowania albumem',
                clientId, clientEmail, entityType: 'offer', entityId: offer.id,
                correlationId: operation.correlationId,
                details: { error: e instanceof Error ? e.message : String(e) },
            });
        }

        // Notify photographer only when a deployment-specific recipient is configured.
        const notificationEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_FROM;
        try {
            const stillActionableBeforeNotification = await prisma.offer.count({
                where: {
                    id: offer.id,
                    client_id: client.id,
                    updated_at: offer.updated_at,
                    status: { in: CLIENT_ACTIONABLE_OFFER_STATUS_VALUES },
                },
            });
            if (stillActionableBeforeNotification !== 1) {
                return clientJson({ error: 'Oferta została zmieniona. Odśwież stronę.' }, { status: 409, correlationId: operation.correlationId });
            }
            if (!notificationEmail) {
                await logSystem('WARN', 'EMAIL', 'Album interest email skipped: notification recipient is not configured');
                throw new Error('Brak adresu powiadomień administratora');
            }
            await sendEmail({
                to: notificationEmail,
                subject: isAddToOffer
                    ? `KLIENT DODAŁ ALBUM DO OFERTY: ${album.title} (+${album.price} ${album.currency}) — #${offer.offerNumber || offer.id}`
                    : `Klient chce album: ${album.title} — oferta #${offer.offerNumber || offer.id}`,
                html: `
                    <h2>${isAddToOffer ? 'Klient zatwierdził dodanie albumu do oferty' : 'Nowe zainteresowanie albumem'}</h2>
                    <p><strong>Klient:</strong> ${safeEmail}</p>
                    <p><strong>Email:</strong> ${safeEmail}</p>
                    <p><strong>Oferta:</strong> #${offer.offerNumber || offer.id} — ${safeOfferTitle}</p>
                    <hr>
                    <p><strong>Album:</strong> ${safeAlbumTitle}</p>
                    <p><strong>Cena:</strong> ${album.price} ${album.currency}</p>
                    ${message ? `<hr><p><strong>Wiadomość od klienta:</strong><br>${safeMessage}</p>` : ''}
                    <hr>
                    <p style="color:#888">${isAddToOffer ? '<strong>AKCJA:</strong> Zaktualizuj ofertę o cenę albumu i potwierdź klientowi.' : 'Akcja: oddzwon do klienta i potwierdz zamowienie albumu w pakiecie sesji.'}</p>
                `,
            });
        } catch (e) {
            await logSystem('WARN', 'EMAIL', 'Album interest notification failed', { error: String(e) });
            await recordAdminIncidentSafely({
                severity: 'P1', category: 'COMMUNICATION', reasonCode: 'ALBUM_INTEREST_NOTIFICATION_FAILED',
                summary: 'Nie udało się przekazać zainteresowania albumem administratorowi',
                clientId, clientEmail, entityType: 'offer', entityId: offer.id,
                correlationId: operation.correlationId,
                details: { error: e instanceof Error ? e.message : String(e) },
            });
            return clientJson({ error: 'Nie udało się przekazać wiadomości.' }, { status: 502, correlationId: operation.correlationId });
        }

        await recordSlowClientOperation({
            operation: 'album_interest', startedAt: operation.startedAt, correlationId: operation.correlationId,
            clientId, clientEmail, entityType: 'offer', entityId: offer.id, outcome: 'success',
        });
        return clientJson({ success: true }, { correlationId: operation.correlationId });
    } catch (error: any) {
        console.error('Album interest POST error:', { correlationId: operation.correlationId, error });
        await recordAdminIncidentSafely({
            severity: 'P1', category: 'CLIENT_PORTAL', reasonCode: 'ALBUM_INTEREST_FAILED',
            summary: 'Nie udało się obsłużyć zainteresowania albumem', clientId, clientEmail,
            entityType: 'offer', entityId: incidentOfferId, correlationId: operation.correlationId,
            details: { error: error instanceof Error ? error.message : String(error) },
        });
        return clientJson({ error: 'Nie udało się obsłużyć wiadomości.' }, { status: 500, correlationId: operation.correlationId });
    }
}
