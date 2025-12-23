
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'przemyslaw@wlasniewski.pl';
    const password = 'password123';
    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.adminUser.upsert({
        where: { email },
        update: { password_hash: hash },
        create: {
            email,
            password_hash: hash,
            name: 'Debug Admin',
            role: 'ADMIN'
        }
    });

    console.log(`Updated password for ${user.email} to '${password}'`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
