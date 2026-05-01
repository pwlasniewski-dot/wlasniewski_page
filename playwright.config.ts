import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config — testy E2E modułu Foto Wyzwanie.
 *
 * Strategia:
 *  - Większość testów to API-level (request context) — szybkie, bez przeglądarki,
 *    bez seedu DB. Sprawdzamy bezpieczeństwo i walidację route'ów.
 *  - Jeden smoke browser test na landing /foto-wyzwanie.
 *
 * Uruchomienie:
 *   npm run test:e2e            (headless)
 *   npm run test:e2e -- --ui    (UI mode)
 *
 * Wymaga lokalnego dev servera — Playwright auto-startuje `next dev`.
 */
export default defineConfig({
    testDir: './tests/e2e',
    timeout: 60_000,
    expect: { timeout: 10_000 },
    fullyParallel: false, // rate-limit test wymaga sekwencyjności
    workers: 1,
    reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
    use: {
        baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'api',
            testMatch: /.*\.api\.spec\.ts/,
        },
        {
            name: 'chromium',
            testMatch: /.*\.browser\.spec\.ts/,
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        timeout: 180_000,
        reuseExistingServer: true,
        stdout: 'ignore',
        stderr: 'pipe',
    },
});
