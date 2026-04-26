import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
    const u = await p.user.findUnique({ where: { email: 'przem091@wp.pl' } });
    console.log('User:', u ? { id: u.id, name: u.name, created_at: u.created_at, welcome_email_sent_at: u.welcome_email_sent_at, welcome_email_count: u.welcome_email_count } : 'NIE ISTNIEJE');

    // Sprawdź ostatnie logi EMAIL/SYSTEM
    const logs = await p.systemLog.findMany({
        where: { OR: [{ message: { contains: 'welcome' } }, { message: { contains: 'przem091' } }, { message: { contains: 'Welcome' } }] },
        orderBy: { created_at: 'desc' },
        take: 10,
    });
    console.log('\nLogi (welcome / przem091):');
    for (const l of logs) console.log(`  [${l.created_at.toISOString()}] ${l.level} ${l.module}: ${l.message}`);

    await p.$disconnect();
})();
