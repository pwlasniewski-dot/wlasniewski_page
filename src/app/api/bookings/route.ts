import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/sender";
import { generateBookingConfirmedEmail, generateGoogleReviewRequestEmail } from "@/lib/email-templates";
import { logSystem } from "@/lib/logger";
import { requireAuth } from "@/lib/auth/middleware";
import { normalizeGoogleReviewUrl } from "@/lib/marketing/gallery-trust";
import { isBookingBlockingAvailability } from '@/lib/bookingStatus';
import { minimumBookingDateISO } from '@/lib/bookingDate';
import { buildBookingSlots, normalizeBookingServiceKey, resolveBookingSchedule } from '@/lib/bookingSchedule';
import { loadBookingScheduleConfiguration } from '@/lib/bookingScheduleRepository';
import { hasBookingDateTimeConflict } from '@/lib/bookingAvailability';

import prisma from '@/lib/db/prisma';

/**
 * Legacy endpoint disabled deliberately. It accepted package and price values from
 * the browser, so it could create false confirmed bookings and consume vouchers.
 * Public bookings are created only by /api/basket/checkout, which resolves the
 * active package and final amount on the server.
 */
export async function POST() {
    return NextResponse.json(
        { ok: false, message: "Ten sposób rezerwacji nie jest już obsługiwany. Rozpocznij rezerwację na stronie oferty." },
        { status: 410 }
    );
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");

    try {
        if (mode === "availability") {
            const ym = searchParams.get("ym"); // e.g., "2023-10"
            if (!ym || !/^\d{4}-(0[1-9]|1[0-2])$/.test(ym)) {
                return NextResponse.json({ availability: {} });
            }

            // Parse year and month
            const [year, month] = ym.split("-").map(Number);
            const startDate = new Date(Date.UTC(year, month - 1, 1));
            const endDate = new Date(Date.UTC(year, month, 1));

            // Fetch bookings for this month
            const lastMonthDate = new Date(endDate.getTime() - 86_400_000).toISOString().slice(0, 10);
            const serviceKey = normalizeBookingServiceKey(searchParams.get('service'));
            const requestedDuration = Number(searchParams.get('durationHours'));
            const durationMinutes = Number.isFinite(requestedDuration) && requestedDuration > 0
                ? Math.min(24, requestedDuration) * 60
                : 60;
            const exclusiveDay = searchParams.get('exclusiveDay') === 'true';
            const [bookings, bookingSettings, bookingConfiguration] = await Promise.all([
                prisma.booking.findMany({
                    where: {
                        date: {
                            gte: new Date(startDate.getTime() - 86_400_000),
                            lt: new Date(endDate.getTime() + 86_400_000),
                        },
                        status: {
                            notIn: ["cancelled", "rejected", "archived"],
                        },
                    },
                    // Availability must remain readable during additive schema
                    // rollouts. Selecting the full Booking record would make a
                    // deploy preview depend on columns that are not migrated yet.
                    select: {
                        date: true,
                        status: true,
                        start_time: true,
                        end_time: true,
                        blocks_entire_day: true,
                    },
                }),
                prisma.setting.findFirst({ orderBy: { id: 'asc' }, select: { booking_min_days_ahead: true } }),
                loadBookingScheduleConfiguration({
                    service: serviceKey,
                    fromDate: startDate.toISOString().slice(0, 10),
                    toDate: lastMonthDate,
                }),
            ]);

            const availability: Record<string, any> = {};
            const blockingBookings = bookings.filter(booking => isBookingBlockingAvailability(booking));

            for (let day = 1; day <= new Date(Date.UTC(year, month, 0)).getUTCDate(); day += 1) {
                const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const schedule = resolveBookingSchedule({
                    serviceKey,
                    date: dateKey,
                    rules: bookingConfiguration.rules,
                    exceptions: bookingConfiguration.exceptions,
                });
                const candidateSlots = schedule?.enabled ? buildBookingSlots(schedule, durationMinutes) : [];
                const hasBookableSlot = candidateSlots.some(slot => !hasBookingDateTimeConflict(blockingBookings, {
                    dateISO: dateKey,
                    blocksEntireDay: exclusiveDay,
                    startTime: slot.start,
                    endTime: slot.end,
                    endDayOffset: slot.endDayOffset,
                }));
                availability[dateKey] = {
                    fullDay: false,
                    closed: !schedule?.enabled || !hasBookableSlot,
                    booked: [],
                    ranges: [],
                };
            }

            // Process bookings into availability format
            blockingBookings.forEach((booking) => {
                const dateKey = booking.date.toISOString().split("T")[0];

                if (!availability[dateKey]) return;

                // Wyłącznie jawna konfiguracja pakietu może zablokować cały dzień.
                if (booking.blocks_entire_day) {
                    availability[dateKey].fullDay = true;
                } else {
                    // For sessions, mark specific slots as booked
                    if (booking.start_time) {
                        availability[dateKey].booked.push(booking.start_time);
                        // Also add to ranges for overlap checking
                        if (booking.end_time) {
                            availability[dateKey].ranges.push({
                                start: booking.start_time,
                                end: booking.end_time,
                                endDayOffset: booking.end_time <= booking.start_time ? 1 : 0,
                            });
                        }
                    }
                }
            });

            const minDaysAhead = Math.max(0, Math.min(365, bookingSettings?.booking_min_days_ahead ?? 7));
            return NextResponse.json({
                availability,
                minBookingDate: minimumBookingDateISO(minDaysAhead, new Date(), 'Europe/Warsaw'),
            });
        }

        // Default: List all bookings (Admin only) — z opcjonalnymi filtrami
        const authError = await requireAuth(request as any);
        if (authError) return authError;

        const from = searchParams.get('from'); // ISO date YYYY-MM-DD
        const to = searchParams.get('to');     // ISO date YYYY-MM-DD
        const status = searchParams.get('status'); // pending|confirmed|paid|cancelled|archived
        const photographerId = searchParams.get('photographer_id');

        const where: any = { status: { not: 'archived' } };
        if (status && status !== 'all') {
            where.status = status;
        }
        if (from || to) {
            where.date = {};
            if (from) where.date.gte = new Date(from + 'T00:00:00.000Z');
            if (to) where.date.lte = new Date(to + 'T23:59:59.999Z');
        }
        if (photographerId) {
            where.photographer_id = parseInt(photographerId, 10);
        }

        const bookings = await prisma.booking.findMany({
            where,
            orderBy: { date: 'asc' },
        });

        return NextResponse.json({ bookings });

    } catch (error) {
        console.error("Error fetching bookings:", error);
        return NextResponse.json(
            { ok: false, message: "Błąd serwera" },
            { status: 500 }
        );
    }
}

