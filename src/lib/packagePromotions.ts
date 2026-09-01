import { Prisma } from '@prisma/client';
import prisma from '@/lib/db/prisma';

import {
    calculateReferenceDiscountPercent,
    formatPricePln,
    type PublicPackagePromotion,
} from '@/lib/packagePromotionPricing';

export {
    calculatePromotionalPrice,
    calculateReferenceDiscountPercent,
    formatPricePln,
    type PromotionDiscountType,
    type PromotionReferenceSource,
    type PublicPackagePromotion,
} from '@/lib/packagePromotionPricing';

type PromotionDb = Pick<typeof prisma, '$queryRaw' | '$executeRaw'> | Prisma.TransactionClient;

type PromotionRow = {
    id: number;
    package_id: number;
    package_name: string;
    package_order: number;
    service_name: string;
    service_order: number;
    discount_type: string;
    discount_value: number;
    regular_price_snapshot: number;
    promotional_price: number;
    lowest_price_30d: number;
    lowest_price_source: string;
    label: string;
    starts_at: Date;
    ends_at: Date | null;
    allow_promo_code: boolean;
    show_on_home: boolean;
};

type PriceHistoryRow = {
    price: number;
    valid_from: Date;
    valid_to: Date | null;
    verified: boolean;
};

type PriorPromotionRow = {
    promotional_price: number;
};

function toDate(value: Date | string): Date {
    return value instanceof Date ? value : new Date(value);
}

function basePromotionSelect() {
    return Prisma.sql`
        SELECT
            pp."id",
            pp."package_id",
            p."name" AS "package_name",
            p."order" AS "package_order",
            st."name" AS "service_name",
            st."order" AS "service_order",
            pp."discount_type",
            pp."discount_value",
            pp."regular_price_snapshot",
            pp."promotional_price",
            pp."lowest_price_30d",
            pp."lowest_price_source",
            pp."label",
            pp."starts_at",
            pp."ends_at",
            pp."allow_promo_code",
            pp."show_on_home"
        FROM "package_promotions" pp
        INNER JOIN "packages" p ON p."id" = pp."package_id"
        INNER JOIN "service_types" st ON st."id" = p."service_id"
    `;
}

export function toPublicPackagePromotion(record: PromotionRow): PublicPackagePromotion {
    const startsAt = toDate(record.starts_at);
    const endsAt = record.ends_at ? toDate(record.ends_at) : null;
    const lowestPrice30d = Number(record.lowest_price_30d);
    const promotionalPrice = Number(record.promotional_price);

    return {
        id: Number(record.id),
        packageId: Number(record.package_id),
        packageName: record.package_name,
        serviceName: record.service_name,
        label: record.label || 'Promocja',
        discountType: record.discount_type === 'fixed' ? 'fixed' : 'percentage',
        discountValue: Number(record.discount_value),
        regularPrice: Number(record.regular_price_snapshot),
        price: promotionalPrice,
        lowestPrice30d,
        referenceSource: record.lowest_price_source === 'AUTO_HISTORY'
            ? 'AUTO_HISTORY'
            : 'ADMIN_CONFIRMED',
        startsAt: startsAt.toISOString(),
        endsAt: endsAt?.toISOString() || null,
        allowPromoCode: record.allow_promo_code === true,
        showOnHome: record.show_on_home === true,
        displayDiscountPercent: calculateReferenceDiscountPercent(lowestPrice30d, promotionalPrice),
        legalText: `Najniższa cena z 30 dni przed obniżką: ${formatPricePln(lowestPrice30d)}`,
    };
}

export async function loadActivePromotionsForPackages(
    packageIds: number[],
    now = new Date(),
    db: PromotionDb = prisma,
): Promise<Map<number, PublicPackagePromotion>> {
    const ids = Array.from(new Set(packageIds.filter(id => Number.isInteger(id) && id > 0)));
    if (ids.length === 0) return new Map();

    const rows = await db.$queryRaw<PromotionRow[]>(Prisma.sql`
        ${basePromotionSelect()}
        WHERE pp."package_id" IN (${Prisma.join(ids)})
          AND pp."is_enabled" = TRUE
          AND pp."starts_at" <= ${now}
          AND (pp."ends_at" IS NULL OR pp."ends_at" > ${now})
          AND p."is_active" = TRUE
          AND st."is_active" = TRUE
        ORDER BY pp."package_id" ASC, pp."starts_at" DESC, pp."id" DESC
    `);

    const result = new Map<number, PublicPackagePromotion>();
    for (const row of rows) {
        const packageId = Number(row.package_id);
        if (!result.has(packageId)) result.set(packageId, toPublicPackagePromotion(row));
    }
    return result;
}

