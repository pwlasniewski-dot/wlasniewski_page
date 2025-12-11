const { PrismaClient } = require('@prisma/client');

async function main() {
    const prisma = new PrismaClient();
    
    // Check SMTP settings in database
    const smtpSettings = await prisma.setting.findMany({
        where: {
            setting_key: { in: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_from', 'smtp_password'] }
        }
    });
    
    console.log('📧 SMTP Settings in Database:');
    smtpSettings.forEach(s => {
        if (s.setting_key === 'smtp_password') {
            console.log(`  ${s.setting_key}: ${s.setting_value ? '[HIDDEN]' : '[NOT SET]'}`);
        } else {
            console.log(`  ${s.setting_key}: ${s.setting_value || '[NOT SET]'}`);
        }
    });
    
    console.log('\n📧 Environment Variables:');
    console.log(`  SMTP_HOST: ${process.env.SMTP_HOST || '[NOT SET]'}`);
    console.log(`  SMTP_PORT: ${process.env.SMTP_PORT || '[NOT SET]'}`);
    console.log(`  SMTP_USER: ${process.env.SMTP_USER || '[NOT SET]'}`);
    console.log(`  SMTP_FROM: ${process.env.SMTP_FROM || '[NOT SET]'}`);
    console.log(`  SMTP_PASS: ${process.env.SMTP_PASS ? '[SET]' : '[NOT SET]'}`);
    console.log(`  SMTP_PASSWORD: ${process.env.SMTP_PASSWORD ? '[SET]' : '[NOT SET]'}`);
    
    console.log('\n🌐 Base URL:');
    console.log(`  NEXT_PUBLIC_BASE_URL: ${process.env.NEXT_PUBLIC_BASE_URL || '[NOT SET]'}`);
    
    console.log('\n💳 PayU Settings:');
    const payuSettings = await prisma.setting.findMany({
        where: {
            setting_key: { in: ['payu_client_id', 'payu_pos_id', 'payu_test_mode'] }
        }
    });
    
    payuSettings.forEach(s => {
        if (s.setting_key === 'payu_client_secret') {
            console.log(`  ${s.setting_key}: [HIDDEN]`);
        } else {
            console.log(`  ${s.setting_key}: ${s.setting_value}`);
        }
    });
    
    console.log('\n📊 Gift Card Orders:');
    const orders = await prisma.giftCardOrder.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        select: {
            id: true,
            customer_email: true,
            customer_name: true,
            payment_status: true,
            created_at: true,
            stripe_session_id: true
        }
    });
    
    if (orders.length === 0) {
        console.log('  Brak zamówień kart podarunkowych');
    } else {
        orders.forEach(o => {
            console.log(`  Order #${o.id}: ${o.customer_email} - Status: ${o.payment_status} - PayU ID: ${o.stripe_session_id || 'pending'}`);
        });
    }
    
    console.log('\n📝 Recent System Logs (LAST 15):');
    const logs = await prisma.systemLog.findMany({
        take: 15,
        orderBy: { created_at: 'desc' },
        select: {
            level: true,
            module: true,
            message: true,
            created_at: true
        }
    });
    
    logs.forEach(log => {
        console.log(`  [${log.created_at.toISOString()}] ${log.level.padEnd(5)} - ${log.module.padEnd(10)} - ${log.message}`);
    });
    
    await prisma.$disconnect();
}

main().catch(console.error);
