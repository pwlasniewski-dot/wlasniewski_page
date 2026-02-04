
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Setting up demo data...');

    // 1. Create/Update Admin
    const adminEmail = 'admin@example.com';
    const adminPassword = await bcrypt.hash('admin123', 10);

    let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!admin) {
        admin = await prisma.user.create({
            data: {
                email: adminEmail,
                password_hash: adminPassword, // Schema uses password_hash, not password
                name: 'Admin Demo',
                role: 'ADMIN', // Schema uses uppercase ADMIN
            },
        });
    } else {
        await prisma.user.update({
            where: { email: adminEmail },
            data: { password_hash: adminPassword, role: 'ADMIN' }
        });
    }
    console.log('✅ Admin user ready:', adminEmail);

    // 2. Create/Update Client
    const clientEmail = 'klient@example.com';
    const clientPassword = await bcrypt.hash('klient123', 10);

    let client = await prisma.user.findUnique({ where: { email: clientEmail } });
    if (!client) {
        client = await prisma.user.create({
            data: {
                email: clientEmail,
                password_hash: clientPassword,
                name: 'Jan Kowalski',
                role: 'CLIENT', // Schema uses uppercase CLIENT
            },
        });
    } else {
        await prisma.user.update({
            where: { email: clientEmail },
            data: { password_hash: clientPassword, role: 'CLIENT' }
        });
    }
    console.log('✅ Client user ready:', clientEmail);

    // 3. Create Offer for Client
    const offer = await prisma.offer.create({
        data: {
            title: 'Sesja Ślubna Premium - Demo',
            slug: 'sesja-slubna-demo-' + Date.now(),
            type: 'b2c',
            status: 'sent',
            client_email: clientEmail,
            client_id: client.id,
            total_price: 3600,
            // is_template: false, // Removed as column missing in DB
            valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 days
            sections: {
                create: [
                    {
                        title: 'Reportaż Ślubny',
                        description: 'Pełna obsługa fotograficzna dnia ślubu',
                        order: 0,
                        items: {
                            create: [
                                { title: 'Przygotowania', quantity: 1, price: 500, description: 'Od godziny 11:00' },
                                { title: 'Ceremonia', quantity: 1, price: 1000, description: 'Kościół św. Jakuba' },
                                { title: 'Wesele', quantity: 1, price: 2000, description: 'Do oczepin (00:30)' },
                            ]
                        }
                    },
                    {
                        title: 'Dodatki',
                        description: 'Opcjonalne elementy',
                        order: 1,
                        items: {
                            create: [
                                { title: 'Fotoksiążka Premium', quantity: 1, price: 500, is_optional: true },
                                { title: 'Sesja narzeczeńska', quantity: 1, price: 600, is_optional: true },
                            ]
                        }
                    }
                ]
            },
            contract: {
                create: {
                    // content: '...' // Removed as might be missing too if schema drift
                    status: 'pending'
                }
            }
        },
    });

    console.log('✅ Demo Offer created:', offer.title, `(ID: ${offer.id})`);
    console.log('🔗 Link:', `http://localhost:3000/strefa-klienta/oferty/${offer.id}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
