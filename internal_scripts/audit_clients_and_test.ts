import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('\n=== AUDYT: Klienci i testowy email ===\n');
    
    const allClients = await prisma.user.findMany({
        where: { role: 'CLIENT' },
        select: { 
            id: true, name: true, email: true, created_at: true, 
            reset_token: true, reset_token_expires: true,
            welcome_email_sent_at: true, welcome_email_count: true,
        },
        orderBy: { created_at: 'desc' }
    });
    
    console.log(`Łącznie klientów (CLIENT role): ${allClients.length}\n`);
    for (const c of allClients) {
        const tokenValid = c.reset_token_expires && new Date(c.reset_token_expires) > new Date();
        console.log(`  [${c.id}] ${c.name} <${c.email}>`);
        console.log(`      created: ${c.created_at?.toISOString().split('T')[0]} | token: ${c.reset_token ? '✓' : '✗'} | valid: ${tokenValid ? '✓' : '✗'}`);
        console.log(`      welcome_sent: ${c.welcome_email_sent_at?.toISOString().split('T')[0] || 'never'} | count: ${c.welcome_email_count}`);
    }

    const testUser = await prisma.user.findUnique({
        where: { email: 'przem091@wp.pl' }
    });
    console.log('\n=== TEST EMAIL przem091@wp.pl ===');
    if (testUser) {
        console.log(`⚠ Już istnieje: ID=${testUser.id}, role=${testUser.role}`);
        console.log('  → Aby przetestować jako "nowego klienta" trzeba go najpierw usunąć (hard delete) z panelu admina LUB zmienić email.');
    } else {
        console.log('✓ FREE - można utworzyć jako nowego klienta');
    }

    // Stats - galerie i produkty
    const albums = await prisma.nphotoAlbum.count();
    const recommendations = await prisma.offerRecommendedAlbum.count();
    console.log(`\n=== nPhoto Module ===`);
    console.log(`  Albumy w katalogu: ${albums}`);
    console.log(`  Rekomendacje (offer↔album): ${recommendations}`);

    await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
