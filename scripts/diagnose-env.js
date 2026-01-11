
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const url = process.env.DATABASE_URL || 'UNDEFINED';
// Mask password
const maskedUrl = url.replace(/:([^:@]+)@/, ':****@');

console.log(`[Diagnostic] DATABASE_URL seen by script: ${maskedUrl}`);

const prisma = new PrismaClient();
prisma.$connect()
    .then(() => {
        console.log('[Diagnostic] Connection SUCCESSFUL');
        return prisma.page.count();
    })
    .then((count) => {
        console.log(`[Diagnostic] Page Count: ${count}`);
    })
    .catch((e) => {
        console.error('[Diagnostic] Connection FAILED:', e.message);
    })
    .finally(() => prisma.$disconnect());
