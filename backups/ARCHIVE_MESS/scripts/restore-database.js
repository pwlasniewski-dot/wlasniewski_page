/**
 * DATABASE RESTORE SCRIPT
 * 
 * Przywraca backup bazy danych z pliku JSON
 * Użycie: node scripts/restore-database.js backups/backup-YYYY-MM-DD....json
 */

const fs = require('fs');
const path = require('path');

const backupFile = process.argv[2];

if (!backupFile) {
    console.error('❌ ERROR: Please provide backup file path');
    console.error('Usage: node scripts/restore-database.js backups/backup-XXXX.json');
    process.exit(1);
}

if (!fs.existsSync(backupFile)) {
    console.error(`❌ ERROR: Backup file not found: ${backupFile}`);
    process.exit(1);
}

async function restoreBackup() {
    console.log('📦 Loading backup file...');
    const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

    console.log(`⏰ Backup from: ${backup.timestamp}`);
    console.log(`📊 Tables to restore: ${Object.keys(backup.tables).length}`);
    console.log('');

    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    try {
        for (const [tableName, tableData] of Object.entries(backup.tables)) {
            if (tableData.error) {
                console.log(`⚠️  Skipping ${tableName} (had error in backup)`);
                continue;
            }

            const modelName = tableName.charAt(0).toLowerCase() + tableName.slice(1);

            console.log(`🔄 Restoring ${tableName} (${tableData.count} rows)...`);

            try {
                // Delete existing data
                await prisma[modelName].deleteMany({});

                // Insert backup data
                if (tableData.count > 0) {
                    await prisma[modelName].createMany({
                        data: tableData.data,
                        skipDuplicates: true
                    });
                }

                console.log(`  ✅ ${tableName}: Restored ${tableData.count} rows`);
            } catch (err) {
                console.log(`  ❌ ${tableName}: Error - ${err.message}`);
            }
        }

        await prisma.$disconnect();

        console.log('');
        console.log('✅ Restore completed!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Restore failed:', error.message);
        console.error(error.stack);
        await prisma.$disconnect();
        process.exit(1);
    }
}

restoreBackup();
