
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugSMTP() {
    console.log('📧 Debugging SMTP Settings...');

    try {
        const settings = await prisma.setting.findFirst({
            where: { setting_key: 'main_settings' }
        });

        if (settings) {
            console.log('✅ Settings Record Found');
            console.log('   Host:', settings.smtp_host);
            console.log('   Port:', settings.smtp_port);
            console.log('   User:', settings.smtp_user);
            console.log('   From:', settings.smtp_from);
            console.log('   Password Set:', settings.smtp_password ? 'YES (Length: ' + settings.smtp_password.length + ')' : 'NO');
        } else {
            console.error('❌ No "main_settings" record found in database!');
        }

    } catch (e) {
        console.error('❌ Error reading settings:', e);
    }
}

debugSMTP()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
