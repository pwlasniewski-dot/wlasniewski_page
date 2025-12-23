#!/usr/bin/env node
/**
 * Szybki reset hasła przez API emergency endpoint
 * Użycie: node scripts/quick-reset.js
 */

const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function quickReset() {
    console.log('\n🔐 Szybki Reset Hasła Admin (przez API)\n');

    const email = await question('📧 Email admina [pwlasniewski@gmail.com]: ') || 'pwlasniewski@gmail.com';
    const newPassword = await question('🔑 Nowe hasło (min 8 znaków): ');

    if (newPassword.length < 8) {
        console.log('❌ Hasło musi mieć minimum 8 znaków!');
        process.exit(1);
    }

    const masterKey = await question('🔐 Master Key [WLASNIEWSKI2024RESET]: ') || 'WLASNIEWSKI2024RESET';
    const apiUrl = await question('🌐 URL API [http://localhost:3000]: ') || 'http://localhost:3000';

    console.log('\n🔄 Wysyłanie żądania...\n');

    try {
        const response = await fetch(`${apiUrl}/api/admin/emergency-reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                newPassword,
                masterKey
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            console.log('✅ SUKCES! Hasło zostało zmienione.\n');
            console.log('📧 Email:', email);
            console.log('🔑 Nowe hasło:', newPassword);
            console.log('\n🌐 Możesz się teraz zalogować na:');
            console.log(`   ${apiUrl}/admin/login\n`);
        } else {
            console.log('❌ BŁĄD:', data.error || 'Nieznany błąd');
            console.log('Odpowiedź serwera:', data);
        }

    } catch (error) {
        console.error('❌ Błąd połączenia:', error.message);
        console.log('\n💡 Upewnij się że:');
        console.log('   1. Serwer dev działa (npm run dev)');
        console.log('   2. URL jest poprawny');
        console.log('   3. Master Key jest poprawny w .env lub kodzie\n');
    } finally {
        rl.close();
    }
}

quickReset();
