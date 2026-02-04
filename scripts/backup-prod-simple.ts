// Simple script to backup production database
// Usage: NODE_ENV=production npx tsx scripts/backup-prod-simple.ts

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load production .env
dotenv.config({ path: '.env.production' });

const prisma = new PrismaClient();

async function main() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(__dirname, '..', 'backups', 'data', `backup-${timestamp}.json`);
    const latestFile = path.join(__dirname, '..', 'backups', 'data', 'latest-holy-backup.json');

    console.log('🔗 Connecting to database...');
    console.log(`📦 Starting backup to: ${backupFile}`);

    const backup: any = {};

    // Backup all tables
    console.log('\n📊 Backing up tables:');

    const tables = {
        adminUser: await prisma.adminUser.findMany(),
        setting: await prisma.setting.findMany(),
        page: await prisma.page.findMany(),
        blogPost: await prisma.blogPost.findMany(),
        portfolioSession: await prisma.portfolioSession.findMany(),
        mediaLibrary: await prisma.mediaLibrary.findMany(),
        menuItem: await prisma.menuItem.findMany(),
        heroSlide: await prisma.heroSlide.findMany(),
        testimonial: await prisma.testimonial.findMany(),
        serviceType: await prisma.serviceType.findMany(),
        package: await prisma.package.findMany(),
        booking: await prisma.booking.findMany(),
        promoCode: await prisma.promoCode.findMany(),
        giftCard: await prisma.giftCard.findMany(),
        giftCardOrder: await prisma.giftCardOrder.findMany(),
        inquiry: await prisma.inquiry.findMany(),
        user: await prisma.user.findMany(),
    };

    let totalRecords = 0;
    for (const [table, data] of Object.entries(tables)) {
        backup[table] = data;
        console.log(`  ✓ ${table}: ${data.length} records`);
        totalRecords += data.length;
    }

    // Save backup
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    fs.writeFileSync(latestFile, JSON.stringify(backup, null, 2));

    console.log(`\n✅ Backup completed!`);
    console.log(`📊 Total records: ${totalRecords}`);
    console.log(`📁 Saved to: ${backupFile}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
