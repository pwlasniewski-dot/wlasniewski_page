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

    await expect(page.getByText('Pudrowy róż', { exact: true })).toBeVisible();
    await expect(page.getByText('#D8AAA4', { exact: true })).toBeVisible();
    await expectNoHorizontalOverflow(page);
});
