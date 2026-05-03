/**
 * Naprawa pilna:
 *  1) Zapisuje numer konta (mBank) w Settings — żeby był w mailach i nowych umowach.
 *  2) Linkuje umowę UMW-B2C-2026-010 (id=18) z ofertą 68 (Oskar Liszaj).
 *  3) Podstawia wszystkie placeholdery {{...}} w treści umowy 18.
 *  4) Wymusza regenerację PDF na S3 (PUT /api/admin/contracts/18/save-s3 zrobi to przy następnej zmianie,
 *     ale tu od razu uruchamiamy generator i wgrywamy plik).
 *
 * Uruchom: node internal_scripts/fix_contract_18_and_bank.js
 */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const BANK_ACCOUNT = '97 1140 2004 0000 3202 8378 2010';
const BANK_HOLDER = 'FOTO-DRON Przemysław Właśniewski';
const BANK_NAME = 'mBank';

function fmtDatePL(d) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
}

(async () => {
    // 1) Zapisz numer konta — w modelu Setting (key/value, ale pola bank_* są globalne na każdym rekordzie). Aktualizujemy WSZYSTKIE wiersze żeby findFirst() zawsze zwrócił zaktualizowane.
    const updated = await p.setting.updateMany({
        data: {
            bank_account_number: BANK_ACCOUNT,
            bank_account_holder: BANK_HOLDER,
            bank_name: BANK_NAME,
        },
    });
    console.log(`OK: Settings — numer konta zapisany na ${updated.count} wierszach.`);

    // 2) Pobierz umowę i ofertę
    const contract = await p.contract.findUnique({
        where: { contract_number: 'UMW-B2C-2026-010' },
        include: { user: true },
    });
    if (!contract) { console.error('Brak umowy 010'); process.exit(1); }

    const offer = await p.offer.findUnique({ where: { id: 68 } });
    if (!offer) { console.error('Brak oferty 68'); process.exit(1); }

    // 3) Połącz umowę z ofertą (offer_id ma unique constraint — sprawdzimy najpierw czy nie zajęte)
    const existing = await p.contract.findUnique({ where: { offer_id: 68 } }).catch(() => null);
    if (existing && existing.id !== contract.id) {
        console.warn(`Oferta 68 już ma umowę id=${existing.id}, nie nadpisuję offer_id w 18.`);
    } else if (!contract.offer_id) {
        await p.contract.update({ where: { id: contract.id }, data: { offer_id: 68 } });
        console.log('OK: Umowa 18 powiązana z ofertą 68.');
    }

    // 4) Pełna podmiana placeholderów w treści
    const td = offer.template_data || {};
    const sel = offer.client_selection || {};
    const ctx = {
        contractNumber: contract.contract_number,
        currentDate: new Date().toLocaleDateString('pl-PL'),
        clientName: contract.user?.name || offer.client_email || '',
        clientEmail: contract.user?.email || offer.client_email || '',
        clientPhone: contract.user?.phone || td.contactPhone || '',
        clientAddress: '',
        offerTitle: offer.title || '',
        eventDate: fmtDatePL(offer.session_date || td.eventDate),
        eventTime: offer.session_time || td.sessionTime || td.eventTime || '',
        eventLocation: offer.session_location || td.eventLocation || '',
        eventCount: (sel.childCount ? String(sel.childCount) : '') || (td.eventCount || ''),
        eventTeam: td.eventTeam || '',
        totalPrice: String(sel.totalPrice || offer.total_price || 0),
        depositAmount: String(contract.deposit_amount || 0),
        depositDueDate: contract.deposit_due_at ? new Date(contract.deposit_due_at).toLocaleDateString('pl-PL') : '',
        deliveryDays: '21',
        packageDetails: sel.selectedPackage ? `**Wybrany pakiet:** ${sel.selectedPackage.name}` : '',
        workshopPlan: '',
        bankAccount: BANK_ACCOUNT,
        bankHolder: BANK_HOLDER,
        bankName: BANK_NAME,
    };

    // Dorzuć wzmiankę o numerze konta zaraz po sekcji STRONY UMOWY (jeżeli jeszcze brak)
    let content = contract.content || '';
    if (!content.includes('Numer konta')) {
        content = content.replace(
            /(\*\*Wykonawca:\*\* FOTO-DRON[^\n]*\n)/,
            `$1Numer konta (${BANK_NAME}): **${BANK_ACCOUNT}** — odbiorca: ${BANK_HOLDER}\n`
        );
    }
    const newContent = content.replace(/\{\{(\w+)\}\}/g, (_m, k) => {
        const v = ctx[k];
        return v == null || v === '' ? '' : String(v);
    });

    await p.contract.update({
        where: { id: contract.id },
        data: { content: newContent, session_location: offer.session_location || contract.session_location },
    });
    console.log('OK: Treść umowy 18 podmieniona, placeholdery zastąpione.');

    // 5) Regeneruj PDF na S3 (używa naszego serwisu)
    try {
        const { generateContractPDF } = require('../src/lib/services/pdf');
        const { uploadToS3 } = require('../src/lib/storage/s3');
        const fresh = await p.contract.findUnique({
            where: { id: contract.id },
            include: { offer: { include: { user: true } }, user: true },
        });
        const buf = await generateContractPDF(fresh, false);
        const key = `contracts/umowa_${fresh.contract_number}.pdf`;
        const url = await uploadToS3(buf, key, 'application/pdf');
        await p.contract.update({ where: { id: contract.id }, data: { pdf_url: url } });
        console.log('OK: PDF zregenerowany i wgrany do S3:', url);
    } catch (e) {
        console.warn('Nie udało się zregenerować PDF z poziomu skryptu (prawdopodobnie brakuje TS runtime). Zrób to z panelu admina przyciskiem "Zapisz i zregeneruj PDF".');
        console.warn(e.message);
    }

    await p.$disconnect();
})();
