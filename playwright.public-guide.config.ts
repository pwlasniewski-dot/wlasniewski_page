import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    testMatch: /public-guide\.render\.spec\.tsx/,
    timeout: 60_000,
    fullyParallel: false,
    workers: 1,
    reporter: [['list']],
    projects: [{ name: 'render' }],
});
