#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Tworzenie testowych danych dla v3.0 Offer Generator...\n');

    try {
        console.log('1️⃣  Tworzenie testowej oferty...');

        // 2. Utwórz ofertę dla testowego klienta
        console.log('2️⃣  Tworzenie oferty...');
        
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
        
        console.log(`   ✅ Oferta ID: ${offer.id}`);
        console.log(`   📋 Tytuł: ${offer.title}\n`);

        // 3. Dodaj sekcje do oferty
        console.log('3️⃣  Dodawanie sekcji do oferty...');
        
        const section1 = await prisma.offerSection.create({
            data: {
                offer_id: offer.id,
                title: 'Pakiet Klasyczny',
                description: '2 fotografów, do 300 zdjęć',
                order: 1,
                items: {
                    create: [
                        {
                            name: 'Czas sesji',
                            description: '4 godziny',
                            order: 1,
                            quantity: 1,
                            unit_price: 800
                        },
                        {
                            name: 'Liczba fotografów',
                            description: '2 profesjonalistów',
                            order: 2,
                            quantity: 2,
                            unit_price: 400
                        },
                        {
                            name: 'Liczba zdjęć',
                            description: 'Do 300 zdjęć',
                            order: 3,
                            quantity: 300,
                            unit_price: 2
                        }
                    ]
                }
            },
            include: {
                items: true
            }
        });

        console.log(`   ✅ Sekcja 1: ${section1.title} (${section1.items.length} pozycji)\n`);

        // 4. Dodaj drugą sekcję
        const section2 = await prisma.offerSection.create({
            data: {
                offer_id: offer.id,
                title: 'Pakiet Premium',
                description: '3 fotografów, do 500 zdjęć + album premium',
                order: 2,
                items: {
                    create: [
                        {
                            name: 'Czas sesji',
                            description: '6 godzin',
                            order: 1,
                            quantity: 1,
                            unit_price: 1200
                        },
                        {
                            name: 'Liczba fotografów',
                            description: '3 profesjonalistów',
                            order: 2,
                            quantity: 3,
                            unit_price: 500
                        },
                        {
                            name: 'Album premium',
                            description: 'Twarda okładka, 150 stron',
                            order: 3,
                            quantity: 1,
                            unit_price: 400
                        }
                    ]
                }
            },
            include: {
                items: true
            }
        });

        console.log(`   ✅ Sekcja 2: ${section2.title} (${section2.items.length} pozycji)\n`);

        console.log('✨ Dane testowe zostały utworzone!\n');
        console.log('═══════════════════════════════════════════════════════');
        console.log('📍 DANE LOGOWANIA KLIENTA:');
        console.log('═══════════════════════════════════════════════════════');
        console.log(`Email: ${client.email}`);
        console.log(`Hasło: test123456`);
        console.log('\n🔗 Przejdź tutaj aby się zalogować:');
        console.log('http://localhost:3000/strefa-klienta/login\n');
        console.log('📋 Po zalogowaniu zobacz ofertę:');
        console.log(`http://localhost:3000/strefa-klienta/oferty/${offer.id}\n`);
        
    } catch (error) {
        console.error('❌ Błąd:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
