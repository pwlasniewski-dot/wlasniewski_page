
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function forceReset() {
    try {
        const admin = await prisma.adminUser.findFirst();

        if (!admin) {
            console.log('No admin user found. Creating one...');
            const passwordHash = await bcrypt.hash('WLASNIEWSKI2024RESET', 10);
            const newAdmin = await prisma.adminUser.create({
                data: {
                    email: 'kontakt@wlasniewski.pl', // Default email
                    name: 'Admin',
                    password_hash: passwordHash,
                    role: 'ADMIN'
                }
            });
            console.log('Created new admin:', newAdmin.email);
            console.log('Password: WLASNIEWSKI2024RESET');
            return;
        }

        console.log('Found admin:', admin.email);
        const passwordHash = await bcrypt.hash('WLASNIEWSKI2024RESET', 10);

        await prisma.adminUser.update({
            where: { id: admin.id },
            data: { password_hash: passwordHash }
        });

        console.log('SUCCESS: Password reset for', admin.email);
        console.log('New Password: WLASNIEWSKI2024RESET');

    } catch (error) {
        console.error('Error resetting password:', error);
    } finally {
        await prisma.$disconnect();
    }
}

forceReset();
