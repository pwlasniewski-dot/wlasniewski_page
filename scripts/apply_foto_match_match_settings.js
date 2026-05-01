/**
 * Apply foto_match_match_settings table.
 * ZERO LOSS: CREATE TABLE IF NOT EXISTS + idempotentny INSERT singleton.
 */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const p = new PrismaClient();

(async () => {
    try {
        const sqlPath = path.join(__dirname, '..', 'database', 'migration_foto_match_match_settings.sql');
        const raw = fs.readFileSync(sqlPath, 'utf8');
        // Strip line comments before splitting on ';'.
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
            const preview = stmt.slice(0, 60).replace(/\s+/g, ' ');
            console.log(`[${i}/${statements.length}] ${preview}...`);
            try {
                await p.$executeRawUnsafe(stmt);
                console.log('  OK');
            } catch (e) {
                if (stmt.toUpperCase().startsWith('SELECT')) {
                    console.log('  (skipped — SELECT in batch)');
                    continue;
                }
                throw e;
            }
        }

        const r = await p.$queryRawUnsafe(
            `SELECT id, opposite_gender_only, age_range, age_range_years FROM foto_match_match_settings`
        );
        console.log('SANITY:', JSON.stringify(r));

        await p.$disconnect();
        console.log('DONE');
    } catch (e) {
        console.error('ERR', e.message);
        process.exit(1);
    }
})();
