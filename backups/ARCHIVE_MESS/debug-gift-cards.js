const { PrismaClient } = require('@prisma/client');

async function main() {
    const prisma = new PrismaClient();
    
    const orders = await prisma.giftCardOrder.findMany({
        select: {
            id: true,
            customer_email: true,
            customer_name: true,
            access_token: true,
            payment_status: true,
            created_at: true,
            paid_at: true
        },
        orderBy: { created_at: 'desc' },
        take: 10
    });
    
    console.log('Gift Card Orders:');
    console.log(JSON.stringify(orders, null, 2));
    
    await prisma.$disconnect();
}

main().catch(console.error);
