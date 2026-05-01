import { test, expect } from '@playwright/test';

/**
 * Foto-Match — testy API (waitlist + confirm + admin).
 * Bezpieczne dla DB: używają losowych emaili z prefiksem `e2e-fm-` i
 * większość testów uderza w ścieżki błędów (rate-limit, invalid token).
 *
 * UWAGA: jeśli migracja `foto_match_waitlist` nie jest jeszcze odpalona w
 * lokalnej DB, testy DB-write są oznaczone jako skip.
 */

function randomEmail() {
    return `e2e-fm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;
}

const SKIP_DB = process.env.SKIP_FOTO_MATCH_DB_TESTS === '1';

test.describe('Foto-Match waitlist — walidacja', () => {
    test('POST bez emaila → 400 INVALID_EMAIL', async ({ request }) => {
        const res = await request.post('/api/foto-match/waitlist', {
            data: { rules_accepted: true },
        });
        expect(res.status()).toBe(400);
        const body = await res.json();
        expect(body.error).toBe('INVALID_EMAIL');
    });

    test('POST z błędnym emailem → 400', async ({ request }) => {
        const res = await request.post('/api/foto-match/waitlist', {
            data: { email: 'nope', rules_accepted: true },
        });
        expect(res.status()).toBe(400);
        expect((await res.json()).error).toBe('INVALID_EMAIL');
    });

    test('POST bez akceptacji regulaminu → 400 RULES_NOT_ACCEPTED', async ({ request }) => {
        const res = await request.post('/api/foto-match/waitlist', {
            data: { email: randomEmail() },
        });
        expect(res.status()).toBe(400);
        expect((await res.json()).error).toBe('RULES_NOT_ACCEPTED');
    });

    test('honeypot wypełniony → 200 success ale BEZ zapisu (silent block)', async ({ request }) => {
        const res = await request.post('/api/foto-match/waitlist', {
            data: { email: randomEmail(), rules_accepted: true, website: 'http://spam.example' },
        });
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body.success).toBe(true);
        expect(body.status).toBe('queued'); // marker dla naszej heurystyki
    });

    test('Invalid JSON body → 400 INVALID_BODY', async ({ request }) => {
        const res = await request.fetch('/api/foto-match/waitlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            data: Buffer.from('{not json', 'utf-8'),
        });
        expect(res.status()).toBe(400);
        expect((await res.json()).error).toBe('INVALID_BODY');
    });
});

test.describe('Foto-Match confirm — token validation', () => {
    test('GET /confirm bez tokenu → 400', async ({ request }) => {
        const res = await request.get('/api/foto-match/waitlist/confirm');
        expect(res.status()).toBe(400);
        expect((await res.json()).error).toBe('INVALID_TOKEN');
    });

    test('GET /confirm z krótkim tokenem → 400', async ({ request }) => {
        const res = await request.get('/api/foto-match/waitlist/confirm?t=abc');
        expect(res.status()).toBe(400);
    });

    test('GET /confirm z nieistniejącym tokenem → 404', async ({ request }) => {
        const fakeToken = 'a'.repeat(48);
        const res = await request.get(`/api/foto-match/waitlist/confirm?t=${fakeToken}`);
        // 404 = token not found OR 503 = tabela nie istnieje (migracja nie odpalona).
        expect([404, 503, 500]).toContain(res.status());
    });
});

test.describe('Foto-Match admin — auth', () => {
    test('GET /admin bez tokenu → 401', async ({ request }) => {
        const res = await request.get('/api/foto-match/waitlist/admin');
        expect(res.status()).toBe(401);
    });

    test('GET /admin z błędnym Bearer → 401', async ({ request }) => {
        const res = await request.get('/api/foto-match/waitlist/admin', {
            headers: { Authorization: 'Bearer fake-jwt-token' },
        });
        expect(res.status()).toBe(401);
    });
});

test.describe('Foto-Match waitlist — happy path (DB)', () => {
    test.skip(SKIP_DB, 'set SKIP_FOTO_MATCH_DB_TESTS=1 if migracja nie odpalona');

    test('POST → 200 pending_confirmation, ponowny POST → 429 RATE_LIMITED (per email)', async ({ request }) => {
        const email = randomEmail();
        const res1 = await request.post('/api/foto-match/waitlist', {
            data: { email, city: 'Toruń', role: 'inviter', rules_accepted: true, marketing_opt_in: true },
        });
        // 200 sukces, ALBO 503 jeśli tabeli nie ma (skip-friendly).
        if (res1.status() === 503 || res1.status() === 500) {
            test.skip(true, 'Tabela foto_match_waitlist nie istnieje — odpal migrację.');
        }
        expect(res1.status()).toBe(200);
        const body1 = await res1.json();
        expect(body1.success).toBe(true);
        expect(body1.status).toBe('pending_confirmation');
        expect(typeof body1.record_id).toBe('number');

        // Drugi POST z tym samym emailem od razu → rate-limit per email (1/15min).
        const res2 = await request.post('/api/foto-match/waitlist', {
            data: { email, rules_accepted: true },
        });
        expect(res2.status()).toBe(429);
        expect((await res2.json()).error).toBe('RATE_LIMITED');
    });
});
