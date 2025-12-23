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
        // This will be enhanced when Prisma schema updates are fully synced
        let availableHoursArray: number[] = Array.from({ length: 24 }, (_, i) => i);

        // Get the day of week (0 = Sunday, 1 = Monday, etc.)
        const bookingDate = new Date(dateStr);
        const dayOfWeek = bookingDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        // Get all bookings for this date
        const bookingsForDate = await prisma.booking.findMany({
            where: {
                date: {
                    gte: new Date(dateStr + 'T00:00:00Z'),
                    lt: new Date(dateStr + 'T23:59:59Z')
                }
            }
        });

        // Build availability map
        const availabilityMap = new Map<number, AvailabilitySlot>();

        // Initialize all hours as available
        for (let hour = 0; hour < 24; hour++) {
            availabilityMap.set(hour, {
                hour,
                available: availableHoursArray.includes(hour),
                reason: availableHoursArray.includes(hour) ? undefined : 'outside_hours'
            });
        }

        // Process existing bookings with intelligent blocking logic
        // Rules:
        // 1. If booking blocks_entire_day (weddings, events) = entire day is blocked
        // 2. If booking is a session (1h) = only that time slot is blocked
        // 3. Weddings/events take priority - if day is blocked, sessions can't be added
        
        let dayCompletelyBlocked = false;

        for (const booking of bookingsForDate) {
            // Check if this booking should block entire day
            // For now, we check if it's wedding/event service type by analyzing package info
            // This will be enhanced when blocks_entire_day field is available
            
            const isWeddingOrEvent = booking.service === 'Ślub' || 
                                     booking.service === 'Przyjęcie' || 
                                     booking.service === 'Urodziny';

            if (isWeddingOrEvent) {
                // Block entire day
                dayCompletelyBlocked = true;
                for (let hour = 0; hour < 24; hour++) {
                    availabilityMap.set(hour, {
                        hour,
                        available: false,
                        reason: 'booked_event'
                    });
                }
            } else if (booking.start_time && booking.end_time) {
                // Block only specific time slot (session)
                // But don't block if day is already blocked by event
                if (!dayCompletelyBlocked) {
                    const startHour = parseInt(booking.start_time.split(':')[0]);
                    const endHour = parseInt(booking.end_time.split(':')[0]);

                    for (let hour = startHour; hour < endHour && hour < 24; hour++) {
                        const current = availabilityMap.get(hour);
                        // Keep event blocks, only add session blocks if not blocked by event
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

