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

    const emailData = {
        clientName: booking.client_name,
        service: booking.service,
        packageName: booking.package,
        date: formattedDate,
        time: booking.start_time ? (booking.end_time ? `${booking.start_time} - ${booking.end_time}` : booking.start_time) : undefined,
        location: booking.venue_city ? (booking.venue_place ? `${booking.venue_city}, ${booking.venue_place}` : booking.venue_city) : undefined,
        price: Number(booking.price),
        promoCode: booking.promo_code || undefined,
        giftCardCode: booking.gift_card_code || undefined,
        notes: booking.notes || undefined,
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
