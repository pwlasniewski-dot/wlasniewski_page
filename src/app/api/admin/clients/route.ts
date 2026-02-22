import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import bcrypt from 'bcryptjs';
import { logSystem } from '@/lib/logger';
import { sendEmail } from '@/lib/email/sender';

export const dynamic = 'force-dynamic';

// GET: Fetch all clients with stats
export async function GET(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const clients = await prisma.user.findMany({
                where: { role: 'CLIENT' },
                orderBy: { created_at: 'desc' }
            });

            if (clients.length === 0) {
                return NextResponse.json({ success: true, clients: [] });
            }

            const allClientEmails = clients.map(c => c.email);
            const allClientIds = clients.map(c => c.id);

            // 1. Fetch Related Data Independently (Avoids failing includes)
            const [giftCardOrders, assignedBookings, offers, clientGalleries, negotiations] = await Promise.all([
                prisma.giftCardOrder.findMany({
                    where: { user_id: { in: allClientIds } },
                    select: { user_id: true, amount_paid: true, created_at: true }
                }).catch(() => []),
                prisma.booking.findMany({
                    where: { email: { in: allClientEmails } },
                    select: { email: true, id: true, service: true, package: true, date: true, status: true, price: true },
                    orderBy: { date: 'desc' }
                }).catch(() => []),
                prisma.offer.findMany({
                    where: { client_id: { in: allClientIds } },
                    select: {
                        id: true,
                        client_id: true,
                        status: true,
                        total_price: true,
                        category: true,
                        type: true,
                        template_data: true,
                        created_at: true
                    },
                    orderBy: { created_at: 'desc' }
                }).catch(() => []),
                prisma.clientGallery.findMany({
                    where: {
                        OR: [
                            { client_id: { in: allClientIds } },
                            { client_email: { in: allClientEmails } }
                        ]
                    },
                    select: {
                        id: true,
                        client_id: true,
                        client_email: true,
                        standard_count: true,
                        // nested selects/includes might still fail if tables are truly weird, 
                        // but let's try to keep them simplified
                    }
                }).catch(() => []),
                prisma.negotiation.findMany({
                    where: {
                        offer: {
                            client_id: { in: allClientIds }
                        }
                    },
                    select: {
                        id: true,
                        offer_id: true,
                        offer: { select: { client_id: true } }
                    }
                }).catch(() => [])
            ]);

            // Map data for fast lookup
            const ordersMap = new Map<number, typeof giftCardOrders>();
            giftCardOrders.forEach(o => {
                if (o.user_id) {
                    const list = ordersMap.get(o.user_id) || [];
                    list.push(o);
                    ordersMap.set(o.user_id, list);
                }
            });

            const bookingsMap = new Map<string, typeof assignedBookings>();
            assignedBookings.forEach(b => {
                const list = bookingsMap.get(b.email) || [];
                list.push(b);
                bookingsMap.set(b.email, list);
            });

            const offersMap = new Map<number, typeof offers>();
            offers.forEach(o => {
                if (o.client_id) {
                    const list = offersMap.get(o.client_id) || [];
                    list.push(o);
                    offersMap.set(o.client_id, list);
                }
            });

            const galleriesMap = new Map<string, (typeof clientGalleries)[0]>();
            clientGalleries.forEach(g => {
                if (g.client_email) galleriesMap.set(g.client_email, g);
            });

            const negotiationsMap = new Map<number, typeof negotiations>();
            negotiations.forEach(n => {
                if (n.offer?.client_id) {
                    const list = negotiationsMap.get(n.offer.client_id) || [];
                    list.push(n);
                    negotiationsMap.set(n.offer.client_id, list);
                }
            });

            const formattedClients = clients.map(client => {
                const clientOrders = ordersMap.get(client.id) || [];
                const clientBookings = bookingsMap.get(client.email) || [];
                const clientOffers = offersMap.get(client.id) || [];
                const clientGallery = galleriesMap.get(client.email) || null;
                const clientNegotiations = negotiationsMap.get(client.id) || [];

                const giftCardRevenue = clientOrders.reduce((sum, o) => sum + o.amount_paid, 0);
                const bookingRevenue = clientBookings
                    .filter(b => b.status === 'confirmed' || b.status === 'completed')
                    .reduce((sum, b) => sum + (b.price || 0), 0);

                const totalSpent = giftCardRevenue + bookingRevenue;
                const lastOrder = clientOrders.length > 0 ? clientOrders[0].created_at : null;

                // Offer analysis
                const latestOffer = clientOffers[0] || null;
                const offerStatus = latestOffer?.status || null;
                const approvedAmount = latestOffer?.status === 'accepted'
                    ? (latestOffer.total_price || 0)
                    : null;

                // Job type
                const offerCategory = latestOffer?.category ||
                    (latestOffer?.template_data as any)?.category || null;
                const latestBooking = clientBookings[0] || null;
                const jobType = offerCategory || latestBooking?.service || null;
                const jobTypeLower = jobType?.toLowerCase() || '';
                const isKomunia = jobTypeLower.includes('komunia') || jobTypeLower.includes('communion');

                // Gallery analysis
                const photosExpected = clientGallery?.standard_count || 0;

                return {
                    id: client.id,
                    name: client.name || 'Wczytywanie...',
                    email: client.email,
                    phone: client.phone,
                    created_at: client.created_at,
                    stats: {
                        totalSpent,
                        lastActive: lastOrder,
                        offerStatus,
                        offersCount: clientOffers.length,
                        approvedAmount,
                        contractStatus: 'Wczytywanie...', // Partial recovery
                        contractSignedAt: null,
                        photosExpected,
                        photosAdded: 0,
                        hasGallery: !!clientGallery,
                        isPaid: false,
                        jobType,
                        isKomunia,
                        nextBookingDate: latestBooking?.date || null,
                        bookingStatus: latestBooking?.status || null,
                        hasBookings: clientBookings.length > 0,
                        negotiationsCount: clientNegotiations.length
                    }
                };
            });

            return NextResponse.json({ success: true, clients: formattedClients });
        } catch (error: any) {
            console.error('Fetch clients error:', error);
            await logSystem('ERROR', 'SYSTEM', 'Failed to fetch clients', { error: error.message, stack: error.stack });
            return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
        }
    });
}

