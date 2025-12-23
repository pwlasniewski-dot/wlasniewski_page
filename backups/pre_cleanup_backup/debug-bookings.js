const { PrismaClient } = require('@prisma/client');

async function main() {
    const prisma = new PrismaClient();
    
    const bookings = await prisma.booking.findMany({
        orderBy: { created_at: 'desc' },
        take: 5
    });
    
    console.log('Recent bookings:');
    console.log(JSON.stringify(bookings, (key, value) => {
        if (key === 'id' || key === 'created_at' || key === 'updated_at') return value;
        if (typeof value === 'object' && value instanceof Date) return value.toISOString();
        return value;
    }, 2));
    
    await prisma.$disconnect();
}

main().catch(console.error);
