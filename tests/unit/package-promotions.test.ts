import assert from 'node:assert/strict';
import test from 'node:test';
import {
    calculatePromotionalPrice,
    calculateReferenceDiscountPercent,
    effectivePackagePrice,
    isPromotionWindowActive,
    legalReferenceText,
    promotionAllowsAdditionalDiscount,
} from '../../src/lib/packagePromotionPricing';
import {
    homepagePromotionServiceNames,
    homepagePromotionSlot,
    regularPriceHistoryCoversLookback,
} from '../../src/lib/packagePromotions';

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

test('public percentage is conservative and based on the legal reference price', () => {
    assert.equal(calculateReferenceDiscountPercent(60_000, 50_000), 16);
    assert.equal(calculateReferenceDiscountPercent(75_000, 50_000), 33);
    assert.equal(calculateReferenceDiscountPercent(75_000, 74_999), 0);
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

test('public legal copy distinguishes a package offered for less than 30 days', () => {
    assert.equal(
        legalReferenceText(75_000, 'THIRTY_DAYS'),
        'Najniższa cena z 30 dni przed obniżką: 750 zł',
    );
    assert.equal(
        legalReferenceText(75_000, 'SINCE_OFFERING'),
        'Najniższa cena od rozpoczęcia oferowania: 750 zł',
    );
});

test('migration baseline becomes sufficient after the complete observed window', () => {
    const lookback = new Date('2026-10-01T12:00:00.000Z');
    assert.equal(regularPriceHistoryCoversLookback([{
        valid_from: new Date('2026-09-01T12:00:00.000Z'),
        valid_to: null,
    }], lookback), true);
    assert.equal(regularPriceHistoryCoversLookback([{
        valid_from: new Date('2026-10-15T12:00:00.000Z'),
        valid_to: null,
    }], lookback), false);
});

test('birthdays and receptions share one homepage promotion slot', () => {
    assert.equal(homepagePromotionSlot('Urodziny'), 'events');
    assert.equal(homepagePromotionSlot('Przyjęcie'), 'events');
    assert.deepEqual(homepagePromotionServiceNames('Urodziny'), ['Urodziny', 'Przyjęcie', 'Przyjecie']);
    assert.deepEqual(homepagePromotionServiceNames('Sesja'), ['Sesja']);
});