export async function loadActivePromotionForPackage(
    packageId: number,
    now = new Date(),
    db: PromotionDb = prisma,
): Promise<PublicPackagePromotion | null> {
    return (await loadActivePromotionsForPackages([packageId], now, db)).get(packageId) || null;
}

export async function loadFeaturedPromotionsByService(
    now = new Date(),
    db: PromotionDb = prisma,
): Promise<Record<string, PublicPackagePromotion>> {
    const rows = await db.$queryRaw<PromotionRow[]>(Prisma.sql`
        ${basePromotionSelect()}
        WHERE pp."is_enabled" = TRUE
          AND pp."show_on_home" = TRUE
          AND pp."starts_at" <= ${now}
          AND (pp."ends_at" IS NULL OR pp."ends_at" > ${now})
          AND p."is_active" = TRUE
          AND st."is_active" = TRUE
        ORDER BY st."order" ASC, p."order" ASC, pp."starts_at" DESC, pp."id" DESC
    `);

    return rows.reduce<Record<string, PublicPackagePromotion>>((result, row) => {
        if (!result[row.service_name]) result[row.service_name] = toPublicPackagePromotion(row);
        return result;
    }, {});
}

export type LowestPriceResolution = {
    completeHistory: boolean;
    lowestPrice: number | null;
    lookbackStartsAt: Date;
    candidates: Array<{ kind: 'REGULAR' | 'PROMOTION'; price: number }>;
};

export async function resolveLowestPriceBeforePromotion(
    packageId: number,
    promotionStartsAt: Date,
    db: PromotionDb = prisma,
    excludePromotionId?: number,
): Promise<LowestPriceResolution> {
    const lookbackStartsAt = new Date(promotionStartsAt.getTime() - 30 * 24 * 60 * 60 * 1000);
    const exclude = excludePromotionId
        ? Prisma.sql`AND pp."id" <> ${excludePromotionId}`
        : Prisma.empty;

    const [regularHistory, promotionHistory] = await Promise.all([
        db.$queryRaw<PriceHistoryRow[]>(Prisma.sql`
            SELECT "price", "valid_from", "valid_to", "verified"
            FROM "package_price_history"
            WHERE "package_id" = ${packageId}
              AND "valid_from" < ${promotionStartsAt}
              AND ("valid_to" IS NULL OR "valid_to" > ${lookbackStartsAt})
            ORDER BY "valid_from" ASC
        `),
        db.$queryRaw<PriorPromotionRow[]>(Prisma.sql`
            SELECT pp."promotional_price"
            FROM "package_promotions" pp
            WHERE pp."package_id" = ${packageId}
              AND pp."is_enabled" = TRUE
              AND pp."starts_at" < ${promotionStartsAt}
              AND (pp."ends_at" IS NULL OR pp."ends_at" > ${lookbackStartsAt})
              ${exclude}
        `),
    ]);

    const completeHistory = regularHistory.some(row => {
        const validFrom = toDate(row.valid_from);
        const validTo = row.valid_to ? toDate(row.valid_to) : null;
        return row.verified === true
            && validFrom <= lookbackStartsAt
            && (!validTo || validTo > lookbackStartsAt);
    });

    const candidates: LowestPriceResolution['candidates'] = [
        ...regularHistory.map(row => ({ kind: 'REGULAR' as const, price: Number(row.price) })),
        ...promotionHistory.map(row => ({ kind: 'PROMOTION' as const, price: Number(row.promotional_price) })),
    ].filter(row => Number.isInteger(row.price) && row.price > 0);

    return {
        completeHistory,
        lowestPrice: candidates.length ? Math.min(...candidates.map(item => item.price)) : null,
        lookbackStartsAt,
        candidates,
    };
}
