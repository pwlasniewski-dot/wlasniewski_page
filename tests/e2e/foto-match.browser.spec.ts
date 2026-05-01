import { test, expect } from '@playwright/test';

test.describe('Foto-Match landing /foto-match', () => {
    test('renders hero, FAQ, JSON-LD and waitlist form (SSR)', async ({ page }) => {
        const res = await page.goto('/foto-match');
        expect(res?.status()).toBe(200);

        // H1
        await expect(page.getByRole('heading', { level: 1 })).toContainText(/Poznaj kogoś/i);

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
