import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PromotionPriceBlock from '../../src/components/promotions/PromotionPriceBlock';
import { applyPublicPackagePrices, type PublicPackagePromotion } from '../../src/lib/packagePromotionPricing';
import { summarizeMinimumPrices } from '../../src/lib/publicPackagePricing';
import { selectPublicReviews, summarizeGoogleReviews, googleReviewSummaryLabel } from '../../src/lib/public-reviews';

const promotion: PublicPackagePromotion = {
    id: 1, packageId: 1, packageName: 'Rodzinny Start', serviceName: 'Sesja', label: 'Promocja',
    discountType: 'fixed', discountValue: 15000, regularPrice: 75000, price: 60000,
    lowestPrice30d: 75000, referenceSource: 'ADMIN_CONFIRMED', referencePeriod: 'THIRTY_DAYS',
    startsAt: '2026-09-01T19:24:00.000Z', endsAt: '2026-10-01T19:19:00.000Z',
    allowPromoCode: false, showOnHome: false, displayDiscountPercent: 20,
    legalText: 'Najniższa cena z 30 dni przed obniżką: 750 zł',
};

test('minimum price follows the active booking promotion, regardless of homepage feature flag', () => {
    const packages = [{ id: 1, price: 75000, service: { name: 'Sesja' } }, { id: 2, price: 98000, service: { name: 'Sesja' } }];
    const active = applyPublicPackagePrices(packages, new Map([[1, promotion]]), new Date('2026-09-06'));
    assert.deepEqual(summarizeMinimumPrices(active), { Sesja: 60000 });
    assert.equal(active[0].regular_price, 75000);
    assert.equal(packages[0].price, 75000);
    for (const date of ['2026-09-01T19:23:59Z', promotion.endsAt!]) {
        const inactive = applyPublicPackagePrices(packages, new Map([[1, promotion]]), new Date(date));
        assert.deepEqual(summarizeMinimumPrices(inactive), { Sesja: 75000 });
        assert.equal(inactive[0].promotion, null);
    }
});

test('public promotion render retains exact price, reference price and Warsaw end time', () => {
    const html = renderToStaticMarkup(React.createElement(PromotionPriceBlock, { promotion, variant: 'compact' }));
    assert.match(html, /600 zł/);
    assert.match(html, /Najniższa cena z 30 dni przed obniżką: 750 zł/);
    assert.match(html, /21:19/);
    assert.match(html, /data-package-id="1"/);
});

test('Google summary uses all Google reviews and never counts Facebook as Google', () => {
    const reviews = [
        { id: 1, client_name: 'A', testimonial_text: 'A', source: 'Google', rating: 5, is_featured: true, display_order: -1 },
        { id: 2, client_name: 'B', testimonial_text: 'B', source: 'Google', rating: 3, is_featured: false },
        { id: 3, client_name: 'C', testimonial_text: 'C', source: 'Facebook', rating: 5, show_on_booking_page: true },
    ];
    const summary = summarizeGoogleReviews(reviews)!;
    assert.deepEqual(summary, { source: 'Google', count: 2, rating: 4 });
    assert.equal(googleReviewSummaryLabel(summary), 'Google · 4,0/5 · 2 opinie');
    assert.deepEqual(selectPublicReviews(reviews).map(x => x.id), [1]);
    assert.deepEqual(selectPublicReviews(reviews, 'booking').map(x => x.id), [3]);
    assert.equal(summarizeGoogleReviews([reviews[2]]), null);
});
