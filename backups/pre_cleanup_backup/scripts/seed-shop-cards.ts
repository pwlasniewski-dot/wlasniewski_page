
import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

async function seedShopCards() {
    try {
        // Create a standard Christmas card product
        await prisma.giftCard.create({
            data: {
                code: `TMPL-${nanoid(6)}`,
                value: 200,
                amount: 200,
                theme: 'christmas',
                card_template: 'standard',
                card_title: 'Świąteczna Karta Podarunkowa',
                card_description: 'Idealny prezent pod choinkę',
                status: 'active',
                is_active: true,
                currency: 'PLN'
            }
        });

        await prisma.giftCard.create({
            data: {
                code: `TMPL-${nanoid(6)}`,
                value: 500,
                amount: 500,
                theme: 'birthday',
                card_template: 'gold',
                card_title: 'Urodzinowa Niespodzianka',
                card_description: 'Złota karta na wyjątkowe okazje',
                status: 'active',
                is_active: true,
                currency: 'PLN'
            }
        });

        console.log('Seeded gift card templates successfully.');
    } catch (error) {
        console.error('Error seeding cards:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedShopCards();