// POST: Create a new client user
export async function POST(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const body = await req.json();
            const { name, email, phone } = body;

            if (!name || !email) {
                return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
            }

            // Check if email already exists
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
            }

            // Generate a secure one-time token for password setup
            const { randomBytes } = await import('crypto');
            const resetToken = randomBytes(32).toString('hex');
            const resetTokenExpires = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

            // Create client user with a locked placeholder password (they'll set their own)
            const placeholderHash = await bcrypt.hash(`LOCKED_${resetToken}_${Date.now()}`, 10);

            const user = await prisma.user.create({
                data: {
                    name,
                    email,
                    phone,
                    password_hash: placeholderHash,
                    role: 'CLIENT',
                    reset_token: resetToken,
                    reset_token_expires: resetTokenExpires,
                }
            });

            // Set default full permissions for admin-created clients
            const defaultPerms = JSON.stringify({ galleries: true, offers: true, contracts: true, bookings: true, gift_cards: true });
            await prisma.$executeRawUnsafe(
                `UPDATE users SET permissions = $1::jsonb WHERE id = $2`,
                defaultPerms,
                user.id
            );

            // Build the password-setup link
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wlasniewski.pl';
            const setupUrl = `${appUrl}/logowanie/ustaw-haslo?token=${resetToken}`;

            // Send welcome email with password setup link
            try {
                await sendEmail({
                    to: email,
                    subject: `Witaj ${name} w panelu klienta na stronie fotografa Przemka Właśniewskiego`,
                    template: 'welcome-client',
                    data: {
                        name,
                        email,
                        loginUrl: setupUrl,
                    }
                });
            } catch (emailError) {
                console.error('Failed to send welcome email:', emailError);
            }

            return NextResponse.json({ success: true, client: { id: user.id, name: user.name, email: user.email } });
        } catch (error: any) {
            console.error('Create client error:', error);
            await logSystem('ERROR', 'SYSTEM', 'Failed to create client', { error: error.message });
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
            const isHardDelete = searchParams.get('hard') === 'true';

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
                if (isHardDelete) {
                    // HARD DELETE STRATEGY
                    // 1. Delete Bookings
                    await tx.booking.deleteMany({
                        where: { email: user.email }
                    });

                    // 2. Delete Offers
                    await tx.offer.deleteMany({
                        where: { client_id: userId }
                    });

                    // 3. Delete Galleries
                    await tx.clientGallery.deleteMany({
                        where: {
                            OR: [
                                { client_id: userId },
                                { client_email: user.email }
                            ]
                        }
                    });

                    // 4. Delete the user record
                    await tx.user.delete({
                        where: { id: userId }
                    });
                } else {
                    // GDPR ANONYMIZATION STRATEGY
                    const timestamp = new Date().getTime();
                    const anonymizedEmail = `deleted-${userId}-${timestamp}@deleted.local`;
                    const anonymizedName = `Użytkownik Usunięty (RODO)`;

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
                }
            });

            return NextResponse.json({
                success: true,
                message: isHardDelete ? 'Client deleted permanently' : 'Client anonymized successfully'
            });

        } catch (error) {
            console.error('Anonymization error:', error);
            return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
        }
    });
}
