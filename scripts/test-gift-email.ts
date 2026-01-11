import { sendGiftCardAccessEmail } from '../src/lib/email/giftCardAccess';
import { getSMTPConfig } from '../src/lib/email/sender';
import prisma from '../src/lib/db/prisma';

async function main() {
    console.log('📧 Testing Gift Card Email Sending...');

    // 1. Check SMTP Config
    const config = await getSMTPConfig();
    console.log('⚙️ SMTP Configuration Resolved:');
    console.log(`   Host: ${config.host}`);
    console.log(`   Port: ${config.port}`);
    console.log(`   User: ${config.user}`);
    console.log(`   From: ${config.from}`);
    console.log(`   Pass: ${config.pass ? '********' : 'MISSING'}`);

    if (!config.host || !config.user || !config.pass) {
        console.error('❌ SMTP Configuration is incomplete!');
        return;
    }

    // 2. Mock Data
    const mockCard = {
        code: 'TEST-CODE-1234',
        amount: 500.00,
        value: 500.00,
        theme: 'gold',
        card_title: 'Testowa Karta',
        card_description: 'To jest testowa karta podarunkowa.'
    };

    const recipientEmail = 'pwlasniewski@gmail.com'; // User's email from history

    console.log(`🚀 Attempting to send test email to ${recipientEmail}...`);

    try {
        await sendGiftCardAccessEmail(
            recipientEmail, // Customer Email
            'Przemysław Właśniewski', // Customer Name
            mockCard,
            'test-access-token-xyz',
            'Odbiorca Testowy', // Recipient Name
            recipientEmail, // Recipient Email (sending to same for test)
            'Nadawca Testowy', // Sender Name
            'Wszystkiego najlepszego! To jest test maila.', // Message
            12345, // Order ID
            'gold'
        );
        console.log('✅ Email sent successfully!');
    } catch (error) {
        console.error('❌ Failed to send email:', error);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
