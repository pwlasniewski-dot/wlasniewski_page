import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';
import { logSystem } from '@/lib/logger';
import { parsePolishDate, parsePolishTime } from '@/lib/calendar/polishDate';
import { calculateDraftOfferTotal } from '@/lib/offers/draft-total';
import { normalizeEmail } from '@/lib/crm/delivery';
import { isAdminImmutableOfferStatus, normalizeOfferStatus } from '@/lib/offers/status';
import { parsePlnAmount } from '@/lib/money/pln';
import { randomUUID } from 'node:crypto';
import { recordAdminIncidentSafely } from '@/lib/admin-incidents';
import { jsonWithCorrelation } from '@/lib/http/correlation';

export const dynamic = 'force-dynamic';

class OfferWriteConflict extends Error {}

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    let id = '';
    const correlationId = randomUUID();
    try {
        // Check auth
        const authError = await requireAuth(request);
        if (authError) return authError;

        const params = await context.params;
        id = params.id;
        const offerId = parseInt(id);

        const offer = await prisma.offer.findUnique({
            where: { id: offerId }
        });

        if (!offer) {
            return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
        }
        // Fetch related data independently to bypass Prisma include/validation crashes in production
        const [sections, negotiations, contract, user, supersededBy] = await Promise.all([
            prisma.offerSection.findMany({
                where: { offer_id: offerId },
                include: { items: true },
                orderBy: { order: 'asc' }
            }),
            prisma.negotiation.findMany({
                where: { offer_id: offerId },
                orderBy: { created_at: 'desc' }
            }),
            prisma.contract.findUnique({
                where: { offer_id: offerId }
            }),
            offer.client_id
                ? prisma.user.findUnique({
                    where: { id: offer.client_id },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        permissions: true,
                    }
                })
                : Promise.resolve(null),
            offer.superseded_by_offer_id
                ? prisma.offer.findUnique({
                    where: { id: offer.superseded_by_offer_id },
                    select: { id: true, offerNumber: true, title: true, status: true, total_price: true },
                })
                : Promise.resolve(null),
        ]);

        return jsonWithCorrelation({
            offer: {
                ...offer,
                user,
                sections,
                negotiations,
                contract,
                supersededBy,
            }
        }, correlationId);
    } catch (error: any) {
        console.error('Error fetching offer:', error);
        await logSystem('ERROR', 'SYSTEM', `Failed to fetch offer detail for ${id}`, { error: error.message });
        await recordAdminIncidentSafely({
            severity: 'P1', category: 'ADMIN_PROFILE', reasonCode: 'ADMIN_OFFER_PROFILE_LOAD_FAILED',
            summary: 'Nie udało się pobrać pełnego profilu oferty w panelu administratora',
            entityType: 'offer', entityId: Number.isInteger(Number(id)) ? Number(id) : null,
            correlationId, details: { error: error instanceof Error ? error.message : String(error) },
        });
        return jsonWithCorrelation({ error: 'Nie udało się pobrać pełnych danych oferty', correlation_id: correlationId }, correlationId, 500);
    }
}

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const correlationId = randomUUID();
    try {
        // Check auth
        const authError = await requireAuth(request);
        if (authError) return authError;

        const { id } = await context.params;
        const offerId = parseInt(id);
        const body = await request.json();
        const {
            title,
            type,
            status,
            valid_until,
            client_id,
            client_email,
            sections,
            pdf_url,
            drive_url,
            category,
            template_data,
            negotiation_enabled,
            client_selection,
            session_date,
            session_time,
            session_end_time,
            session_duration_min,
            session_location,
            photographer_id,
            total_price,
        } = body;

        // Check if offer exists
        const offer = await prisma.offer.findUnique({
            where: { id: offerId },
        });

        if (!offer) {
            return NextResponse.json(
                { error: 'Offer not found' },
                { status: 404 }
            );
        }
        const currentStatus = normalizeOfferStatus(offer.status);
        if (isAdminImmutableOfferStatus(currentStatus)) {
            return NextResponse.json({ error: 'Wysłana lub zaakceptowana oferta jest niezmiennym snapshotem. Utwórz nową wersję.' }, { status: 409 });
        }
        if (status !== undefined && normalizeOfferStatus(status) !== currentStatus) {
            return NextResponse.json({ error: 'Status oferty zmienia wyłącznie dedykowana akcja wysyłki lub decyzja klienta.' }, { status: 409 });
        }

        const rawRequestedTotal = client_selection?.totalPrice !== undefined
            ? client_selection.totalPrice
            : total_price;
        const parsedRequestedTotal = rawRequestedTotal !== undefined
            ? parsePlnAmount(rawRequestedTotal)
            : null;
        if (rawRequestedTotal !== undefined && parsedRequestedTotal === null) {
            return NextResponse.json({ error: 'Kwota oferty ma nieprawidłowy lub niejednoznaczny format PLN.' }, { status: 400 });
        }

        let normalizedSections: any[] | undefined;
        if (sections !== undefined) {
            if (!Array.isArray(sections)) {
                return NextResponse.json({ error: 'Sekcje oferty mają nieprawidłowy format.' }, { status: 400 });
            }
            try {
                normalizedSections = sections.map((section: any) => ({
                    ...section,
                    items: (Array.isArray(section.items) ? section.items : []).map((item: any) => {
                        const price = parsePlnAmount(item.price ?? 0);
                        const quantity = Number(item.quantity ?? 1);
                        if (price === null || !Number.isInteger(quantity) || quantity <= 0) {
                            throw new Error('INVALID_OFFER_ITEM');
                        }
                        return { ...item, price, quantity };
                    }),
                }));
            } catch {
                return NextResponse.json({ error: 'Pozycja oferty ma nieprawidłową cenę PLN lub ilość.' }, { status: 400 });
            }
        }

        // Validate client_id if provided
        let parsedClientId: number | undefined | null = undefined;
        if (client_id !== undefined) {
            if (client_id === null || client_id === '') {
                parsedClientId = null;
            } else {
                const parsed = parseInt(String(client_id), 10);
                parsedClientId = isNaN(parsed) ? null : parsed;
            }
        }

        const effectiveClientId = parsedClientId !== undefined ? parsedClientId : offer.client_id;
        let normalizedClientEmail: string | null | undefined = client_email !== undefined
            ? (client_email ? normalizeEmail(client_email) : null)
            : undefined;
        if (effectiveClientId && (client_id !== undefined || client_email !== undefined)) {
            const clientAccount = await prisma.user.findUnique({
                where: { id: effectiveClientId },
                select: { email: true, role: true },
            });
            if (!clientAccount || clientAccount.role !== 'CLIENT') {
                return NextResponse.json({ error: 'Nieprawidłowe konto klienta' }, { status: 409 });
            }
            const accountEmail = normalizeEmail(clientAccount.email);
            const effectiveEmail = normalizedClientEmail !== undefined ? normalizedClientEmail : offer.client_email;
            if (effectiveEmail && normalizeEmail(effectiveEmail) !== accountEmail) {
                return NextResponse.json({ error: 'Adres e-mail oferty nie zgadza się z kontem klienta' }, { status: 409 });
            }
            if (client_email !== undefined || parsedClientId !== undefined) normalizedClientEmail = accountEmail;
        }

        // Wyznacz session_date (priorytet: jawnie podane > template_data.eventDate)
        let resolvedSessionDate: Date | null | undefined = undefined;
        let resolvedSessionTime: string | null | undefined = session_time !== undefined ? session_time : undefined;
        let resolvedSessionLocation: string | null | undefined = session_location !== undefined ? session_location : undefined;
        if (session_date !== undefined) {
            if (session_date === null || session_date === '') resolvedSessionDate = null;
            else {
                const d = new Date(session_date);
                resolvedSessionDate = isNaN(d.getTime()) ? null : d;
            }
        } else if (template_data) {
            const td = template_data as Record<string, unknown>;
            const parsed = parsePolishDate((td.eventDate as string) || (td.event_date as string) || null);
            if (parsed) {
                resolvedSessionDate = parsed;
                if (resolvedSessionTime === undefined) resolvedSessionTime = parsePolishTime((td.eventTime as string) || (td.eventHour as string) || (td.eventDate as string) || null);
                if (resolvedSessionLocation === undefined) resolvedSessionLocation = (td.eventLocation as string) || (td.location as string) || null;
            }
        }
        const parsedPhotographerId = photographer_id !== undefined
            ? (photographer_id === null || photographer_id === '' ? null : (parseInt(String(photographer_id), 10) || null))
            : undefined;

        const updateData = {
                ...(title && { title }),
                ...(type && { type }),
                ...(category && { category }),
                ...(status && { status }),
                ...(negotiation_enabled !== undefined && { negotiation_enabled }),
                ...(template_data !== undefined && { template_data }),
                ...(resolvedSessionDate !== undefined && { session_date: resolvedSessionDate }),
                ...(resolvedSessionTime !== undefined && { session_time: resolvedSessionTime }),
                ...(session_end_time !== undefined && { session_end_time: session_end_time || null }),
                ...(session_duration_min !== undefined && { session_duration_min: session_duration_min ? parseInt(String(session_duration_min), 10) || null : null }),
                ...(resolvedSessionLocation !== undefined && { session_location: resolvedSessionLocation }),
                ...(parsedPhotographerId !== undefined && { photographer_id: parsedPhotographerId }),
                ...(client_selection !== undefined && { client_selection }),
                ...(valid_until && { valid_until: new Date(valid_until) }),
                ...(parsedClientId !== undefined && { client_id: parsedClientId }),
                ...(normalizedClientEmail !== undefined && { client_email: normalizedClientEmail }),
                ...(pdf_url && { pdf_url }),
                ...(drive_url && { drive_url }),
        };
        const effectiveTemplateData = template_data !== undefined ? template_data : offer.template_data;
        const finalOffer = await prisma.$transaction(async (tx) => {
            const currentSections = normalizedSections ?? await tx.offerSection.findMany({
                where: { offer_id: offerId },
                include: { items: true },
            });
            const totalPrice = parsedRequestedTotal !== null
                ? parsedRequestedTotal
                : calculateDraftOfferTotal(effectiveTemplateData, currentSections, offer.total_price);
            const claimed = await tx.offer.updateMany({
                where: { id: offerId, status: offer.status, updated_at: offer.updated_at },
                data: { ...updateData, total_price: totalPrice } as any,
            });
            if (claimed.count !== 1) throw new OfferWriteConflict('OFFER_CHANGED');

            if (normalizedSections) {
                await tx.offerSection.deleteMany({ where: { offer_id: offerId } });
                for (const [sectionIndex, section] of normalizedSections.entries()) {
                    await tx.offerSection.create({
                        data: {
                            offer_id: offerId,
                            title: section.title,
                            description: section.description,
                            order: sectionIndex,
                            items: {
                                create: (section.items || []).map((item: any) => ({
                                    title: item.title,
                                    description: item.description,
                                    price: item.price,
                                    quantity: item.quantity,
                                    is_optional: item.is_optional || false,
                                })),
                            },
                        },
                    });
                }
            }
            return tx.offer.findUniqueOrThrow({
                where: { id: offerId },
                include: {
                    sections: { include: { items: true }, orderBy: { order: 'asc' } },
                    negotiations: { orderBy: { created_at: 'desc' } },
                    contract: true,
                },
            });
        });

        return jsonWithCorrelation({
            offer: {
                ...finalOffer,
            }
        }, correlationId);
    } catch (error) {
        console.error('Error updating offer:', error);
        if (error instanceof OfferWriteConflict) {
            return jsonWithCorrelation({ error: 'Oferta została równolegle zmieniona lub wysłana. Odśwież dane.', correlation_id: correlationId }, correlationId, 409);
        }
        await recordAdminIncidentSafely({
            severity: 'P1', category: 'ADMIN_WRITE', reasonCode: 'ADMIN_OFFER_UPDATE_FAILED',
            summary: 'Aktualizacja oferty w panelu nie powiodła się', correlationId,
            details: { error: error instanceof Error ? error.message : String(error) },
        });
        return jsonWithCorrelation({ error: 'Failed to update offer', correlation_id: correlationId }, correlationId, 500);
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    let id = '';
    try {
        // Check auth
        const authError = await requireAuth(request);
        if (authError) return authError;

        const params = await context.params;
        id = params.id;
        const offerId = parseInt(id);

        // Check if offer exists
        const offer = await prisma.offer.findUnique({
            where: { id: offerId },
        });

        if (!offer) {
            return NextResponse.json(
                { error: 'Offer not found' },
                { status: 404 }
            );
        }
        if (isAdminImmutableOfferStatus(offer.status)) {
            return NextResponse.json({ error: 'Wysłanej ani zaakceptowanej oferty nie można usunąć. Utwórz nową wersję lub archiwizuj dokument.' }, { status: 409 });
        }
        const deletion = await prisma.$transaction(async (tx) => {
            const claimedAt = new Date();
            const claimed = await tx.offer.updateMany({
                where: { id: offerId, status: offer.status, updated_at: offer.updated_at },
                data: { updated_at: claimedAt },
            });
            if (claimed.count !== 1) return { outcome: 'conflict' as const };
            const attachedContract = await tx.contract.findUnique({
                where: { offer_id: offerId },
                select: { id: true, status: true },
            });
            if (attachedContract) return { outcome: 'contract' as const, attachedContract };
            await tx.negotiation.deleteMany({ where: { offer_id: offerId } });
            const deleted = await tx.offer.deleteMany({
                where: { id: offerId, status: offer.status, updated_at: claimedAt },
            });
            return { outcome: deleted.count === 1 ? 'deleted' as const : 'conflict' as const };
        });
        if (deletion.outcome === 'contract') {
            return NextResponse.json({
                error: `Oferty z umową #${deletion.attachedContract.id} nie można usunąć. Umowa i oferta tworzą wspólny snapshot.`,
            }, { status: 409 });
        }
        if (deletion.outcome !== 'deleted') {
            return NextResponse.json({ error: 'Oferta została równolegle zmieniona lub wysłana. Odśwież dane.' }, { status: 409 });
        }

        return NextResponse.json({ message: 'Offer deleted successfully' });
    } catch (error) {
        console.error('Error deleting offer:', error);
        return NextResponse.json(
            { error: 'Failed to delete offer' },
            { status: 500 }
        );
    }
}
