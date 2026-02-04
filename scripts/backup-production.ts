import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// PRODUCTION DATABASE URL
const PRODUCTION_DB = "postgresql://neondb_owner:npg_vjh6d9PJuKFT@ep-dry-art-aemsvsfc.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require";

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: PRODUCTION_DB
        }
    }
});

async function backupProduction() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(process.cwd(), 'backups', 'data', `backup-${timestamp}.json`);
    const latestFile = path.join(process.cwd(), 'backups', 'data', 'latest-holy-backup.json');

    console.log(`🔗 Connecting to PRODUCTION database (Neon)...`);
    console.log(`📦 Starting full backup...`);

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
        'analyticsSnapshot', 'marketingTemplate', 'newsletter_campaigns',
        'payouts', 'provider_availability', 'subscribers'
    ];

    const fullBackup: any = {};
    let totalRecords = 0;

    for (const model of models) {
        try {
            // @ts-ignore
            const data = await prisma[model].findMany();
            fullBackup[model] = data;
            console.log(`✓ ${model}: ${data.length} records`);
            totalRecords += data.length;
        } catch (e: any) {
            console.error(`✗ Failed to backup ${model}:`, e.message);
            fullBackup[model] = [];
        }
    }

    // Save to file with BigInt handling
    const jsonString = JSON.stringify(fullBackup, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
        , 2);

    fs.writeFileSync(backupFile, jsonString);
    fs.writeFileSync(latestFile, jsonString);

    console.log(`\n✅ Backup completed successfully!`);
    console.log(`📊 Total records: ${totalRecords}`);
    console.log(`📁 Saved to: ${backupFile}`);
    console.log(`📁 Latest: ${latestFile}`);

    return fullBackup;
}

backupProduction()
    .catch((e) => {
        console.error('❌ Backup failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
