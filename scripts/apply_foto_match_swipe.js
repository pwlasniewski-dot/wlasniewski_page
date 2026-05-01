/**
 * Apply migration: foto_match_swipe table + lat/lng columns.
 * ZERO LOSS: IF NOT EXISTS.
 */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const p = new PrismaClient();

(async () => {
    try {
        const sqlPath = path.join(__dirname, '..', 'database', 'migration_foto_match_swipe.sql');
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
            `SELECT column_name FROM information_schema.columns WHERE table_name='foto_match_profile' AND column_name IN ('latitude','longitude') ORDER BY column_name`
        );
        console.log('SANITY profile cols:', JSON.stringify(r));
        const r2 = await p.$queryRawUnsafe(
            `SELECT column_name FROM information_schema.columns WHERE table_name='foto_match_swipe' ORDER BY column_name`
        );
        console.log('SANITY swipe cols:', JSON.stringify(r2));

        await p.$disconnect();
        console.log('DONE');
    } catch (e) {
        console.error('ERR', e.message);
        process.exit(1);
    }
})();
