import assert from 'node:assert/strict';
import test from 'node:test';
import {
    calculatePromotionalPrice,
    calculateReferenceDiscountPercent,
    effectivePackagePrice,
    isPromotionWindowActive,
    promotionAllowsAdditionalDiscount,
} from '../../src/lib/packagePromotionPricing';

test('percentage promotion is calculated from the regular package price', () => {
    assert.equal(calculatePromotionalPrice(75_000, 'percentage', 20), 60_000);
    assert.equal(calculatePromotionalPrice(75_000, 'percentage', 33), 50_250);
});

test('fixed promotion stores the discount in grosze', () => {
    assert.equal(calculatePromotionalPrice(75_000, 'fixed', 25_000), 50_000);
});

test('promotion must remain positive and lower than regular price', () => {
    assert.throws(() => calculatePromotionalPrice(75_000, 'fixed', 75_000));
    assert.throws(() => calculatePromotionalPrice(75_000, 'percentage', 0));
    assert.throws(() => calculatePromotionalPrice(75_000, 'percentage', 100));
});

test('public percentage is based on the 30-day reference, not catalogue price', () => {
    assert.equal(calculateReferenceDiscountPercent(60_000, 50_000), 17);
    assert.equal(calculateReferenceDiscountPercent(75_000, 50_000), 33);
    assert.equal(calculateReferenceDiscountPercent(50_000, 50_000), 0);
});

test('effective price uses active promotion data supplied by the trusted API', () => {
    assert.equal(effectivePackagePrice(75_000, { price: 50_000 }), 50_000);
    assert.equal(effectivePackagePrice(75_000, null), 75_000);
});

test('promotion window uses start inclusive and end exclusive', () => {
    const promotion = {
        startsAt: '2026-09-01T08:00:00.000Z',
        endsAt: '2026-09-15T08:00:00.000Z',
    };
    assert.equal(isPromotionWindowActive(promotion, new Date('2026-09-01T08:00:00.000Z')), true);
    assert.equal(isPromotionWindowActive(promotion, new Date('2026-09-15T08:00:00.000Z')), false);
});

test('additional discount is denied by default for a promoted package', () => {
    assert.equal(promotionAllowsAdditionalDiscount({ allowPromoCode: false }), false);
    assert.equal(promotionAllowsAdditionalDiscount({ allowPromoCode: true }), true);
    assert.equal(promotionAllowsAdditionalDiscount(null), true);
});
