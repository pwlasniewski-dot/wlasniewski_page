import { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { sendEmail } from '@/lib/email/sender';
import { generateOfferEmail } from '@/lib/email-templates';
import { generateOfferPDF } from '@/lib/services/pdf';
import { getPrivateS3Object, uploadToS3 } from '@/lib/storage/s3';
import { hasUnambiguousA4Price } from '@/lib/offers/draft-total';
import { isUnsendableOfferStatus, normalizeOfferStatus } from '@/lib/offers/status';
import {
    OWNER_EMAIL,
    buildLoginUrl,
    buildPasswordSetupUrl,
    normalizeEmail,
} from '@/lib/crm/delivery';
import { ensurePasswordSetupToken } from '@/lib/auth/password-setup-token';
import { randomUUID } from 'node:crypto';
import { recordAdminIncidentSafely } from '@/lib/admin-incidents';
import { captureOfferVersion, completeEmailOutbox, failEmailOutbox, stageEmailOutbox } from '@/lib/messaging/outbox';
import { jsonWithCorrelation } from '@/lib/http/correlation';

function offerSummary(offer: any): string {
    const td = offer.template_data as any;
    if (td && Array.isArray(td.pricingHeaders) && Array.isArray(td.footerPrices)) {
        const recommended = Number.isInteger(Number(td.recommendationColumnIndex))
            ? Number(td.recommendationColumnIndex)
            : 1;
        const columns = td.pricingHeaders.map((heading: string, index: number) => {
            const price = td.footerPrices[index];
            if (!heading || !price || index === 0) return '';
            return `<li style="margin:6px 0;color:${index === recommended ? '#c5a059' : '#aaa'}"><strong>${heading}:</strong> ${price}${index === recommended ? ' — rekomendowany' : ''}</li>`;
        }).join('');
        return columns ? `<ul style="padding-left:20px;margin:0">${columns}</ul>` : '';
    }

    return offer.sections.map((section: any) => {
        const items = section.items.map((item: any) =>
            `<li style="margin:5px 0;color:#aaa"><strong>${item.title}</strong>: ${item.price} PLN${item.quantity > 1 ? ` × ${item.quantity}` : ''}</li>`,
        ).join('');
        return `<div style="margin:12px 0"><div style="color:#c5a059;font-weight:600">${section.title}</div><ul style="padding-left:20px">${items}</ul></div>`;
    }).join('');
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    return withAuth(request, async req => {
        const correlationId = req.headers.get('x-correlation-id') || randomUUID();
        const respond = (body: unknown, status = 200) => jsonWithCorrelation(body, correlationId, status);
        let incidentOfferId: number | null = null;
        let incidentClientId: number | null = null;
        let incidentClientEmail: string | null = null;
        let phase = 'load_offer';
        let outboxId: string | null = null;
        let emailDelivered = false;
        let offerClaimed = false;
        try {
            const { id } = await context.params;
            const offerId = Number(id);
            incidentOfferId = Number.isInteger(offerId) ? offerId : null;
            if (!Number.isInteger(offerId)) {
                return respond({ error: 'Nieprawidłowe ID oferty', correlation_id: correlationId }, 400);
            }

            const offer = await prisma.offer.findUnique({
                where: { id: offerId },
                include: { user: true, sections: { include: { items: true }, orderBy: { order: 'asc' } } },
            });
            if (!offer) return respond({ error: 'Oferta nie znaleziona', correlation_id: correlationId }, 404);
            const currentStatus = normalizeOfferStatus(offer.status);
            if (offer.is_template || currentStatus === 'template') {
                return respond({ error: 'Nie można wysłać szablonu oferty', correlation_id: correlationId }, 409);
            }
            if (isUnsendableOfferStatus(currentStatus)) {
                return respond({
                    error: `Oferty ze statusem ${currentStatus} nie można wysłać ponownie jako nowej wersji`,
                    correlation_id: correlationId,
                }, 409);
            }
            if (currentStatus === 'sent' || currentStatus === 'open') {
                return respond({ success: true, alreadySent: true, message: 'Oferta została już wysłana.' });
            }
            if (currentStatus !== 'draft') {
                return respond({ error: `Oferty ze statusem ${currentStatus} nie można wysłać.`, correlation_id: correlationId }, 409);
            }
            if (offer.total_price <= 0) {
                await recordAdminIncidentSafely({
                    severity: 'P2', category: 'OFFER', reasonCode: 'OFFER_ZERO_PRICE_PREVENTED',
                    summary: 'Zablokowano wysyłkę oferty bez dodatniej ceny', entityType: 'offer', entityId: offer.id,
                    clientId: offer.client_id, clientEmail: offer.client_email, correlationId,
                });
                return respond({ error: 'Oferta nie ma poprawnej, jednoznacznej ceny', correlation_id: correlationId }, 409);
            }
            if (offer.template_data && !hasUnambiguousA4Price(offer.template_data)) {
                await recordAdminIncidentSafely({
                    severity: 'P2', category: 'OFFER', reasonCode: 'OFFER_ZERO_PRICE_PREVENTED',
                    summary: 'Zablokowano wysyłkę oferty z niejednoznacznym wariantem ceny', entityType: 'offer', entityId: offer.id,
                    clientId: offer.client_id, clientEmail: offer.client_email, correlationId,
                });
                return respond({ error: 'Wskaż jednoznacznie rekomendowany wariant i jego cenę', correlation_id: correlationId }, 409);
            }

            const recipientEmail = normalizeEmail(offer.user?.email || offer.client_email);
            incidentClientId = offer.client_id;
            incidentClientEmail = recipientEmail;
            if (!recipientEmail || !offer.client_id) {
                return respond({ error: 'Najpierw przypisz ofertę do istniejącego konta klienta', correlation_id: correlationId }, 409);
            }
            const client = offer.user || await prisma.user.findUnique({ where: { id: offer.client_id } });
            if (!client || normalizeEmail(client.email) !== recipientEmail || client.role !== 'CLIENT' || !client.is_active || client.deleted_at) {
                return respond({ error: 'Powiązane konto klienta jest nieprawidłowe', correlation_id: correlationId }, 409);
            }

            const returnTo = `/strefa-klienta/oferty/${offer.id}`;
            let offerUrl: string;
            if (!client.last_login || client.password_reset_required) {
                const token = await ensurePasswordSetupToken(client);
                offerUrl = buildPasswordSetupUrl(token, returnTo);
            } else {
                offerUrl = buildLoginUrl(returnTo);
            }

            phase = 'claim_offer';
            const offerClaim = await prisma.offer.updateMany({
                where: { id: offer.id, status: offer.status, updated_at: offer.updated_at },
                data: { status: 'sending' },
            });
            if (offerClaim.count !== 1) {
                return respond({ error: 'Wysyłka tej oferty już trwa lub jej dane zostały zmienione.', correlation_id: correlationId }, 409);
            }
            offerClaimed = true;

            const isGenerated = Boolean(offer.template_data) || offer.sections.length > 0;
            let pdfUrl = offer.pdf_url;
            let pdfBuffer: Buffer | null = null;
            const attachments: Array<Record<string, unknown>> = [];

            if (isGenerated) {
                phase = 'prepare_pdf';
                pdfBuffer = await generateOfferPDF(offer, false);
                if (!pdfBuffer.length) throw new Error('Wygenerowany PDF oferty jest pusty');
                const key = `offers/oferta_${offer.offerNumber || offer.id}_wyslana.pdf`;
                pdfUrl = await uploadToS3(pdfBuffer, key, 'application/pdf', { access: 'private' });
                attachments.push({ filename: `Oferta_${offer.offerNumber || offer.id}.pdf`, content: pdfBuffer, contentType: 'application/pdf' });
                await prisma.offer.update({ where: { id: offer.id }, data: { pdf_url: pdfUrl } });
            } else {
                phase = 'load_pdf';
                if (!pdfUrl) throw new Error('Brak pliku PDF oferty do wysłania');
                const storedPdf = await getPrivateS3Object(pdfUrl);
                const storedPdfBuffer = Buffer.from(await storedPdf.body.transformToByteArray());
                attachments.push({
                    filename: `Oferta_${offer.offerNumber || offer.id}.pdf`,
                    content: storedPdfBuffer,
                    contentType: storedPdf.contentType || 'application/pdf',
                });
            }

            const subject = `Oferta ${offer.offerNumber || `#${offer.id}`}: ${offer.title}`;
            phase = 'stage_outbox';
            const versionPayload = {
                offer_id: offer.id,
                offer_number: offer.offerNumber,
                title: offer.title,
                total_price: offer.total_price,
                recipient: recipientEmail,
                pdf_key: pdfUrl,
                template_version: offer.template_data ? offer.updated_at.toISOString() : null,
            };
            const staged = await stageEmailOutbox({
                idempotencyKey: `offer:${offer.id}:send:${offer.updated_at.toISOString()}:${recipientEmail}`,
                messageType: 'OFFER_SENT', recipient: recipientEmail, subject,
                payload: versionPayload, entityType: 'offer', entityId: offer.id,
            });
            if (staged && !staged.claimed) {
                if (staged.alreadySent) {
                    await prisma.offer.updateMany({ where: { id: offer.id, status: 'sending' }, data: { status: 'sent' } });
                    return respond({ success: true, alreadySent: true, message: 'Oferta została już wysłana.' });
                }
                throw new Error('Wysyłka tej wiadomości jest już przetwarzana');
            }
            outboxId = staged?.outbox.id || null;

            phase = 'send_email';
            const delivery = await sendEmail({
                to: recipientEmail,
                bcc: OWNER_EMAIL,
                subject,
                attachments,
                html: generateOfferEmail({
                    clientName: client.name || 'Kliencie',
                    offerNumber: offer.offerNumber || `#${offer.id}`,
                    offerTitle: offer.title,
                    offerCategory: offer.category || undefined,
                    totalPrice: offer.total_price,
                    validUntil: offer.valid_until?.toLocaleDateString('pl-PL'),
                    offerUrl,
                    type: offer.type === 'b2b' ? 'b2b' : 'b2c',
                    summaryHtml: offerSummary(offer),
                    hasPdf: true,
                }),
            });
            emailDelivered = true;
            if (outboxId) {
                await completeEmailOutbox(outboxId, delivery.messageId).catch(error => {
                    console.error('[OFFER_SEND] Outbox completion failed after delivery', { outboxId, correlationId, error });
                });
            }

            const details = JSON.stringify({
                recipient: recipientEmail,
                messageId: delivery.messageId,
                pdfUrl,
                pdfVersion: isGenerated ? `generated:${offer.updated_at.toISOString()}` : 'uploaded',
                templateVersion: offer.template_data ? offer.updated_at.toISOString() : null,
            });
            phase = 'persist_delivery';
            const persisted = await prisma.$transaction([
                prisma.offer.updateMany({ where: { id: offer.id, status: 'sending' }, data: { status: 'sent', client_email: recipientEmail } }),
                prisma.crmActivity.create({
                    data: {
                        client_id: client.id,
                        client_email: recipientEmail,
                        action: 'offer_sent',
                        entity_type: 'offer',
                        entity_id: offer.id,
                        details,
                        ip_address: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
                        user_agent: req.headers.get('user-agent')?.substring(0, 500) || null,
                    },
                }),
            ]);
            if (persisted[0].count !== 1) throw new Error('Nie udało się atomowo oznaczyć oferty jako wysłanej');
            await captureOfferVersion({
                offerId: offer.id, payload: versionPayload, pdfKey: pdfUrl, status: 'sent', sentAt: new Date(),
            }).catch(error => {
                console.error('[OFFER_SEND] Offer version dual-write failed after delivery', { offerId: offer.id, correlationId, error });
            });

            return respond({ success: true, message: `Oferta i PDF zostały wysłane do ${recipientEmail}`, pdfUrl });
        } catch (error) {
            console.error('[OFFER_SEND] Delivery failed:', error);
            if (emailDelivered) {
                if (incidentOfferId) {
                    await prisma.offer.updateMany({
                        where: { id: incidentOfferId, status: 'sending' },
                        data: { status: 'sent' },
                    }).catch(reconcileError => console.error('[OFFER_SEND] Delivered state reconciliation failed', {
                        incidentOfferId, correlationId, reconcileError,
                    }));
                }
                await recordAdminIncidentSafely({
                    severity: 'P1', category: 'COMMUNICATION', reasonCode: 'OFFER_DELIVERED_STATE_PERSIST_FAILED',
                    summary: 'Oferta została dostarczona, ale zapis stanu po wysyłce wymaga uzgodnienia',
                    clientId: incidentClientId, clientEmail: incidentClientEmail,
                    entityType: 'offer', entityId: incidentOfferId, correlationId,
                    details: { phase, error: error instanceof Error ? error.message : String(error) },
                });
                return respond({
                    success: true,
                    deliveryCompleted: true,
                    reconciliationRequired: true,
                    warning: 'Wiadomość została wysłana, ale zapis stanu wymaga weryfikacji administratora.',
                    correlationId,
                }, 202);
            }
            if (offerClaimed && !emailDelivered && incidentOfferId) {
                await prisma.offer.updateMany({
                    where: { id: incidentOfferId, status: 'sending' },
                    data: { status: 'draft' },
                }).catch(revertError => console.error('[OFFER_SEND] Failed to release offer claim', { incidentOfferId, revertError }));
            }
            if (outboxId && !emailDelivered) {
                await failEmailOutbox(outboxId, error).catch(outboxError => {
                    console.error('[OFFER_SEND] Outbox failure write failed', { outboxId, correlationId, outboxError });
                });
            }
            await recordAdminIncidentSafely({
                severity: 'P1',
                category: 'COMMUNICATION',
                reasonCode: 'OFFER_EMAIL_DELIVERY_FAILED',
                summary: 'Nie udało się wysłać oferty z dokumentem PDF',
                clientId: incidentClientId,
                clientEmail: incidentClientEmail,
                entityType: 'offer',
                entityId: incidentOfferId,
                correlationId,
                details: { phase, error: error instanceof Error ? error.message : String(error) },
            });
            return respond({
                success: false,
                error: 'Oferta nie została wysłana',
                details: error instanceof Error ? error.message : String(error),
                correlation_id: correlationId,
            }, 502);
        }
    });
}
