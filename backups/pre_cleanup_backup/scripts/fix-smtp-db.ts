
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function fixSmtp() {
    console.log('--- Migrating SMTP Settings to Database (Port 465) ---');

    const host = process.env.SMTP_HOST || 'mail.wlasniewski.pl';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    const port = 465; // Force SSL

    if (!user || !pass) {
        console.error('❌ Error: Could not find SMTP_USER or SMTP_PASS in .env file.');
        console.log('Please ensure .env is readable.');
        return;
    }

    console.log(`Configuration to save:`);
    console.log(`Host: ${host}`);
    console.log(`Port: ${port}`);
    console.log(`User: ${user}`);
    console.log(`From: ${from}`);

    try {
        // Update the main settings record (assuming ID 1 or the first found)
        const setting = await prisma.setting.findFirst();

        if (setting) {
            await prisma.setting.update({
                where: { id: setting.id },
                data: {
                    smtp_host: host,
                    smtp_port: port,
                    smtp_user: user,
                    smtp_password: pass,
                    smtp_from: from
                }
            });
            console.log('✅ Updated existing settings record.');
        } else {
            // Create if not exists (unlikely given previous context)
            await prisma.setting.create({
                data: {
                    setting_key: 'main_settings', // Dummy key if needed logic requires it
                    smtp_host: host,
                    smtp_port: port,
                    smtp_user: user,
                    smtp_password: pass,
                    smtp_from: from
                }
            });
            console.log('✅ Created new settings record.');
        }

        // Also duplicate to Key-Value store if "SystemSettings" are used separately?
        // The schema has "SystemSettings" (model SystemSettings) and "Setting" (model Setting).
        // `sender.ts` uses `prisma.setting.findFirst`. So we are good.

    } catch (error) {
        console.error('❌ Database update failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixSmtp();
