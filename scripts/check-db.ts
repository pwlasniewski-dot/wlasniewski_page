
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    const pkgs = await prisma.challengePackage.findMany();
    const locs = await prisma.challengeLocation.findMany();

    console.log('--- PACKAGES ---');
    console.log(JSON.stringify(pkgs, null, 2));
    console.log('--- LOCATIONS ---');
    console.log(JSON.stringify(locs, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
