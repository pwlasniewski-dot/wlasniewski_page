import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // 1. Create an admin only when deployment-specific credentials are supplied.
    // Never keep real or default credentials in source control.
    const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;

    if (adminEmail && adminPassword) {
        if (adminPassword.length < 12) {
            throw new Error('SEED_ADMIN_PASSWORD must contain at least 12 characters');
        }

        const existingAdmin = await prisma.adminUser.findUnique({ where: { email: adminEmail } });
        if (!existingAdmin) {
            const bcrypt = require('bcryptjs');
            const passwordHash = await bcrypt.hash(adminPassword, 10);

            await prisma.adminUser.create({
                data: {
                    email: adminEmail,
                    password_hash: passwordHash,
                    name: 'Administrator',
                    role: 'ADMIN'
                }
            });
            console.log('✅ Admin user created from environment configuration');
        }
    } else {
        console.log('ℹ️  Admin seed skipped (SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD not set)');
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
                smtp_host: process.env.SMTP_HOST || null,
                smtp_port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : null,
                smtp_user: process.env.SMTP_USER || null,
                smtp_from: process.env.SMTP_FROM || null,

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
                social_proof_enabled: false,
                social_proof_total_clients: 0,
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
            { name: 'Rodzinny Start', icon: '📷', hours: 1, price: 75000, subtitle: 'Spokojna godzina zdjęć', features: ['około 60 minut fotografowania', '35 starannie opracowanych zdjęć', 'prywatna galeria internetowa', 'pendrive z gotowym materiałem'] },
            { name: 'Rodzinny Komfort', icon: '⭐', hours: 2, price: 98000, subtitle: 'Najczęściej wybierany', features: ['do 2 godzin fotografowania', '55 starannie opracowanych zdjęć', 'ujęcia całej rodziny i mniejszych grup', 'prywatna galeria internetowa', 'pendrive z gotowym materiałem'] },
            { name: 'Rodzinny Album', icon: '📖', hours: 2.5, price: 163000, subtitle: 'Zdjęcia i album nPhoto', features: ['do 2,5 godziny fotografowania', '80 starannie opracowanych zdjęć', 'prywatna galeria i pendrive', 'album nPhoto w cenie'] },
        ],
        'Ślub': [
            { name: 'Ceremonia cywilna', icon: '🤍', hours: 2, price: 190000, subtitle: 'Urząd, życzenia i krótka sesja', features: ['ceremonia w USC lub plenerze', 'życzenia i zdjęcia z bliskimi', 'krótka sesja Pary Młodej', 'minimum 100 opracowanych zdjęć', 'prywatna galeria internetowa'] },
            { name: 'Ślub i kameralne przyjęcie', icon: '🥂', hours: 5, price: 350000, subtitle: 'Od ceremonii do najważniejszych chwil przyjęcia', features: ['ceremonia kościelna lub cywilna', 'reportaż z przyjęcia do 5 godzin', 'sesja Pary Młodej w dniu ślubu', 'minimum 250 opracowanych zdjęć', 'prywatna galeria i pendrive'] },
            { name: 'Pełny reportaż ślubny', icon: '💍', hours: 12, price: 590000, subtitle: 'Przygotowania, ceremonia i wesele', features: ['do 12 godzin obecności fotografa', 'przygotowania i ceremonia kościelna lub cywilna', 'wesele do oczepin', 'minimum 500 opracowanych zdjęć', 'sesja Pary Młodej w dniu ślubu', 'prywatna galeria i pendrive'] },
        ],
        'Przyjęcie': [
            { name: 'Krótkie przyjęcie', icon: '📷', hours: 3, price: 120000, subtitle: 'Najważniejsze momenty spotkania', features: ['do 3 godzin reportażu', 'minimum 150 opracowanych zdjęć', 'zdjęcia rodzinne i grupowe', 'prywatna galeria internetowa'] },
            { name: 'Pełna opowieść', icon: '⭐', hours: 5, price: 180000, subtitle: 'Od powitania po zabawę', features: ['do 5 godzin reportażu', 'minimum 250 opracowanych zdjęć', 'portrety gości i zdjęcia grupowe', 'prywatna galeria internetowa'] },
            { name: 'Cały dzień', icon: '✨', hours: 8, price: 260000, subtitle: 'Rozbudowany reportaż z uroczystości', features: ['do 8 godzin reportażu', 'minimum 400 opracowanych zdjęć', 'pełna historia uroczystości', 'prywatna galeria i pendrive'] },
        ],
        'Urodziny': [
            { name: 'Urodzinowy reportaż', icon: '🎂', hours: 3, price: 110000, subtitle: 'Tort, goście i swobodne kadry', features: ['do 3 godzin fotografowania', 'minimum 150 opracowanych zdjęć', 'zdjęcia solenizanta i gości', 'prywatna galeria internetowa'] },
            { name: 'Urodziny z historią', icon: '🎈', hours: 5, price: 170000, subtitle: 'Więcej czasu na ludzi i atmosferę', features: ['do 5 godzin fotografowania', 'minimum 250 opracowanych zdjęć', 'portrety i zdjęcia grupowe', 'prywatna galeria internetowa'] },
            { name: 'Duże urodziny', icon: '🥳', hours: 7, price: 240000, subtitle: 'Reportaż z całego wydarzenia', features: ['do 7 godzin fotografowania', 'minimum 350 opracowanych zdjęć', 'pełny reportaż i zdjęcia grupowe', 'prywatna galeria i pendrive'] },
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
