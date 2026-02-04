/**
 * ADVANCED RESTORE SIMULATION
 * Detailed dry-run of database restore process
 * Shows exactly what would happen without modifying database
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function simulateRestore() {
    console.log('🔄 ADVANCED RESTORE SIMULATION\n');
    console.log('⚠️  DRY RUN - No data will be modified\n');

    // Load backup
    const backupFile = path.join(__dirname, '..', 'backups', 'data', 'latest-holy-backup.json');

    if (!fs.existsSync(backupFile)) {
        console.error('❌ Backup file not found!');
        process.exit(1);
    }

    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));

    console.log('📁 Backup loaded:', backupFile);
    console.log(`💾 Size: ${(fs.statSync(backupFile).size / 1024).toFixed(2)} KB\n`);

    // Define restore order (dependencies first)
    const restoreOrder = [
        'adminUser',
        'user',
        'setting',
        'mediaLibrary',
        'serviceType',
        'package',
        'page',
        'menuItem',
        'blogPost',
        'portfolioSession',
        'heroSlide',
        'testimonial',
        'promoCode',
        'giftCard',
        'giftCardOrder',
        'inquiry',
        'booking'
    ];

    console.log('📊 RESTORE PLAN:\n');

    let totalToRestore = 0;
    const operations: any[] = [];

    for (const table of restoreOrder) {
        const backupRecords = backupData[table] || [];

        if (backupRecords.length === 0) {
            console.log(`  ○ ${table}: Skipped (0 records in backup)`);
            continue;
        }

        try {
            // Check current database state
            // @ts-ignore
            const currentRecords = await prisma[table].findMany();

            // Analyze what would happen
            const toCreate = [];
            const toUpdate = [];

            for (const backupRecord of backupRecords) {
                // Determine unique identifier for this table
                let uniqueKey = 'id';
                if (['page', 'blogPost', 'portfolioSession'].includes(table)) {
                    uniqueKey = 'slug';
                } else if (['adminUser', 'user'].includes(table)) {
                    uniqueKey = 'email';
                } else if (table === 'setting') {
                    uniqueKey = 'setting_key';
                }

                const exists = currentRecords.find((r: any) =>
                    r[uniqueKey] === backupRecord[uniqueKey]
                );

                if (exists) {
                    toUpdate.push(backupRecord);
                } else {
                    toCreate.push(backupRecord);
                }
            }

            const toDelete = currentRecords.filter((current: any) => {
                const uniqueKey = table === 'page' || table === 'blogPost' ? 'slug' :
                    table === 'adminUser' || table === 'user' ? 'email' :
                        table === 'setting' ? 'setting_key' : 'id';

                return !backupRecords.find((b: any) => b[uniqueKey] === current[uniqueKey]);
            });

            console.log(`  ✓ ${table}:`);
            console.log(`     - Current: ${currentRecords.length} records`);
            console.log(`     - Backup:  ${backupRecords.length} records`);
            console.log(`     - CREATE:  ${toCreate.length} new`);
            console.log(`     - UPDATE:  ${toUpdate.length} existing`);
            if (toDelete.length > 0) {
                console.log(`     - DELETE:  ${toDelete.length} orphaned ⚠️`);
            }

            totalToRestore += backupRecords.length;

            operations.push({
                table,
                current: currentRecords.length,
                backup: backupRecords.length,
                create: toCreate.length,
                update: toUpdate.length,
                delete: toDelete.length
            });

        } catch (e: any) {
            console.log(`  ⚠️  ${table}: Unable to check (${e.message})`);
        }
    }

    console.log(`\n📊 SUMMARY:\n`);
    console.log(`  Total records to restore: ${totalToRestore}`);

    const totalCreates = operations.reduce((sum, op) => sum + op.create, 0);
    const totalUpdates = operations.reduce((sum, op) => sum + op.update, 0);
    const totalDeletes = operations.reduce((sum, op) => sum + op.delete, 0);

    console.log(`  - New records (CREATE): ${totalCreates}`);
    console.log(`  - Updated records (UPDATE): ${totalUpdates}`);
    console.log(`  - Orphaned records (DELETE): ${totalDeletes}`);

    // Verify critical content
    console.log(`\n🔍 CRITICAL CONTENT VERIFICATION:\n`);

    const pages = backupData.page || [];
    const pkpPage = pages.find((p: any) => p.slug === 'pkp-pluznica');

    if (pkpPage) {
        console.log(`  ✅ PKP Płużnica (ID: ${pkpPage.id})`);
        console.log(`     - Title: "${pkpPage.title}"`);
        console.log(`     - Published: ${pkpPage.is_published ? 'YES' : 'NO'}`);
        console.log(`     - Would be: ${operations.find(o => o.table === 'page')?.create > 0 ? 'CREATED' : 'UPDATED'}`);
    }

    const blogPosts = backupData.blogPost || [];
    console.log(`\n  📝 Blog Posts: ${blogPosts.length} total`);
    blogPosts.slice(0, 3).forEach((post: any) => {
        console.log(`     - "${post.title}" (${post.slug})`);
    });

    const portfolio = backupData.portfolioSession || [];
    console.log(`\n  📸 Portfolio Sessions: ${portfolio.length} total`);
    portfolio.forEach((session: any) => {
        console.log(`     - "${session.title}" (${session.category})`);
    });

    console.log(`\n✅ SIMULATION COMPLETE\n`);
    console.log(`📌 Next step: Run actual restore with:\n`);
    console.log(`   npm run db:restore\n`);
    console.log(`⚠️  WARNING: Actual restore will modify database!`);
}

simulateRestore()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
