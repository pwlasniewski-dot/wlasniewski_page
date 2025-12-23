
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSettings() {
    try {
        const existing = await prisma.setting.findFirst();
        if (existing) {
            await prisma.setting.update({
                where: { id: existing.id },
                data: {
                    payu_merchant_pos_id: '300746', // Public sandbox POS ID from PayU docs
                    payu_client_id: '300746',
                    payu_client_secret: 'c8d4b7ac61758704f38ed5564d8c0ac0', // Public sandbox secret
                    payu_md5_key: 'b30ec12b5d4e5f033100234567890123', // Dummy
                    payu_environment: 'sandbox',
                    payu_notify_url: 'http://localhost:3000/api/payu/notify'
                }
            });
        } else {
            await prisma.setting.create({
                data: {
                    setting_key: 'main_config',
                    payu_merchant_pos_id: '300746',
                    payu_client_id: '300746',
                    payu_client_secret: 'c8d4b7ac61758704f38ed5564d8c0ac0',
                    payu_md5_key: 'b30ec12b5d4e5f033100234567890123',
                    payu_environment: 'sandbox',
                    payu_notify_url: 'http://localhost:3000/api/payu/notify'
                }
            });
        }
        console.log('Seeded PayU settings.');
    } catch (error) {
        console.error('Error seeding settings:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedSettings();
