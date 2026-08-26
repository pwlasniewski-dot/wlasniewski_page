import prisma from '@/lib/db/prisma';

const DEFAULT_GROUP_PRINT_PRICE_10X15 = 150;
const DEFAULT_GROUP_PRINT_PRICE_15X21 = 250;

export async function getGroupPrintPrices() {
    const rows = await prisma.setting.findMany({
        where: {
            setting_key: { in: ['group_print_price_10x15', 'group_print_price_15x21'] },
        },
        select: { setting_key: true, setting_value: true },
    });
    const byKey = new Map(rows.map(row => [row.setting_key, row.setting_value]));
    const price10x15 = Number(byKey.get('group_print_price_10x15'));
    const price15x21 = Number(byKey.get('group_print_price_15x21'));
    return {
        price10x15: Number.isFinite(price10x15) && price10x15 > 0
            ? Math.round(price10x15)
            : DEFAULT_GROUP_PRINT_PRICE_10X15,
        price15x21: Number.isFinite(price15x21) && price15x21 > 0
            ? Math.round(price15x21)
            : DEFAULT_GROUP_PRINT_PRICE_15X21,
    };
}
