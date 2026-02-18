import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import bcrypt from 'bcrypt';
import { sendEmail } from '@/lib/email/sender';

export const dynamic = 'force-dynamic';

// GET: Fetch all clients with stats
export async function GET(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const clients = await prisma.user.findMany({
                where: { role: 'CLIENT' },
                orderBy: { created_at: 'desc' },
                include: {
                    _count: {
                        select: {
                            orders: true,
                            assigned_bookings: true,
                            client_galleries: true
                        }
                    },
                    orders: {
                        select: { amount_paid: true, created_at: true }
                    },
                    offers: {
                        select: {
                            id: true,
                            status: true,
                            total_price: true,
                            category: true,
                            type: true,
                            template_data: true,
                            created_at: true,
                            contract: {
                                select: { id: true, status: true, signed_at: true }
                            }
                        },
                        orderBy: { created_at: 'desc' }
                    },
                    client_galleries: {
                        select: {
                            id: true,
                            standard_count: true,
                            photos: { select: { id: true } },
                            orders: { select: { id: true, payment_status: true } }
                        }
                    }
                }
            });

            // Fetch bookings by email for LTV + type info
            const allClientEmails = clients.map(c => c.email);
            const bookingsByEmail = await prisma.booking.groupBy({
                by: ['email'],
                where: {
                    email: { in: allClientEmails },
                    status: { in: ['confirmed', 'completed'] }
                },
                _sum: { price: true }
            });
            const bookingRevenueMap = new Map(
                bookingsByEmail.map(b => [b.email, b._sum.price || 0])
            );

            // Fetch latest booking per client for type/date info
            const latestBookings = await prisma.booking.findMany({
                where: { email: { in: allClientEmails } },
                select: {
                    email: true,
                    service: true,
                    package: true,
                    date: true,
                    status: true,
                    price: true
                },
                orderBy: { date: 'desc' }
            });
            const latestBookingMap = new Map<string, typeof latestBookings[0]>();
            for (const b of latestBookings) {
                if (!latestBookingMap.has(b.email)) {
                    latestBookingMap.set(b.email, b);
                }
            }

            const formattedClients = clients.map(client => {
                const giftCardRevenue = client.orders.reduce((sum, o) => sum + o.amount_paid, 0);
                const bookingRevenue = bookingRevenueMap.get(client.email) || 0;
                const totalSpent = giftCardRevenue + bookingRevenue;
                const lastOrder = client.orders.length > 0 ? client.orders[0].created_at : null;

                // Offer analysis
                const latestOffer = client.offers[0] || null;
                const offerStatus = latestOffer?.status || null;
                const approvedAmount = latestOffer?.status === 'accepted'
                    ? (latestOffer.total_price || 0)
                    : null;

                // Job type from offer category or booking service
                const offerCategory = latestOffer?.category ||
                    (latestOffer?.template_data as any)?.category || null;
                const latestBooking = latestBookingMap.get(client.email);
                const jobType = offerCategory || latestBooking?.service || null;
                const jobTypeLower = jobType?.toLowerCase() || '';
                const isKomunia = jobTypeLower.includes('komunia') || jobTypeLower.includes('communion');

                // Contract analysis
                const latestContract = latestOffer?.contract || null;
                const contractStatus = latestContract?.status || null;

                // Gallery analysis (client's own galleries)
                const gallery = client.client_galleries[0] || null;
                const photosExpected = gallery?.standard_count || 0;
                const photosAdded = gallery?.photos?.length || 0;
                const isPaid = gallery?.orders?.some(
                    (o: { payment_status: string }) =>
                        o.payment_status === 'paid' || o.payment_status === 'completed'
                ) || false;

                return {
                    id: client.id,
                    name: client.name || 'Bez nazwy',
                    email: client.email,
                    phone: client.phone,
                    created_at: client.created_at,
                    stats: {
                        ordersCount: client._count.orders,
                        bookingsCount: client._count.assigned_bookings,
                        galleriesCount: client._count.client_galleries,
                        totalSpent,
                        lastActive: lastOrder,
                        // Offer
                        offerStatus,
                        offersCount: client.offers.length,
                        approvedAmount,
                        // Contract
                        contractStatus,
                        contractSignedAt: latestContract?.signed_at || null,
                        // Gallery
                        photosExpected,
                        photosAdded,
                        hasGallery: !!gallery,
                        isPaid,
                        // Job type
                        jobType,
                        isKomunia,
                        // Booking
                        nextBookingDate: latestBooking?.date || null,
                        bookingStatus: latestBooking?.status || null,
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

            // Send welcome email (without password — security best practice)
            try {
                await sendEmail({
                    to: email,
                    subject: 'Witaj w Panelu Klienta — Przemysław Właśniewski',
                    template: 'welcome-client',
                    data: {
                        name,
                        email,
                        loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://wlasniewski.pl'}/logowanie`
                        // Password NOT included — admin should communicate it separately and securely
                    }
                });
            } catch (emailError) {
                console.error('Failed to send welcome email:', emailError);
                // We don't fail the whole request if email fails, but we log it
            }

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
