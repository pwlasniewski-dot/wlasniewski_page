
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return withAuth(request, async (req) => {
        try {
            const userId = parseInt(id);

            const client = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    // Full history for the detail modal
                    orders: {
                        orderBy: { created_at: 'desc' },
                        include: {
                            gift_card: true
                        }
                    },
                    assigned_bookings: {
                        orderBy: { date: 'desc' }
                    },
                    assigned_galleries: {
                        orderBy: { created_at: 'desc' },
                        include: {
                            photos: {
                                take: 1
                            }
                        }
                    },
                    client_galleries: {
                        orderBy: { created_at: 'desc' },
                        include: {
                            photos: {
                                take: 1
                            }
                        }
                    },
                    baskets: {
                        include: { items: true },
                        orderBy: { updated_at: 'desc' },
                        take: 1
                    },
                    offers: {
                        orderBy: { created_at: 'desc' },
                        include: {
                            sections: { include: { items: true } }
                        }
                    }
                }
            });

            if (!client) {
                return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
            }

            // Also fetch offers by email (for offers created before client_id was linked)
            const userEmail = (client as any).email;
            const offersByEmail = await prisma.offer.findMany({
                where: {
                    client_email: userEmail,
                    client_id: null // Only those not already linked by ID
                },
                orderBy: { created_at: 'desc' },
                include: {
                    sections: { include: { items: true } }
                }
            });

            // Merge: offers by ID + offers by email (deduplicated)
            const allOffers = [...((client as any).offers || []), ...offersByEmail]
                .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

            return NextResponse.json({ success: true, client: { ...client, offers: allOffers } });
        } catch (error) {
            console.error('Fetch client details error:', error);
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
