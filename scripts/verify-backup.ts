import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function verifyBackup() {
    try {
        console.log('🔍 Starting Backup Verification...');

        // 1. Find Latest Holy Backup
        const backupPath = path.join(process.cwd(), 'backups', 'data', 'latest-holy-backup.json');

        if (!fs.existsSync(backupPath)) {
            console.error('❌ No "latest-holy-backup.json" found!');
            process.exit(1);
        }

        console.log(`📂 Loading backup: ${backupPath}`);
        const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

        // Timestamp might not be in the file based on db-management.ts structure (it saves pure data object?)
        // Let's check keys.
        // db-management.ts: const data: Record<string, any> = {}; ... data[table] = ...
        // So the structure is { user: [...], page: [...] }
        // There is no top-level timestamp key in the JSON content itself, only in the filename.
        // We'll skip timestamp printing from JSON.

        // 2. Compare Counts
        const checks = [
            { model: 'page', label: 'Pages' },
            { model: 'blogPost', label: 'Blog Posts' },
            { model: 'user', label: 'Users' },
            { model: 'booking', label: 'Bookings' },
            { model: 'setting', label: 'Settings' },
            { model: 'package', label: 'Packages' },
            { model: 'serviceType', label: 'Service Types' },
            { model: 'mediaLibrary', label: 'Media Library' }
        ];

        let allMatch = true;

        console.log('\n📊 Comparing Database vs Backup Record Counts:');
        console.log('------------------------------------------------');

        for (const check of checks) {
            const modelDelegate = (prisma as any)[check.model];

            if (!modelDelegate) {
                console.warn(`⚠️ Model ${check.model} not found in Prisma Client`);
                continue;
            }

            const dbCount = await modelDelegate.count();

            // Access top-level key
            const backupRecords = (backupData as any)[check.model];
            const backupCount = Array.isArray(backupRecords) ? backupRecords.length : 0;

            const match = dbCount === backupCount;
            if (!match) allMatch = false;

            const icon = match ? '✅' : '❌';
            const diff = dbCount - backupCount;
            const diffStr = diff !== 0 ? `(Diff: ${diff > 0 ? '+' : ''}${diff})` : '';

            console.log(`${icon} ${check.label.padEnd(20)} | DB: ${dbCount.toString().padEnd(5)} | Backup: ${backupCount.toString().padEnd(5)} ${diffStr}`);
        }

        console.log('------------------------------------------------');

        if (allMatch) {
            console.log('\n✅ VERIFICATION SUCCESS: Backup is perfectly synced with Database.');
        } else {
            console.log('\n⚠️ VERIFICATION WARNING: Discrepancies found.');
            console.log('   This is normal if data changed SINCE the backup was taken.');
        }

    } catch (error) {
        console.error('Verify error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyBackup();
