const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Rozpoczynam naprawę cen pakietów ---');

    const packages = await prisma.package.findMany();
    console.log(`Znaleziono ${packages.length} pakietów.`);

    for (const pkg of packages) {
        // Jeśli cena jest mała (prawdopodobnie w PLN, a nie w groszach), przemnażamy
        // Zakładamy, że sesja nie kosztuje 50 000 PLN (500 zł * 100)
        // Jeśli cena jest < 10000 (czyli < 100 zł jeśli to grosze), to prawdopodobnie to są całe PLN
        // Ale bezpieczniej: jeśli użytkownik wpisał np 300, to teraz chcemy 30000.
        // Jeśli już miał tam 30000, to nie chcemy mieć 3 000 000.

        // Sprawdzamy czy cena jest "podejrzanie niska" rzędu 0-5000 (czyli do 50 zł jeśli to grosze)
        // W fotografii pakiety zwykle kosztują 100+ zł.
        // Ale użytkownik wyraźnie powiedział, że widzi 3.00 zamiast 300.

        if (pkg.price < 10000) {
            const newPrice = pkg.price * 100;
            console.log(`Aktualizuję pakiet "${pkg.name}" (ID: ${pkg.id}): ${pkg.price} -> ${newPrice}`);
            await prisma.package.update({
                where: { id: pkg.id },
                data: { price: newPrice }
            });
        } else {
            console.log(`Pakiet "${pkg.name}" (ID: ${pkg.id}) ma już wysoką cenę (${pkg.price}), pomijam.`);
        }
    }

    console.log('--- Koniec naprawy ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