// PATCH /api/bookings?id=123 - Update booking status
export async function PATCH(request: Request) {
    const authError = await requireAuth(request as any);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json(
            { ok: false, message: "Brak ID rezerwacji" },
            { status: 400 }
        );
    }

    try {
        const body = await request.json();

        // Allowed fields for update
        const allowedFields = [
            'status', 'service', 'package', 'price',
            'date', 'start_time', 'end_time',
            'client_name', 'email', 'phone',
            'venue_city', 'venue_place', 'notes',
            'promo_code', 'gift_card_code', 'flight_check_status', 'drone_goal', 'company_name'
        ];

        const updateData: Record<string, any> = {};

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                if (field === 'price') {
                    updateData[field] = Number(body[field]);
                } else if (field === 'date') {
                    updateData[field] = new Date(body[field]);
                } else {
                    updateData[field] = body[field];
                }
            }
        }

        // Validate status if present
        if (updateData.status && !["pending", "confirmed", "cancelled", "completed"].includes(updateData.status)) {
            return NextResponse.json(
                { ok: false, message: "Nieprawidłowy status" },
                { status: 400 }
            );
        }

        const previousBooking = await prisma.booking.findUnique({ where: { id: parseInt(id) } });
        const booking = await prisma.booking.update({
            where: { id: parseInt(id) },
            data: updateData,
        });

        if (updateData.flight_check_status && previousBooking?.flight_check_status !== updateData.flight_check_status && booking.drone_package_slug) {
            try {
                const label: Record<string, string> = {
                    APPROVED: 'Lot został sprawdzony i jest możliwy w zarezerwowanym terminie.',
                    RESCHEDULE_REQUIRED: 'Warunki wymagają ustalenia innego terminu lotu. Skontaktuję się z Tobą w sprawie dostępnych dat.',
                    NOT_POSSIBLE: 'W tym miejscu lub terminie lot nie może zostać wykonany. Skontaktuję się z Tobą w sprawie zmiany terminu albo zwrotu za część dronową.',
                    PENDING: 'Możliwość lotu wróciła do etapu sprawdzania.',
                };
                await sendEmail({
                    to: booking.email,
                    subject: `Aktualizacja rezerwacji drona #${booking.id}`,
                    html: `<p>Dzień dobry ${booking.client_name},</p><p>${label[updateData.flight_check_status] || 'Zaktualizowano możliwość wykonania lotu.'}</p><p>Rezerwacja: ${booking.service} — ${booking.package}${booking.drone_package_name && booking.service !== 'Dron' ? ` + ${booking.drone_package_name}` : ''}.</p><p>W razie pytań odpowiedz na tę wiadomość.</p>`,
                });
            } catch (flightEmailError) {
                await logSystem('ERROR', 'EMAIL', 'Failed to send drone flight status email', { bookingId: id, error: String(flightEmailError) });
            }
        }

        // [STABLE: 2025-12-23] Notify client when status is updated to confirmed
        if (updateData.status === "confirmed" && previousBooking?.status !== "confirmed") {
            try {
                const formattedDate = new Date(booking.date).toLocaleDateString('pl-PL', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                const emailData = {
                    clientName: booking.client_name,
                    service: booking.service,
                    packageName: booking.package,
                    date: formattedDate,
                    time: booking.start_time ? (booking.end_time ? `${booking.start_time} - ${booking.end_time}` : booking.start_time) : undefined,
                    location: booking.venue_city ? (booking.venue_place ? `${booking.venue_city}, ${booking.venue_place}` : booking.venue_city) : undefined,
                    price: Number(booking.price),
                    email: booking.email,
                };

                await sendEmail({
                    to: booking.email,
                    subject: `✅ Twoja rezerwacja została POTWIERDZONA! - ${booking.service}`,
                    html: generateBookingConfirmedEmail(emailData)
                });

                await logSystem('INFO', 'EMAIL', `Booking confirmation email sent to client after admin action`, { bookingId: id, email: booking.email });
            } catch (emailError) {
                console.error("Failed to send status update email:", emailError);
                await logSystem('ERROR', 'EMAIL', `Failed to send client status update email`, { bookingId: id, error: String(emailError) });
            }
        }

        // Send exactly once on the transition to completed. Editing an already
        // completed booking must never generate another request.
        if (updateData.status === "completed" && previousBooking?.status !== "completed") {
            try {
                const reviewLinkSetting = await prisma.setting.findUnique({ where: { setting_key: 'gbp_review_link' } });
                const reviewLink = normalizeGoogleReviewUrl(reviewLinkSetting?.setting_value);

                if (reviewLink) {
                    await sendEmail({
                        to: booking.email,
                        subject: `${booking.client_name}, dziękuję za zaufanie ⭐`,
                        html: generateGoogleReviewRequestEmail({
                            clientName: booking.client_name,
                            service: booking.service,
                            reviewLink,
                        }),
                    });
                    await logSystem('INFO', 'LOCAL_SEO', `Google review request sent to client`, { bookingId: id, email: booking.email });
                }
            } catch (reviewError) {
                console.error("Failed to send Google review request:", reviewError);
                await logSystem('ERROR', 'LOCAL_SEO', `Failed to send Google review request`, { bookingId: id, error: String(reviewError) });
            }
        }

        await logSystem('INFO', 'BOOKING', `Booking #${id} updated`, { bookingId: id, updates: updateData });

        return NextResponse.json({ ok: true, booking });
    } catch (error) {
        console.error("Error updating booking:", error);
        await logSystem('ERROR', 'BOOKING', `Booking #${id} update failed`, { error: String(error) });
        return NextResponse.json(
            { ok: false, message: "Błąd podczas aktualizacji" },
            { status: 500 }
        );
    }
}
// DELETE /api/bookings?id=123 - Remove a booking
export async function DELETE(request: Request) {
    const authError = await requireAuth(request as any);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json(
            { ok: false, message: "Brak ID rezerwacji" },
            { status: 400 }
        );
    }

    try {
        // Soft delete — archive instead of destroy (zero-loss policy)
        await prisma.booking.update({
            where: { id: parseInt(id) },
            data: { status: 'archived' },
        });

        await logSystem('INFO', 'BOOKING', `Booking #${id} archived by admin`, { bookingId: id });

        return NextResponse.json({ ok: true, message: "Rezerwacja została zarchiwizowana" });
    } catch (error) {
        console.error("Error archiving booking:", error);
        await logSystem('ERROR', 'BOOKING', `Booking #${id} archive failed`, { error: String(error) });
        return NextResponse.json(
            { ok: false, message: "Błąd podczas archiwizacji rezerwacji" },
            { status: 500 }
        );
    }
}
