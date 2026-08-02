import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    testMatch: /(homepage|public-pricing|local-seo)\.contract\.spec\.ts/,
    timeout: 60_000,
    workers: 1,
    reporter: [['list']],
    projects: [{ name: 'contract' }],
});
