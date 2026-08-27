import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { resolvePayUNotifyUrl, verifyPayUNotificationSignature } from '../../src/lib/payments/payuNotification.ts';

test('PayU notification signature requires the configured second key and exact signed body', () => {
    const body = '{"order":{"orderId":"PAYU-1","status":"COMPLETED"}}';
    const key = 'test-second-key';
    const signature = createHash('md5').update(body + key).digest('hex');
    const header = `sender=test;signature=${signature};algorithm=MD5;content=DOCUMENT`;

    assert.equal(verifyPayUNotificationSignature(header, body, key), true);
    assert.equal(verifyPayUNotificationSignature(header, `${body} `, key), false);
    assert.equal(verifyPayUNotificationSignature(header, body, ''), false);
    assert.equal(verifyPayUNotificationSignature(header.replace('MD5', 'SHA256'), body, key), false);
    assert.equal(verifyPayUNotificationSignature('signature=not-a-signature;algorithm=MD5', body, key), false);
});

test('new PayU orders always use the canonical HTTPS notification handler', () => {
    assert.equal(
        resolvePayUNotifyUrl('https://payments.example.test/api/payu/notify?secret=leak', 'https://wlasniewski.pl'),
        'https://payments.example.test/api/payu/notify',
    );
    assert.equal(
        resolvePayUNotifyUrl('https://wlasniewski.pl/api/payments/callback', 'https://wlasniewski.pl'),
        'https://wlasniewski.pl/api/payu/notify',
    );
    assert.equal(
        resolvePayUNotifyUrl('http://wlasniewski.pl/api/payu/notify', 'https://wlasniewski.pl'),
        'https://wlasniewski.pl/api/payu/notify',
    );
});
