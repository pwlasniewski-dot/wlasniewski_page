import { calculatePromotionalPrice, type PromotionDiscountType } from './packagePromotionPricing';

export type PromotionInputMode = 'price' | 'percentage' | 'fixed';

/** The default input is the final price; the API still stores a discount. */
export function calculatePromotionInput(regularPrice: number, mode: PromotionInputMode, input: string) {
    const text = input.trim().replace(',', '.');
    if (!/^\d+(?:\.\d{1,2})?$/.test(text)) throw new Error('Wpisz dodatnią kwotę, maksymalnie z dwoma miejscami po przecinku.');
    const value = Number(text);
    const discountType: PromotionDiscountType = mode === 'percentage' ? 'percentage' : 'fixed';
    if (mode === 'percentage' && !Number.isInteger(value)) throw new Error('Wpisz rabat jako pełny procent.');
    const amount = Math.round(value * 100);
    const discountValue = mode === 'price' ? regularPrice - amount : mode === 'percentage' ? value : amount;
    const price = calculatePromotionalPrice(regularPrice, discountType, discountValue);
    return { price, discountType, discountValue, reduction: regularPrice - price };
}
