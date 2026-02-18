
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return withAuth(request, async (req) => {
        try {
            const userId = parseInt(id);

            // 1. Fetch the base client (no relations)
            const client = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (!client) {
                return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
            }

            const clientEmail = client.email;

            // 2. Fetch all related data independently
            const [
                orders,
                bookings,
                clientGalleries,
                assignedGalleries,
                basket,
                offersById,
                offersByEmail
            ] = await Promise.all([
                prisma.giftCardOrder.findMany({
                    where: { user_id: userId },
                    orderBy: { created_at: 'desc' },
                    include: { gift_card: true }
                }).catch(() => []),
                prisma.booking.findMany({
                    where: { email: clientEmail },
                    orderBy: { date: 'desc' }
                }).catch(() => []),
                prisma.clientGallery.findMany({
                    where: { client_id: userId },
                    orderBy: { created_at: 'desc' },
                    include: { photos: { take: 1 } }
                }).catch(() => []),
                prisma.clientGallery.findMany({
                    where: { photographer_id: userId }, // "assigned" context
                    orderBy: { created_at: 'desc' },
                    include: { photos: { take: 1 } }
                }).catch(() => []),
                prisma.basket.findFirst({
                    where: { user_id: userId },
                    include: { items: true },
                    orderBy: { updated_at: 'desc' }
                }).catch(() => null),
                prisma.offer.findMany({
                    where: { client_id: userId },
                    orderBy: { created_at: 'desc' },
                    include: { sections: { include: { items: true } } }
                }).catch(() => []),
                prisma.offer.findMany({
                    where: {
                        client_email: clientEmail,
                        client_id: null
                    },
                    orderBy: { created_at: 'desc' },
                    include: { sections: { include: { items: true } } }
                }).catch(() => [])
            ]);

            // Deduplicate offers (by ID + by Email)
            const allOffers = [...offersById, ...offersByEmail]
                .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

            const fullClient = {
                ...client,
                orders,
                assigned_bookings: bookings,
                client_galleries: clientGalleries,
                assigned_galleries: assignedGalleries,
                baskets: basket ? [basket] : [],
                offers: allOffers
            };

            return NextResponse.json({ success: true, client: fullClient });
        } catch (error: any) {
            console.error('Fetch client details error:', error);
            await logSystem('ERROR', 'SYSTEM', `Failed to fetch client detail for ${id}`, { error: error.message, stack: error.stack });
            return NextResponse.json({ error: 'Failed to fetch details' }, { status: 500 });
        }
    });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return withAuth(request, async (req) => {
        try {
            const userId = parseInt(id);
            const body = await req.json();

            // Fetch current user to check for email change
            const currentUser = await prisma.user.findUnique({
                where: { id: userId },
                select: { email: true }
            });

            if (!currentUser) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }

            const emailChanged = body.email && body.email !== currentUser.email;

            const updatedClient = await prisma.$transaction(async (tx) => {
                const updated = await tx.user.update({
                    where: { id: userId },
                    data: {
                        name: body.name,
                        email: body.email,
                        phone: body.phone,
                        address: body.address,
                        city: body.city,
                        postal_code: body.postal_code,
                        is_active: body.is_active
                    }
                });

                if (emailChanged) {
                    console.log(`[CRM] Email changed from ${currentUser.email} to ${body.email}. Syncing records...`);

                    // Update Offers
                    await tx.offer.updateMany({
                        where: { client_id: userId },
                        data: { client_email: body.email }
                    });

                    // Update Galleries
                    await tx.clientGallery.updateMany({
                        where: { client_id: userId },
                        data: { client_email: body.email }
                    });
                }

                return updated;
            });

            return NextResponse.json({ success: true, client: updatedClient });
        } catch (error) {
            console.error('Update client details error:', error);
            return NextResponse.json({ error: 'Failed to update details' }, { status: 500 });
        }
    });
}
