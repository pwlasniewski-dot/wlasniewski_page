
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES = [
    {
        name: 'Sala Weselna',
        icon: '🏰',
        slug: 'venue',
        names: ['Pałac Rozalin', 'Villa Park Julianna', 'Dwór Złotopolo']
    },
    {
        name: 'Restauracja',
        icon: '🍽️',
        slug: 'restaurant',
        names: ['Restauracja Pod Aniołami', 'Biały Fortepian', 'Smaki Regionu']
    },
    {
        name: 'DJ',
        icon: '🎧',
        slug: 'dj',
        names: ['DJ Marco & Events', 'Level Up Music', 'SoundMaster Wedding']
    },
    {
        name: 'Fotograf',
        icon: '📸',
        slug: 'photographer',
        names: ['Adam Nowak Photography', 'Świetliste Kadry', 'Moment Catcher Studio']
    },
    {
        name: 'Fotobudka',
        icon: '🎭',
        slug: 'photobooth',
        names: ['SmileBox Premium', 'Magiczne Lustro 360', 'Retro Fotki']
    },
    {
        name: 'Dekorator Wnętrz',
        icon: '💐',
        slug: 'decorator',
        names: ['Bloom & Style', 'Wymarzone Wnętrza', 'Boho Wedding Design']
    },
    {
        name: 'Animator',
        icon: '🎈',
        slug: 'animator',
        names: ['Bajkowa Kraina', 'Crazy Kids Animations', 'Animacje z Pasją']
    },
    {
        name: 'Drink Bar',
        icon: '🍸',
        slug: 'drinkbar',
        names: ['ProBar Masters', 'Koktajlowy Raj', 'Mobilny Bar VIP']
    },
    {
        name: 'Zespół Muzyczny',
        icon: '🎸',
        slug: 'band',
        names: ['Zespół Coverowy Flow', 'Grupa Takt', 'Kapela Weselna Hit']
    },
];

const MOCK_PHOTOS = [
    "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=300&h=300",
    "https://images.unsplash.com/photo-1511285560982-1351cdeb9821?auto=format&fit=crop&q=80&w=300&h=300",
    "https://images.unsplash.com/photo-1478147427282-58a87a120781?auto=format&fit=crop&q=80&w=300&h=300",
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=300&h=300",
    "https://images.unsplash.com/photo-1505236858274-0959ac156d0f?auto=format&fit=crop&q=80&w=300&h=300"
];

async function main() {
    console.log('🌱 Starting seed...');

    // FIX SEQUENCES
    try {
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('service_types', 'id'), COALESCE((SELECT MAX(id) FROM service_types) + 1, 1), false);`);
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users) + 1, 1), false);`);
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('packages', 'id'), COALESCE((SELECT MAX(id) FROM packages) + 1, 1), false);`);
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('photographer_profiles', 'id'), COALESCE((SELECT MAX(id) FROM photographer_profiles) + 1, 1), false);`);
        console.log('✅ Sequences reset.');
    } catch (e) {
        console.warn('⚠️ Could not reset sequences (might be irrelevant if tables empty):', e);
    }

    for (const cat of CATEGORIES) {
        // 1. Ensure ServiceType exists
        let serviceType = await prisma.serviceType.findFirst({
            where: { name: cat.name }
        });

        if (!serviceType) {
            serviceType = await prisma.serviceType.create({
                data: { name: cat.name, icon: cat.icon, is_active: true }
            });
            console.log(`Created category: ${cat.name}`);
        } else {
            console.log(`Found category: ${cat.name}`);
        }

        // 2. Create 3 Providers per Category
        for (let i = 0; i < 3; i++) {
            const email = `${cat.slug}${i + 1}@test.pl`;
            // Use realistic name if available, fallback to generic
            const realName = cat.names[i];
            const tier = ['Premium', 'Gold', 'Standard'][i];

            let user = await prisma.user.findUnique({ where: { email } });

            if (!user) {
                user = await prisma.user.create({
                    data: {
                        email,
                        name: realName,
                        password_hash: 'hashed_dummy_pass',
                        role: 'PHOTOGRAPHER',
                        is_active: true,
                    }
                });
                console.log(`  - Created user: ${realName}`);
            } else {
                // Update name if user exists (to apply new realistic names)
                await prisma.user.update({
                    where: { id: user.id },
                    data: { name: realName }
                });
                console.log(`  - Updated user: ${realName}`);
            }

            const photos = JSON.stringify(MOCK_PHOTOS);
            const bio = `Profesjonalny ${cat.name} z ${(i + 1) * 2}-letnim doświadczeniem. Gwarancja satysfakcji i niezapomnianych wrażeń.`;

            if (!user.photographer_profile_id) {
                const profile = await prisma.photographerProfile.create({
                    data: {
                        bio,
                        rating: 4.5 + (i * 0.1),
                        avatar_url: MOCK_PHOTOS[i % MOCK_PHOTOS.length],
                        highlight_photos: photos,
                        portfolio_enabled: true
                    }
                });

                await prisma.user.update({
                    where: { id: user.id },
                    data: { photographer_profile_id: profile.id }
                });
            }

            const basePrice = ((i + 1) * 1000) * 100;

            // Package 1
            const pkgName = `Pakiet Full - ${tier}`;
            // Note: Package names are unique per provider automatically via ID, but name must be unique per Service? 
            // No, Prisma constraints usually just ID. Let's create specific names to avoid confusion.

            const existingPkg = await prisma.package.findFirst({
                where: { service_id: serviceType.id, provider_id: user.id, name: pkgName }
            });

            if (!existingPkg) {
                await prisma.package.create({
                    data: {
                        service_id: serviceType.id,
                        provider_id: user.id,
                        name: pkgName,
                        price: basePrice,
                        hours: 8,
                        description: `Pełna obsługa ${cat.name} przez 8 godzin.`,
                        features: 'Dojazd w cenie, wysoka jakość, profesjonalny sprzęt',
                        is_active: true
                    }
                });
            }

            // Package 2
            const pkgNameSmall = `Pakiet Mini - ${tier}`;
            const existingPkgSmall = await prisma.package.findFirst({
                where: { service_id: serviceType.id, provider_id: user.id, name: pkgNameSmall }
            });

            if (!existingPkgSmall) {
                await prisma.package.create({
                    data: {
                        service_id: serviceType.id,
                        provider_id: user.id,
                        name: pkgNameSmall,
                        price: basePrice * 0.6,
                        hours: 4,
                        description: `Obsługa ${cat.name} przez 4 godziny.`,
                        features: 'Dojazd do 50km',
                        is_active: true
                    }
                });
            }
        }
    }

    console.log('✅ Seeding completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
