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

    // 3. Create essential settings (including SMTP for Gmail)
    const settings = [
        { key: 'site_title', value: 'Przemysław Właśniewski Fotografia' },
        { key: 'site_description', value: 'Profesjonalna fotografia ślubna i portretowa' },
        { key: 'contact_email', value: 'pwlasniewski@gmail.com' },
        { key: 'contact_phone', value: '+48530788694' },
        { key: 'whatsapp_number', value: '48530788694' },
        // Gmail SMTP settings
        { key: 'smtp_host', value: 'smtp.gmail.com' },
        { key: 'smtp_port', value: '587' },
        { key: 'smtp_user', value: 'pwlasniewski@gmail.com' },
        { key: 'smtp_password', value: 'bava jtrh wwql uokn' },
        { key: 'smtp_from', value: 'pwlasniewski@gmail.com' },
    ];

    for (const setting of settings) {
        await prisma.setting.upsert({
            where: { setting_key: setting.key },
            update: { setting_value: setting.value },
            create: {
                setting_key: setting.key,
                setting_value: setting.value
            }
        });
    }
    console.log('✅ Settings created/updated');

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
