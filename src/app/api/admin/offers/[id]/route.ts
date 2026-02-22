import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';
import { logSystem } from '@/lib/logger';

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
            negotiation_enabled, // Added negotiation_enabled
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

        const updatedOffer = await prisma.offer.update({
            where: { id: offerId },
            data: {
                ...(title && { title }),
                ...(type && { type }),
                ...(category && { category }),
                ...(status && { status }),
                ...(negotiation_enabled !== undefined && { negotiation_enabled }),
                ...(template_data && { template_data }),
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
