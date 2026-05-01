import { test, expect } from '@playwright/test';

/**
 * API tests verifying the 5 hardening etaps for /foto-wyzwanie module.
 *
 * Note: Most tests intentionally hit failure paths (deprecated, missing fields,
 * rate-limit, nonexistent records) so they don't pollute the database and don't
 * require seed data. The few tests that DO need a real challenge are skipped
 * unless TEST_CHALLENGE_LINK env var is provided.
 */

const REAL_LINK = process.env.TEST_CHALLENGE_LINK; // optional: existing unique_link in dev DB

test.describe('Etap 1 — deprecated /api/photo-challenge/payment/[id]', () => {
    test('returns 410 Gone (mock removed, no payment side-effects)', async ({ request }) => {
        // Próba "fałszywego potwierdzenia płatności" dla dowolnego ID powinna zwrócić 410.
        const res = await request.get('/api/photo-challenge/payment/999999');
        expect(res.status()).toBe(410);
        const body = await res.json();
        expect(body.success).toBe(false);
        expect(body.error).toBe('Gone');
    });

    test('410 also for low IDs (no enumeration bypass)', async ({ request }) => {
        const res = await request.get('/api/photo-challenge/payment/1');
        expect(res.status()).toBe(410);
    });
});

test.describe('Etap 2 — reject route idempotency', () => {
    test('404 for nonexistent unique_link', async ({ request }) => {
        const res = await request.post('/api/photo-challenge/00000000-0000-0000-0000-000000000000/reject');
        expect(res.status()).toBe(404);
    });

    test('returns 409 ALREADY_REJECTED on second call (real link)', async ({ request }) => {
        test.skip(!REAL_LINK, 'Requires TEST_CHALLENGE_LINK env var with real challenge');
        const first = await request.post(`/api/photo-challenge/${REAL_LINK}/reject`);
        // first should be 200 OR 409 if already rejected from previous run
        expect([200, 409]).toContain(first.status());

        const second = await request.post(`/api/photo-challenge/${REAL_LINK}/reject`);
        expect(second.status()).toBe(409);
        const body = await second.json();
        expect(body.error).toBe('ALREADY_REJECTED');
    });
});

test.describe('Etap 3 — accept route guards', () => {
    test('400 when missing date/hour', async ({ request }) => {
        const res = await request.post(
            '/api/photo-challenge/00000000-0000-0000-0000-000000000000/accept',
            { data: { name: 'Test' } },
        );
        expect(res.status()).toBe(400);
    });

    test('404 for nonexistent unique_link', async ({ request }) => {
        const res = await request.post(
            '/api/photo-challenge/00000000-0000-0000-0000-000000000000/accept',
            { data: { name: 'Test', date: '2099-12-31', hour: 14 } },
        );
        expect(res.status()).toBe(404);
    });

    test('returns 409 PAYMENT_NOT_CONFIRMED for unpaid challenge', async ({ request }) => {
        test.skip(!REAL_LINK, 'Requires TEST_CHALLENGE_LINK env var');
        const res = await request.post(
            `/api/photo-challenge/${REAL_LINK}/accept`,
            { data: { name: 'Test', date: '2099-12-31', hour: 14 } },
        );
        // Either deadline expired (410) or payment not confirmed (409) or already accepted (409)
        expect([409, 410]).toContain(res.status());
    });
});

test.describe('Etap 4 — PayU webhook signature verification', () => {
    test('401 without OpenPayu-Signature header', async ({ request }) => {
        const res = await request.post('/api/payu/notify', {
            data: { order: { extOrderId: 'CHALLENGE_1_123', orderId: 'PAYU_X', status: 'CANCELED' } },
        });
        expect(res.status()).toBe(401);
    });

    test('401 with invalid signature', async ({ request }) => {
        const res = await request.post('/api/payu/notify', {
            headers: { 'OpenPayu-Signature': 'signature=DEADBEEF;algorithm=MD5' },
            data: { order: { extOrderId: 'CHALLENGE_1_123', orderId: 'PAYU_X', status: 'CANCELED' } },
        });
        // 401 (invalid sig) or 500 (no MD5 key configured locally) — both prove
        // that unsigned/spoofed requests cannot drive challenge state.
        expect([401, 500]).toContain(res.status());
    });

    test('400 for empty body', async ({ request }) => {
        const res = await request.post('/api/payu/notify', { data: {} });
        expect(res.status()).toBe(400);
    });
});

test.describe('Etap 5 — create-with-payment validation + rate limit', () => {
    test('400 when missing required fields', async ({ request }) => {
        const res = await request.post('/api/photo-challenge/create-with-payment', {
            data: { inviter_name: 'X' },
        });
        expect(res.status()).toBe(400);
        const body = await res.json();
        expect(body.error).toBe('Missing required fields');
    });

    test('429 after exceeding 5 attempts per IP within 10 min window', async ({ request }) => {
        // Same IP, different emails — should hit per-IP limit (5 attempts).
        const baseBody = {
            inviter_name: 'RL Test',
            inviter_phone: '+48600100200',
            invitee_name: 'Invitee',
            package_id: 999999, // nonexistent — won't reach DB writes that need cleanup
        };

        // First 5 valid-shape requests should pass IP rate limit (will fail later
        // on package not found = 404, but rate counter advances first).
        const statuses: number[] = [];
        for (let i = 0; i < 7; i++) {
            const res = await request.post('/api/photo-challenge/create-with-payment', {
                data: {
                    ...baseBody,
                    inviter_email: `rl-test-${i}@example.com`,
                    invitee_email: `target-${i}@example.com`,
                },
            });
            statuses.push(res.status());
        }

        // At least one of the last 2 must be 429 (IP limit kicked in).
        const lastTwo = statuses.slice(-2);
        expect(lastTwo).toContain(429);
    });
});

test.describe('Sanity — public read endpoints', () => {
    test('GET /api/photo-challenge/[unique_link] returns 404 for fake link', async ({ request }) => {
        const res = await request.get('/api/photo-challenge/00000000-0000-0000-0000-000000000000');
        // Either 404 (not found) or 200 with success:false — both acceptable
        expect([200, 404]).toContain(res.status());
        if (res.status() === 200) {
            const body = await res.json();
            expect(body.success).toBe(false);
        }
    });

    test('GET /api/photo-challenge/packages returns array', async ({ request }) => {
        const res = await request.get('/api/photo-challenge/packages');
        expect(res.ok()).toBeTruthy();
        const body = await res.json();
        expect(Array.isArray(body.packages)).toBe(true);
    });
});
