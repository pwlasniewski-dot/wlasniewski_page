
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetPassword() {
    console.log('🔐 Starting Emergency Admin Fix (UPSERT)...');

    try {
        const adminEmail = 'pwlasniewski@gmail.com';
        const newPassword = 'admin123';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Upsert admin user: Update if exists, Create if not.
        const admin = await prisma.adminUser.upsert({
            where: { email: adminEmail },
            update: {
                password_hash: hashedPassword,
                role: 'ADMIN' // Ensure role is ADMIN
            },
            create: {
                email: adminEmail,
                password_hash: hashedPassword,
                name: 'Przemysław Właśniewski',
                role: 'ADMIN'
            }
        });

        console.log(`✅ Admin user SECURED: ${adminEmail}`);
        console.log(`🔑 Password set to: ${newPassword}`);
        console.log(`🆔 ID: ${admin.id}`);

    } catch (e) {
        console.error('❌ Error fixing admin user:', e);
    }
}

resetPassword()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
