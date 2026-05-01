/**
 * Idempotentny seed: dodaje "Foto-Match" do menu B2C jeśli go nie ma.
 * Zero-loss: tylko CREATE jeśli brak, nigdy UPDATE/DELETE istniejących.
 */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
    const existing = await p.menuItem.findFirst({
        where: { menu_type: 'b2c', url: '/foto-match' },
    });

    if (existing) {
        console.log('Foto-Match już w menu (id=' + existing.id + ') — skip.');
        return;
    }

    // Sprawdź konflikt po tytule (gdyby ktoś dodał ręcznie z innym url)
    const byTitle = await p.menuItem.findFirst({
        where: { menu_type: 'b2c', title: { contains: 'Foto-Match', mode: 'insensitive' } },
    });
    if (byTitle) {
        console.log('Item z tytułem Foto-Match już istnieje (id=' + byTitle.id + ', url=' + byTitle.url + ') — skip.');
        return;
    }

    const created = await p.menuItem.create({
        data: {
            title: 'Foto-Match',
            url: '/foto-match',
            menu_type: 'b2c',
            order: 9,
            is_active: true,
        },
    });
    console.log('Utworzony menu item id=' + created.id);
}

main()
    .catch((e) => { console.error('FAIL:', e); process.exit(1); })
    .finally(() => p.$disconnect());
