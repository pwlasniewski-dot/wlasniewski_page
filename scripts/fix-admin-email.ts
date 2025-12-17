
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function fixAdminEmail() {
    try {
        const passwordHash = await bcrypt.hash('WLASNIEWSKI2024RESET', 10);

        // Check if correct user already exists
        const correctUser = await prisma.adminUser.findUnique({
            where: { email: 'pwlasniewski@gmail' }
        });

        if (correctUser) {
            console.log('User pwlasniewski@gmail exists. Updating password...');
            await prisma.adminUser.update({
                where: { email: 'pwlasniewski@gmail' },
                data: { password_hash: passwordHash }
            });
        } else {
            console.log('User pwlasniewski@gmail not found. Checking for old temp user...');
            const tempUser = await prisma.adminUser.findUnique({
                where: { email: 'kontakt@wlasniewski.pl' }
            });

            if (tempUser) {
                console.log('updating kontakt@wlasniewski.pl to pwlasniewski@gmail');
                await prisma.adminUser.update({
                    where: { email: 'kontakt@wlasniewski.pl' },
                    data: {
                        email: 'pwlasniewski@gmail',
                        password_hash: passwordHash,
                        name: 'Admin'
                    }
                });
            } else {
                console.log('Creating new admin pwlasniewski@gmail');
                await prisma.adminUser.create({
                    data: {
                        email: 'pwlasniewski@gmail',
                        name: 'Admin',
                        password_hash: passwordHash,
                        role: 'ADMIN'
                    }
                });
            }
        }

        console.log('SUCCESS: Admin email set to pwlasniewski@gmail');
        console.log('Password set to: WLASNIEWSKI2024RESET');

    } catch (error) {
        console.error('Error fixing admin email:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixAdminEmail();
