
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
    console.log('Checking for duplicate bookings...');
    const bookings = await prisma.booking.findMany();
    const emails = new Set();
    const duplicates = [];

    for (const b of bookings) {
        if (emails.has(b.email)) {
            duplicates.push(b.id);
        } else {
            emails.add(b.email);
        }
    }

    if (duplicates.length > 0) {
        console.log(`Found ${duplicates.length} duplicates. Deleting...`);
        await prisma.booking.deleteMany({
            where: { id: { in: duplicates } }
        });
        console.log('Duplicates deleted.');
    } else {
        console.log('No duplicates found.');
    }

    console.log('Checking AdminUser...');
    try {
        const admin = await prisma.adminUser.findFirst();
        console.log('Admin check:', admin ? 'OK' : 'No Admin found');
    } catch (e) {
        console.error('Admin check failed:', e.message);
    }
}

fix().finally(() => prisma.$disconnect());
