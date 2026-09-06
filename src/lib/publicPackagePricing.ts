import prisma from '@/lib/db/prisma';
import { unstable_noStore as noStore } from 'next/cache';
import { applyPublicPackagePrices } from '@/lib/packagePromotionPricing';
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
    minimumPromotions: Record<string, PublicPackagePromotion>;
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

/** Request-time pricing: an ended or scheduled promotion must not remain in ISR. */
export async function findPricedPublicPackages(filter: PublicPackageFilter = {}) {
    noStore();
    const packages = await findActivePublicPackages(filter);
    let promotions = new Map<number, PublicPackagePromotion>();
    try {
        promotions = await loadActivePromotionsForPackages(packages.map(pkg => pkg.id));
    } catch (error) {
        console.warn('[public-pricing] Promotions unavailable; using regular prices.', error);
    }
    return applyPublicPackagePrices(packages, promotions);
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
    loader: () => Promise<PriceSourcePackage[]> = findPricedPublicPackages,
): Promise<PublicMinimumPricesInCents> {
    try {
        return summarizeMinimumPrices(await loader());
    } catch (error) {
        console.warn('[public-pricing] Packages unavailable; rendering without an amount.', error);
        return {};
    }
}

/**
 * Public pricing snapshot. Promotions are additive and fail open: during the
 * migration rollout the site keeps showing regular prices instead of failing.
 */
export async function loadPublicPricingSnapshot(): Promise<PublicPricingSnapshot> {
    try {
        const packages = await findPricedPublicPackages();
        let featuredPromotions: Record<string, PublicPackagePromotion> = {};

        try {
            featuredPromotions = await loadFeaturedPromotionsByService();
        } catch (promotionError) {
            console.warn('[public-pricing] Promotions unavailable; using regular prices.', promotionError);
        }

        const minimumPrices = summarizeMinimumPrices(packages);
        const minimumPromotions: Record<string, PublicPackagePromotion> = {};
        for (const pkg of packages) {
            if (pkg.promotion && pkg.price === minimumPrices[pkg.service.name]
                && !minimumPromotions[pkg.service.name]) {
                minimumPromotions[pkg.service.name] = pkg.promotion;
            }
        }
        return {
            minimumPrices,
            minimumPromotions,
            featuredPromotions,
        };
    } catch (error) {
        console.warn('[public-pricing] Pricing snapshot unavailable.', error);
        return { minimumPrices: {}, minimumPromotions: {}, featuredPromotions: {} };
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
