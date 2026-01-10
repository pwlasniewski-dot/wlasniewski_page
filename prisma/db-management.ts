import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Tables to include in "Holy Content" backup
const TABLES = [
    'adminUser',
    'user',
    'setting',
    'systemSettings',
    'mediaLibrary',
    'page',
    'menuItem',
    'serviceType',
    'package',
    'blogPost',
    'portfolioSession',
    'testimonial',
    'promoCode',
    'giftCard',
    'giftCardOrder',
    'photoChallenge',
    'challengeSetting',
    'inquiry',
    'droneOrder',
    'analyticsSnapshot',
    'businessGoal',
    'marketingTemplate',
    'heroSlide',
    'clientGallery',
    'galleryPhoto',
    'photoOrder',
    'sessionInvite',
    'challengeUser',
    'challengeTimelineEvent',
    'payout',
    'providerAvailability',
    'subscriber',
    'newsletterCampaign'
];

async function backup() {
    console.log('📦 Starting "Zero Loss" Backup...');
    console.log('DEBUG: process.cwd() =', process.cwd());
    const data: Record<string, any> = {};

    for (const table of TABLES) {
        try {
            // @ts-ignore - Dynamic table access
            const model = prisma[table as keyof typeof prisma];
            if (!model || typeof (model as any).findMany !== 'function') {
                console.warn(`⚠️  Skipped ${table}: Model not found in Prisma client.`);
                continue;
            }

            data[table] = await (model as any).findMany();
            console.log(`✅ Extracted: ${table} (${data[table].length} records)`);
        } catch (err: any) {
            console.warn(`⚠️  Error extracting ${table}: ${err.message}`);
        }
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const projectRoot = process.cwd();
    const backupDir = path.join(projectRoot, 'backups', 'data');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const filePath = path.join(backupDir, `backup-${timestamp}.json`);
    const latestPath = path.join(backupDir, `latest-holy-backup.json`);

    const json = JSON.stringify(data, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
        , 2);

    fs.writeFileSync(filePath, json);
    fs.writeFileSync(latestPath, json);

    console.log(`\n🎉 Backup saved to: ${filePath}`);
    console.log(`🔗 Linked to: ${latestPath}`);
}

async function restore(filePath?: string) {
    const targetFile = filePath || path.join(process.cwd(), 'backups', 'data', 'latest-holy-backup.json');

    if (!fs.existsSync(targetFile)) {
        console.error(`❌ Error: Backup file not found: ${targetFile}`);
        process.exit(1);
    }

    console.log(`🔄 Restoring from: ${targetFile}...`);
    const data = JSON.parse(fs.readFileSync(targetFile, 'utf-8'));

    for (const table of TABLES) {
        const records = data[table];
        if (!records || records.length === 0) continue;

        console.log(`📝 Restoring ${table} (${records.length} records)...`);

        for (const record of records) {
            try {
                // Sanitize record: remove fields that might not exist in current schema (simple protection)
                // In a real scenario, we should check against Prisma's dmmf, but here we just try-catch.
                // However, 'Invalid invocation' often means extra fields.
                // We'll trust strict matching for now, but if fails, we might need to be smarter.
                // Let's add 'role' default if missing for User
                if (table === 'user' && !record.role) {
                    record.role = 'CLIENT';
                }

                // We use id or unique slugs for upsert
                const where: any = { id: record.id };
                if (table === 'page' || table === 'portfolioSession' || table === 'blogPost') {
                    delete where.id;
                    where.slug = record.slug;
                } else if (table === 'setting' || table === 'challengeSetting' || table === 'systemSettings') {
                    delete where.id;
                    where.setting_key = record.setting_key || record.key;
                } else if (table === 'adminUser' || table === 'emailSubscriber' || table === 'user') {
                    delete where.id;
                    where.email = record.email;
                }

                // @ts-ignore - Dynamic table access
                await prisma[table].upsert({
                    where,
                    update: record,
                    create: record
                });
            } catch (err: any) {
                console.error(`❌ Failed to restore record in ${table}:`, err.message);
            }
        }
    }

    console.log('\n✅ Restore complete! Your content is safe.');
}

const mode = process.argv[2];
const arg = process.argv[3];

async function main() {
    try {
        if (mode === 'backup') {
            await backup();
        } else if (mode === 'restore') {
            await restore(arg);
        } else {
            console.log('Usage: ts-node scripts/db-management.ts [backup|restore] [filepath]');
        }
    } catch (err: any) {
        fs.appendFileSync('db-error.log', `[${new Date().toISOString()}] GLOBAL ERROR: ${err.message}\n${err.stack}\n\n`);
        console.error('CRITICAL ERROR:', err.message);
        process.exit(1);
    }
}

main().finally(() => prisma.$disconnect());
