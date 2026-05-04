require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
    console.log('\n=== 1. DANE KONTRAKTU OSKARA ===');
    const contract = await p.contract.findUnique({
        where: { id: 19 },
        include: {
            offer: { select: { id: true, total_price: true, title: true } },
            user: { select: { id: true, name: true, email: true } }
        }
    });
    if (!contract) { console.error('❌ Kontrakt id=19 nie istnieje!'); process.exit(1); }
    console.log('  id:', contract.id);
    console.log('  contract_number:', contract.contract_number);
    console.log('  status:', contract.status);
    console.log('  client_id:', contract.client_id);
    console.log('  offer_id:', contract.offer_id);
    console.log('  deposit_amount:', contract.deposit_amount, 'PLN');
    console.log('  deposit_due_at:', contract.deposit_due_at);
    console.log('  deposit_paid_at:', contract.deposit_paid_at, '(null = nie opłacono)');
    console.log('  deposit_note:', contract.deposit_note);
    console.log('  user:', contract.user ? `${contract.user.name} <${contract.user.email}> (id=${contract.user.id})` : '❌ BRAK USER');
    console.log('  offer.total_price:', contract.offer?.total_price, 'PLN');
    console.log('  offer.title:', contract.offer?.title);

    console.log('\n=== 2. WALIDACJA PÓL ===');
    const issues = [];
    if (!contract.deposit_amount) issues.push('❌ deposit_amount jest NULL — przyciski PayU nie wyświetlą się');
    if (!contract.offer_id) issues.push('❌ offer_id jest NULL — "Zapłać resztę" nie będzie znało total_price');
    if (!contract.offer?.total_price) issues.push('⚠️  offer.total_price = 0 — przyciski "Całość" i "Reszta" skryte');
    if (!contract.client_id) issues.push('❌ client_id jest NULL — ClientDepositPanel nie wyświetli się (brak user)');
    if (!contract.user) issues.push('❌ Brak powiązanego user — e-mail do PayU będzie pusty');

    if (issues.length === 0) {
        console.log('  ✅ Wszystkie wymagane pola są ustawione');
    } else {
        issues.forEach(i => console.log(' ', i));
    }

    console.log('\n=== 3. USTAWIENIA BANKU ===');
    const bank = await p.setting.findFirst({
        select: { bank_account_number: true, bank_account_holder: true, bank_name: true }
    });
    if (!bank?.bank_account_number) {
        console.log('  ❌ Brak numeru konta bankowego w Settings!');
    } else {
        console.log('  ✅', bank.bank_name, '/', bank.bank_account_number, '/', bank.bank_account_holder);
    }

    console.log('\n=== 4. SYMULACJA LOGIKI PRZYCISKÓW ===');
    const depositAmount = contract.deposit_amount || 0;
    const totalPrice = contract.offer?.total_price || 0;
    const remainingAmount = totalPrice > depositAmount ? totalPrice - depositAmount : 0;
    const isPaid = !!contract.deposit_paid_at;

    console.log(`  depositAmount   = ${depositAmount} PLN`);
    console.log(`  totalPrice      = ${totalPrice} PLN`);
    console.log(`  remainingAmount = ${remainingAmount} PLN`);
    console.log(`  isPaid (deposit)= ${isPaid}`);
    console.log('');
    if (!isPaid) {
        console.log(`  ✅ POKAŻE: "Zapłać zaliczkę (${depositAmount} PLN)"`);
        if (totalPrice > 0) console.log(`  ✅ POKAŻE: "Zapłać całość (${totalPrice} PLN)"`);
        else console.log(`  ⚠️  UKRYJE: "Zapłać całość" (totalPrice=0)`);
    } else {
        console.log('  ℹ️  Zaliczka już opłacona — "Zapłać zaliczkę" ukryte');
        if (remainingAmount > 0) console.log(`  ✅ POKAŻE: "Zapłać resztę (${remainingAmount} PLN)"`);
    }

    console.log('\n=== 5. SPRAWDZENIE ZMIENNYCH ŚRODOWISKOWYCH PAYU ===');
    const payuPosId = process.env.PAYU_POS_ID;
    const payuKey = process.env.PAYU_MD5_KEY;
    const payuUrl = process.env.PAYU_API_URL || process.env.NEXT_PUBLIC_PAYU_API_URL;
    console.log('  PAYU_POS_ID:', payuPosId ? '✅ ustawiony' : '❌ BRAK');
    console.log('  PAYU_MD5_KEY:', payuKey ? '✅ ustawiony' : '❌ BRAK');
    console.log('  PAYU_API_URL:', payuUrl || '(domyślny)');

    console.log('\n=== 6. SYMULACJA extOrderId ===');
    const ts = Date.now();
    console.log('  deposit  →', `CONTRACT_19_deposit_${ts}`);
    console.log('  full     →', `CONTRACT_19_full_${ts}`);
    console.log('  remaining→', `CONTRACT_19_remaining_${ts}`);

    await p.$disconnect();
    console.log('\n=== KONIEC ===');
}

main().catch(e => { console.error(e); process.exit(1); });
