#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedGiftCards() {
    console.log('🎁 Seed gift card products...\n');
    
    try {
        // Check if cards already exist
        const existingCount = await prisma.giftCard.count();
        if (existingCount > 0) {
            console.log(`✅ Already have ${existingCount} gift card products\n`);
            const cards = await prisma.giftCard.findMany({
                select: { id: true, code: true, value: true, theme: true, status: true }
            });
            cards.forEach(card => {
                console.log(`   ${card.code}: ${card.value} PLN (${card.theme}) - ${card.status}`);
            });
            await prisma.$disconnect();
            return;
        }

        // Create default gift card products
        const defaultCards = [
            { code: 'GC-100-CHRISTMAS', value: 100, theme: 'christmas', title: 'Karta Bożonarodzeniowa 100 PLN', description: 'Idealna na Święta' },
            { code: 'GC-250-CHRISTMAS', value: 250, theme: 'christmas', title: 'Karta Bożonarodzeniowa 250 PLN', description: 'Idealna na Święta' },
            { code: 'GC-500-CHRISTMAS', value: 500, theme: 'christmas', title: 'Karta Bożonarodzeniowa 500 PLN', description: 'Idealna na Święta' },
            
            { code: 'GC-100-UNIVERSAL', value: 100, theme: 'universal', title: 'Karta Universal 100 PLN', description: 'Na każdą okazję' },
            { code: 'GC-250-UNIVERSAL', value: 250, theme: 'universal', title: 'Karta Universal 250 PLN', description: 'Na każdą okazję' },
            { code: 'GC-500-UNIVERSAL', value: 500, theme: 'universal', title: 'Karta Universal 500 PLN', description: 'Na każdą okazję' },
            
            { code: 'GC-100-WEDDING', value: 100, theme: 'wedding', title: 'Karta Ślubna 100 PLN', description: 'Do prezentu ślubnego' },
            { code: 'GC-250-WEDDING', value: 250, theme: 'wedding', title: 'Karta Ślubna 250 PLN', description: 'Do prezentu ślubnego' },
            { code: 'GC-500-WEDDING', value: 500, theme: 'wedding', title: 'Karta Ślubna 500 PLN', description: 'Do prezentu ślubnego' },
        ];

        let created = 0;
        for (const cardData of defaultCards) {
            try {
                await prisma.giftCard.create({
                    data: {
                        code: cardData.code,
                        amount: cardData.value,
                        value: cardData.value,
                        theme: cardData.theme,
                        card_template: cardData.theme,
                        card_title: cardData.title,
                        card_description: cardData.description,
                        recipient_email: 'customer@example.com',
                        recipient_name: 'Customer',
                        status: 'active',
                        discount_type: 'fixed'
                    }
                });
                created++;
                console.log(`✅ Created: ${cardData.code}`);
            } catch (error) {
                console.log(`⚠️  Skipped: ${cardData.code} (${error.message})`);
            }
        }

        console.log(`\n✨ Total created: ${created} products`);
        
        // Enable shop
        await prisma.setting.upsert({
            where: { setting_key: 'gift_card_shop_enabled' },
            update: { setting_value: 'true' },
            create: { setting_key: 'gift_card_shop_enabled', setting_value: 'true' }
        });
        console.log('✅ Shop enabled');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

seedGiftCards();
