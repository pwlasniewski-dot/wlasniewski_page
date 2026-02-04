import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import bcrypt from 'bcrypt';

export const dynamic = 'force-dynamic';

// GET: Fetch all clients with stats
export async function GET(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const clients = await prisma.user.findMany({
                where: {
                    role: 'CLIENT'
                },
                orderBy: { created_at: 'desc' },
                include: {
                    // Count relations for the list view
                    _count: {
                        select: {
                            orders: true,
                            assigned_bookings: true,
                            assigned_galleries: true
                        }
                    },
                    // Fetch recent history for preview
                    orders: {
                        select: {
                            amount_paid: true,
                            created_at: true
                        }
                    },
                    offers: {
                        select: {
                            status: true
                        }
                    }
                }
            });

            // Calculate LTV (Lifetime Value)
            const formattedClients = clients.map(client => {
                const totalSpent = client.orders.reduce((sum, order) => sum + order.amount_paid, 0);
                const lastOrder = client.orders.length > 0 ? client.orders[0].created_at : null;
                const acceptedOffersCount = client.offers.filter(o => o.status === 'accepted').length;

                return {
                    id: client.id,
                    name: client.name || 'Bez nazwy',
                    email: client.email,
                    phone: client.phone,
                    created_at: client.created_at,
                    stats: {
                        ordersCount: client._count.orders,
                        bookingsCount: client._count.assigned_bookings,
                        galleriesCount: client._count.assigned_galleries,
                        totalSpent: totalSpent,
                        lastActive: lastOrder,
                        acceptedOffersCount: acceptedOffersCount
                    }
                };
            });

            return NextResponse.json({ success: true, clients: formattedClients });
        } catch (error) {
            console.error('Fetch clients error:', error);
            return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
        }
    });
}

// POST: Create a new client user
export async function POST(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const body = await req.json();
            const { name, email, phone, password } = body;

            if (!name || !email || !password) {
                return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });
            }

            // Check if email already exists
            const existingUser = await prisma.user.findUnique({
                where: { email }
            });

            if (existingUser) {
                return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
            }

            // Hash password
            const password_hash = await bcrypt.hash(password, 10);

            // Create client user
            const user = await prisma.user.create({
                data: {
                    name,
                    email,
                    phone,
                    password_hash,
                    role: 'CLIENT'
                }
            });

            return NextResponse.json({ success: true, client: user });
        } catch (error) {
            console.error('Create client error:', error);
            return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
        }
    });
}

// DELETE: GDPR Anonymization (Not Hard Delete)
export async function DELETE(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const { searchParams } = new URL(request.url);
            const id = searchParams.get('id');

            if (!id) {
                return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
            }

            const userId = parseInt(id);

            // 1. Check if user exists
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: { orders: true }
            });

            if (!user) {
                return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
            }

            // GDPR ANONYMIZATION STRATEGY
            const timestamp = new Date().getTime();
            const anonymizedEmail = `deleted-${userId}-${timestamp}@deleted.local`;
            const anonymizedName = `Użytkownik Usunięty (RODO)`;

            await prisma.$transaction(async (tx) => {
                // A. Update User Record
                await tx.user.update({
                    where: { id: userId },
                    data: {
                        email: anonymizedEmail,
                        name: anonymizedName,
                        phone: null,
                        password_hash: `DELETED_${timestamp}`,
                        is_active: false,
                        photographer_profile_id: null
                    }
                });

                // B. Anonymize Orders
                await tx.giftCardOrder.updateMany({
                    where: { user_id: userId },
                    data: {
                        customer_name: 'RODO Anonymized',
                        customer_email: anonymizedEmail,
                        recipient_name: 'RODO Anonymized',
                        recipient_email: null,
                        message: null,
                        sender_name: null
                    }
                });

                // C. Anonymize Bookings
                await tx.booking.updateMany({
                    where: { email: user.email },
                    data: {
                        client_name: 'RODO Anonymized',
                        email: anonymizedEmail,
                        phone: null,
                        notes: 'Dane zanonimizowane na wniosek RODO'
                    }
                });
            });

            return NextResponse.json({ success: true, message: 'Client anonymized successfully' });

        } catch (error) {
            console.error('Anonymization error:', error);
            return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
        }
    });
}
