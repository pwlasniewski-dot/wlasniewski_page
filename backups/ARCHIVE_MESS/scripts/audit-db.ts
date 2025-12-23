import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkDatabase() {
    console.log('--- DATABASE CONTENT AUDIT ---');

    const pages = await prisma.page.findMany({
        select: { id: true, slug: true, title: true, is_published: true, menu_order: true }
    });
    console.log(`\nPages (${pages.length}):`);
    pages.forEach(p => console.log(` - [${p.id}] /${p.slug} : ${p.title} (Published: ${p.is_published}, Order: ${p.menu_order})`));

    const settings = await prisma.setting.count();
    console.log(`\nSettings records: ${settings}`);
    if (settings > 0) {
        const s = await prisma.setting.findFirst({ orderBy: { id: 'asc' } });
        console.log(` - SMTP Info: Host=${s?.smtp_host}, User=${s?.smtp_user}, From=${s?.smtp_from}`);
    }

    const bookings = await prisma.booking.count();
    console.log(`\nBookings: ${bookings}`);

    const giftCardOrders = await prisma.giftCardOrder.count();
    console.log(`\nGift Card Orders: ${giftCardOrders}`);

    const inquiries = await prisma.inquiry.count();
    console.log(`\nInquiries: ${inquiries}`);

    await prisma.$disconnect();
}

checkDatabase();
