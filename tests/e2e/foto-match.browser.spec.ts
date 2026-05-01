import { test, expect } from '@playwright/test';

test.describe('Foto-Match landing /foto-match', () => {
    test('renders hero, FAQ, JSON-LD and waitlist form (SSR)', async ({ page }) => {
        const res = await page.goto('/foto-match');
        expect(res?.status()).toBe(200);

        // H1 — nowy hero "Wspólna fotograficzna przygoda"
        await expect(page.getByRole('heading', { level: 1 })).toContainText(/Wspólna fotograficzna/i);

        // Form pól (SSR — bez JS już są w HTML)
        await expect(page.locator('input[name="email"]')).toBeVisible();
        await expect(page.locator('select[name="role"]')).toBeVisible();
        await expect(page.locator('input[name="rules_accepted"]')).toBeAttached();

        // FAQ — co najmniej 5 pytań w <details>
        const faqCount = await page.locator('details').count();
        expect(faqCount).toBeGreaterThanOrEqual(5);

        // JSON-LD FAQPage + WebSite
        const ldScripts = await page.locator('script[type="application/ld+json"]').allTextContents();
        const types = ldScripts.flatMap((s) => {
            try {
                const j = JSON.parse(s);
                return [j['@type']].flat();
            } catch {
                return [];
            }
        });
        expect(types).toContain('FAQPage');
        expect(types).toContain('WebSite');

        // Canonical
        const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
        expect(canonical).toBeTruthy();
        expect(canonical).toMatch(/foto-match/);

        // Robots: index,follow
        const robots = await page.locator('meta[name="robots"]').getAttribute('content');
        expect(robots || '').toMatch(/index/);
    });

    test('honeypot pole jest ukryte (display:none / hidden parent)', async ({ page }) => {
        await page.goto('/foto-match');
        const hp = page.locator('input[name="website"]');
        await expect(hp).toBeAttached();
        await expect(hp).toBeHidden();
    });
});

test.describe('Foto-Match /zapis-potwierdzony', () => {
    test('bez tokenu pokazuje komunikat o braku tokenu i jest noindex', async ({ page }) => {
        await page.goto('/foto-match/zapis-potwierdzony');
        await expect(page.getByText(/Brak tokenu/i)).toBeVisible();
        const robots = await page.locator('meta[name="robots"]').getAttribute('content');
        expect(robots || '').toMatch(/noindex/);
    });
});

test.describe('Foto-Match SEO — content w surowym HTML (bez JS)', () => {
    test('cały content jest w SSR HTML — Googlebot nie potrzebuje JS', async ({ request }) => {
        // Pobieramy raw HTML, bez egzekucji JS.
        const res = await request.get('/foto-match');
        expect(res.status()).toBe(200);
        const html = await res.text();

        // H1
        expect(html).toMatch(/Wspólna fotograficzna/i);
        expect(html).toMatch(/Poznaj kogoś w niecodzienny sposób/i);
        expect(html).toMatch(/Pierwszy taki projekt w Polsce/i);
        // FAQ — kluczowe pytania w HTML
        expect(html).toMatch(/Co to właściwie jest Foto-Match/i);
        expect(html).toMatch(/Czy to jest aplikacja randkowa/i);
        expect(html).toMatch(/Bezpieczeństwo/i);
        // Trzy intencje (nowe nazwy — brak "Randka")
        expect(html).toMatch(/Wspólna przygoda/i);
        expect(html).toMatch(/Lokalna społeczność/i);
        expect(html).toMatch(/Networking kreatywny/i);
        // Anty-asercja: usunęliśmy framing "alternatywa Tindera" — nie powinno być
        expect(html).not.toMatch(/zamiast aplikacji randkowej/i);
        // How it works
        expect(html).toMatch(/Jak to działa/i);
        // Galeria stylu — captiony i disclaimer
        expect(html).toMatch(/Złota godzina/);
        expect(html).toMatch(/Bulwar Filadelfijski/);
        expect(html).toMatch(/portfolio.*Przemysława/i);
        // Sekcja bezpieczeństwa
        expect(html).toMatch(/Weryfikacja tożsamości/i);
        expect(html).toMatch(/miejsca publiczne/i);
        // JSON-LD FAQPage
        expect(html).toMatch(/"@type":"FAQPage"/);
        // Form pól w HTML (bez JS)
        expect(html).toMatch(/name="email"/);
        expect(html).toMatch(/name="rules_accepted"/);
        // Pre-launch indicator
        expect(html).toMatch(/pre-launch/i);
    });
});
