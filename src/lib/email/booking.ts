import { sendEmail, getAdminEmail } from './sender';
import { generateBookingConfirmedEmail, generateAdminEmail } from '@/lib/email-templates';
import { Booking } from '@prisma/client';

export async function sendBookingConfirmationEmail(booking: Booking) {
    const formattedDate = new Date(booking.date).toLocaleDateString('pl-PL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // booking.price jest w groszach — mail musi pokazać złote
    const priceZl = Number(booking.price) / 100;
    // techniczne notatki webhooka („Paid via PayU …”) nie są dla klienta
    const internalNote = booking.notes && /^Paid via PayU/i.test(booking.notes);
    const clientNotes = internalNote ? undefined : (booking.notes || undefined);

    const emailData = {
        clientName: booking.client_name,
        service: booking.service,
        packageName: booking.package,
        date: formattedDate,
        time: booking.start_time ? (booking.end_time ? `${booking.start_time} - ${booking.end_time}` : booking.start_time) : undefined,
        location: booking.venue_city ? (booking.venue_place ? `${booking.venue_city}, ${booking.venue_place}` : booking.venue_city) : undefined,
        price: priceZl,
        promoCode: booking.promo_code || undefined,
        giftCardCode: booking.gift_card_code || undefined,
        notes: clientNotes,
        phone: booking.phone || undefined,
        email: booking.email,
    };

    // 1. Send Client Email
    try {
        await sendEmail({
            to: booking.email,
            subject: `✅ Twoja rezerwacja została POTWIERDZONA! - ${booking.service}`,
            html: generateBookingConfirmedEmail(emailData)
        });
    } catch (error) {
        console.error('Failed to send client booking confirmation:', error);
    }

    // 2. Send Admin Email
    try {
        const adminEmail = await getAdminEmail();
        if (adminEmail) {
            await sendEmail({
                to: adminEmail,
                subject: `🎉 Opłacona rezerwacja: ${booking.client_name} - ${booking.service} (${formattedDate})`,
                html: generateAdminEmail(emailData)
            });
        }
    } catch (error) {
        console.error('Failed to send admin booking notification:', error);
    }
}
