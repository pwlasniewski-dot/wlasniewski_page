#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Tworzenie testowej oferty dla v3.0 Offer Generator...\n');

    try {
        console.log('📝 Tworzenie oferty...');
        
        const offer = await prisma.offer.create({
            data: {
                slug: 'test-first-communion-' + Date.now(),
                title: 'Oferta Pierwsza Komunia Święta - Toruń',
                type: 'b2c',
                status: 'draft',
                client_email: 'testclient@example.com',
                total_price: 2500,
                valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            }
        });
        
        console.log(`✅ Oferta ID: ${offer.id}`);
        console.log(`✅ Tytuł: ${offer.title}\n`);

        console.log('═══════════════════════════════════════════════════════');
        console.log('✨ Dane testowe zostały utworzone!\n');
        console.log('📍 DANE LOGOWANIA KLIENTA:');
        console.log('═══════════════════════════════════════════════════════');
        console.log(`📧 Email: testclient@example.com`);
        console.log(`🔐 Hasło: test123456\n`);
        
        console.log('🔗 LINKI:');
        console.log('═══════════════════════════════════════════════════════');
        console.log(`🎯 Zalogowanie klienta:`);
        console.log(`   http://localhost:3000/strefa-klienta/login\n`);
        
        console.log(`📋 Podgląd oferty:`);
        console.log(`   http://localhost:3000/strefa-klienta/oferty/${offer.id}\n`);
        
        console.log(`⚙️  Panel admina - tworzenie oferty:`);
        console.log(`   http://localhost:3000/admin/offers/create\n`);
        
    } catch (error) {
        console.error('❌ Błąd:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
