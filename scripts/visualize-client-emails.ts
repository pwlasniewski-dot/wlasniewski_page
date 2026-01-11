import { sendGiftCardAccessEmail } from '../src/lib/email/giftCardAccess';
import { sendEmail } from '../src/lib/email/sender';
import { generateBookingConfirmedEmail } from '../src/lib/email-templates';
import prisma from '../src/lib/db/prisma';

const TARGET_EMAIL = 'pwlasniewski@gmail.com';

async function main() {
    console.log(`🎨 Generating Client Email Previews for: ${TARGET_EMAIL}`);

    // 1. Gift Card Email (Client View)
    console.log('🎁 Sending Gift Card Email (Client View)...');

    // Mock Data mimicking a real purchase with personalization
    const giftCardMock = {
        code: 'PREZENT-2026-XMAS',
        amount: 500.00,
        value: 500.00,
        theme: 'christmas',
        card_title: 'Sesja Świąteczna',
        card_description: 'Magiczna sesja w zimowej scenerii'
    };

    await sendGiftCardAccessEmail(
        TARGET_EMAIL,               // Customer Email (receiving the card)
        'Jan Kowalski',             // Customer Name
        giftCardMock,               // Card Data
        'preview-token-123',        // Access URL token
        'Anna Nowak',               // RECIPIENT NAME (For Whom)
        undefined,                  // Recipient Email (optional, usually sent to buyer first)
        'Piotr',                    // SENDER NAME
        'Wszystkiego najlepszego Aniu! Spełnienia marzeń! 🎅', // MESSAGE
        1001,
        'christmas'
    );

    // 2. Booking Confirmation Email (Client View)
    console.log('📅 Sending Booking Confirmation Email (Client View)...');

    const bookingMock = {
        clientName: 'Anna Nowak',
        service: 'Sesja Portretowa',
        packageName: 'Pakiet Gold',
        date: 'sobota, 24 maja 2026',
        time: '10:00 - 12:00',
        location: 'Studio, Warszawa',
        price: 120000, // 1200.00 PLN (stored in cents usually, but template handles numbers) actually template expects standard number usually or converts
        // The sender/template logic expects formatting. Let's check template.
        // generateBookingConfirmedEmail uses `data.price` directly.
        // In the app we passed `Number(booking.price)` which is integer cents? 
        // No, in `bookings/route.ts` it was `Number(price)`. 
        // Let's assume standard number for this visualization.
        email: TARGET_EMAIL,
        notes: 'Poproszę o makijaż w stylu glamour.',
        start_time: '10:00',
        end_time: '12:00',
        venue_city: 'Warszawa'
    };

    // We manually generate HTML here to bypass the wrapping logic in `booking.ts` 
    // and ensure we send EXACTLY what the client sees for valid `CONFIRMED` booking.
    const bookingHtml = generateBookingConfirmedEmail({
        ...bookingMock,
        price: 1200 // Assumed 1200 PLN
    });

    await sendEmail({
        to: TARGET_EMAIL,
        subject: `✅ [PREVIEW] Twoja rezerwacja została POTWIERDZONA! - ${bookingMock.service}`,
        html: bookingHtml
    });

    console.log('✨ All preview emails sent successfully!');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
