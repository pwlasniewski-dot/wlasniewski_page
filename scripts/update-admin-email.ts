
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // 1. Try to find the old email
    const oldEmail = 'przemyslaw@wlasniewski.pl';
    const newEmail = 'pwlasniewski@gmail.com';

    console.log(`Checking for admin with email: ${oldEmail}...`);

    const user = await prisma.adminUser.findUnique({
        where: { email: oldEmail }
    });

    if (user) {
        console.log(`Found user ID ${user.id}. Updating to ${newEmail}...`);
        await prisma.adminUser.update({
            where: { id: user.id },
            data: { email: newEmail }
        });
        console.log('✅ Email updated successfully.');
    } else {
        console.log(`User ${oldEmail} not found. Checking for ANY admin...`);
        const anyAdmin = await prisma.adminUser.findFirst();
        if (anyAdmin) {
            console.log(`Found admin ID ${anyAdmin.id} (${anyAdmin.email}). Updating to ${newEmail}...`);
            await prisma.adminUser.update({
                where: { id: anyAdmin.id },
                data: { email: newEmail }
            });
            console.log('✅ Email updated successfully.');
        } else {
            console.error('❌ No admin users found in database.');
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
