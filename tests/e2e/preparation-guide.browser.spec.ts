import { expect, test, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';

const markup = execFileSync(
    process.execPath,
    [
        join(process.cwd(), 'node_modules', 'tsx', 'dist', 'cli.mjs'),
        join(process.cwd(), 'tests', 'helpers', 'renderPreparationGuide.ts'),
    ],
    { cwd: process.cwd(), encoding: 'utf8' }
);

const cssPromise = postcss([
    tailwindcss({
        content: [
            {
                raw: [
                    markup,
                    'min-h-screen bg-zinc-950 p-4 text-zinc-100 sm:p-8',
                ].join(' '),
                extension: 'html',
            },
        ],
    }),
]).process('@tailwind base; @tailwind components; @tailwind utilities;', { from: undefined });

async function openGuide(page: Page) {
    const css = (await cssPromise).css;
    await page.setContent(`
        <!doctype html>
        <html lang="pl">
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>${css}</style>
            </head>
            <body class="min-h-screen bg-zinc-950 p-4 text-zinc-100 sm:p-8">
                <main>${markup}</main>
            </body>
        </html>
    `);
}

async function expectNoHorizontalOverflow(page: Page) {
    expect(await page.evaluate(() => ({
        document: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        body: document.body.scrollWidth <= document.body.clientWidth,
    }))).toEqual({ document: true, body: true });
}

test('preparation guide reflows at 320 px and keeps full color labels', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await openGuide(page);

    await expect(page.getByRole('heading', { name: 'Palety kolorów' })).toBeVisible();
    await expect(page.getByText('Pudrowy róż', { exact: true })).toBeVisible();
    await expect(page.getByText('#D8AAA4', { exact: true })).toBeVisible();
    await expect(page.getByText('Toruń — Stare Miasto', { exact: true })).toBeVisible();
    await expect(page.getByText('4 osób', { exact: true })).toBeVisible();
    const wardrobeTab = page.getByRole('button', { name: 'Jak się ubrać' });
    const posesTab = page.getByRole('button', { name: 'Pozy' });
    await expect(wardrobeTab).toBeVisible();
    await expect(posesTab).toBeVisible();
    await expect(wardrobeTab).toHaveAttribute('aria-pressed', 'true');
    await expect(posesTab).toHaveAttribute('aria-pressed', 'false');
    for (const tab of [wardrobeTab, posesTab]) {
        const metrics = await tab.evaluate((element) => {
            const style = getComputedStyle(element);
            const bounds = element.getBoundingClientRect();
            return {
                fontSize: Number.parseFloat(style.fontSize),
                fontWeight: Number.parseInt(style.fontWeight, 10),
                height: bounds.height,
            };
        });
        expect(metrics.fontSize).toBeGreaterThanOrEqual(16);
        expect(metrics.fontWeight).toBeGreaterThanOrEqual(700);
        expect(metrics.height).toBeGreaterThanOrEqual(44);
    }
    const paletteCards = page.locator('[data-palette-card]');
    await expect(paletteCards).toHaveCount(7);
    await expect(page.getByRole('heading', { name: 'Miasto: cegła, beton i szkło' })).toBeVisible();
    await expect(paletteCards.locator('img')).toHaveCount(7);
    const firstCard = await paletteCards.nth(0).boundingBox();
    const secondCard = await paletteCards.nth(1).boundingBox();
    expect(firstCard).not.toBeNull();
    expect(secondCard).not.toBeNull();
    expect(Math.abs(secondCard!.x - firstCard!.x)).toBeLessThan(2);
    expect(secondCard!.y).toBeGreaterThan(firstCard!.y + firstCard!.height - 2);
    const descriptionSize = await paletteCards.nth(0).locator('p').evaluate(
        (element) => Number.parseFloat(getComputedStyle(element).fontSize)
    );
    const hexSize = await page.getByText('#F3E8D5', { exact: true }).evaluate(
        (element) => Number.parseFloat(getComputedStyle(element).fontSize)
    );
    expect(descriptionSize).toBeGreaterThanOrEqual(16);
    expect(hexSize).toBeGreaterThanOrEqual(14);
    await expectNoHorizontalOverflow(page);

    const colorLabelFits = await page.getByText('Pudrowy róż', { exact: true }).evaluate(
        (element) => element.scrollWidth <= element.clientWidth
    );
    expect(colorLabelFits).toBe(true);
});

test('preparation guide has no horizontal overflow at 200% zoom', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 900 });
    await openGuide(page);
    await page.evaluate(() => {
        document.body.style.zoom = '2';
    });

    await expect(page.getByRole('button', { name: 'Jak się ubrać' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Pozy' })).toBeVisible();
    await expect(page.locator('[data-palette-card] img')).toHaveCount(7);
    const colorLabel = page.getByText('Pudrowy róż', { exact: true });
    await expect(colorLabel).toBeAttached();
    await expect(page.getByText('#D8AAA4', { exact: true })).toBeAttached();
    expect(await colorLabel.evaluate((element) => {
        const style = getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    })).toBe(true);
    await expectNoHorizontalOverflow(page);
});
