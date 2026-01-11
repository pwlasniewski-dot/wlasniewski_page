
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Syncing sequences...');
    const tables = [
        'users',
        'bookings',
        'client_galleries',
        'gallery_photos',
        'gift_card_orders',
        'gift_cards'
    ];

    for (const table of tables) {
        try {
            await prisma.$executeRawUnsafe(`
                SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM "${table}";
            `);
            console.log(`Synced sequence for ${table}`);
        } catch (e) {
            console.error(`Failed to sync sequence for ${table}:`, e);
        }
    }

    const email = 'demo-client@example.com';
    const password = 'Password123!';
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Create User
    const user = await prisma.user.upsert({
        where: { email },
        update: { password_hash: hashedPassword },
        create: {
            email,
            password_hash: hashedPassword,
            name: 'Demo Client',
            role: 'CLIENT',
        },
    });

    console.log(`User created/updated: ${user.email}`);

    // 2. Clear old demo data for this user to avoid unique constraint errors
    await prisma.booking.deleteMany({ where: { email } });
    await prisma.giftCardOrder.deleteMany({ where: { user_id: user.id } });
    await prisma.giftCard.deleteMany({ where: { owner_id: user.id } });

    // 3. Create a Booking for this user
    const booking = await prisma.booking.create({
        data: {
            client_name: 'Demo Client',
            email: email,
            service: 'Sesja Indywidualna',
            package: 'Premium Pack',
            price: 50000,
            date: new Date('2026-06-15T12:00:00Z'),
            status: 'confirmed',
        }
    });
    console.log(`Booking created for ${email}`);

    // 4. Create a Client Gallery for this user
    const gallery = await prisma.clientGallery.upsert({
        where: { access_code: 'DEMO-ACCESS-CODE' },
        update: { client_email: email },
        create: {
            client_name: 'Demo Client',
            client_email: email,
            access_code: 'DEMO-ACCESS-CODE',
            standard_count: 10,
            price_per_premium: 2000,
            is_active: true,
        }
    });

    // Add mock photos
    await prisma.galleryPhoto.deleteMany({ where: { gallery_id: gallery.id } });
    await prisma.galleryPhoto.createMany({
        data: [
            {
                gallery_id: gallery.id,
                file_url: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e',
                file_size: 1024,
                width: 800,
                height: 600,
                is_standard: true
            },
            {
                gallery_id: gallery.id,
                file_url: 'https://images.unsplash.com/photo-1554080353-a576cf803bda',
                file_size: 1024,
                width: 800,
                height: 600,
                is_standard: false
            },
        ]
    });

    console.log(`Gallery created and photos added for ${email}`);

    // 5. Create a Gift Card and assign to user
    const giftCard = await prisma.giftCard.create({
        data: {
            code: 'DEMO-GIFT-123',
            amount: 10000,
            value: 100,
            owner_id: user.id,
            is_active: true,
            status: 'active',
        }
    });

    await prisma.giftCardOrder.create({
        data: {
            user_id: user.id,
            customer_name: 'Demo Sender',
            customer_email: 'sender@example.com',
            recipient_name: 'Demo Client',
            amount_paid: 10000,
            access_token: 'demo-token-123',
            payment_status: 'completed',
            card_id: 1,
            gift_card_id: giftCard.id
        }
    });
    console.log(`Gift Card created for ${email}`);

    console.log('\n--- DEMO DATA READY ---');
    console.log(`Login: ${email}`);
    console.log(`Password: ${password}`);
    console.log('------------------------');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
