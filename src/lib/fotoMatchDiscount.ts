export type FotoMatchRewardType = 'AMOUNT' | 'PERCENT' | 'BOTH';

export interface FotoMatchDiscountResult {
    discountGrosze: number;
    amountPartGrosze: number;
    percentPartGrosze: number;
}

export function calculateFotoMatchDiscount(input: {
    baseAmountGrosze: number;
    rewardType: unknown;
    rewardAmountGrosze: unknown;
    rewardPercent: unknown;
}): FotoMatchDiscountResult {
    const base = Number.isFinite(Number(input.baseAmountGrosze))
        ? Math.max(0, Math.round(Number(input.baseAmountGrosze)))
        : 0;
    const type = String(input.rewardType || 'AMOUNT').toUpperCase() as FotoMatchRewardType;
    const amount = Number.isFinite(Number(input.rewardAmountGrosze))
        ? Math.max(0, Math.round(Number(input.rewardAmountGrosze)))
        : 0;
    const percent = Number.isFinite(Number(input.rewardPercent))
        ? Math.max(0, Math.min(100, Number(input.rewardPercent)))
        : 0;

    const amountPartGrosze = type === 'AMOUNT' || type === 'BOTH' ? amount : 0;
    const percentPartGrosze = type === 'PERCENT' || type === 'BOTH'
        ? Math.round(base * percent / 100)
        : 0;

    return {
        discountGrosze: Math.min(base, amountPartGrosze + percentPartGrosze),
        amountPartGrosze,
        percentPartGrosze,
    };
}
