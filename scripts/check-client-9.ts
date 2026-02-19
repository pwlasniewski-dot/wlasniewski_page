import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkClient9() {
    console.log('--- CHECKING CLIENT ID 9 ---');
    try {
        const userId = 9;
        const client = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (client) {
            console.log('Client found:', JSON.stringify(client, null, 2));

            // Safe model detection from common names
            const modelsToCheck = [
                { key: 'booking', field: 'user_id' },
                { key: 'order', field: 'user_id' },
                { key: 'giftCardOrder', field: 'user_id' },
                { key: 'clientGallery', field: 'client_id' },
                { key: 'offer', field: 'client_id' },
                { key: 'photoBasket', field: 'user_id' } // Changed 'basket' to 'photoBasket' to match original
            ];

            const results: any = {};
            for (const m of modelsToCheck) {
                if ((prisma as any)[m.key]) {
                    try {
                        const count = await (prisma as any)[m.key].count({
                            where: { [m.field]: userId }
                        });
                        results[m.key] = count;
                    } catch (e) {
                        results[m.key] = 'error';
                    }
                }
            }

            console.log('Related counts:', results);
        } else {
            console.log('Client ID 9 not found.');
        }
    } catch (e: any) {
        console.error('Error checking client 9:', e.message);
    }
}

checkClient9()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
