
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

    // Complete list of models from schema.prisma (camelCase)
    const models = [
        'adminUser', 'setting', 'historyPhoto', 'menuItem', 'mediaLibrary',
        'portfolioSession', 'blogPost', 'testimonial', 'promoCode', 'inquiry',
        'emailSubscriber', 'analyticsEvent', 'heroSlide', 'page', 'booking',
        'serviceType', 'package', 'giftCardOrder', 'giftCard', 'user',
        'photographerProfile', 'basket', 'basketItem', 'sessionInvite',
        'challengePackage', 'challengeLocation', 'challengeUser', 'photoChallenge',
        'challengeTimelineEvent', 'challengeSetting', 'challengeGallery',
        'challengePhoto', 'clientGallery', 'galleryPhoto', 'photoOrder',
        'systemSettings', 'pageEffect', 'systemLog', 'errorNote',
        'businessGoal', 'scrumTask', 'marketingAction', 'droneOrder',
        'analyticsSnapshot', 'marketingTemplate'
    ];

    const stats: Record<string, number> = {};

    for (const model of models) {
        try {
            // @ts-ignore
            if (!prisma[model]) {
                console.warn(`  ⚠️  Model "${model}" not found in Prisma client.`);
                continue;
            }
            // @ts-ignore
            const data = await prisma[model].findMany();
            fs.writeFileSync(
                path.join(backupDir, `${model}.json`),
                JSON.stringify(data, null, 2)
            );
            stats[model] = data.length;
            console.log(`  ✓ ${model.padEnd(25)}: ${data.length} records`);
        } catch (e: any) {
            console.error(`  ✗ Failed to backup "${model}":`, e.message);
        }
    }

    // Create a manifest file
    fs.writeFileSync(
        path.join(backupDir, 'manifest.json'),
        JSON.stringify({
            timestamp,
            source: 'Production (Neon/wlasniewski.pl)',
            stats
        }, null, 2)
    );

    console.log('\n✅ PRODUCTION BACKUP COMPLETED');
    console.log(`Total models backed up: ${Object.keys(stats).length}\n`);

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
