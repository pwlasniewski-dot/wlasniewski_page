/**
 * Idempotentny seed: 3 testowe zapisy na waitlist Foto-Match (1 confirmed, 2 pending).
 * Bezpieczny: emaile zaczynają się od `seed-fm-` i nie wysyła maili.
 *
 * Użycie: `node scripts/seed_foto_match_test_data.js`
 * Cleanup: `node scripts/seed_foto_match_test_data.js --clean`
 */
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const p = new PrismaClient();

const SEEDS = [
    {
        email: 'seed-fm-anna@example.test',
        city: 'Toruń',
        role: 'invitee',
        age_range: '25-34',
        source: 'seed-test',
        marketing_opt_in: true,
        confirmed: true,
    },
    {
        email: 'seed-fm-marek@example.test',
        city: 'Bydgoszcz',
        role: 'inviter',
        age_range: '35-44',
        source: 'seed-test',
        marketing_opt_in: false,
        confirmed: false,
    },
    {
        email: 'seed-fm-kasia@example.test',
        city: 'Toruń',
        role: 'both',
        age_range: '25-34',
        source: 'seed-test',
        marketing_opt_in: true,
        confirmed: false,
    },
];

async function clean() {
    const r = await p.fotoMatchWaitlist.deleteMany({
        where: { email: { startsWith: 'seed-fm-' } },
    });
    console.log('Usuniętych seedów:', r.count);
}

async function seed() {
    for (const s of SEEDS) {
        const existing = await p.fotoMatchWaitlist.findUnique({ where: { email: s.email } });
        if (existing) {
            console.log('SKIP (exists):', s.email);
            continue;
        }
        const token = crypto.randomBytes(24).toString('hex');
        await p.fotoMatchWaitlist.create({
            data: {
                email: s.email,
                city: s.city,
                role: s.role,
                age_range: s.age_range,
                source: s.source,
                marketing_opt_in: s.marketing_opt_in,
                rules_accepted_at: new Date(),
                ip_address: '127.0.0.1',
                user_agent: 'seed-script',
                confirm_token: s.confirmed ? null : token,
                confirm_token_expires: s.confirmed ? null : new Date(Date.now() + 24 * 60 * 60 * 1000),
                confirmed_at: s.confirmed ? new Date() : null,
            },
        });
        console.log('CREATED:', s.email, '(' + (s.confirmed ? 'confirmed' : 'pending') + ')');
    }
}

(async () => {
    try {
        if (process.argv.includes('--clean')) await clean();
        else await seed();
    } catch (e) {
        console.error('FAIL:', e.message);
        process.exit(1);
    } finally {
        await p.$disconnect();
    }
})();
