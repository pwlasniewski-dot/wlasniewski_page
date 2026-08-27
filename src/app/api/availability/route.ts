import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { loadDronePhotographyCmsPage } from '@/lib/dronePhotographyCms';
import { hasBookingConflict, parseAvailableHours } from '@/lib/bookingAvailability';
import {
    bookingDateUtcRange,
    isBookingDateAllowed,
    isBookingStartInFuture,
    minimumBookingDateISO,
} from '@/lib/bookingDate';
import { isBookingBlockingAvailability } from '@/lib/bookingStatus';

interface AvailabilitySlot {
    hour: number;
    available: boolean;
    reason?: string; // "booked_session" | "booked_event" | "outside_hours"
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');
    const packageId = searchParams.get('packageId');
    const dronePackageSlug = searchParams.get('dronePackageSlug');
    const dateStr = searchParams.get('date'); // YYYY-MM-DD format

    if ((!serviceId && !dronePackageSlug) || !dateStr) {
        return NextResponse.json(
            { error: 'Missing serviceId and date parameters' },
            { status: 400 }
        );
    }

    try {
        const now = new Date();
        const dateRange = bookingDateUtcRange(dateStr);
        if (!dateRange) {
            return NextResponse.json({ error: 'Nieprawidłowa data rezerwacji' }, { status: 400 });
        }
        const bookingSettings = await prisma.setting.findFirst({ orderBy: { id: 'asc' } });
        const minDaysAhead = Math.max(0, Math.min(365, bookingSettings?.booking_min_days_ahead ?? 7));
        const minBookingDate = minimumBookingDateISO(minDaysAhead, now, 'Europe/Warsaw');
        if (!isBookingDateAllowed(dateStr, minDaysAhead, now, 'Europe/Warsaw')) {
            return NextResponse.json({ error: `Najbliższy dostępny dzień rezerwacji to ${minBookingDate}` }, { status: 400 });
        }

        // Get package details. Godziny pakietu są jedynym źródłem godzin
        // wyświetlanych w rezerwacji; pustą konfigurację obsługuje bezpieczny fallback.
        let pkg: { name: string; hours: number; available_hours?: string | null; blocks_entire_day?: boolean | null } | null = null;
        if (dronePackageSlug) {
            const { config } = await loadDronePhotographyCmsPage();
            const item = config.packages.find(candidate =>
                candidate.slug === dronePackageSlug &&
                candidate.active !== false &&
                candidate.bookingMode !== 'addon'
            );
            if (item) pkg = {
                name: item.name,
                hours: Math.max(1, item.durationHours || 1),
                blocks_entire_day: item.blocksEntireDay === true,
            };
        } else {
            const pkgQuery = packageId ? { id: parseInt(packageId) } : { service_id: parseInt(serviceId!) };
            pkg = await prisma.package.findFirst({
                where: pkgQuery,
                select: { name: true, hours: true, available_hours: true, blocks_entire_day: true },
            });
        }

        if (!pkg) {
            return NextResponse.json({ error: 'Package not found' }, { status: 404 });
        }

        const availableHoursArray = parseAvailableHours(pkg.available_hours);

        // Get the day of week (0 = Sunday, 1 = Monday, etc.)
        const dayOfWeek = dateRange.start.getUTCDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        // Get all bookings for this date
        const bookingsForDate = await prisma.booking.findMany({
            where: {
                date: {
                    gte: dateRange.start,
                    lt: dateRange.end,
                },
                status: {
                    notIn: ['cancelled', 'rejected']
                }
            }
        });

        const normalizedBookings = bookingsForDate
          .filter(booking => isBookingBlockingAvailability(booking))
          .map(booking => ({
            start_time: booking.start_time,
            end_time: booking.end_time,
            blocks_entire_day: booking.blocks_entire_day,
          }));
        const dayCompletelyBlocked = normalizedBookings.some(booking => booking.blocks_entire_day);
        const fullDayAvailable = normalizedBookings.length === 0
            && isBookingStartInFuture(dateStr, '00:00', now, 'Europe/Warsaw');
        const configuredHours = new Set(availableHoursArray);

        const slots: AvailabilitySlot[] = Array.from({ length: 24 }, (_, hour) => {
            const fitsConfiguredHours = Array.from({ length: pkg.hours }, (_, index) => hour + index)
                .every(candidate => configuredHours.has(candidate));
            if (!fitsConfiguredHours) return { hour, available: false, reason: 'outside_hours' };
            const start = `${String(hour).padStart(2, '0')}:00`;
            if (!isBookingStartInFuture(dateStr, start, now, 'Europe/Warsaw')) {
                return { hour, available: false, reason: 'past_time' };
            }
            if (dayCompletelyBlocked) return { hour, available: false, reason: 'booked_event' };

            const endHour = hour + pkg.hours;
            const end = endHour < 24 ? `${String(endHour).padStart(2, '0')}:00` : null;
            const conflicts = !end || hasBookingConflict(normalizedBookings, {
                blocksEntireDay: false,
                startTime: start,
                endTime: end,
            });
            return conflicts
                ? { hour, available: false, reason: 'booked_session' }
                : { hour, available: true };
        });

        return NextResponse.json({
            success: true,
            date: dateStr,
            dayOfWeek,
            isWeekend,
            packageName: pkg.name,
            packageHours: pkg.hours,
            dayCompletelyBlocked,
            fullDayAvailable: pkg.blocks_entire_day ? fullDayAvailable : undefined,
            minBookingDate,
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
