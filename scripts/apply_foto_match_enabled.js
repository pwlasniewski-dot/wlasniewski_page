/**
 * Apply foto_match_enabled setting column.
 * ZERO LOSS: ALTER TABLE ADD COLUMN IF NOT EXISTS.
 */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
    try {
        console.log('[1/2] ALTER TABLE settings ADD COLUMN foto_match_enabled...');
        await p.$executeRawUnsafe(
            `ALTER TABLE settings ADD COLUMN IF NOT EXISTS foto_match_enabled BOOLEAN DEFAULT FALSE`
        );
        console.log('  OK');

        console.log('[2/2] Sanity check...');
        const r = await p.$queryRawUnsafe(
            `SELECT id, foto_match_enabled FROM settings LIMIT 5`
        );
        console.log('  OK ->', JSON.stringify(r));

        await p.$disconnect();
        console.log('DONE');
    } catch (e) {
        console.error('ERR', e.message);
        process.exit(1);
    }
})();
