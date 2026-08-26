import { parsePlnAmount } from '../money/pln.ts';

type OfferItemInput = { price?: unknown; quantity?: unknown; is_optional?: boolean };
type OfferSectionInput = { items?: OfferItemInput[] };

export function calculateDraftOfferTotal(
    templateData: unknown,
    sections: OfferSectionInput[] = [],
    fallback = 0,
): number {
    if (templateData && typeof templateData === 'object' && !Array.isArray(templateData)) {
        const data = templateData as Record<string, unknown>;
        const prices = Array.isArray(data.footerPrices) ? data.footerPrices : [];
        if (prices.length > 0) {
            const recommended = Number(data.recommendationColumnIndex);
            const candidates = [
                Number.isInteger(recommended) && recommended >= 0 ? recommended : -1,
                1,
                ...prices.map((_value, index) => index),
            ];
            for (const index of candidates) {
                if (index < 0 || index >= prices.length) continue;
                const price = parsePlnAmount(prices[index]);
                if (price !== null && price > 0) return price;
            }
        }
        return fallback;
    }

    return sections.reduce((sum, section) => sum + (section.items || []).reduce((inner, item) => {
        if (item.is_optional) return inner;
        const quantity = Number(item.quantity);
        return inner + (parsePlnAmount(item.price) ?? 0) * (Number.isFinite(quantity) && quantity > 0 ? quantity : 1);
    }, 0), 0);
}

export function hasUnambiguousA4Price(templateData: unknown): boolean {
    if (!templateData || typeof templateData !== 'object' || Array.isArray(templateData)) return false;
    const data = templateData as Record<string, unknown>;
    const prices = Array.isArray(data.footerPrices) ? data.footerPrices : [];
    const recommended = Number(data.recommendationColumnIndex);
    return Number.isInteger(recommended)
        && recommended > 0
        && recommended < prices.length
        && (parsePlnAmount(prices[recommended]) ?? 0) > 0;
}
