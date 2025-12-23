
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSmtp() {
    try {
        const settings = await prisma.setting.findMany({
            where: {
                setting_key: {
                    in: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_from', 'smtp_password']
                }
            }
        });

        console.log('--- Key-Value Settings ---');
        settings.forEach(s => {
            console.log(`${s.setting_key}: ${s.setting_key === 'smtp_password' ? '***' : s.setting_value}`);
        });

        const mainSettings = await prisma.setting.findFirst({
            where: { id: 1 } // Assuming main settings are in ID 1 or first record
        });

        if (mainSettings) {
            console.log('--- Main Record Settings ---');
            console.log('smtp_host:', mainSettings.smtp_host);
            console.log('smtp_port:', mainSettings.smtp_port);
            console.log('smtp_user:', mainSettings.smtp_user);
            console.log('smtp_from:', mainSettings.smtp_from);
            console.log('smtp_password:', mainSettings.smtp_password ? '***' : 'missing');
        } else {
            console.log('No main setting record found.');
        }

    } catch (error) {
        console.error('Error checking SMTP:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkSmtp();
