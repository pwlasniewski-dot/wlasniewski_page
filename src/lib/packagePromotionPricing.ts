export type PromotionDiscountType = 'percentage' | 'fixed';
export type PromotionReferenceSource = 'AUTO_HISTORY' | 'ADMIN_CONFIRMED';

export type PublicPackagePromotion = {
    id: number;
    packageId: number;
    packageName: string;
    serviceName: string;
    label: string;
    discountType: PromotionDiscountType;
    /** Percentage points or grosze, depending on discountType. */
    discountValue: number;
    /** Regular package price captured when the promotion was created, in grosze. */
    regularPrice: number;
    /** Effective promotional package price, in grosze. */
    price: number;
    /** Lowest price from the 30 days before the reduction, in grosze. */
    lowestPrice30d: number;
    referenceSource: PromotionReferenceSource;
    startsAt: string;
    endsAt: string | null;
    allowPromoCode: boolean;
    showOnHome: boolean;
    /** Displayed reduction calculated against lowestPrice30d. */
    displayDiscountPercent: number;
    legalText: string;
};

export function calculatePromotionalPrice(
    regularPrice: number,
    discountType: PromotionDiscountType,
    discountValue: number,
): number {
    if (!Number.isInteger(regularPrice) || regularPrice <= 0) {
        throw new Error('Cena regularna musi być dodatnią liczbą całkowitą w groszach.');
    }
    if (!Number.isInteger(discountValue) || discountValue <= 0) {
        throw new Error('Wartość obniżki musi być dodatnią liczbą całkowitą.');
    }
    if (discountType === 'percentage' && discountValue >= 100) {
        throw new Error('Obniżka procentowa musi być mniejsza niż 100%.');
    }

    const result = discountType === 'percentage'
        ? regularPrice - Math.floor(regularPrice * discountValue / 100)
        : regularPrice - discountValue;

    if (result <= 0 || result >= regularPrice) {
        throw new Error('Cena promocyjna musi być niższa od ceny regularnej i większa od zera.');
    }
    return result;
}

export function calculateReferenceDiscountPercent(referencePrice: number, promotionalPrice: number): number {
    if (!Number.isInteger(referencePrice) || referencePrice <= 0) return 0;
    if (!Number.isInteger(promotionalPrice) || promotionalPrice <= 0 || promotionalPrice >= referencePrice) return 0;
    return Math.max(1, Math.round((1 - promotionalPrice / referencePrice) * 100));
}

export function isPromotionWindowActive(
    promotion: Pick<PublicPackagePromotion, 'startsAt' | 'endsAt'>,
    now = new Date(),
): boolean {
    const startsAt = new Date(promotion.startsAt);
    const endsAt = promotion.endsAt ? new Date(promotion.endsAt) : null;
    if (Number.isNaN(startsAt.getTime()) || startsAt > now) return false;
    return !endsAt || (!Number.isNaN(endsAt.getTime()) && endsAt > now);
}

export function effectivePackagePrice(
    regularPrice: number,
    promotion?: Pick<PublicPackagePromotion, 'price'> | null,
): number {
    return promotion?.price && Number.isInteger(promotion.price) && promotion.price > 0
        ? promotion.price
        : regularPrice;
}

export function promotionAllowsAdditionalDiscount(
    promotion?: Pick<PublicPackagePromotion, 'allowPromoCode'> | null,
): boolean {
    return !promotion || promotion.allowPromoCode === true;
}

export function formatPricePln(priceInCents: number): string {
    if (!Number.isFinite(priceInCents)) return '—';
    return `${new Intl.NumberFormat('pl-PL', {
        minimumFractionDigits: priceInCents % 100 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
    }).format(priceInCents / 100)} zł`;
}
