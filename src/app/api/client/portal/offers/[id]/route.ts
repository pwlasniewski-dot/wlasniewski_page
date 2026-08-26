import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyToken, extractToken } from '@/lib/auth/jwt';
import { sendEmail, getAdminEmail } from '@/lib/email/sender';
import { generateOfferPDF } from '@/lib/services/pdf';
import { deleteFromS3, uploadToS3 } from '@/lib/storage/s3';
import { logClientActivity, logClientActivityStrict } from '@/lib/crm-activity';
import { canonicalizeAcceptedOfferSelection, OfferSelectionError } from '@/lib/offers/calculateAcceptedOfferTotal';
import {
    CLIENT_ACTIONABLE_OFFER_STATUS_VALUES,
    isClientActionableOfferStatus,
    isClientVisibleOfferStatus,
    normalizeOfferStatus,
} from '@/lib/offers/status';
import { randomUUID } from 'crypto';
import { revalidateActiveClient } from '@/lib/auth/active-client';
import { recordAdminIncidentSafely } from '@/lib/admin-incidents';
import { isClientRecordOwner } from '@/lib/auth/document-access';
import { isClientVisibleContractStatus } from '@/lib/contracts/status';
import { clientJson, clientOperationTotalMs, recordSlowClientOperation } from '@/lib/client-operations';
import { escapeHtml } from '@/lib/security/output';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlationId = randomUUID();
    const startedAt = performance.now();
    try {
        // Extract and verify token
        const token = extractToken(request.headers.get('authorization')) ||
            request.cookies.get('client_token')?.value;

        if (!token) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const decoded = await verifyToken(token);
        if (!decoded) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }
        const client = await revalidateActiveClient(decoded);
        if (!client) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const offerId = parseInt(id);

        // Fetch offer and verify ownership
        const offer = await prisma.offer.findUnique({
            where: { id: offerId },
            include: {
                sections: {
                    include: {
                        items: true,
                    },
                },
                negotiations: true,
                contract: true,
            },
        });

        if (!offer) {
            return NextResponse.json(
                { error: 'Offer not found' },
                { status: 404 }
            );
        }

        if (!isClientVisibleOfferStatus(offer.status)) {
            return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
        }

        // Verify client owns this offer
        if (!isClientRecordOwner(offer, client)) {
            if (offer.client_id !== null
                && offer.client_id !== client.id
                && offer.client_email?.trim().toLowerCase() === client.email.trim().toLowerCase()) {
                await recordAdminIncidentSafely({
                    severity: 'P1', category: 'DATA_INTEGRITY', reasonCode: 'CLIENT_OFFER_OWNERSHIP_CONFLICT',
                    summary: 'E-mail oferty wskazuje inne konto niż nadrzędny client_id',
                    clientId: client.id, clientEmail: client.email, entityType: 'offer', entityId: offerId,
                    correlationId, details: { authoritative_client_id: offer.client_id },
                });
            }
            return clientJson({ error: 'Offer not found' }, { status: 404, correlationId });
        }

        // CRM Activity: offer viewed
        await logClientActivity(decoded, 'offer_viewed', {
            entityType: 'offer',
            entityId: offerId,
            details: {
                title: offer.title, status: offer.status, correlation_id: correlationId,
                total_ms: clientOperationTotalMs(startedAt), outcome: 'success',
            },
            request,
        });
        await recordSlowClientOperation({
            operation: 'offer_open', startedAt, correlationId, clientId: client.id, clientEmail: client.email,
            entityType: 'offer', entityId: offerId, outcome: 'success',
        });

        return clientJson({
            offer: {
                ...offer,
                contract: offer.contract && isClientVisibleContractStatus(offer.contract.status)
                    ? offer.contract
                    : null,
            },
        }, { correlationId });
    } catch (error) {
        console.error('Error fetching offer:', error);
        await recordAdminIncidentSafely({
            severity: 'P1', category: 'CLIENT_PORTAL', reasonCode: 'OFFER_OPEN_FAILED',
            summary: 'Nie udało się otworzyć oferty klienta', correlationId,
            details: { error: error instanceof Error ? error.message : String(error) },
        });
        return clientJson({ error: 'Nie udało się otworzyć oferty.' }, { status: 500, correlationId });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlationId = randomUUID();
    const startedAt = performance.now();
    let decisionCommitted = false;
    let committedOfferSnapshot: Record<string, unknown> | null = null;
    try {
        // Extract and verify token
        const token = extractToken(request.headers.get('authorization')) ||
            request.cookies.get('client_token')?.value;

        if (!token) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const decoded = await verifyToken(token);
        if (!decoded) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }
        const client = await revalidateActiveClient(decoded);
        if (!client) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const offerId = parseInt(id);
        const body = await request.json();
        const { action, message } = body;

        if (!['accept', 'reject', 'negotiate', 'request_unlock'].includes(action)) {
            return NextResponse.json({ error: 'Nieznana akcja oferty' }, { status: 400 });
        }

        // Fetch offer and verify ownership
        const offer = await prisma.offer.findUnique({
            where: { id: offerId },
            include: { sections: { include: { items: true } } },
        });

        if (!offer) {
            return NextResponse.json(
                { error: 'Offer not found' },
                { status: 404 }
            );
        }

        // Verify client owns this offer
        if (!isClientRecordOwner(offer, client)) {
            if (offer.client_id !== null
                && offer.client_id !== client.id
                && offer.client_email?.trim().toLowerCase() === client.email.trim().toLowerCase()) {
                await recordAdminIncidentSafely({
                    severity: 'P1', category: 'DATA_INTEGRITY', reasonCode: 'CLIENT_OFFER_OWNERSHIP_CONFLICT',
                    summary: 'E-mail oferty wskazuje inne konto niż nadrzędny client_id',
                    clientId: client.id, clientEmail: client.email, entityType: 'offer', entityId: offerId,
                    correlationId, details: { authoritative_client_id: offer.client_id, action },
                });
            }
            return clientJson({ error: 'Offer not found' }, { status: 404, correlationId });
        }

        const recordNotificationFailure = async (
            reasonCode: string,
            summary: string,
            notificationError: unknown,
        ) => recordAdminIncidentSafely({
            severity: 'P1',
            category: 'COMMUNICATION',
            reasonCode,
            summary,
            clientId: client.id,
            clientEmail: client.email,
            entityType: 'offer',
            entityId: offerId,
            correlationId,
            details: {
                action,
                error: notificationError instanceof Error ? notificationError.message : String(notificationError),
            },
        });

        const currentStatus = normalizeOfferStatus(offer.status);
        const isActionable = isClientActionableOfferStatus(currentStatus);

        if ((action === 'accept' && currentStatus === 'accepted')
            || (action === 'reject' && currentStatus === 'rejected')) {
            return clientJson({ success: true, idempotent: true, offer }, { correlationId });
        }

        if (action === 'request_unlock') {
            if (currentStatus !== 'accepted') {
                return NextResponse.json({ error: 'Prośbę o zmianę można wysłać tylko dla zaakceptowanej oferty.' }, { status: 409 });
            }
        } else if (!isActionable) {
            return NextResponse.json({
                error: `Akcja ${action} nie jest dostępna dla oferty ze statusem ${currentStatus || 'nieznanym'}.`,
            }, { status: 409 });
        }
        const negotiationMessage = typeof message === 'string' ? message.trim() : '';
        if (action === 'negotiate' && !negotiationMessage) {
            return NextResponse.json({ error: 'Wiadomość negocjacyjna jest wymagana.' }, { status: 400 });
        }
        if (action === 'negotiate' && negotiationMessage.length > 2000) {
            return NextResponse.json({ error: 'Wiadomość negocjacyjna może mieć maksymalnie 2000 znaków.' }, { status: 400 });
        }
        if (action === 'negotiate' && isActionable) {
            const existingNegotiation = await prisma.negotiation.findFirst({
                where: { offer_id: offerId, sender: 'client', message: negotiationMessage },
                orderBy: { created_at: 'desc' },
                select: { id: true },
            });
            if (existingNegotiation) {
                return clientJson({ success: true, idempotent: true, offer }, { correlationId });
            }
        }
        if (action !== 'request_unlock' && offer.valid_until && offer.valid_until < new Date()) {
            return NextResponse.json({ error: 'Termin ważności oferty minął.' }, { status: 410 });
        }

        // Handle different actions
        if (action === 'accept') {
            if (offer.is_template || !isClientActionableOfferStatus(offer.status)) {
                return NextResponse.json(
                    { error: 'Tej wersji oferty nie można zaakceptować. Poproś fotografa o aktualną wersję.' },
                    { status: 409 },
                );
            }
            let parsedTotalPrice: number;
            let trustedSelection: Record<string, unknown>;
            try {
                const canonical = canonicalizeAcceptedOfferSelection(offer as any, body.client_selection);
                parsedTotalPrice = canonical.total;
                trustedSelection = canonical.selection;
            } catch (error) {
                const message = error instanceof OfferSelectionError
                    ? error.message
                    : 'Nie można potwierdzić ceny oferty. Odśwież stronę lub skontaktuj się z fotografem.';
                return NextResponse.json({ error: message }, { status: 409 });
            }

            const shouldGenerateAcceptedPdf = Boolean(offer.template_data) || offer.sections.length > 0;
            let acceptedPdfKey = offer.pdf_url;
            let uploadedAcceptedPdf: string | null = null;

            if (shouldGenerateAcceptedPdf) {
                const acceptedSnapshot = {
                    ...offer,
                    status: 'accepted',
                    client_selection: trustedSelection,
                    total_price: parsedTotalPrice,
                };
                const pdfBuffer = await generateOfferPDF(acceptedSnapshot, true);
                if (!pdfBuffer.length) throw new Error('Wygenerowany PDF zaakceptowanej oferty jest pusty');
                const key = `offers/oferta_${offer.offerNumber || offerId}_zatwierdzona_${randomUUID()}.pdf`;
                uploadedAcceptedPdf = await uploadToS3(pdfBuffer, key, 'application/pdf', { access: 'private' });
                acceptedPdfKey = uploadedAcceptedPdf;
            } else if (!acceptedPdfKey) {
                return NextResponse.json({ error: 'Oferta nie ma dokumentu PDF do zaakceptowania.' }, { status: 409 });
            }

            const acceptedAt = new Date();
            let accepted: { count: number };
            try {
                accepted = await prisma.$transaction(async (tx) => {
                    const claimed = await tx.offer.updateMany({
                        where: {
                            id: offerId,
                            client_id: client.id,
                            updated_at: offer.updated_at,
                            is_template: false,
                            status: { in: CLIENT_ACTIONABLE_OFFER_STATUS_VALUES },
                            OR: [{ valid_until: null }, { valid_until: { gte: acceptedAt } }],
                        },
                        data: {
                            status: 'accepted',
                            client_selection: trustedSelection as any,
                            total_price: parsedTotalPrice,
                            pdf_url: acceptedPdfKey,
                        },
                    });
                    if (claimed.count !== 1) return claimed;
                    await tx.crmActivity.create({
                        data: {
                            client_id: client.id,
                            client_email: client.email,
                            action: 'offer_accepted',
                            entity_type: 'offer',
                            entity_id: offerId,
                            details: JSON.stringify({
                                action, status: 'accepted', correlation_id: correlationId,
                                total_ms: clientOperationTotalMs(startedAt), outcome: 'success',
                            }),
                            ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
                                || request.headers.get('x-real-ip') || null,
                            user_agent: request.headers.get('user-agent')?.slice(0, 500) || null,
                        },
                    });
                    return claimed;
                });
            } catch (error) {
                if (uploadedAcceptedPdf) {
                    await deleteFromS3(uploadedAcceptedPdf).catch(cleanupError => console.error('[CLIENT_ACCEPT] Orphan cleanup failed:', cleanupError));
                }
                throw error;
            }
            if (accepted.count !== 1) {
                if (uploadedAcceptedPdf) {
                    await deleteFromS3(uploadedAcceptedPdf).catch(cleanupError => console.error('[CLIENT_ACCEPT] Lost-CAS cleanup failed:', cleanupError));
                }
                const latest = await prisma.offer.findUnique({ where: { id: offerId } });
                if (latest && normalizeOfferStatus(latest.status) === 'accepted' && isClientRecordOwner(latest, client)) {
                    return clientJson({ success: true, idempotent: true, offer: latest }, { correlationId });
                }
                return NextResponse.json({ error: 'Oferta została już zmieniona lub zaakceptowana. Odśwież stronę.' }, { status: 409 });
            }
            decisionCommitted = true;
            committedOfferSnapshot = {
                ...offer,
                status: 'accepted',
                client_selection: trustedSelection,
                total_price: parsedTotalPrice,
                pdf_url: acceptedPdfKey,
            };

            // Notify admin
            try {
                const adminEmail = await getAdminEmail();
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wlasniewski.pl';
                const selectionInfo = `Cena została obliczona i potwierdzona po stronie serwera.`;
                if (!adminEmail) throw new Error('Brak adresu administratora');
                await sendEmail({
                        to: adminEmail,
                        subject: `✅ Oferta zaakceptowana — ${offer.title}`,
                        html: `
<div style="font-family:Arial,sans-serif;padding:20px;background:#0a0a0a;color:#fff;max-width:600px;margin:0 auto;">
  <h2 style="color:#4ade80;">✅ Klient zaakceptował ofertę!</h2>
  <div style="background:#111;border:1px solid #222;border-radius:8px;padding:20px;margin:16px 0;">
    <p style="color:#888;margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Oferta</p>
    <p style="color:#c5a059;font-size:18px;font-weight:bold;margin:0;">${offer.title}</p>
    <p style="color:#555;font-size:12px;margin:6px 0 0;">Klient: ${decoded.email}</p>
  </div>
  ${selectionInfo ? `<p style="color:#ccc;font-size:14px;">${selectionInfo}</p>` : ''}
  <p style="color:#ccc;font-size:14px;">Łączna wartość: <strong style="color:#c5a059;">${parsedTotalPrice.toLocaleString('pl-PL')} PLN</strong></p>
  <div style="text-align:center;margin:24px 0;">
    <a href="${appUrl}/admin/clients" style="display:inline-block;background:#c5a059;color:#000;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;">Przejdź do panelu →</a>
  </div>
</div>`
                    });
            } catch (emailError) {
                console.error('[Offer Accept] Failed to send admin notification:', emailError);
                await recordNotificationFailure(
                    'OFFER_ACCEPT_ADMIN_NOTIFICATION_FAILED',
                    'Nie udało się powiadomić administratora o akceptacji oferty',
                    emailError,
                );
            }
        } else if (action === 'reject') {
            const rejected = await prisma.$transaction(async (tx) => {
                const claimed = await tx.offer.updateMany({
                    where: {
                        id: offerId,
                        client_id: client.id,
                        updated_at: offer.updated_at,
                        status: { in: CLIENT_ACTIONABLE_OFFER_STATUS_VALUES },
                        OR: [{ valid_until: null }, { valid_until: { gte: new Date() } }],
                    },
                    data: { status: 'rejected' },
                });
                if (claimed.count !== 1) return claimed;
                await tx.crmActivity.create({
                    data: {
                        client_id: client.id, client_email: client.email,
                        action: 'offer_rejected', entity_type: 'offer', entity_id: offerId,
                        details: JSON.stringify({
                            action, status: 'rejected', correlation_id: correlationId,
                            total_ms: clientOperationTotalMs(startedAt), outcome: 'success',
                        }),
                        ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
                            || request.headers.get('x-real-ip') || null,
                        user_agent: request.headers.get('user-agent')?.slice(0, 500) || null,
                    },
                });
                return claimed;
            });
            if (rejected.count !== 1) {
                const latest = await prisma.offer.findUnique({ where: { id: offerId } });
                if (latest && normalizeOfferStatus(latest.status) === 'rejected' && isClientRecordOwner(latest, client)) {
                    return clientJson({ success: true, idempotent: true, offer: latest }, { correlationId });
                }
                return NextResponse.json({ error: 'Oferta została już zmieniona. Odśwież stronę.' }, { status: 409 });
            }
            decisionCommitted = true;
            committedOfferSnapshot = { ...offer, status: 'rejected' };

            // Notify admin
            try {
                const adminEmail = await getAdminEmail();
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wlasniewski.pl';
                if (!adminEmail) throw new Error('Brak adresu administratora');
                await sendEmail({
                        to: adminEmail,
                        subject: `❌ Oferta odrzucona — ${offer.title}`,
                        html: `
<div style="font-family:Arial,sans-serif;padding:20px;background:#0a0a0a;color:#fff;max-width:600px;margin:0 auto;">
  <h2 style="color:#f87171;">❌ Klient odrzucił ofertę</h2>
  <p style="color:#ccc;">Oferta <strong>${offer.title}</strong> została odrzucona przez klienta ${decoded.email}.</p>
  <div style="text-align:center;margin:24px 0;">
    <a href="${appUrl}/admin/clients" style="display:inline-block;background:#c5a059;color:#000;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;">Przejdź do panelu →</a>
  </div>
</div>`
                    });
            } catch (emailError) {
                console.error('[Offer Reject] Failed to send admin notification:', emailError);
                await recordNotificationFailure(
                    'OFFER_REJECT_ADMIN_NOTIFICATION_FAILED',
                    'Nie udało się powiadomić administratora o odrzuceniu oferty',
                    emailError,
                );
            }
        } else if (action === 'negotiate') {
            const negotiated = await prisma.$transaction(async (tx) => {
                const claimed = await tx.offer.updateMany({
                    where: {
                        id: offerId,
                        client_id: client.id,
                        updated_at: offer.updated_at,
                        status: { in: CLIENT_ACTIONABLE_OFFER_STATUS_VALUES },
                        OR: [{ valid_until: null }, { valid_until: { gte: new Date() } }],
                    },
                    data: { updated_at: new Date() },
                });
                if (claimed.count !== 1) return claimed;
                await tx.negotiation.create({
                    data: {
                        offer_id: offerId,
                        message: negotiationMessage,
                        status: 'open',
                        sender: 'client',
                    },
                });
                await tx.crmActivity.create({
                    data: {
                        client_id: client.id, client_email: client.email,
                        action: 'offer_negotiate', entity_type: 'offer', entity_id: offerId,
                        details: JSON.stringify({
                            action, status: offer.status, message: negotiationMessage.slice(0, 200),
                            correlation_id: correlationId,
                            total_ms: clientOperationTotalMs(startedAt), outcome: 'success',
                        }),
                        ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
                            || request.headers.get('x-real-ip') || null,
                        user_agent: request.headers.get('user-agent')?.slice(0, 500) || null,
                    },
                });
                return claimed;
            });
            if (negotiated.count !== 1) {
                const existingNegotiation = await prisma.negotiation.findFirst({
                    where: { offer_id: offerId, sender: 'client', message: negotiationMessage },
                    select: { id: true },
                });
                if (existingNegotiation) {
                    return clientJson({ success: true, idempotent: true, offer }, { correlationId });
                }
                return clientJson({ error: 'Oferta została już zmieniona. Odśwież stronę.' }, { status: 409, correlationId });
            }
            decisionCommitted = true;
            committedOfferSnapshot = offer as unknown as Record<string, unknown>;

            // Notify admin about negotiation
            try {
                const adminEmail = await getAdminEmail();
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wlasniewski.pl';
                if (!adminEmail) throw new Error('Brak adresu administratora');
                await sendEmail({
                        to: adminEmail,
                        subject: `💬 Nowa negocjacja — ${offer.title}`,
                        html: `
<div style="font-family:Arial,sans-serif;padding:20px;background:#0a0a0a;color:#fff;max-width:600px;margin:0 auto;">
  <h2 style="color:#f59e0b;">💬 Klient chce negocjować ofertę</h2>
  <div style="background:#111;border:1px solid #222;border-radius:8px;padding:20px;margin:16px 0;">
    <p style="color:#888;margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Oferta</p>
    <p style="color:#c5a059;font-size:18px;font-weight:bold;margin:0;">${escapeHtml(offer.title)}</p>
    <p style="color:#555;font-size:12px;margin:6px 0 0;">Klient: ${escapeHtml(decoded.email)}</p>
  </div>
  <div style="background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:16px;margin:16px 0;">
    <p style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Wiadomość klienta:</p>
    <p style="color:#ccc;font-size:14px;margin:0;white-space:pre-wrap;line-height:1.6;">${escapeHtml(negotiationMessage)}</p>
  </div>
  <div style="text-align:center;margin:24px 0;">
    <a href="${appUrl}/admin/offers/${offer.id}" style="display:inline-block;background:#c5a059;color:#000;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;">Odpowiedz w panelu →</a>
  </div>
</div>`
                    });
            } catch (emailError) {
                console.error('[Offer Negotiate] Failed to send admin notification:', emailError);
                await recordNotificationFailure(
                    'OFFER_NEGOTIATE_ADMIN_NOTIFICATION_FAILED',
                    'Nie udało się powiadomić administratora o negocjacji oferty',
                    emailError,
                );
            }
        } else if (action === 'request_unlock') {
            // Notify admin about the unlock request
            try {
                const adminEmail = await getAdminEmail();
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wlasniewski.pl';
                if (!adminEmail) throw new Error('Brak adresu administratora');
                await sendEmail({
                        to: adminEmail,
                        subject: `🔓 Prośba o odblokowanie oferty — ${offer.title}`,
                        html: `
<div style="font-family:Arial,sans-serif;padding:20px;background:#0a0a0a;color:#fff;max-width:600px;margin:0 auto;">
  <h2 style="color:#fbbf24;">🔓 Klient prosi o odblokowanie oferty</h2>
  <div style="background:#111;border:1px solid #222;border-radius:8px;padding:20px;margin:16px 0;">
    <p style="color:#888;margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Oferta</p>
    <p style="color:#c5a059;font-size:18px;font-weight:bold;margin:0;">${offer.title}</p>
    <p style="color:#555;font-size:12px;margin:6px 0 0;">Klient: ${decoded.email}</p>
  </div>
  <p style="color:#ccc;font-size:14px;">Klient zaznaczył, że pomylił się przy wyborze i prosi o ponowne odblokowanie możliwości edycji/wyboru pakietu.</p>
  <p style="color:#ccc;font-size:14px;">Zaakceptowana wersja pozostaje niezmienna. Jeśli zmiana jest zasadna, przygotuj i wyślij klientowi nową wersję oferty.</p>
  <div style="text-align:center;margin:24px 0;">
    <a href="${appUrl}/admin/offers/${offer.id}" style="display:inline-block;background:#c5a059;color:#000;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;">Edytuj ofertę →</a>
  </div>
</div>`
                    });
            } catch (emailError) {
                console.error('[Offer Unlock Request] Failed to send admin notification:', emailError);
                await recordNotificationFailure(
                    'OFFER_UNLOCK_ADMIN_NOTIFICATION_FAILED',
                    'Nie udało się powiadomić administratora o prośbie odblokowania oferty',
                    emailError,
                );
            }
        }

        // Decyzje accept/reject/negotiate zapisują audit w tej samej transakcji
        // co zmianę stanu. request_unlock nie zmienia snapshotu dokumentu.
        if (action === 'request_unlock') await logClientActivityStrict(decoded, 'offer_selection_changed', {
                entityType: 'offer',
                entityId: offerId,
                details: {
                    action,
                    status: offer.status,
                    message: typeof message === 'string' ? message.substring(0, 200) : undefined,
                    correlation_id: correlationId,
                    total_ms: clientOperationTotalMs(startedAt),
                    outcome: 'success',
                },
                request,
            });
        await recordSlowClientOperation({
            operation: 'offer_decide', startedAt, correlationId, clientId: client.id, clientEmail: client.email,
            entityType: 'offer', entityId: offerId, outcome: action,
        });

        // Fetch updated offer
        const updated = await prisma.offer.findUnique({
            where: { id: offerId },
            include: {
                sections: {
                    include: {
                        items: true,
                    },
                },
                negotiations: true,
                contract: true,
            },
        });

        return clientJson({ offer: updated }, { correlationId });
    } catch (error) {
        console.error('Error updating offer:', error);
        await recordAdminIncidentSafely({
            severity: 'P1', category: 'CLIENT_PORTAL', reasonCode: 'OFFER_DECISION_FAILED',
            summary: 'Nie udało się zapisać decyzji klienta dotyczącej oferty', correlationId,
            details: { error: error instanceof Error ? error.message : String(error) },
        });
        if (decisionCommitted && committedOfferSnapshot) {
            return clientJson({
                success: true,
                decisionCommitted: true,
                reconciliationRequired: true,
                offer: committedOfferSnapshot,
            }, { status: 202, correlationId });
        }
        return clientJson({ error: 'Nie udało się zapisać decyzji.' }, { status: 500, correlationId });
    }
}
