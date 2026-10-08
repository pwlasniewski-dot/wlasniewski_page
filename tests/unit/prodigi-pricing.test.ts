import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateProdigiPrice } from '../../src/lib/fulfillment/prodigi-pricing';
const base = { supplierTotal: '100.00', customerShipping: '10.00', copies: 1, marginPercent: '0' };
test('zero margin includes customer shipping once', () => assert.equal(calculateProdigiPrice(base).unitPrice, '90.00'));
test('quantity divides product revenue only; shipping charged once', () => assert.equal(calculateProdigiPrice({ ...base, copies: 3 }).unitPrice, '30.00'));
test('minimum price rounds up to grosz and applies margin to all revenue', () => assert.equal(calculateProdigiPrice({ ...base, copies: 3, marginPercent: '30' }).unitPrice, '44.29'));
test('bank percentage and fixed fee are separate cost inputs', () => assert.equal(calculateProdigiPrice({ ...base, bankFeePercent: '2', bankFeeFixed: '1' }).unitPrice, '93.07'));
test('reject impossible margins, invalid quantities and negative decimals', () => {
 for (const patch of [{ marginPercent: '100' }, { marginPercent: '99', bankFeePercent: '1' }, { copies: 0 }, { copies: 1.5 }, { supplierTotal: '-1' }, { customerShipping: '1.005' }]) assert.throws(() => calculateProdigiPrice({ ...base, ...patch }));
});
test('no negative price when customer shipping already covers cost', () => assert.equal(calculateProdigiPrice({ ...base, customerShipping: '110' }).unitPrice, '0.00'));
