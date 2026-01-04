
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function restoreSettings() {
    console.log('⚙️ Restoring Production Settings...');

    try {
        const backupPath = path.join(process.cwd(), 'production_settings_backup.json');

        if (!fs.existsSync(backupPath)) {
            throw new Error('Backup file not found: ' + backupPath);
        }

        const content = fs.readFileSync(backupPath, 'utf-8');
        const backup = JSON.parse(content);
        const s = backup.settings;

        if (!s) throw new Error('Invalid backup format: missing settings object');

        console.log(`Found settings for: ${s.site_title}`);
        console.log(`SMTP Host: ${s.smtp_host}`);

        await prisma.setting.upsert({
            where: { setting_key: 'main_settings' },
            update: {
                site_title: s.site_title,
                contact_email: s.contact_email,
                contact_phone: s.contact_phone,
                smtp_host: s.smtp_host,
                smtp_port: s.smtp_port,
                smtp_user: s.smtp_user,
                smtp_password: s.smtp_password,
                payu_pos_id: s.payu_pos_id,
                payu_merchant_pos_id: s.payu_merchant_pos_id,
                payu_md5_key: s.payu_md5_key,
                payu_client_id: s.payu_client_id,
                payu_client_secret: s.payu_client_secret,
                payu_environment: s.payu_environment,
                p24_pos_id: s.p24_pos_id,
                p24_crc_key: s.p24_crc_key,
                p24_api_key: s.p24_api_key,
                google_analytics_id: s.google_analytics_id
            },
            create: {
                setting_key: 'main_settings',
                site_title: s.site_title,
                contact_email: s.contact_email,
                contact_phone: s.contact_phone,
                smtp_host: s.smtp_host,
                smtp_port: s.smtp_port,
                smtp_user: s.smtp_user,
                smtp_password: s.smtp_password,
                payu_pos_id: s.p24_pos_id, // Fallback mapping if payu keys missing in creation
                payu_merchant_pos_id: s.payu_merchant_pos_id,
                payu_md5_key: s.payu_md5_key,
                payu_client_id: s.payu_client_id,
                payu_client_secret: s.payu_client_secret,
                payu_environment: s.payu_environment,
                p24_pos_id: s.p24_pos_id,
                p24_crc_key: s.p24_crc_key,
                p24_api_key: s.p24_api_key,
                google_analytics_id: s.google_analytics_id
            }
        });

        console.log('✅ Settings restored successfully!');

    } catch (e) {
        console.error('❌ Error restoring settings:', e);
    }
}

restoreSettings()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
