import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { generateGiftCardEmail } from '../../src/lib/email/giftCardTemplate.ts';
import { buildVoucherPrintDocument } from '../../src/lib/gift-cards/voucherPrintDocument.ts';

function source(relativePath: string) {
    return readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8');
}

const voucher = {
    code: 'RODZINA26',
    value: 500,
    theme: 'green',
    recipientName: 'Michał i Zuzia',
    senderName: 'Bliscy',
    message: 'Wspólny czas i fotografie na lata.',
    cardTitle: 'Voucher podarunkowy',
    cardDescription: 'Sesja rodzinna',
};

test('print layout supports a service voucher without disclosing its internal value', () => {
    const html = buildVoucherPrintDocument({ ...voucher, showPrice: false }, 'https://wlasniewski.pl');

    assert.match(html, /Dla Michał i Zuzia/);
    assert.match(html, /Sesja fotograficzna/);
    assert.match(html, /RODZINA26/);
    assert.doesNotMatch(html, /500 zł/);
    assert.match(html, /Drukuj \/ zapisz PDF/);
    assert.match(html, /voucher-logo\.svg/);
    assert.match(html, /WWW\.WLASNIEWSKI\.PL/);
    assert.doesNotMatch(html, /wlasniewski\.pl\/rezerwacja/);
    assert.doesNotMatch(html, /background:#090909/);
});

test('print layout shows the amount only when administrator enables it', () => {
    const html = buildVoucherPrintDocument({ ...voucher, showPrice: true }, 'https://wlasniewski.pl');
    assert.match(html, /500 zł/);
});

test('print layout escapes editable customer fields', () => {
    const html = buildVoucherPrintDocument({ ...voucher, recipientName: '<script>alert(1)</script>' }, 'https://wlasniewski.pl');
    assert.doesNotMatch(html, /<script>alert/);
    assert.match(html, /&lt;script&gt;alert/);
});

test('email follows the same price visibility and escapes personalized copy', () => {
    const email = generateGiftCardEmail(
        '<b>Michał i Zuzia</b>',
        'RODZINA26',
        500,
        'green',
        'Bliscy',
        '<script>alert(1)</script>',
        undefined,
        'Voucher podarunkowy',
        'Sesja rodzinna',
        { showPrice: false, validUntil: '2027-08-29' },
    );

    assert.doesNotMatch(email, /500 zł/);
    assert.doesNotMatch(email, /<script>alert/);
    assert.match(email, /&lt;script&gt;alert/);
    assert.match(email, /Voucher ważny do: 29\.08\.2027/);
});

test('admin flow stores price visibility and permits personal pickup without an email', () => {
    const schema = source('prisma/schema.prisma');
    const route = source('src/app/api/gift-cards/route.ts');
    const admin = source('src/app/admin/gift-cards/page.tsx');
    const sidebar = source('src/components/admin/Sidebar.tsx');

    assert.match(schema, /show_price\s+Boolean\s+@default\(true\)/);
    assert.match(route, /recipient_email: data\.recipientEmail \|\| null/);
    assert.match(route, /show_price: data\.showPrice/);
    assert.match(admin, /Zapisz i drukuj \/ PDF/);
    assert.match(admin, /Pokaż cenę/);
    assert.match(sidebar, /Studio voucherów/);
});
