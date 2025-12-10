#!/usr/bin/env node
/**
 * Script do resetowania hasła admina
 * Użycie: node scripts/reset-admin-password.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function resetPassword() {
    console.log('\n🔐 Reset Hasła Admina\n');

    try {
        // 1. Wyświetl listę adminów
        const admins = await prisma.adminUser.findMany({
            select: { id: true, email: true, name: true }
        });

        if (admins.length === 0) {
            console.log('❌ Brak adminów w bazie danych!');
            process.exit(1);
        }

        console.log('Dostępni administratorzy:');
        admins.forEach((admin, index) => {
            console.log(`${index + 1}. ${admin.email} (${admin.name || 'Brak nazwy'})`);
        });

        // 2. Wybierz admina
        const choice = await question('\nWybierz numer admina (1-' + admins.length + '): ');
        const selectedAdmin = admins[parseInt(choice) - 1];

        if (!selectedAdmin) {
            console.log('❌ Nieprawidłowy wybór!');
            process.exit(1);
        }

        console.log(`\nWybrany admin: ${selectedAdmin.email}`);

        // 3. Wpisz nowe hasło
        const newPassword = await question('Wpisz nowe hasło (min 8 znaków): ');

        if (newPassword.length < 8) {
            console.log('❌ Hasło musi mieć minimum 8 znaków!');
            process.exit(1);
        }

        // 4. Potwierdź
        const confirm = await question(`\n⚠️  Czy na pewno chcesz zmienić hasło dla ${selectedAdmin.email}? (tak/nie): `);

        if (confirm.toLowerCase() !== 'tak') {
            console.log('❌ Anulowano.');
            process.exit(0);
        }

        // 5. Zahashuj i zapisz
        console.log('\n🔄 Hashowanie hasła...');
        const passwordHash = await bcrypt.hash(newPassword, 10);

        console.log('💾 Zapisywanie w bazie...');
        await prisma.adminUser.update({
            where: { email: selectedAdmin.email },
            data: { password_hash: passwordHash }
        });

        console.log('\n✅ Hasło zostało zmienione!');
        console.log(`📧 Email: ${selectedAdmin.email}`);
        console.log(`🔑 Nowe hasło: ${newPassword}`);
        console.log('\nMożesz się teraz zalogować na /admin/login\n');

    } catch (error) {
        console.error('\n❌ Błąd:', error.message);
    } finally {
        rl.close();
        await prisma.$disconnect();
    }
}

resetPassword();
