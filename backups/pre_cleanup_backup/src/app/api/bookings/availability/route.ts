import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('start');
        const endDate = searchParams.get('end');

        // Default: next 60 days
        const start = startDate ? new Date(startDate) : new Date();
        const end = endDate ? new Date(endDate) : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

        // Fetch all bookings in date range
        const bookings = await prisma.booking.findMany({
            where: {
                date: {
                    gte: start,
                    lte: end,
                },
                status: {
                    not: 'cancelled',
                },
            },
            select: {
                date: true,
                start_time: true,
                end_time: true,
            },
        });

        // Group by date
        const bookedDates = bookings.map(b => ({
            date: b.date.toISOString().split('T')[0],
            start_time: b.start_time,
            end_time: b.end_time,
        }));

        // Generate suggested free dates (3-5 suggestions)
        const suggestedDates: string[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 1; suggestedDates.length < 5 && i < 60; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() + i);

            // Skip Mondays (day 1) - photographer's day off
            if (checkDate.getDay() === 1) continue;

            const dateStr = checkDate.toISOString().split('T')[0];
            const isBooked = bookedDates.some(b => b.date === dateStr);

            if (!isBooked) {
                suggestedDates.push(dateStr);
            }
        }

        return NextResponse.json({
            success: true,
            booked_dates: bookedDates,
            suggested_dates: suggestedDates,
        });
    } catch (error) {
        console.error('Error fetching availability:', error);
        return NextResponse.json(
            { success: false, error: 'Nie udało się pobrać dostępności' },
            { status: 500 }
        );
    }
}
