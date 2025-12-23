import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // 1. Create default admin user if not exists
    const adminEmail = 'pwlasniewski@gmail.com';
    let admin = await prisma.adminUser.findUnique({ where: { email: adminEmail } });

    if (!admin) {
        // Real bcrypt hash for password: "admin123"
        // UWAGA: ZMIEŃ TO HASŁO PO PIERWSZYM LOGOWANIU!
        const bcrypt = require('bcryptjs');
        const passwordHash = await bcrypt.hash('admin123', 10);

        admin = await prisma.adminUser.create({
            data: {
                email: adminEmail,
                password_hash: passwordHash,
                name: 'Przemysław Właśniewski',
                role: 'ADMIN'
            }
        });
        console.log('✅ Admin user created');
        console.log('   📧 Email: pwlasniewski@gmail.com');
        console.log('   🔑 Password: admin123');
        console.log('   ⚠️  ZMIEŃ HASŁO po pierwszym logowaniu!');
    }

    // 2. Create essential pages for menu
    const pages = [
        { slug: '', title: 'Strona Główna', menu_title: 'Start', menu_order: 1 },
        { slug: 'o-mnie', title: 'O Mnie', menu_title: 'O Mnie', menu_order: 2 },
        { slug: 'portfolio', title: 'Portfolio', menu_title: 'Portfolio', menu_order: 3 },
        { slug: 'rezerwacja', title: 'Rezerwacja', menu_title: 'Rezerwacja', menu_order: 4 },
        { slug: 'blog', title: 'Blog', menu_title: 'Blog', menu_order: 5 },
        { slug: 'foto-wyzwanie', title: 'Foto Wyzwanie', menu_title: 'Foto Wyzwanie', menu_order: 6 },
    ];

    for (const page of pages) {
        await prisma.page.upsert({
            where: { slug: page.slug },
            update: {
                is_in_menu: true,
                menu_title: page.menu_title,
                menu_order: page.menu_order
            },
            create: {
                slug: page.slug,
                title: page.title,
                content: '{}',
                is_in_menu: true,
                is_published: true,
                menu_title: page.menu_title,
                menu_order: page.menu_order
            }
        });
    }
    console.log('✅ Pages created/updated');

    // 3. Create/Update the main settings record
    const mainSettingsKey = 'main_settings';
    const existingSettings = await prisma.setting.findUnique({ where: { setting_key: mainSettingsKey } });

    if (!existingSettings) {
        await prisma.setting.create({
            data: {
                setting_key: mainSettingsKey,
                // Navbar & Branding
                navbar_layout: 'logo_left_menu_right',
                navbar_sticky: true,
                navbar_transparent: false,
                navbar_font_size: 16,
                navbar_font_family: 'Montserrat',
                logo_size: 140,
                seasonal_effect: 'none',

                // Email SMTP (Defaults)
                smtp_host: process.env.SMTP_HOST || 'mail.wlasniewski.pl',
                smtp_port: parseInt(process.env.SMTP_PORT || '465'),
                smtp_user: process.env.SMTP_USER || 'noreply@wlasniewski.pl',
                smtp_from: process.env.SMTP_FROM || 'noreply@wlasniewski.pl',

                // Payment P24
                p24_test_mode: true,
                p24_method_blik: true,
                p24_method_card: true,
                p24_method_transfer: true,

                // Payment PayU
                payu_environment: 'sandbox',

                // Booking
                booking_currency: 'PLN',
                booking_min_days_ahead: 7,
                booking_payment_method: 'stripe',
                booking_require_payment: false,

                // Marketing
                urgency_enabled: false,
                urgency_slots_remaining: 5,
                social_proof_enabled: true,
                social_proof_total_clients: 100,
                promo_code_discount_enabled: false,
                promo_code_discount_amount: 10,
                promo_code_discount_type: 'percentage',

                // Gift Cards
                gift_card_promo_enabled: false,
                gift_card_promo_title: 'Karty Podarunkowe',
                gift_card_promo_rotation_interval: 5,
                gift_card_hero_opacity: 0.6,

                // Portfolio
                portfolio_layout: 'slider',
            }
        });
        console.log('✅ Main settings record created');
    } else {
        console.log('ℹ️ Main settings record already exists');
    }

    // 4. Clear old analytics (optional - tylko jeśli tabela istnieje)
    try {
        await prisma.analyticsEvent.deleteMany({
            where: {
                created_at: {
                    lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // starsze niż 30 dni
                }
            }
        });
        console.log('✅ Old analytics cleaned');
    } catch (e) {
        console.log('⚠️  Analytics cleanup skipped (table may not exist)');
    }

    // 5. Seed service types and packages
    const serviceTypes = [
        { name: 'Sesja', icon: '📸', description: 'Sesja zdjęciowa' },
        { name: 'Ślub', icon: '💍', description: 'Fotografia ślubna' },
        { name: 'Przyjęcie', icon: '🎉', description: 'Sesja imprezowa' },
        { name: 'Urodziny', icon: '🎂', description: 'Fotografia urodzinowa' },
    ];

    for (const serviceType of serviceTypes) {
        const existingType = await prisma.serviceType.findUnique({
            where: { name: serviceType.name }
        });

        if (!existingType) {
            await prisma.serviceType.create({
                data: {
                    name: serviceType.name,
                    icon: serviceType.icon,
                    description: serviceType.description,
                    order: serviceTypes.indexOf(serviceType)
                }
            });
        }
    }
    console.log('✅ Service types seeded');

    // 6. Seed packages for each service type
    const packagesData = {
        'Sesja': [
            { name: 'Ekonomiczny', icon: '💰', hours: 1, price: 29900, subtitle: 'Sesja 1h', features: ['1 godzina', 'do 50 zdjęć', 'edycja podstawowa'] },
            { name: 'Złoty', icon: '⭐', hours: 2, price: 49900, subtitle: 'Sesja 2h', features: ['2 godziny', 'do 100 zdjęć', 'edycja pełna', 'album cyfrowy'] },
            { name: 'Platynowy', icon: '👑', hours: 4, price: 79900, subtitle: 'Sesja 4h', features: ['4 godziny', 'do 200 zdjęć', 'edycja premium', 'album drukowany'] },
        ],
        'Ślub': [
            { name: 'Ekonomiczny', icon: '💰', hours: 6, price: 149900, subtitle: 'Pakiet 6h', features: ['6 godzin', 'do 300 zdjęć', 'edycja standardowa'] },
            { name: 'Złoty', icon: '⭐', hours: 10, price: 249900, subtitle: 'Pakiet 10h', features: ['10 godzin', 'do 500 zdjęć', 'edycja pełna', 'fotograf + asystent'] },
            { name: 'Platynowy', icon: '👑', hours: 12, price: 349900, subtitle: 'Pakiet 12h+', features: ['12+ godzin', 'do 700 zdjęć', 'edycja premium', 'fotograf + 2x asystent', 'album drukowany'] },
        ],
        'Przyjęcie': [
            { name: 'Standard', icon: '📷', hours: 3, price: 39900, subtitle: 'Sesja 3h', features: ['3 godziny', 'do 150 zdjęć'] },
            { name: 'Złoty', icon: '⭐', hours: 5, price: 59900, subtitle: 'Sesja 5h', features: ['5 godzin', 'do 250 zdjęć', 'edycja pełna'] },
            { name: 'Platynowy', icon: '👑', hours: 8, price: 89900, subtitle: 'Sesja 8h', features: ['8 godzin', 'do 400 zdjęć', 'fotograf + asystent'] },
        ],
        'Urodziny': [
            { name: 'Standard', icon: '📷', hours: 2, price: 29900, subtitle: 'Sesja 2h', features: ['2 godziny', 'do 80 zdjęć'] },
            { name: 'Złoty', icon: '⭐', hours: 3, price: 39900, subtitle: 'Sesja 3h', features: ['3 godziny', 'do 120 zdjęć', 'edycja pełna'] },
            { name: 'Platynowy', icon: '👑', hours: 5, price: 59900, subtitle: 'Sesja 5h', features: ['5 godzin', 'do 200 zdjęć', 'album cyfrowy'] },
        ],
    };

    for (const [serviceName, packages] of Object.entries(packagesData)) {
        const serviceType = await prisma.serviceType.findUnique({
            where: { name: serviceName }
        });

        if (serviceType) {
            for (let i = 0; i < packages.length; i++) {
                const pkg = packages[i];
                const existingPackage = await prisma.package.findFirst({
                    where: {
                        service_id: serviceType.id,
                        name: pkg.name
                    }
                });

                if (!existingPackage) {
                    await prisma.package.create({
                        data: {
                            service_id: serviceType.id,
                            name: pkg.name,
                            icon: pkg.icon,
                            hours: pkg.hours,
                            price: pkg.price,
                            subtitle: pkg.subtitle,
                            features: JSON.stringify(pkg.features),
                            order: i
                        }
                    });
                }
            }
        }
    }
    console.log('✅ Packages seeded');

    console.log('🎉 Database seed completed!');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
