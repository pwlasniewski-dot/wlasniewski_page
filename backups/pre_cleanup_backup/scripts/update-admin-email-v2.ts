
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const targetEmail = 'pwlasniewski@gmail.com';

    // Check if target already exists
    const existingTarget = await prisma.adminUser.findUnique({
        where: { email: targetEmail }
    });

    if (existingTarget) {
        console.log(`✅ User ${targetEmail} already exists (ID: ${existingTarget.id}). No update needed.`);
        return;
    }

    // Try to find the old email
    const oldEmail = 'przemyslaw@wlasniewski.pl';
    console.log(`Checking for admin with email: ${oldEmail}...`);

    const oldUser = await prisma.adminUser.findUnique({
        where: { email: oldEmail }
    });

    if (oldUser) {
        console.log(`Found user ID ${oldUser.id}. Updating to ${targetEmail}...`);
        await prisma.adminUser.update({
            where: { id: oldUser.id },
            data: { email: targetEmail }
        });
        console.log('✅ Email updated successfully.');
    } else {
        console.log(`User ${oldEmail} not found. Checking for ANY admin...`);
        const anyAdmin = await prisma.adminUser.findFirst();
        if (anyAdmin) {
            console.log(`Found admin ID ${anyAdmin.id} (${anyAdmin.email}). Updating to ${targetEmail}...`);
            await prisma.adminUser.update({
                where: { id: anyAdmin.id },
                data: { email: targetEmail }
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
