
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSettings() {
    try {
        const settings = await prisma.setting.findFirst();
        console.log('PayU Settings:', {
            posId: settings?.payu_merchant_pos_id || 'MISSING',
            clientId: settings?.payu_client_id || 'MISSING',
            env: settings?.payu_environment || 'MISSING'
        });
    } catch (error) {
        console.error('Error checking settings:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkSettings();
