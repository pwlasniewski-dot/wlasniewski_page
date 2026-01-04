const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding marketplace data...');

    // 1. Create Admin
    const adminPassword = await bcrypt.hash('Admin123!', 10);
    const admin = await prisma.adminUser.upsert({
        where: { email: 'kontakt@wlasniewski.pl' },
        update: {},
        create: {
            email: 'kontakt@wlasniewski.pl',
            password_hash: adminPassword,
            name: 'Przemysław Admin',
            role: 'ADMIN'
        }
    });
    console.log('Admin created:', admin.email);

    // 2. Create Photographer
    const photographerPassword = await bcrypt.hash('Photo123!', 10);
    const photographer = await prisma.user.upsert({
        where: { email: 'fotograf@example.com' },
        update: {},
        create: {
            email: 'fotograf@example.com',
            password_hash: photographerPassword,
            name: 'Jan Kowalski (Fotograf)',
            role: 'PHOTOGRAPHER',
            photographer_profile: {
                create: {
                    bio: 'Specjalizuję się w fotografii portretowej i eventowej.',
                    experience_years: 5,
                    specialties: 'Portret, Event, Ślub',
                    base_commission: 15
                }
            }
        }
    });
    console.log('Photographer created:', photographer.email);

    // 3. Create Client
    const clientPassword = await bcrypt.hash('Client123!', 10);
    const client = await prisma.user.upsert({
        where: { email: 'klient@example.com' },
        update: {},
        create: {
            email: 'klient@example.com',
            password_hash: clientPassword,
            name: 'Marek Nowak (Klient)',
            role: 'CLIENT'
        }
    });
    console.log('Client created:', client.email);

    // 4. Create Client Gallery
    const gallery = await prisma.clientGallery.create({
        data: {
            client_name: 'Marek Nowak',
            client_email: 'klient@example.com',
            access_code: 'test-galeria-123',
            standard_count: 5,
            price_per_premium: 3500, // 35.00 PLN
            is_active: true,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            photographer_id: photographer.id,
            photos: {
                create: [
                    // Standard Photos
                    {
                        thumbnail_url: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&q=80',
                        file_url: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e',
                        file_size: 1024000,
                        is_standard: true,
                        order_index: 0
                    },
                    {
                        thumbnail_url: 'https://images.unsplash.com/photo-1554080353-a576cf803bda?w=800&q=80',
                        file_url: 'https://images.unsplash.com/photo-1554080353-a576cf803bda',
                        file_size: 1024000,
                        is_standard: true,
                        order_index: 1
                    },
                    // Premium Photos (Special request from user)
                    {
                        thumbnail_url: 'https://images.unsplash.com/photo-1492691523567-61723c28a9ea?w=800&q=80',
                        file_url: 'https://images.unsplash.com/photo-1492691523567-61723c28a9ea',
                        file_size: 1524000,
                        is_standard: false,
                        order_index: 2
                    },
                    {
                        thumbnail_url: 'https://images.unsplash.com/photo-1516035069341-349193613f31?w=800&q=80',
                        file_url: 'https://images.unsplash.com/photo-1516035069341-349193613f31',
                        file_size: 1524000,
                        is_standard: false,
                        order_index: 3
                    },
                    {
                        thumbnail_url: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&q=80',
                        file_url: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b',
                        file_size: 1524000,
                        is_standard: false,
                        order_index: 4
                    }
                ]
            }
        }
    });
    console.log('Gallery created:', gallery.access_code);

    console.log('Seeding complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
