import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function introspect() {
    console.log('--- PRISMA INTROSPECTION ---');
    const keys = Object.keys(prisma);
    const modelKeys = keys.filter(k => !k.startsWith('_') && !k.startsWith('$') && typeof (prisma as any)[k] === 'object');
    console.log(modelKeys.join(', '));
}

introspect()
    .finally(() => prisma.$disconnect());
