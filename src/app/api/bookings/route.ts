import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { sendEmail } from "@/lib/email/sender";
import { generateClientEmail, generateAdminEmail, generateBookingConfirmedEmail } from "@/lib/email-templates";
import { logSystem } from "@/lib/logger";

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
                status: "pending",
            },
        });

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
            await sendEmail({
                to: email,
                subject: `✨ Potwierdzenie rezerwacji - ${service}`,
                html: generateClientEmail(emailData)
            });
            await logSystem('INFO', 'EMAIL', `Booking confirmation sent to client`, { bookingId: booking.id, email });
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

        // Default: List all bookings (for Admin)
        // In a real app, check for admin session here
        const bookings = await prisma.booking.findMany({
            orderBy: {
                created_at: "desc",
            },
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
