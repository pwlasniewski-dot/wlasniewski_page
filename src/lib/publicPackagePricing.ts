import prisma from '@/lib/db/prisma';

export type PublicPackageFilter = {
    serviceId?: number;
    serviceName?: string;
};

/** Monetary values from Package.price, always expressed in grosze. */
export type PublicMinimumPricesInCents = Record<string, number>;

type PriceSourcePackage = {
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

export function publicPriceLabel(pricesInCents: PublicMinimumPricesInCents, serviceName: string): string {
    const priceInCents = pricesInCents[serviceName];
    return priceInCents
        ? `od ${new Intl.NumberFormat('pl-PL', {
            minimumFractionDigits: priceInCents % 100 === 0 ? 0 : 2,
            maximumFractionDigits: 2,
        }).format(priceInCents / 100)} zł`
        : 'Aktualne pakiety i ceny';
}
