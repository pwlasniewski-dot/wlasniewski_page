
import fs from 'fs';
import path from 'path';

async function verifyBackupContent() {
    try {
        console.log('🔍 Starting Backup Content Verification (Simulation)...');

        // 1. Find Latest Holy Backup
        const backupPath = path.join(process.cwd(), 'backups', 'data', 'latest-holy-backup.json');

        if (!fs.existsSync(backupPath)) {
            console.error('❌ No "latest-holy-backup.json" found!');
            process.exit(1);
        }

        console.log(`📂 Loading backup key file: ${backupPath}`);
        const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

        console.log('\n📊 Backup Content Report:');
        console.log('------------------------------------------------');
        console.log(`| Model Name           | Records Found |`);
        console.log('------------------------------------------------');

        const modelsToCheck = [
            'adminUser', 'user', 'setting', 'page', 'menuItem', 'blogPost',
            'portfolioSession', 'mediaLibrary', 'package', 'serviceType',
            'inquiry', 'giftCardOrder', 'droneOrder'
        ];

        let totalRecords = 0;

        for (const model of modelsToCheck) {
            const records = backupData[model];
            const count = Array.isArray(records) ? records.length : 0;
            totalRecords += count;

            console.log(`| ${model.padEnd(20)} | ${count.toString().padEnd(13)} |`);
        }

        console.log('------------------------------------------------');
        console.log(`TOTAL KEY RECORDS: ${totalRecords}`);

        // Deep check for specific critical content
        if (backupData.page && Array.isArray(backupData.page)) {
            const homePage = backupData.page.find((p: any) => p.slug === 'strona-glowna' || p.slug === '/');
            if (homePage) {
                console.log('\n✅ Found "strona-glowna" page in backup.');
            } else {
                console.warn('\n⚠️  WARNING: "strona-glowna" NOT found in backup pages.');
            }
        }

        if (backupData.adminUser && Array.isArray(backupData.adminUser)) {
            console.log(`✅ Found ${backupData.adminUser.length} admin users.`);
        }

        console.log('\n✅ SIMULATION COMPLETE: Backup file is readable and contains structured data.');

    } catch (error) {
        console.error('❌ Verify error:', error);
        process.exit(1);
    }
}

verifyBackupContent();
