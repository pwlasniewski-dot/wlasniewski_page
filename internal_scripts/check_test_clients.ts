import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('\n=== STAN BAZY KLIENTÓW PRZED ZMIANAMI ===\n');
    
    // Wszyscy klienci
    const allClients = await prisma.user.findMany({
        where: { role: 'CLIENT' },
        select: { 
            id: true, 
            name: true, 
            email: true, 
            created_at: true, 
            reset_token: true,
            reset_token_expires: true,
        },
        orderBy: { created_at: 'desc' }
    });
    
    console.log(`Łącznie klientów: ${allClients.length}\n`);
    
    for (const c of allClients) {
        const hasToken = !!c.reset_token;
        const tokenValid = c.reset_token_expires && new Date(c.reset_token_expires) > new Date();
        console.log(`[${c.id}] ${c.name} <${c.email}>`);
        console.log(`    utworzony: ${c.created_at?.toISOString()}`);
        console.log(`    reset_token: ${hasToken ? '✓' : '✗'} | ważny: ${tokenValid ? '✓' : '✗'}`);
    }
    
    // Czy istnieje przem091@wp.pl?
    const testUser = await prisma.user.findUnique({
        where: { email: 'przem091@wp.pl' }
    });
    
    console.log('\n=== TESTOWY EMAIL przem091@wp.pl ===');
    if (testUser) {
        console.log(`⚠ Już istnieje: ID=${testUser.id}, name=${testUser.name}, role=${testUser.role}`);
    } else {
        console.log('✓ Nie istnieje - można testować jako nowy klient');
    }
    
    // Galerie
    const galleries = await prisma.clientGallery.count();
    console.log(`\n=== GALERIE: ${galleries} ===`);
    
    // Produkty galerii
    const products = await prisma.galleryProduct.count();
    console.log(`=== PRODUKTY GALERII: ${products} ===`);
    
    // Oferty
    const offers = await prisma.offer.count();
    console.log(`=== OFERTY: ${offers} ===`);
    
    await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
