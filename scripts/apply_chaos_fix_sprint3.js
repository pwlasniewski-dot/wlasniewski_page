/**
 * Apply migration_chaos_fix_sprint3.sql
 * ZERO LOSS: wszystkie ALTER/CREATE z IF NOT EXISTS.
 */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const p = new PrismaClient();

(async () => {
    try {
        const sqlPath = path.join(__dirname, '..', 'database', 'migration_chaos_fix_sprint3.sql');
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
            console.log(`[${i}/${statements.length}] ${stmt.slice(0, 90).replace(/\s+/g, ' ')}...`);
            await p.$executeRawUnsafe(stmt);
            console.log('  OK');
        }

        // Sanity
        const userCols = await p.$queryRawUnsafe(
            `SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name IN ('terms_accepted_at','gdpr_consent_at','deleted_at') ORDER BY column_name`
        );
        console.log('SANITY users:', JSON.stringify(userCols));
        const bookCols = await p.$queryRawUnsafe(
            `SELECT column_name FROM information_schema.columns WHERE table_name='bookings' AND column_name IN ('refund_status','refunded_at','cancellation_reason') ORDER BY column_name`
        );
        console.log('SANITY bookings:', JSON.stringify(bookCols));
        const tables = await p.$queryRawUnsafe(
            `SELECT table_name FROM information_schema.tables WHERE table_name IN ('foto_match_block','foto_match_report','foto_match_message','foto_match_session_consent','booking_complaint') ORDER BY table_name`
        );
        console.log('SANITY tables:', JSON.stringify(tables));

        await p.$disconnect();
        console.log('DONE');
    } catch (e) {
        console.error('ERR', e.message);
        process.exit(1);
    }
})();
