const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'pwlasniewski@gmail.com';
    const password = 'Admin123!';
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.adminUser.upsert({
        where: { email },
        update: { password_hash: hashedPassword },
        create: {
            email,
            password_hash: hashedPassword,
            name: 'Admin',
        },
    });

    console.log('Admin user created/updated:', user);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
