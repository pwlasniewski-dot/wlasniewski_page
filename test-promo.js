const { PrismaClient } = require('@prisma/client');

async function main() {
    const prisma = new PrismaClient();
    
    console.log('🎁 Gift Card Promo Settings:');
    const promoEnabled = await prisma.setting.findFirst({
        where: { setting_key: 'gift_card_promo_enabled' }
    });
    
    console.log(`  Enabled: ${promoEnabled?.setting_value || 'NOT SET (defaults to false)'}`);
    
    if (promoEnabled?.setting_value === 'true') {
        const promoMessages = await prisma.setting.findFirst({
            where: { setting_key: 'gift_card_promo_messages' }
        });
        
        if (promoMessages?.setting_value) {
            try {
                const messages = JSON.parse(promoMessages.setting_value);
                console.log(`  Messages: ${messages.length} message(s)`);
                messages.forEach((m, i) => {
                    console.log(`    ${i + 1}. ${m.title}`);
                });
            } catch (e) {
                console.log('  Messages: [INVALID JSON]');
            }
        } else {
            console.log('  Messages: Using defaults');
        }
    }
    
    console.log('\n📧 Checking if email was sent from admin...');
    const emailLogs = await prisma.systemLog.findMany({
        where: { module: 'EMAIL' },
        orderBy: { created_at: 'desc' },
        take: 10
    });
    
    if (emailLogs.length === 0) {
        console.log('  ⚠️ No EMAIL logs found - email may not have been sent');
    } else {
        console.log(`  Found ${emailLogs.length} email attempts:`);
        emailLogs.forEach(log => {
            console.log(`    [${log.created_at.toISOString()}] ${log.message}`);
        });
    }
    
    await prisma.$disconnect();
}

main().catch(console.error);
