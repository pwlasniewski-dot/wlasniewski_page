import { sendBookingConfirmationEmail } from '../src/lib/email/booking';
import prisma from '../src/lib/db/prisma';

async function main() {
    console.log('📧 Testing Booking Confirmation Email...');

    // 1. Create Dummy Booking Object (mimicking Prisma result)
    // We don't save to DB to avoid pollution, just mocking the interface
    const mockBooking: any = {
        id: 99999,
        client_name: 'Test Client',
        email: 'pwlasniewski@gmail.com', // User's email
        service: 'Sesja Testowa',
        package: 'Pakiet Standard',
        price: 10000, // 100.00 PLN
        date: new Date(),
        start_time: '12:00',
        venue_city: 'Warszawa',
        status: 'confirmed'
    };

    console.log(`🚀 Attempting to send booking confirmation to ${mockBooking.email}...`);

    try {
        await sendBookingConfirmationEmail(mockBooking);
        console.log('✅ Booking email sent successfully!');
    } catch (error) {
        console.error('❌ Failed to send booking email:', error);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
