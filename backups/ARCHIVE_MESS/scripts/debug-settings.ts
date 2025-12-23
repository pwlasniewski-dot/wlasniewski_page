
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking Settings in DB...');
    const settings = await prisma.setting.findMany();
    console.log('Found ' + settings.length + ' settings records.');

    settings.forEach((s, i) => {
        console.log(`\n--- Record ${i + 1} (ID: ${s.id}) ---`);
        console.log('urgency_enabled:', s.urgency_enabled);
        console.log('urgency_slots_remaining:', s.urgency_slots_remaining);
        console.log('urgency_month:', s.urgency_month);
        console.log('gift_card_promo_enabled:', s.gift_card_promo_enabled);
        console.log('updated_at:', s.updated_at);
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
