import prisma from '@/lib/db/prisma';
import { hashPassword } from '@/lib/auth/jwt';

async function createTestUser() {
    const email = 'testuser@example.com';
    const password = 'password123';

    // Check if exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        console.log('✅ Test user already exists.');
        return;
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
        data: {
            name: 'Test Setup User',
            email,
            password_hash: hashedPassword,
        }
    });

    console.log(`✅ Created test user: ${user.email} (password: ${password})`);
}

createTestUser()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
