import { getSMTPConfig } from '@/lib/email/sender';
import prisma from '@/lib/db/prisma';

async function verifyEmailConfig() {
    console.log('🔍 Checking Email Configuration...');

    // 1. Raw DB check
    const settings = await prisma.setting.findFirst({ orderBy: { id: 'asc' } });
    console.log('DB Record (SMTP Columns):', {
        host: settings?.smtp_host,
        port: settings?.smtp_port,
        user: settings?.smtp_user,
        pass: settings?.smtp_password ? '******' : '(empty)',
        from: settings?.smtp_from
    });

    // 2. Logic check
    const config = await getSMTPConfig();
    console.log('Resolved Configuration (sender.ts logic):', {
        host: config.host,
        port: config.port,
        user: config.user,
        pass: config.pass ? '******' : '(empty)',
        from: config.from
    });

    if (!config.host || !config.user || !config.pass) {
        console.error('❌ Configuration INVALID. Emails will NOT send.');
    } else {
        console.log('✅ Configuration appears valid (syntax only).');
    }
}

verifyEmailConfig()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
