/**
 * Apply migration_foto_match_phone_verification.sql
 * ZERO LOSS: ALTER ... ADD COLUMN IF NOT EXISTS + CREATE INDEX IF NOT EXISTS.
 */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const p = new PrismaClient();

(async () => {
    try {
        const sqlPath = path.join(__dirname, '..', 'database', 'migration_foto_match_phone_verification.sql');
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

        const cols = await p.$queryRawUnsafe(
            `SELECT column_name FROM information_schema.columns WHERE table_name='foto_match_profile' AND column_name IN ('phone','phone_verified_at','phone_verification_code_hash','phone_verification_expires_at','phone_verification_attempts','age_declared_at','age_declared_ip') ORDER BY column_name`
        );
        console.log('SANITY foto_match_profile:', JSON.stringify(cols));

        await p.$disconnect();
        console.log('DONE');
    } catch (e) {
        console.error('ERR', e.message);
        process.exit(1);
    }
})();
