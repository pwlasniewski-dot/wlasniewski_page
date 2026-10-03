import assert from 'node:assert/strict';
import test from 'node:test';
import { calculatePromotionInput } from '../../src/lib/promotionEditor';

test('final price and discount amount are distinct inputs with an explicit final result', () => {
    assert.deepEqual(calculatePromotionInput(75000, 'price', '155'), { price: 15500, discountType: 'fixed', discountValue: 59500, reduction: 59500 });
    assert.deepEqual(calculatePromotionInput(75000, 'fixed', '155'), { price: 59500, discountType: 'fixed', discountValue: 15500, reduction: 15500 });
    assert.deepEqual(calculatePromotionInput(75000, 'percentage', '20'), { price: 60000, discountType: 'percentage', discountValue: 20, reduction: 15000 });
});

test('money accepts cents and rejects empty, negative, oversized and fractional percentage inputs', () => {
    assert.equal(calculatePromotionInput(75000, 'price', '600,50').price, 60050);
    for (const input of ['', '-155', '0', '750', '751', '155.999', 'NaN']) assert.throws(() => calculatePromotionInput(75000, 'price', input));
    assert.throws(() => calculatePromotionInput(75000, 'percentage', '20.5'));
    assert.throws(() => calculatePromotionInput(75000, 'fixed', '750'));
});
