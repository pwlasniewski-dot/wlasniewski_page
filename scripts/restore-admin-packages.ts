import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Restoring admin user and packages...');

    // 1. Create admin user
    const passwordHash = await bcrypt.hash('Wlasniewski123!', 10);

    const admin = await prisma.adminUser.upsert({
        where: { email: 'pwlasniewski@gmail.com' },
        update: {},
        create: {
            email: 'pwlasniewski@gmail.com',
            password_hash: passwordHash,
            name: 'Przemysław Właśniewski',
            role: 'ADMIN'
        }
    });
    console.log('✅ Admin user created:', admin.email);

    // 2. Create service types
    const serviceTypes = [
        { name: 'Sesja', description: 'Sesja fotograficzna', icon: '📸', order: 1 },
        { name: 'Ślub', description: 'Sesja ślubna', icon: '💒', order: 2 },
        { name: 'Komunia', description: 'Sesja komunijna', icon: '✨', order: 3 },
        { name: 'Biznes', description: 'Sesja biznesowa', icon: '💼', order: 4 },
    ];

    for (const st of serviceTypes) {
        await prisma.serviceType.upsert({
            where: { name: st.name },
            update: st,
            create: st
        });
    }
    console.log('✅ Service types created');

    // 3. Create packages
    const sesjaService = await prisma.serviceType.findFirst({ where: { name: 'Sesja' } });
    const slubService = await prisma.serviceType.findFirst({ where: { name: 'Ślub' } });

    if (sesjaService) {
        await prisma.package.upsert({
            where: { name: 'Sesja Basic' },
            update: {},
            create: {
                name: 'Sesja Basic',
                description: 'Podstawowy pakiet sesyjny - 1h, 30 zdjęć',
                price: 300,
                duration: 60,
                photos_count: 30,
                service_type_id: sesjaService.id,
                features: ['1 godzina sesji', '30 edytowanych zdjęć', 'Galeria online'],
                is_active: true
            }
        });

        await prisma.package.upsert({
            where: { name: 'Sesja Premium' },
            update: {},
            create: {
                name: 'Sesja Premium',
                description: 'Rozszerzony pakiet - 2h, 60 zdjęć + filmik',
                price: 500,
                duration: 120,
                photos_count: 60,
                service_type_id: sesjaService.id,
                features: ['2 godziny sesji', '60 edytowanych zdjęć', 'Filmik 1 min', 'Galeria premium'],
                is_active: true
            }
        });
    }

    if (slubService) {
        await prisma.package.upsert({
            where: { name: 'Ślub Standard' },
            update: {},
            create: {
                name: 'Ślub Standard',
                description: 'Reportaż ślubny - przygotowania + ceremonia + wesele (8h)',
                price: 2500,
                duration: 480,
                photos_count: 300,
                service_type_id: slubService.id,
                features: ['8 godzin reportażu', '300+ zdjęć', 'Album 30x30 cm', 'Pendrive'],
                is_active: true
            }
        });

        await prisma.package.upsert({
            where: { name: 'Ślub Premium' },
            update: {},
            create: {
                name: 'Ślub Premium',
                description: 'Pełny reportaż + film + dron (12h)',
                price: 4500,
                duration: 720,
                photos_count: 500,
                service_type_id: slubService.id,
                features: ['12 godzin reportażu', '500+ zdjęć', 'Film 15 min', 'Dron', 'Album premium', 'Plener'],
                is_active: true
            }
        });
    }

    console.log('✅ Packages created');
    console.log('\n🎉 Database restoration complete!');
    console.log('\n📝 Login credentials:');
    console.log('   Email: pwlasniewski@gmail.com');
    console.log('   Password: Wlasniewski123!');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
