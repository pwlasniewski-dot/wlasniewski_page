
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const tasks = await prisma.scrumTask.findMany();
    console.log('TASKS:', JSON.stringify(tasks, null, 2));
    const bookings = await prisma.booking.findMany({ take: 5 });
    console.log('BOOKINGS:', JSON.stringify(bookings, null, 2));
}
main().finally(() => prisma.$disconnect());
