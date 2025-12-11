import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const daysAhead = parseInt(searchParams.get('daysAhead') || '30');
        const uniqueLink = searchParams.get('unique_link');

        if (!uniqueLink) {
            return NextResponse.json(
                { success: false, error: 'unique_link required' },
                { status: 400 }
            );
        }

        // Get challenge to check if it's for a full day event or specific time
        const challenge = await prisma.photoChallenge.findUnique({
            where: { unique_link: uniqueLink }
        });

        if (!challenge) {
            return NextResponse.json(
                { success: false, error: 'Challenge not found' },
                { status: 404 }
            );
        }

        // Get all bookings for next 30 days
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const futureDate = new Date(today);
        futureDate.setDate(futureDate.getDate() + daysAhead);

        const bookings = await prisma.booking.findMany({
            where: {
                date: {
                    gte: today,
                    lte: futureDate
                }
            }
        });

        // Build occupied dates and hours
        const occupiedDates = new Set<string>();
        const occupiedHours: Record<string, number[]> = {};

        bookings.forEach(booking => {
            const dateStr = booking.date.toISOString().split('T')[0];
            
            // If it's a full day event (wedding/event), block entire day
            if (booking.service === 'Ślub' || booking.service === 'Przyjęcie' || booking.service === 'Event') {
                occupiedDates.add(dateStr);
            } else {
                // For sessions, block only specific hours
                if (booking.start_time) {
                    const startHour = parseInt(booking.start_time.split('T')[1]?.split(':')[0] || '0');
                    if (!occupiedHours[dateStr]) {
                        occupiedHours[dateStr] = [];
                    }
                    // Block hour and next hour (session usually 1-2h)
                    occupiedHours[dateStr].push(startHour);
                    occupiedHours[dateStr].push(startHour + 1);
                }
            }
        });

        // Generate available days and hours
        const availableDays: Array<{
            date: string;
            available: boolean;
            reason?: string;
            hours?: Array<{
                hour: number;
                available: boolean;
            }>;
        }> = [];

        for (let i = 0; i < daysAhead; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];

            // Don't allow past dates
            if (date < today && dateStr !== today.toISOString().split('T')[0]) {
                continue;
            }

            const isFullDayOccupied = occupiedDates.has(dateStr);

            if (isFullDayOccupied) {
                availableDays.push({
                    date: dateStr,
                    available: false,
                    reason: 'Zajęty cały dzień'
                });
            } else {
                // Generate hours (9-20)
                const hours = [];
                for (let hour = 9; hour <= 20; hour++) {
                    const bookedHours = occupiedHours[dateStr] || [];
                    hours.push({
                        hour,
                        available: !bookedHours.includes(hour)
                    });
                }

                availableDays.push({
                    date: dateStr,
                    available: hours.some(h => h.available),
                    hours
                });
            }
        }

        return NextResponse.json({
            success: true,
            availability: availableDays
        });
    } catch (error) {
        console.error('Error fetching availability:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
