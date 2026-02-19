import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugAPI() {
    console.log('--- STARTING CRM API SIMULATION ---');
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

        console.log(`Fetched ${clients.length} raw clients.`);

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

        const latestBookingMap = new Map<string, any>();
        for (const b of latestBookings) {
            if (!latestBookingMap.has(b.email)) {
                latestBookingMap.set(b.email, b);
            }
        }

        const formattedClients = clients.map(client => {
            console.log(`Formatting client: ${client.email}`);
            const giftCardRevenue = client.orders.reduce((sum, o) => sum + o.amount_paid, 0);
            const bookingRevenue = bookingRevenueMap.get(client.email) || 0;
            const totalSpent = giftCardRevenue + bookingRevenue;
            const lastOrder = client.orders.length > 0 ? client.orders[0].created_at : null;

            const latestOffer = client.offers[0] || null;
            const offerStatus = latestOffer?.status || null;
            const approvedAmount = latestOffer?.status === 'accepted'
                ? (latestOffer.total_price || 0)
                : null;

            const offerCategory = latestOffer?.category ||
                (latestOffer?.template_data as any)?.category || null;
            const latestBooking = latestBookingMap.get(client.email);
            const jobType = offerCategory || latestBooking?.service || null;

            // MY FIX APPLIED HERE
            const jobTypeLower = jobType?.toLowerCase() || '';
            const isKomunia = jobTypeLower.includes('komunia') || jobTypeLower.includes('communion');

            const latestContract = latestOffer?.contract || null;
            const contractStatus = latestContract?.status || null;

            const gallery = client.client_galleries[0] || null;
            const photosExpected = gallery?.standard_count || 0;
            const photosAdded = gallery?.photos?.length || 0;
            const isPaid = gallery?.orders?.some(
                (o: { payment_status: string }) =>
                    o.payment_status === 'paid' || o.payment_status === 'completed'
            ) || false;

            return {
                id: client.id,
                email: client.email,
                stats: { totalSpent, jobType, isKomunia } // just a few for check
            };
        });

        console.log('SUCCESS! Formatted clients:', formattedClients.length);
        console.log(JSON.stringify(formattedClients, null, 2));

    } catch (error) {
        console.error('CRASH DETECTED:', error);
    }
}

debugAPI().finally(() => prisma.$disconnect());
