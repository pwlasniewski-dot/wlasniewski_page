/**
 * Apply migration: bookings.fm_voucher_code (+ index).
 * ZERO LOSS: IF NOT EXISTS.
 */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const p = new PrismaClient();

(async () => {
    try {
        const sqlPath = path.join(__dirname, '..', 'database', 'migration_booking_fm_voucher_code.sql');
        const raw = fs.readFileSync(sqlPath, 'utf8');
        const sql = raw
            .split('\n')
            .map(line => line.replace(/--.*/, ''))
            .join('\n');
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        let i = 0;
        for (const stmt of statements) {
            i++;
            console.log(`[${i}/${statements.length}] ${stmt.slice(0, 80).replace(/\s+/g, ' ')}...`);
            await p.$executeRawUnsafe(stmt);
            console.log('  OK');
        }

        const r = await p.$queryRawUnsafe(
            `SELECT column_name FROM information_schema.columns WHERE table_name='bookings' AND column_name='fm_voucher_code'`
        );
        console.log('SANITY:', JSON.stringify(r));

        await p.$disconnect();
        console.log('DONE');
    } catch (e) {
        console.error('ERR', e.message);
        process.exit(1);
    }
})();
