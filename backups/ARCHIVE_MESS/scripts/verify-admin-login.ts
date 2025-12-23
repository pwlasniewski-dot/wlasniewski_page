
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function verifyLogin() {
    const email = 'pwlasniewski@gmail';
    const password = 'WLASNIEWSKI2024RESET';

    try {
        console.log(`Checking admin: ${email}`);
        const admin = await prisma.adminUser.findUnique({ where: { email } });

        if (!admin) {
            console.log('❌ Admin user NOT FOUND in database.');
            return;
        }

        console.log(`User found: ${admin.id} / ${admin.role}`);
        console.log('Stored Hash:', admin.password_hash.substring(0, 20) + '...');

        const isValid = await bcrypt.compare(password, admin.password_hash);

        if (isValid) {
            console.log('✅ Password CHECK PASSED locally.');
            console.log('This means the database has the correct hash.');
        } else {
            console.log('❌ Password CHECK FAILED locally.');
            console.log('The stored hash does not match WLASNIEWSKI2024RESET.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyLogin();
