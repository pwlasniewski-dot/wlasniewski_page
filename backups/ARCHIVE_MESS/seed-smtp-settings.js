#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedSmtp() {
    console.log('\n🔧 INITIALIZING SMTP SETTINGS FROM .env\n');

    // Get SMTP values from environment
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM;

    if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom) {
        console.log('❌ ERROR: SMTP configuration incomplete in .env');
        console.log('   Required: SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM');
        process.exit(1);
    }

    try {
        // Save each SMTP setting
        const settings = {
            smtp_host: smtpHost,
            smtp_port: smtpPort || '465',
            smtp_user: smtpUser,
            smtp_password: smtpPass,
            smtp_from: smtpFrom
        };

        for (const [key, value] of Object.entries(settings)) {
            await prisma.setting.upsert({
                where: { setting_key: key },
                update: { setting_value: value },
                create: { setting_key: key, setting_value: value }
            });
            console.log(`✅ ${key}: ${key === 'smtp_password' ? '***HIDDEN***' : value}`);
        }

        console.log('\n✅ SMTP settings successfully saved to database\n');
        console.log('Email system is now ready:');
        console.log('- Email verification will work correctly');
        console.log('- Gift card orders can send confirmation emails');
        console.log('- Photo challenge invitations can be sent via email\n');

    } catch (error) {
        console.error('❌ Error saving SMTP settings:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

seedSmtp();
