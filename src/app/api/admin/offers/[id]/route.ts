import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Check auth
        const authError = await requireAuth(request);
        if (authError) return authError;

        const { id } = await params;
        const offerId = parseInt(id);

        const offer = await prisma.offer.findUnique({
            where: { id: offerId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
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

        return NextResponse.json({ offer });
    } catch (error) {
        console.error('Error fetching offer:', error);
        return NextResponse.json(
            { error: 'Failed to fetch offer' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Check auth
        const authError = await requireAuth(request);
        if (authError) return authError;

        const { id } = await params;
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

        const updated = await prisma.offer.update({
            where: { id: offerId },
            data: {
                ...(title && { title }),
                ...(type && { type }),
                ...(category && { category }),
                ...(status && { status }),
                ...(negotiation_enabled !== undefined && { negotiation_enabled }), // Update if provided
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
            },
            include: {
                sections: {
                    include: {
                        items: true,
                    },
                },
            },
        });

        // Recalculate total price
        let totalPrice = 0;
        updated.sections.forEach((section) => {
            section.items.forEach((item) => {
                if (!item.is_optional) {
                    totalPrice += item.price * item.quantity;
                }
            });
        });

        const finalOffer = await prisma.offer.update({
            where: { id: offerId },
            data: { total_price: totalPrice },
            include: {
                user: true,
                sections: {
                    include: {
                        items: true,
                    },
                },
                negotiations: true,
                contract: true,
            },
        });

        return NextResponse.json({ offer: finalOffer });
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
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Check auth
        const authError = await requireAuth(request);
        if (authError) return authError;

        const { id } = await params;
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
