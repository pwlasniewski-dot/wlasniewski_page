import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { loadDronePhotographyCmsPage } from '@/lib/dronePhotographyCms';
import { hasBookingDateTimeConflict } from '@/lib/bookingAvailability';
import {
    buildBookingSlots,
    formatScheduleMinute,
    normalizeBookingServiceKey,
    resolveBookingSchedule,
} from '@/lib/bookingSchedule';
import { loadBookingScheduleConfiguration } from '@/lib/bookingScheduleRepository';
import {
    bookingDateUtcRange,
    isBookingDateAllowed,
    isBookingStartInFuture,
    minimumBookingDateISO,
} from '@/lib/bookingDate';
import { isBookingBlockingAvailability } from '@/lib/bookingStatus';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');
    const packageId = searchParams.get('packageId');
    const dronePackageSlug = searchParams.get('dronePackageSlug');
    const dateStr = searchParams.get('date');

    if ((!serviceId && !dronePackageSlug) || !dateStr) {
        return NextResponse.json({ error: 'Brakuje usługi lub daty.' }, { status: 400 });
    }

    try {
        const now = new Date();
        const dateRange = bookingDateUtcRange(dateStr);
        if (!dateRange) {
            return NextResponse.json({ error: 'Nieprawidłowa data rezerwacji.' }, { status: 400 });
        }

        const bookingSettings = await prisma.setting.findFirst({ orderBy: { id: 'asc' } });
        const minDaysAhead = Math.max(0, Math.min(365, bookingSettings?.booking_min_days_ahead ?? 7));
        const minBookingDate = minimumBookingDateISO(minDaysAhead, now, 'Europe/Warsaw');
        if (!isBookingDateAllowed(dateStr, minDaysAhead, now, 'Europe/Warsaw')) {
            return NextResponse.json({ error: `Najbliższy dostępny dzień rezerwacji to ${minBookingDate}.` }, { status: 400 });
        }

        let pkg: {
            name: string;
            hours: number;
            blocksEntireDay: boolean;
            serviceName: string;
        } | null = null;

        if (dronePackageSlug) {
            const { config } = await loadDronePhotographyCmsPage();
            const item = config.packages.find(candidate =>
                candidate.slug === dronePackageSlug
                && candidate.active !== false
                && candidate.bookingMode !== 'addon'
            );
            if (item) {
                pkg = {
                    name: item.name,
                    hours: Math.max(1, item.durationHours || 1),
                    blocksEntireDay: item.blocksEntireDay === true,
                    serviceName: 'Dron',
                };
            }
        } else {
            const numericPackageId = Number(packageId);
            const numericServiceId = Number(serviceId);
            const selected = await prisma.package.findFirst({
                where: Number.isInteger(numericPackageId) && numericPackageId > 0
                    ? { id: numericPackageId, is_active: true }
                    : { service_id: numericServiceId, is_active: true },
                select: {
                    name: true,
                    hours: true,
                    blocks_entire_day: true,
                    service: { select: { name: true } },
                },
            });
            if (selected) {
                pkg = {
                    name: selected.name,
                    hours: Math.max(1, selected.hours),
                    blocksEntireDay: selected.blocks_entire_day === true,
                    serviceName: selected.service.name,
                };
            }
        }

        if (!pkg) {
            return NextResponse.json({ error: 'Wybrany pakiet nie jest dostępny.' }, { status: 404 });
        }

        const serviceKey = normalizeBookingServiceKey(pkg.serviceName);
        const configuration = await loadBookingScheduleConfiguration({
            service: serviceKey,
            fromDate: dateStr,
            toDate: dateStr,
        });
        const schedule = resolveBookingSchedule({
            serviceKey,
            date: dateStr,
            rules: configuration.rules,
            exceptions: configuration.exceptions,
        });
        if (!schedule || !schedule.enabled) {
            return NextResponse.json({
                success: true,
                date: dateStr,
                packageName: pkg.name,
                packageHours: pkg.hours,
                minBookingDate,
                scheduleClosed: true,
                slots: [],
            });
        }

        // Include the previous and next day so an event ending after midnight
        // cannot overlap another reservation anchored to the neighbouring date.
        const queryStart = new Date(dateRange.start.getTime() - 86_400_000);
        const queryEnd = new Date(dateRange.end.getTime() + 86_400_000);
        const bookings = await prisma.booking.findMany({
            where: {
                date: { gte: queryStart, lt: queryEnd },
                status: { notIn: ['cancelled', 'rejected'] },
            },
            select: {
                date: true,
                status: true,
                start_time: true,
                end_time: true,
                blocks_entire_day: true,
                created_at: true,
            },
        });
        const blockingBookings = bookings.filter(booking => isBookingBlockingAvailability(booking));

        const slots = buildBookingSlots(schedule, pkg.hours * 60).map(slot => {
            if (!isBookingStartInFuture(dateStr, slot.start, now, 'Europe/Warsaw')) {
                return { ...slot, available: false, reason: 'past_time' };
            }
            const conflicts = hasBookingDateTimeConflict(blockingBookings, {
                dateISO: dateStr,
                blocksEntireDay: pkg.blocksEntireDay,
                startTime: slot.start,
                endTime: slot.end,
                endDayOffset: slot.endDayOffset,
            });
            return conflicts
                ? { ...slot, available: false, reason: 'booked' }
                : { ...slot, available: true };
        });

        return NextResponse.json({
            success: true,
            date: dateStr,
            packageName: pkg.name,
            packageHours: pkg.hours,
            minBookingDate,
            scheduleClosed: false,
            schedule: {
                from: formatScheduleMinute(schedule.startMinute),
                to: formatScheduleMinute(schedule.endMinute),
                exception: schedule.exceptionMode,
            },
            slots,
        });
    } catch (error) {
        console.error('Error calculating availability:', error);
        return NextResponse.json({ error: 'Nie udało się obliczyć dostępności.' }, { status: 500 });
    }
}
