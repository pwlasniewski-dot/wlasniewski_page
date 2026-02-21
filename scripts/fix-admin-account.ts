import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = "pwlasniewski@gmail.com";
    const password = "Wlasniewski123!";
    const name = "Admin";
    const role = "ADMIN";

    console.log(`Checking admin account: ${email}...`);

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const admin = await prisma.adminUser.upsert({
        where: { email },
        update: {
            password_hash: passwordHash,
            role: role,
            name: name
        },
        create: {
            email,
            password_hash: passwordHash,
            name,
            role
        }
    });

    console.log(`Admin account ${admin.email} is ready!`);
    console.log(`Name: ${admin.name}`);
    console.log(`Role: ${admin.role}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
