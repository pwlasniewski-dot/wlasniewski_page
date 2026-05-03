import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';
import { logSystem } from '@/lib/logger';
import { parsePolishDate, parsePolishTime } from '@/lib/calendar/polishDate';

export const dynamic = 'force-dynamic';

export async function GET(
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

        const offer = await prisma.offer.findUnique({
            where: { id: offerId }
        });

        if (!offer) {
            return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
        }

        // Fetch related data independently to bypass Prisma include/validation crashes in production
        const [sections, negotiations, contract] = await Promise.all([
            prisma.offerSection.findMany({
                where: { offer_id: offerId },
                include: { items: true },
                orderBy: { order: 'asc' }
            }).catch(() => []),
            prisma.negotiation.findMany({
                where: { offer_id: offerId },
                orderBy: { created_at: 'desc' }
            }).catch(() => []),
            prisma.contract.findUnique({
                where: { offer_id: offerId }
            }).catch(() => null)
        ]);

        return NextResponse.json({
            offer: {
                ...offer,
                sections,
                negotiations,
                contract
            }
        });
    } catch (error: any) {
        console.error('Error fetching offer:', error);
        await logSystem('ERROR', 'SYSTEM', `Failed to fetch offer detail for ${id}`, { error: error.message });
        return NextResponse.json({ error: 'Failed to fetch offer' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
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

        // If sections are provided, delete old ones and create new ones
        if (sections) {
            await prisma.offerSection.deleteMany({
                where: { offer_id: offerId },
            });
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

        const updatedOffer = await prisma.offer.update({
            where: { id: offerId },
            data: {
                ...(title && { title }),
                ...(type && { type }),
                ...(category && { category }),
                ...(status && { status }),
                ...(negotiation_enabled !== undefined && { negotiation_enabled }),
                ...(template_data && { template_data }),
                ...(resolvedSessionDate !== undefined && { session_date: resolvedSessionDate }),
                ...(resolvedSessionTime !== undefined && { session_time: resolvedSessionTime }),
                ...(session_end_time !== undefined && { session_end_time: session_end_time || null }),
                ...(session_duration_min !== undefined && { session_duration_min: session_duration_min ? parseInt(String(session_duration_min), 10) || null : null }),
                ...(resolvedSessionLocation !== undefined && { session_location: resolvedSessionLocation }),
                ...(parsedPhotographerId !== undefined && { photographer_id: parsedPhotographerId }),
                ...(client_selection !== undefined && { client_selection }),
                ...(client_selection?.totalPrice && { total_price: parseInt(client_selection.totalPrice) || 0 }),
                ...(valid_until && { valid_until: new Date(valid_until) }),
                ...(parsedClientId !== undefined && { client_id: parsedClientId }),
                ...(client_email && { client_email }),
                ...(pdf_url && { pdf_url }),
                ...(drive_url && { drive_url }),
                ...(sections && {
                    sections: {
                        create: sections.map((section: any, sectionIndex: number) => ({
                            title: section.title,
                            description: section.description,
                            order: sectionIndex,
                            items: {
                                create: (section.items || []).map((item: any) => {
                                    let price = parseInt(item.price || '0');
                                    let quantity = parseInt(item.quantity || '1');

                                    if (isNaN(price)) price = 0;
                                    if (isNaN(quantity)) quantity = 1;

                                    return {
                                        title: item.title,
                                        description: item.description,
                                        price: price,
                                        quantity: quantity,
                                        is_optional: item.is_optional || false,
                                    };
                                }),
                            },
                        })),
                    },
                }),
            }
        });

        // Fetch sections for price calculation
        const sectionsData = await prisma.offerSection.findMany({
            where: { offer_id: offerId },
            include: { items: true }
        });

        // Recalculate total price
        let totalPrice = 0;
        sectionsData.forEach((section) => {
            section.items.forEach((item) => {
                if (!item.is_optional) {
                    totalPrice += item.price * item.quantity;
                }
            });
        });

        const finalOffer = await prisma.offer.update({
            where: { id: offerId },
            data: { total_price: totalPrice }
        });

        // Independent fetch for final response to avoid include crashes
        const [negotiations, contract] = await Promise.all([
            prisma.negotiation.findMany({
                where: { offer_id: offerId },
                orderBy: { created_at: 'desc' }
            }).catch(() => []),
            prisma.contract.findUnique({
                where: { offer_id: offerId }
            }).catch(() => null)
        ]);

        return NextResponse.json({
            offer: {
                ...finalOffer,
                sections: sectionsData,
                negotiations,
                contract
            }
        });
    } catch (error) {
        console.error('Error updating offer:', error);
        return NextResponse.json(
            { error: 'Failed to update offer' },
            { status: 500 }
        );
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

        // Delete associated records
        await prisma.negotiation.deleteMany({
            where: { offer_id: offerId },
        });

        await prisma.contract.deleteMany({
            where: { offer_id: offerId },
        });

        await prisma.offer.delete({
            where: { id: offerId },
        });

        return NextResponse.json({ message: 'Offer deleted successfully' });
    } catch (error) {
        console.error('Error deleting offer:', error);
        return NextResponse.json(
            { error: 'Failed to delete offer' },
            { status: 500 }
        );
    }
}
