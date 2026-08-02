import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
    loadPublicMinimumPrices,
    publicPriceLabel,
    summarizeMinimumPrices,
} from '../../src/lib/publicPackagePricing';

const root = process.cwd();

test('computes current minimums and falls back without inventing a price', async () => {
    expect(summarizeMinimumPrices([
        { price: 90000, service: { name: 'Sesja' } },
        { price: 75000, service: { name: 'Sesja' } },
        { price: 180000, service: { name: 'Ślub' } },
    ])).toEqual({ Sesja: 75000, 'Ślub': 180000 });
    expect(publicPriceLabel({ Sesja: 75000 }, 'Sesja')).toBe('od 750 zł');
    expect(publicPriceLabel({ Sesja: 75050 }, 'Sesja')).toBe('od 750,50 zł');

    const fallback = await loadPublicMinimumPrices(async () => {
        throw new Error('database unavailable');
    });
    expect(publicPriceLabel(fallback, 'Sesja')).toBe('Aktualne pakiety i ceny');
});

test('home, city pages and packages API share the public pricing helper', async () => {
    const [home, city, api, helper] = await Promise.all([
        readFile(path.join(root, 'src/app/page.tsx'), 'utf8'),
        readFile(path.join(root, 'src/app/fotograf-[city]/page.tsx'), 'utf8'),
        readFile(path.join(root, 'src/app/api/packages/route.ts'), 'utf8'),
        readFile(path.join(root, 'src/lib/publicPackagePricing.ts'), 'utf8'),
    ]);

    expect(home).toContain("from '@/lib/publicPackagePricing'");
    expect(city).toContain("from '@/lib/publicPackagePricing'");
    expect(api).toContain('findActivePublicPackages');
    expect(helper).toContain('is_active: true');
    expect(helper).toContain('service: {');
});

test('city SEO and copy contain no legacy hardcoded prices or decorated meta descriptions', async () => {
    const city = await readFile(path.join(root, 'src/app/fotograf-[city]/page.tsx'), 'utf8');
    expect(city).not.toMatch(/\b(?:400|450|500|550)\s*zł/i);
    expect(city).not.toMatch(/\b\d[\d .]*\s*zł/i);

    const descriptions = city.match(/metaDescription:\s*'[^']*'/g) || [];
    expect(descriptions.length).toBeGreaterThan(0);
    for (const description of descriptions) {
        expect(description).not.toMatch(/[★✓☎]/);
    }
});
