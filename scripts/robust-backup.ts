
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function backup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups', `PROD-FULL-${timestamp}`);

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    console.log(`\n🚀 STARTING PRODUCTION BACKUP (wlasniewski.pl)`);
    console.log(`📂 Destination: ${backupDir}\n`);

    // Complete list — ALL 60 models from prisma/schema.prisma (camelCase as exposed by PrismaClient).
    // Order doesn't matter for backup; integrity is per-model.
    const models = [
        // Core / CMS
        'adminUser', 'setting', 'systemSettings', 'historyPhoto', 'menuItem', 'mediaLibrary',
        'portfolioSession', 'blogPost', 'testimonial', 'promoCode', 'inquiry',
        'emailSubscriber', 'analyticsEvent', 'analyticsSnapshot', 'heroSlide', 'page', 'pageEffect',
        // Bookings & products
        'booking', 'serviceType', 'package', 'giftCardOrder', 'giftCard',
        // Users & auth
        'user', 'photographerProfile',
        // Cart
        'basket', 'basketItem', 'sessionInvite',
        // Photo Challenge
        'challengePackage', 'challengeLocation', 'challengeUser', 'photoChallenge',
        'challengeTimelineEvent', 'challengeSetting', 'challengeGallery', 'challengePhoto',
        // Galleries / orders
        'clientGallery', 'galleryPhoto', 'galleryProduct', 'photoOrder',
        // Albums (nphoto)
        'nphotoAlbum', 'offerRecommendedAlbum',
        // Logs / ops
        'systemLog', 'errorNote',
        // Goals / scrum / marketing
        'businessGoal', 'scrumTask', 'marketingAction', 'marketingTemplate', 'droneOrder',
        // Newsletter / payouts / availability / subscribers
        'newsletter_campaigns', 'payouts', 'provider_availability', 'subscribers',
        // CRM (B2B / freelance)
        'offer', 'offerSection', 'offerItem', 'contract', 'negotiation',
        'client', 'clientOffer', 'clientContract', 'crmActivity'
    ];

    const stats: Record<string, number> = {};
    const failures: { model: string; error: string }[] = [];
    const missingClient: string[] = [];

    // BigInt cannot be serialized by JSON.stringify by default; convert to string.
    const bigintReplacer = (_key: string, value: any) =>
        typeof value === 'bigint' ? value.toString() : value;

    for (const model of models) {
        try {
            // @ts-ignore
            if (!prisma[model]) {
                console.warn(`  ⚠️  Model "${model}" not found in Prisma client (skipped).`);
                missingClient.push(model);
                continue;
            }
            // @ts-ignore
            const data = await prisma[model].findMany();
            fs.writeFileSync(
                path.join(backupDir, `${model}.json`),
                JSON.stringify(data, bigintReplacer, 2)
            );
            stats[model] = data.length;
            console.log(`  ✓ ${model.padEnd(25)}: ${data.length} records`);
        } catch (e: any) {
            const msg = e?.message || String(e);
            failures.push({ model, error: msg });
            console.error(`  ✗ Failed to backup "${model}":`, msg);
        }
    }

    // Create a manifest file
    fs.writeFileSync(
        path.join(backupDir, 'manifest.json'),
        JSON.stringify({
            timestamp,
            source: 'Production (Neon/wlasniewski.pl)',
            modelsRequested: models.length,
            modelsBackedUp: Object.keys(stats).length,
            totalRecords: Object.values(stats).reduce((a, b) => a + b, 0),
            stats,
            failures,
            missingFromPrismaClient: missingClient,
        }, null, 2)
    );

    console.log('\n✅ PRODUCTION BACKUP COMPLETED');
    console.log(`Models requested: ${models.length}`);
    console.log(`Models backed up: ${Object.keys(stats).length}`);
    console.log(`Total records:    ${Object.values(stats).reduce((a, b) => a + b, 0)}`);
    if (failures.length) {
        console.log(`\n⚠️  ${failures.length} failures:`);
        failures.forEach((f) => console.log(`   - ${f.model}: ${f.error}`));
    }
    if (missingClient.length) {
        console.log(`\n⚠️  ${missingClient.length} models missing in Prisma client:`);
        missingClient.forEach((m) => console.log(`   - ${m}`));
    }

    return backupDir;
}

backup()
    .catch((e) => {
        console.error('\nCRITICAL BACKUP FAILURE:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
