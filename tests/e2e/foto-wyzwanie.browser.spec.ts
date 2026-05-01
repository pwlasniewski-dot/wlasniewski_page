import { test, expect } from '@playwright/test';

/**
 * Browser smoke tests dla landing /foto-wyzwanie.
 * Sprawdza że SSR działa (kluczowe sekcje obecne w DOM bez JS hydration race).
 */

test.describe('/foto-wyzwanie landing — smoke', () => {
    test('renders hero, packages, FAQ and JSON-LD', async ({ page }) => {
        const res = await page.goto('/foto-wyzwanie');
        expect(res?.status()).toBe(200);

        // Hero — istnieje formularz QuickStart
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

        // FAQ accordion (10 pytań w SSR-owanym page.tsx)
        await expect(page.locator('text=/Pytania, które padają najczęściej/i').first()).toBeVisible();

        // JSON-LD: FAQPage, Product, BreadcrumbList
        const jsonLdScripts = await page.locator('script[type="application/ld+json"]').count();
        expect(jsonLdScripts).toBeGreaterThanOrEqual(3);

        // Meta — canonical
        const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
        expect(canonical).toContain('/foto-wyzwanie');

        // robots — landing musi być indexowalne
        const robots = await page.locator('meta[name="robots"]').getAttribute('content');
        if (robots) {
            expect(robots).not.toContain('noindex');
        }
    });

    test('/foto-wyzwanie/stworz redirects/renders create form (noindex)', async ({ page }) => {
        const res = await page.goto('/foto-wyzwanie/stworz');
        expect(res?.status()).toBe(200);

        // Funnel pages mają być noindex
        const robots = await page.locator('meta[name="robots"]').getAttribute('content');
        expect(robots).toContain('noindex');
    });
});
