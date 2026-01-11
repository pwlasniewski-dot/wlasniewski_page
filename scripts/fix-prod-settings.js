
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

async function main() {
    console.log('--- PRODUCTION SETTINGS REPAIR ---');

    // Load .env.production
    const envPath = path.join(process.cwd(), '.env.production');
    if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath, override: true });
    } else {
        console.error('.env.production not found');
        process.exit(1);
    }

    const prisma = new PrismaClient();

    // Credentials retrieved from local .env
    const SMTP_CONFIG = {
        smtp_host: "smtp.gmail.com", // Corrected hostname based on standard Gmail use
        smtp_port: 587,
        smtp_user: "pwlasniewski@gmail.com",
        smtp_password: "mdbo vfyq trip denj",
        smtp_from: "pwlasniewski@gmail.com"
    };

    try {
        console.log('Updating SMTP settings in production...');

        // Try to find the main settings record first
        const existing = await prisma.setting.findFirst();

        if (existing) {
            console.log(`Found existing settings (ID: ${existing.id}). Updating...`);
            const result = await prisma.setting.update({
                where: { id: existing.id },
                data: SMTP_CONFIG
            });
            console.log('Update successful:', result.smtp_host);
        } else {
            console.log('No settings found. Creating new record...');
            const result = await prisma.setting.create({
                data: {
                    setting_key: "main_settings",
                    ...SMTP_CONFIG
                }
            });
            console.log('Creation successful:', result.smtp_host);
        }

    } catch (e) {
        console.error('Update failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
