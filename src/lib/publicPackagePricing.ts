import prisma from '@/lib/db/prisma';
import {
    loadActivePromotionsForPackages,
    loadFeaturedPromotionsByService,
    type PublicPackagePromotion,
} from '@/lib/packagePromotions';

export type PublicPackageFilter = {
    serviceId?: number;
    serviceName?: string;
};

/** Monetary values from Package.price, always expressed in grosze. */
export type PublicMinimumPricesInCents = Record<string, number>;

export type PublicPricingSnapshot = {
    minimumPrices: PublicMinimumPricesInCents;
    featuredPromotions: Record<string, PublicPackagePromotion>;
};

type PriceSourcePackage = {
    id?: number;
    price: number;
    service: { name: string };
};

/** One source for packages exposed by the API and public sales pages. */
export async function findActivePublicPackages(filter: PublicPackageFilter = {}) {
    return prisma.package.findMany({
        where: {
            is_active: true,
            ...(filter.serviceId ? { service_id: filter.serviceId } : {}),
            service: {
                is_active: true,
                ...(filter.serviceName ? { name: filter.serviceName } : {}),
            },
        },
        include: { service: true },
        orderBy: [{ service_id: 'asc' }, { order: 'asc' }],
    });
}

export function summarizeMinimumPrices(packages: PriceSourcePackage[]): PublicMinimumPricesInCents {
    return packages.reduce<PublicMinimumPricesInCents>((minimums, pkg) => {
        if (!Number.isFinite(pkg.price) || pkg.price <= 0 || !pkg.service?.name) return minimums;
        const current = minimums[pkg.service.name];
        minimums[pkg.service.name] = current === undefined ? pkg.price : Math.min(current, pkg.price);
        return minimums;
    }, {});
}

export async function loadPublicMinimumPrices(
    loader: () => Promise<PriceSourcePackage[]> = findActivePublicPackages,
): Promise<PublicMinimumPricesInCents> {
    try {
        return summarizeMinimumPrices(await loader());
    } catch (error) {
        console.warn('[public-pricing] Packages unavailable; rendering without an amount.', error);
        return {};
    }
}

/**
 * Public homepage snapshot. Promotions are additive and fail open: during the
 * migration rollout the site keeps showing regular prices instead of failing.
 */
export async function loadPublicPricingSnapshot(): Promise<PublicPricingSnapshot> {
    try {
        const packages = await findActivePublicPackages();
        let activePromotions = new Map<number, PublicPackagePromotion>();
        let featuredPromotions: Record<string, PublicPackagePromotion> = {};

        try {
            [activePromotions, featuredPromotions] = await Promise.all([
                loadActivePromotionsForPackages(packages.map(pkg => pkg.id)),
                loadFeaturedPromotionsByService(),
            ]);
        } catch (promotionError) {
            console.warn('[public-pricing] Promotions unavailable; using regular prices.', promotionError);
        }

        return {
            minimumPrices: summarizeMinimumPrices(packages.map(pkg => ({
                id: pkg.id,
                price: activePromotions.get(pkg.id)?.price ?? pkg.price,
                service: pkg.service,
            }))),
            featuredPromotions,
        };
    } catch (error) {
        console.warn('[public-pricing] Pricing snapshot unavailable.', error);
        return { minimumPrices: {}, featuredPromotions: {} };
    }
}

export function publicPriceLabel(pricesInCents: PublicMinimumPricesInCents, serviceName: string): string {
    const priceInCents = pricesInCents[serviceName];
    return priceInCents
        ? `od ${new Intl.NumberFormat('pl-PL', {
            minimumFractionDigits: priceInCents % 100 === 0 ? 0 : 2,
            maximumFractionDigits: 2,
        }).format(priceInCents / 100)} zł`
        : 'Aktualne pakiety i ceny';
}
