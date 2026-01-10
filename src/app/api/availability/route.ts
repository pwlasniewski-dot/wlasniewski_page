import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

interface AvailabilitySlot {
    hour: number;
    available: boolean;
    reason?: string; // "booked_session" | "booked_event" | "outside_hours"
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');
    const packageId = searchParams.get('packageId');
    const dateStr = searchParams.get('date'); // YYYY-MM-DD format
    const providerId = searchParams.get('providerId');

    if (!serviceId || !dateStr) {
        return NextResponse.json(
            { error: 'Missing serviceId and date parameters' },
            { status: 400 }
        );
    }

    try {
        // Get package details
        const pkgQuery = packageId ? { id: parseInt(packageId) } : { service_id: parseInt(serviceId) };
        const pkg = await prisma.package.findFirst({
            where: pkgQuery
        });

        if (!pkg) {
            return NextResponse.json({ error: 'Package not found' }, { status: 404 });
        }

        // Parse available hours from package - for now default to all hours
        let availableHoursArray: number[] = Array.from({ length: 24 }, (_, i) => i);

        // Get the day of week (0 = Sunday, 1 = Monday, etc.)
        const bookingDate = new Date(dateStr);
        const dayOfWeek = bookingDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        // --- PROVIDER CHECK ---
        let providerBlocked = false;
        if (providerId) {
            const pId = parseInt(providerId);
            // Check ProviderAvailability
            const availability = await prisma.providerAvailability.findFirst({
                where: {
                    user_id: pId,
                    date: {
                        gte: new Date(dateStr + 'T00:00:00Z'),
                        lte: new Date(dateStr + 'T23:59:59Z')
                    }
                }
            });

            if (availability && !availability.is_available) {
                providerBlocked = true;
            }
        }

        // Get all bookings for this date
        // If providerId is present, we prefer bookings assigned to this provider OR bookings for this specific package?
        // Logic:
        // - If Provider is specified, we check bookings for THIS Provider.
        // - If no Provider (Admin), we check all bookings? Or just Admin/unassigned bookings?
        // CURRENTLY: Booking logic is global for date. If Wedding is booked, it blocks date for everyone?
        // NO, SaaS logic means multiple photographers can have events on same day.
        // CHANGE: Filter bookings by provider_id if provided. If not provided (Admin), maybe check all unassigned?
        // NOTE: Admin usually sees 'Global' availability if he performs defaults.
        // BUT, `Booking` doesn't strictly have `provider_id` in schema yet? 
        // Wait, I did `include: { provider: ... }` on bookings page, meaning `provider` relation exists on Booking.
        // So Booking HAS `provider_id`.

        const whereBooking: any = {
            date: {
                gte: new Date(dateStr + 'T00:00:00Z'),
                lt: new Date(dateStr + 'T23:59:59Z')
            },
            status: {
                notIn: ['cancelled', 'rejected']
            }
        };

        if (providerId) {
            whereBooking.provider_id = parseInt(providerId);
        } else {
            // Admin/Global context: Check bookings that are NOT assigned to specific providers?
            // Or Admin checks HIS bookings (provider_id = null)?
            // Creating a global collision check might be tricky.
            // Let's assume Admin handles 'null' provider_id bookings.
            whereBooking.provider_id = null;
        }

        const bookingsForDate = await prisma.booking.findMany({
            where: whereBooking
        });

        // Build availability map
        const availabilityMap = new Map<number, AvailabilitySlot>();

        // Initialize all hours
        for (let hour = 0; hour < 24; hour++) {
            let available = availableHoursArray.includes(hour);
            let reason = availableHoursArray.includes(hour) ? undefined : 'outside_hours';

            if (providerBlocked) {
                available = false;
                reason = 'provider_unavailable';
            }

            availabilityMap.set(hour, {
                hour,
                available,
                reason
            });
        }

        // Process existing bookings
        // Logic remains similar but now scoped by provider separation via `whereBooking`
        let dayCompletelyBlocked = providerBlocked;

        if (!providerBlocked) {
            for (const booking of bookingsForDate) {
                const isWeddingOrEvent = booking.service === 'Ślub' ||
                    booking.service === 'Przyjęcie' ||
                    booking.service === 'Urodziny';

                if (isWeddingOrEvent) {
                    dayCompletelyBlocked = true;
                    for (let hour = 0; hour < 24; hour++) {
                        availabilityMap.set(hour, {
                            hour,
                            available: false,
                            reason: 'booked_event'
                        });
                    }
                } else if (booking.start_time && booking.end_time) {
                    if (!dayCompletelyBlocked) {
                        const startHour = parseInt(booking.start_time.split(':')[0]);
                        const endHour = parseInt(booking.end_time.split(':')[0]);

                        for (let hour = startHour; hour < endHour && hour < 24; hour++) {
                            const current = availabilityMap.get(hour);
                            if (current && (current.available || current.reason === 'outside_hours')) {
                                availabilityMap.set(hour, {
                                    hour,
                                    available: false,
                                    reason: 'booked_session'
                                });
                            }
                        }
                    }
                }
            }
        }

        // Convert map to array and sort
        const slots = Array.from(availabilityMap.values()).sort((a, b) => a.hour - b.hour);

        return NextResponse.json({
            success: true,
            date: dateStr,
            dayOfWeek,
            isWeekend,
            packageName: pkg.name,
            packageHours: pkg.hours,
            dayCompletelyBlocked,
            slots
        });
    } catch (error) {
        console.error('Error calculating availability:', error);
        return NextResponse.json(
            { error: 'Failed to calculate availability' },
            { status: 500 }
        );
    }
}

