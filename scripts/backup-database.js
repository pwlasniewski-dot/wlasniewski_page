/**
 * DATABASE BACKUP SCRIPT
 * 
 * Automatycznie tworzy backup bazy danych Neon PostgreSQL
 * Uruchom przed każdym deploymentem: node scripts/backup-database.js
 */

// Load environment variables
require('dotenv').config();

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Konfiguracja
const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL not found in environment');
    process.exit(1);
}

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

async function createBackup() {
    const timestamp = new Date().toISOString().replace(/[:]/g, '-').split('.')[0];
    const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.json`);

    console.log('📦 Starting database backup...');
    console.log(`⏰ Timestamp: ${timestamp}`);

    try {
        // Użyj Prisma do exportu danych
        console.log('🔍 Fetching data from database...');

        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();

        const backup = {
            timestamp: new Date().toISOString(),
            database: 'neondb',
            tables: {}
        };

        // Lista kluczowych tabel do backup
        const tables = [
            'Page',
            'MenuItem',
            'GalleryPhoto',
            'PortfolioSession',
            'Setting',
            'Package',
            'ServiceType',
            'AdminUser',
            'ChallengeSetting'
        ];

        for (const tableName of tables) {
            const modelName = tableName.charAt(0).toLowerCase() + tableName.slice(1);

            try {
                const data = await prisma[modelName].findMany();
                backup.tables[tableName] = {
                    count: data.length,
                    data: data
                };
                console.log(`  ✅ ${tableName}: ${data.length} rows`);
            } catch (err) {
                console.log(`  ⚠️  ${tableName}: Error (${err.message})`);
                backup.tables[tableName] = {
                    count: 0,
                    error: err.message
                };
            }
        }

        // Save backup to file
        fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

        console.log('');
        console.log('✅ Backup completed successfully!');
        console.log(`📁 File: ${backupFile}`);
        console.log(`📊 Total tables: ${Object.keys(backup.tables).length}`);
        console.log('');
        console.log('🔐 BACKUP SUMMARY:');
        Object.entries(backup.tables).forEach(([table, info]) => {
            if (info.error) {
                console.log(`  ${table}: ERROR - ${info.error}`);
            } else {
                console.log(`  ${table}: ${info.count} rows`);
            }
        });

        await prisma.$disconnect();

        // Clean old backups (keep last 10)
        cleanOldBackups();

        return backupFile;

    } catch (error) {
        console.error('❌ Backup failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

function cleanOldBackups() {
    const files = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
        .map(f => ({
            name: f,
            path: path.join(BACKUP_DIR, f),
            time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time);

    // Keep only last 10 backups
    if (files.length > 10) {
        console.log(`🗑️  Cleaning old backups (keeping last 10)...`);
        files.slice(10).forEach(f => {
            fs.unlinkSync(f.path);
            console.log(`  Deleted: ${f.name}`);
        });
    }
}

// Run backup
createBackup()
    .then((file) => {
        console.log('✅ All done!');
        console.log('💾 Backup saved to:', file);
        process.exit(0);
    })
    .catch((err) => {
        console.error('❌ Fatal error:', err);
        process.exit(1);
    });
