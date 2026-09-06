import test from 'node:test';
import assert from 'node:assert/strict';
import { trackPhotoInquiryConversion } from '../../src/lib/analytics/photoInquiryConversion';

test('Ads measures a saved inquiry with current consent and stable deduplication ID', () => {
    const events: unknown[][] = [];
    const context = { localStorage: { getItem: () => 'accepted' }, gtag: (...args: unknown[]) => { events.push(args); } };
    assert.equal(trackPhotoInquiryConversion(123, { city_slug: 'torun' }, context), true);
    assert.deepEqual(events[0], ['event', 'conversion', { send_to: 'AW-17548893646/mNauCJy3h-YbEM67-69B', transaction_id: 'inquiry-123' }]);
    assert.equal(events.length, 2);
    for (const id of [undefined, null, '', '123', 0, -1, 1.2]) assert.equal(trackPhotoInquiryConversion(id, {}, context), false);
    assert.equal(events.length, 2);
});

test('Refused or withdrawn consent and tracking failures never break a saved inquiry', () => {
    for (const consent of ['rejected', null]) {
        assert.equal(trackPhotoInquiryConversion(123, {}, { localStorage: { getItem: () => consent }, gtag: () => { throw Error('must not call'); } }), false);
    }
    assert.equal(trackPhotoInquiryConversion(123, {}, { localStorage: { getItem: () => { throw Error('blocked storage'); } }, gtag: () => {} }), false);
    assert.equal(trackPhotoInquiryConversion(123, {}, { localStorage: { getItem: () => 'accepted' }, gtag: () => { throw Error('tracker failure'); } }), false);
});
