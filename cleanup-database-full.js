/**
 * FULL DATABASE CLEANUP SCRIPT
 * 
 * Usuwa WSZYSTKO z bazy danych i resetuje do stanu czystego
 * 
 * UWAGA: To jest destructive operation - wszystkie dane zostaną usunięte!
 * 
 * Użycie:
 * node cleanup-database-full.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupFullDatabase() {
    console.log('🚨 PEŁNE CZYSZCZENIE BAZY DANYCH\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log('⚠️  UWAGA: Wszystkie dane zostaną TRWALE USUNIĘTE!\n');

    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question('Wpisz "CZYSZCZĘ" aby potwierdzić: ', async (answer) => {
            rl.close();

            if (answer !== 'CZYSZCZĘ') {
                console.log('\n❌ Anulowano. Baza nie została zmieniona.');
                resolve();
                return;
            }

            console.log('\n🔄 Rozpoczynanie czyszczenia...\n');

            try {
                // Lista tabel do usunięcia (w odpowiedniej kolejności ze względu na foreign keys)
                const tablesToDelete = [
                    'PhotoChallenge',
                    'PhotoChallengePicture',
                    'Booking',
                    'Payment',
                    'Reservation',
                    'Inquiry',
                    'Package',
                    'ServiceType',
                    'GalleryFolder',
                    'GalleryImage',
                    'Hero',
                    'About',
                    'InfoBand',
                    'Testimonial',
                    'Page',
                    'Setting',
                    'ChallengeSetting',
                    'MenuItem'
                ];

                for (const table of tablesToDelete) {
                    try {
                        console.log(`⏳ Czyszczę tabelę: ${table}...`);
                        
                        // Dynamicznie usuń wszystkie rekordy
                        const deleteResult = await prisma[table[0].toLowerCase() + table.slice(1)].deleteMany({});
                        console.log(`   ✅ Usunięto ${deleteResult.count} rekordów`);
                    } catch (error) {
                        // Tabela może nie istnieć lub inny błąd
                        console.log(`   ⚠️  ${error.message}`);
                    }
                }

                console.log('\n═══════════════════════════════════════════════════════');
                console.log('✅ BAZA DANYCH WYCZYSZCZONA!\n');
                console.log('Następny krok:');
                console.log('1. Uruchom: npm run migrate');
                console.log('2. Uruchom: npm run seed (jeśli chcesz danych testowych)');
                console.log('3. Uruchom: npm run dev\n');

            } catch (error) {
                console.error('❌ Błąd podczas czyszczenia:', error);
            } finally {
                await prisma.$disconnect();
                resolve();
            }
        });
    });
}

// Run cleanup
cleanupFullDatabase().then(() => {
    process.exit(0);
});
