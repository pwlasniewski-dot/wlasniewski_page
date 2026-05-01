/**
 * Apply split_payment migration (bookings + settings columns).
 * ZERO LOSS: ALTER TABLE ADD COLUMN IF NOT EXISTS.
 */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const p = new PrismaClient();

(async () => {
    try {
        const sqlPath = path.join(__dirname, '..', 'database', 'migration_split_payment.sql');
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
            const preview = stmt.slice(0, 70).replace(/\s+/g, ' ');
            console.log(`[${i}/${statements.length}] ${preview}...`);
            await p.$executeRawUnsafe(stmt);
            console.log('  OK');
        }

        const r = await p.$queryRawUnsafe(
            `SELECT split_payment_enabled, split_payment_deposit_percent, split_payment_remaining_due_days FROM settings ORDER BY id ASC LIMIT 1`
        );
        console.log('SANITY settings:', JSON.stringify(r));

        const r2 = await p.$queryRawUnsafe(
            `SELECT column_name FROM information_schema.columns WHERE table_name='bookings' AND column_name IN ('payment_plan','deposit_amount','remaining_amount') ORDER BY column_name`
        );
        console.log('SANITY bookings columns:', JSON.stringify(r2));

        await p.$disconnect();
        console.log('DONE');
    } catch (e) {
        console.error('ERR', e.message);
        process.exit(1);
    }
})();
