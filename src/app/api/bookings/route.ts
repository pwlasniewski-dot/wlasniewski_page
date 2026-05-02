import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { sendEmail } from "@/lib/email/sender";
import { generateClientEmail, generateAdminEmail, generateBookingConfirmedEmail } from "@/lib/email-templates";
import { logSystem } from "@/lib/logger";
import { requireAuth } from "@/lib/auth/middleware";

import prisma from '@/lib/db/prisma';

// Photographer's email for admin notifications
// Photographer's email for admin notifications
// const ADMIN_EMAIL = "przemyslaw@wlasniewski.pl"; // Moved to dynamic fetching

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            service,
            package: packageName,
            price,
            date,
            start,
            end,
            start_time,
            end_time,
            name,
            email,
            phone,
            venueCity,
            venue_city,
            venuePlace,
            venue_place,
            notes,
            hours,
            promoCode,
            promo_code,
            gift_card_code,
            fm_voucher_code,
            photographer_id,
            payment_plan: requestedPaymentPlan,
            originalPrice
        } = body;

        // Basic validation
        if (!service || !packageName || !date || !name || !email) {
            await logSystem('WARN', 'BOOKING', 'Booking attempt failed: Missing required data', { email, name, missing: 'service/package/date/name/email' });
            return NextResponse.json(
                { ok: false, message: "Brak wymaganych danych" },
                { status: 400 }
            );
        }

        // Foto-Match voucher: walidacja przed stworzeniem rezerwacji.
        // Frontend już mógł zaaplikować rabat na price; my tylko upewniamy się że voucher istnieje
        // i jest niewykorzystany, oraz oznaczamy go jako zużyty po stworzeniu rezerwacji.
        let validatedVoucher: { id: number; code: string } | null = null;
        if (fm_voucher_code) {
            const code = String(fm_voucher_code).trim().toUpperCase();
            const ref = await prisma.fotoMatchReferral.findUnique({
                where: { reward_voucher_code: code },
                select: { id: true, status: true, reward_redeemed_at: true, reward_expires_at: true },
            });
            const now = new Date();
            if (!ref || ref.status !== 'REWARDED' || ref.reward_redeemed_at || (ref.reward_expires_at && ref.reward_expires_at < now)) {
                return NextResponse.json(
                    { ok: false, message: 'Voucher Foto-Match nieważny lub już użyty' },
                    { status: 400 }
                );
            }
            validatedVoucher = { id: ref.id, code };
        }

        // Split payment 50/50: aktywne tylko gdy globalny toggle ON i klient zaznaczył 'SPLIT'.
        let paymentPlan: 'FULL' | 'SPLIT' = 'FULL';
        let depositAmount: number | null = null;
        let remainingAmount: number | null = null;
        let remainingDueAt: Date | null = null;
        if (requestedPaymentPlan === 'SPLIT') {
            const splitSettings = await prisma.setting.findFirst({
                orderBy: { id: 'asc' },
                select: {
                    split_payment_enabled: true,
                    split_payment_deposit_percent: true,
                    split_payment_remaining_due_days: true,
                },
            });
            if (splitSettings?.split_payment_enabled) {
                const pct = Math.max(1, Math.min(99, splitSettings.split_payment_deposit_percent ?? 50));
                const total = Number(price);
                depositAmount = Math.round((total * pct) / 100);
                remainingAmount = total - depositAmount;
                paymentPlan = 'SPLIT';
                const dueDays = splitSettings.split_payment_remaining_due_days ?? 7;
                remainingDueAt = new Date(new Date(date).getTime() - dueDays * 86400_000);
            }
        }

        const booking = await prisma.booking.create({
            data: {
                service,
                package: packageName,
                price: Number(price),
                date: new Date(date),
                start_time: start_time || start || null,
                end_time: end_time || end || null,
                client_name: name,
                email,
                phone: phone || null,
                venue_city: venue_city || venueCity || null,
                venue_place: venue_place || venuePlace || null,
                notes: notes || null,
                promo_code: promo_code || promoCode || null,
                gift_card_code: gift_card_code || null,
                status: Number(price) === 0 ? "confirmed" : "pending",
                payment_plan: paymentPlan,
                deposit_amount: depositAmount,
                remaining_amount: remainingAmount,
                remaining_due_at: remainingDueAt,
                photographer_id: photographer_id ? Number(photographer_id) : null,
            },
        });

        // Voucher: mark redeemed (best-effort, nie blokuje rezerwacji jeśli się nie uda).
        if (validatedVoucher) {
            try {
                await prisma.fotoMatchReferral.update({
                    where: { id: validatedVoucher.id },
                    data: {
                        reward_redeemed_at: new Date(),
                        reward_redeemed_for: `BOOKING:${booking.id}`,
                    },
                });
                await logSystem('INFO', 'FOTO_MATCH_VOUCHER', `Voucher ${validatedVoucher.code} redeemed for booking #${booking.id}`);
            } catch (voucherErr) {
                console.error('Failed to mark fm voucher redeemed:', voucherErr);
                await logSystem('ERROR', 'FOTO_MATCH_VOUCHER', `Failed to redeem voucher ${validatedVoucher.code}`, { bookingId: booking.id, error: String(voucherErr) });
            }
        }

        // Mark gift card as used if provided
        if (gift_card_code) {
            try {
                await prisma.giftCard.updateMany({
                    where: {
                        code: {
                            equals: gift_card_code,
                            mode: 'insensitive'
                        },
                        redeemed_at: null
                    },
                    data: {
                        redeemed_at: new Date(),
                        is_active: false,
                        notes: `Użyto dla rezerwacji #${booking.id}`
                    }
                });
                await logSystem('INFO', 'GIFT_CARD', `Gift card ${gift_card_code} marked as redeemed for booking #${booking.id}`);
            } catch (giftCardError) {
                console.error('Failed to mark gift card as redeemed:', giftCardError);
                await logSystem('ERROR', 'GIFT_CARD', `Failed to redeem gift card ${gift_card_code}`, { bookingId: booking.id, error: String(giftCardError) });
            }
        }

        await logSystem('INFO', 'BOOKING', `New booking created: #${booking.id} - ${service}`, { bookingId: booking.id, email, service });

        // Prepare email data
        const formattedDate = new Date(date).toLocaleDateString('pl-PL', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const finalStartTime = start_time || start;
        const finalEndTime = end_time || end;

        const emailData = {
            clientName: name,
            service,
            packageName,
            date: formattedDate,
            time: finalStartTime ? (finalEndTime ? `${finalStartTime} - ${finalEndTime}` : finalStartTime) : undefined,
            location: (venue_city || venueCity) ? (venue_place || venuePlace ? `${venue_city || venueCity}, ${venue_place || venuePlace}` : venue_city || venueCity) : undefined,
            price: Number(price),
            originalPrice: originalPrice ? Number(originalPrice) : undefined,
            promoCode: promo_code || promoCode || undefined,
            giftCardCode: gift_card_code || undefined,
            notes: notes || undefined,
            phone: phone || undefined,
            email,
        };

        // Send elegant confirmation email to client
        try {
            const isConfirmed = Number(price) === 0;
            const subject = isConfirmed
                ? `✅ Rezerwacja POTWIERDZONA! - ${service}`
                : `✨ Potwierdzenie rezerwacji - ${service}`;

            const html = isConfirmed
                ? generateBookingConfirmedEmail(emailData)
                : generateClientEmail(emailData);

            await sendEmail({
                to: email,
                subject,
                html
            });
            await logSystem('INFO', 'EMAIL', `Booking confirmation sent to client ${isConfirmed ? '(Confirmed)' : '(Pending)'}`, { bookingId: booking.id, email });
        } catch (emailError) {
            await logSystem('ERROR', 'EMAIL', `Failed to send client confirmation email`, { bookingId: booking.id, error: String(emailError) });
        }

        // Send notification email to photographer/admin
        try {
            const { getAdminEmail } = await import('@/lib/email/sender');
            const adminEmail = await getAdminEmail();

            if (!adminEmail) {
                console.warn('⚠️ Admin email not set, skipping notification.');
            } else {
                await sendEmail({
                    to: adminEmail,
                    subject: `🎉 Nowa rezerwacja: ${name} - ${service} (${formattedDate})`,
                    html: generateAdminEmail(emailData)
                });
            }
        } catch (adminEmailError) {
            await logSystem('ERROR', 'EMAIL', `Failed to send admin notification email`, { bookingId: booking.id, error: String(adminEmailError) });
        }

        return NextResponse.json({ ok: true, booking });
    } catch (error) {
        console.error("Error creating booking:", error);
        await logSystem('ERROR', 'BOOKING', `Server error during booking creation`, { error: String(error) });
        return NextResponse.json(
            { ok: false, message: "Błąd serwera podczas zapisu rezerwacji" },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");

    try {
        if (mode === "availability") {
            const ym = searchParams.get("ym"); // e.g., "2023-10"
            const service = searchParams.get("service");

            if (!ym) {
                return NextResponse.json({ availability: {} });
            }

            // Parse year and month
            const [year, month] = ym.split("-").map(Number);
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0); // Last day of month

            // Fetch bookings for this month
            const bookings = await prisma.booking.findMany({
                where: {
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                    status: {
                        not: "cancelled",
                    },
                },
            });

            const availability: Record<string, any> = {};

            // Process bookings into availability format
            bookings.forEach((booking) => {
                const dateKey = booking.date.toISOString().split("T")[0];

                if (!availability[dateKey]) {
                    availability[dateKey] = {
                        fullDay: false,
                        booked: [],
                        ranges: [],
                    };
                }

                // If it's a full day event (Wedding, Party, Birthday usually)
                // Or if it's a Session but marks full day (logic can be refined)
                if (booking.service !== "Sesja") {
                    availability[dateKey].fullDay = true;
                } else {
                    // For sessions, mark specific slots as booked
                    if (booking.start_time) {
                        availability[dateKey].booked.push(booking.start_time);
                        // Also add to ranges for overlap checking
                        if (booking.end_time) {
                            availability[dateKey].ranges.push({
                                start: booking.start_time,
                                end: booking.end_time
                            });
                        }
                    }
                }
            });

            return NextResponse.json({ availability });
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
            'promo_code', 'gift_card_code'
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

        const booking = await prisma.booking.update({
            where: { id: parseInt(id) },
            data: updateData,
        });

        // [STABLE: 2025-12-23] Notify client when status is updated to confirmed
        if (updateData.status === "confirmed") {
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
