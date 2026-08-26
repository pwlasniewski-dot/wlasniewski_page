import { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { sendEmail } from '@/lib/email/sender';
import { generateContractEmail } from '@/lib/email-templates';
import { generateContractPDF } from '@/lib/services/pdf';
import { deleteFromS3, getPrivateS3Object, uploadToS3 } from '@/lib/storage/s3';
import {
    OWNER_EMAIL,
    buildLoginUrl,
    buildPasswordSetupUrl,
    normalizeEmail,
} from '@/lib/crm/delivery';
import { ensurePasswordSetupToken } from '@/lib/auth/password-setup-token';
import { randomUUID } from 'node:crypto';
import { recordAdminIncidentSafely } from '@/lib/admin-incidents';
import { jsonWithCorrelation } from '@/lib/http/correlation';
import {
    captureContractVersion,
    completeEmailOutbox,
    failEmailOutbox,
    immutablePayloadHash,
    stageEmailOutbox,
} from '@/lib/messaging/outbox';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    return withAuth(request, async req => {
        const correlationId = req.headers.get('x-correlation-id') || randomUUID();
        const respond = (body: unknown, status = 200) => jsonWithCorrelation(body, correlationId, status);
        let incidentContractId: number | null = null;
        let incidentClientId: number | null = null;
        let incidentClientEmail: string | null = null;
        let phase = 'load_contract';
        let outboxId: string | null = null;
        let emailDelivered = false;
        let contractClaimed = false;
        let generatedPdfUrl: string | null = null;
        let originalPdfUrl: string | null = null;
        try {
            const { id } = await context.params;
            const contractId = Number(id);
            incidentContractId = Number.isInteger(contractId) ? contractId : null;
            if (!Number.isInteger(contractId)) {
                return respond({ error: 'Nieprawidłowe ID umowy', correlation_id: correlationId }, 400);
            }

            const contract = await prisma.contract.findUnique({
                where: { id: contractId },
                include: { user: true, offer: { include: { user: true } } },
            });
            if (!contract) return respond({ error: 'Umowa nie znaleziona', correlation_id: correlationId }, 404);
            const currentStatus = contract.status.trim().toLowerCase();
            originalPdfUrl = contract.pdf_url;
            if (currentStatus === 'sent') {
                return respond({ success: true, alreadySent: true, message: 'Umowa została już wysłana.' });
            }
            if (currentStatus === 'signed') {
                return respond({ error: 'Podpisanej umowy nie wysyła się ponownie jako oczekującej na podpis.', correlation_id: correlationId }, 409);
            }
            if (currentStatus !== 'draft') {
                return respond({ error: `Umowy ze statusem ${currentStatus} nie można wysłać.`, correlation_id: correlationId }, 409);
            }

            const clientId = contract.client_id || contract.offer?.client_id;
            incidentClientId = clientId || null;
            if (!clientId) return respond({ error: 'Umowa nie jest przypisana do konta klienta', correlation_id: correlationId }, 409);
            const client = contract.user || contract.offer?.user || await prisma.user.findUnique({ where: { id: clientId } });
            const clientEmail = normalizeEmail(client?.email || contract.offer?.client_email);
            incidentClientEmail = clientEmail;
            if (!client || client.role !== 'CLIENT' || !client.is_active || client.deleted_at || !clientEmail || normalizeEmail(client.email) !== clientEmail) {
                return respond({ error: 'Powiązane konto klienta jest nieprawidłowe', correlation_id: correlationId }, 409);
            }

            const returnTo = `/strefa-klienta/umowy/${contract.id}`;
            let contractUrl: string;
            if (!client.last_login || client.password_reset_required) {
                const token = await ensurePasswordSetupToken(client);
                contractUrl = buildPasswordSetupUrl(token, returnTo);
            } else {
                contractUrl = buildLoginUrl(returnTo);
            }

            phase = 'claim_contract';
            const claimed = await prisma.contract.updateMany({
                where: { id: contract.id, status: contract.status, updated_at: contract.updated_at },
                data: { status: 'sending' },
            });
            if (claimed.count !== 1) {
                return respond({ error: 'Wysyłka tej umowy już trwa lub jej dane zostały zmienione.', correlation_id: correlationId }, 409);
            }
            contractClaimed = true;

            const isStandalonePdf = Boolean(contract.pdf_url)
                && (contract.content?.startsWith('Umowa wgrana jako PDF') || !contract.content?.trim());
            let pdfUrl = contract.pdf_url;
            const attachments: Array<Record<string, unknown>> = [];
            if (isStandalonePdf) {
                phase = 'load_pdf';
                if (!pdfUrl) throw new Error('Brak pliku PDF umowy');
                const storedPdf = await getPrivateS3Object(pdfUrl);
                const storedPdfBuffer = Buffer.from(await storedPdf.body.transformToByteArray());
                attachments.push({
                    filename: `Umowa_${contract.contract_number || contract.id}.pdf`,
                    content: storedPdfBuffer,
                    contentType: storedPdf.contentType || 'application/pdf',
                });
            } else {
                phase = 'prepare_pdf';
                const pdfBuffer = await generateContractPDF(contract, false);
                if (!pdfBuffer.length) throw new Error('Wygenerowany PDF umowy jest pusty');
                const key = `contracts/umowa_${contract.contract_number || contract.id}_wyslana_${randomUUID()}.pdf`;
                pdfUrl = await uploadToS3(pdfBuffer, key, 'application/pdf', { access: 'private' });
                generatedPdfUrl = pdfUrl;
                attachments.push({ filename: `Umowa_${contract.contract_number || contract.id}.pdf`, content: pdfBuffer, contentType: 'application/pdf' });
                const pdfPersisted = await prisma.contract.updateMany({
                    where: { id: contract.id, status: 'sending' },
                    data: { pdf_url: pdfUrl },
                });
                if (pdfPersisted.count !== 1) throw new Error('Umowa zmieniła stan podczas przygotowania PDF');
            }

            if (!pdfUrl) throw new Error('Brak pliku PDF umowy');
            const subject = `Umowa ${contract.contract_number || `#${contract.id}`} jest gotowa do podpisania`;
            const versionPayload = {
                contract_id: contract.id,
                contract_number: contract.contract_number,
                offer_id: contract.offer_id,
                client_id: client.id,
                recipient: clientEmail,
                pdf_key: pdfUrl,
                content_hash: immutablePayloadHash(contract.content || ''),
            };
            phase = 'stage_outbox';
            const staged = await stageEmailOutbox({
                idempotencyKey: `contract:${contract.id}:send:${immutablePayloadHash(versionPayload)}`,
                messageType: 'CONTRACT_SENT', recipient: clientEmail, subject,
                payload: versionPayload, entityType: 'contract', entityId: contract.id,
            });
            outboxId = staged?.outbox.id || null;
            if (staged && !staged.claimed) {
                if (staged.alreadySent) {
                    emailDelivered = true;
                    const reconciled = await prisma.$transaction([
                        prisma.contract.updateMany({
                            where: { id: contract.id, status: 'sending' },
                            data: { status: 'sent', client_id: client.id },
                        }),
                        prisma.crmActivity.create({
                            data: {
                                client_id: client.id, client_email: clientEmail,
                                action: 'contract_sent', entity_type: 'contract', entity_id: contract.id,
                                details: JSON.stringify({
                                    recipient: clientEmail, pdfUrl, reconciliation: 'outbox_already_sent', correlation_id: correlationId,
                                }),
                                ip_address: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
                                user_agent: req.headers.get('user-agent')?.substring(0, 500) || null,
                            },
                        }),
                    ]);
                    if (reconciled[0].count !== 1) throw new Error('Nie udało się uzgodnić dostarczonej umowy');
                    await captureContractVersion({
                        contractId: contract.id, payload: versionPayload, pdfKey: pdfUrl,
                        status: 'sent', sentAt: staged.outbox.sent_at || new Date(),
                    }).catch(error => console.error('[CONTRACT_SEND] Reconciliation version write failed', { contractId: contract.id, correlationId, error }));
                    return respond({ success: true, alreadySent: true, message: 'Umowa została już wysłana.' });
                }
                throw new Error('Wysyłka tej wiadomości jest już przetwarzana');
            }
            phase = 'send_email';
            const delivery = await sendEmail({
                to: clientEmail,
                bcc: OWNER_EMAIL,
                subject,
                attachments,
                html: generateContractEmail({
                    clientName: client.name || 'Kliencie',
                    contractNumber: contract.contract_number || `#${contract.id}`,
                    offerTitle: contract.offer?.title || 'Umowa fotograficzna',
                    portalUrl: contractUrl,
                    hasPdf: true,
                }),
            });
            emailDelivered = true;
            if (outboxId) {
                await completeEmailOutbox(outboxId, delivery.messageId).catch(error => {
                    console.error('[CONTRACT_SEND] Outbox completion failed after delivery', { outboxId, correlationId, error });
                });
            }

            phase = 'persist_delivery';
            const persisted = await prisma.$transaction([
                prisma.contract.updateMany({ where: { id: contract.id, status: 'sending' }, data: { status: 'sent', client_id: client.id } }),
                prisma.crmActivity.create({
                    data: {
                        client_id: client.id,
                        client_email: clientEmail,
                        action: 'contract_sent',
                        entity_type: 'contract',
                        entity_id: contract.id,
                        details: JSON.stringify({
                            recipient: clientEmail,
                            messageId: delivery.messageId,
                            pdfUrl,
                            pdfVersion: isStandalonePdf ? 'uploaded' : `generated:${contract.updated_at.toISOString()}`,
                        }),
                        ip_address: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
                        user_agent: req.headers.get('user-agent')?.substring(0, 500) || null,
                    },
                }),
            ]);
            if (persisted[0].count !== 1) throw new Error('Nie udało się atomowo oznaczyć umowy jako wysłanej');
            await captureContractVersion({
                contractId: contract.id,
                payload: versionPayload,
                pdfKey: pdfUrl,
                status: 'sent',
                sentAt: new Date(),
            }).catch(error => {
                console.error('[CONTRACT_SEND] Contract version dual-write failed after delivery', { contractId: contract.id, correlationId, error });
            });

            return respond({ success: true, message: `Umowa i PDF zostały wysłane do ${clientEmail}`, pdfUrl });
        } catch (error) {
            console.error('[CONTRACT_SEND] Delivery failed:', error);
            if (emailDelivered) {
                if (incidentContractId) {
                    await prisma.contract.updateMany({
                        where: { id: incidentContractId, status: 'sending' },
                        data: { status: 'sent' },
                    }).catch(reconcileError => console.error('[CONTRACT_SEND] Delivered state reconciliation failed', {
                        incidentContractId, correlationId, reconcileError,
                    }));
                }
                await recordAdminIncidentSafely({
                    severity: 'P1', category: 'COMMUNICATION', reasonCode: 'CONTRACT_DELIVERED_STATE_PERSIST_FAILED',
                    summary: 'Umowa została dostarczona, ale zapis stanu po wysyłce wymaga uzgodnienia',
                    clientId: incidentClientId, clientEmail: incidentClientEmail,
                    entityType: 'contract', entityId: incidentContractId, correlationId,
                    details: { phase, error: error instanceof Error ? error.message : String(error) },
                });
                return respond({
                    success: true,
                    deliveryCompleted: true,
                    reconciliationRequired: true,
                    warning: 'Wiadomość została wysłana, ale zapis stanu wymaga weryfikacji administratora.',
                    correlation_id: correlationId,
                }, 202);
            }
            let claimReleased = false;
            if (contractClaimed && incidentContractId) {
                const released = await prisma.contract.updateMany({
                    where: { id: incidentContractId, status: 'sending' },
                    data: {
                        status: 'draft',
                        ...(generatedPdfUrl ? { pdf_url: originalPdfUrl } : {}),
                    },
                }).catch(releaseError => {
                    console.error('[CONTRACT_SEND] Failed to release contract claim', {
                        incidentContractId, correlationId, releaseError,
                    });
                    return { count: 0 };
                });
                claimReleased = released.count === 1;
            }
            if (generatedPdfUrl && claimReleased) {
                await deleteFromS3(generatedPdfUrl).catch(cleanupError => console.error('[CONTRACT_SEND] Generated PDF cleanup failed', {
                    incidentContractId, correlationId, cleanupError,
                }));
            }
            if (outboxId) {
                await failEmailOutbox(outboxId, error).catch(outboxError => {
                    console.error('[CONTRACT_SEND] Outbox failure write failed', { outboxId, correlationId, outboxError });
                });
            }
            await recordAdminIncidentSafely({
                severity: 'P1',
                category: 'COMMUNICATION',
                reasonCode: 'CONTRACT_EMAIL_DELIVERY_FAILED',
                summary: 'Nie udało się wysłać umowy z dokumentem PDF',
                clientId: incidentClientId,
                clientEmail: incidentClientEmail,
                entityType: 'contract',
                entityId: incidentContractId,
                correlationId,
                details: { phase, error: error instanceof Error ? error.message : String(error) },
            });
            return respond({
                success: false,
                error: 'Umowa nie została wysłana',
                details: error instanceof Error ? error.message : String(error),
                correlation_id: correlationId,
            }, 502);
        }
    });
}
