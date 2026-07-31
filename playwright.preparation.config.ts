import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    testMatch: /preparation-guide\.(api|browser)\.spec\.ts/,
    timeout: 60_000,
    expect: { timeout: 10_000 },
    fullyParallel: false,
    workers: 1,
    reporter: [['list']],
    projects: [
        {
            name: 'api',
            testMatch: /preparation-guide\.api\.spec\.ts/,
        },
        {
            name: 'chromium',
            testMatch: /preparation-guide\.browser\.spec\.ts/,
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
