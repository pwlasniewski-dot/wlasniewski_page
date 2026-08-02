import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

test('legacy location pages permanently redirect to the canonical city landings', async () => {
    const legacyCity = await readFile(path.join(root, 'src/app/lokalizacje/[city]/page.tsx'), 'utf8');

    expect(legacyCity).toContain("permanentRedirect(`/fotograf-${city}`)");
    expect(legacyCity).toContain("canonical: `https://wlasniewski.pl/fotograf-${city}`");
    expect(legacyCity).not.toContain('https://wlasniewski.pl/lokalizacje/');
});

test('city landings describe services provided by the one global business entity', async () => {
    const [city, layout] = await Promise.all([
        readFile(path.join(root, 'src/app/fotograf-[city]/page.tsx'), 'utf8'),
        readFile(path.join(root, 'src/app/layout.tsx'), 'utf8'),
    ]);

    expect(city).toContain("'@type': 'Service'");
    expect(city).toContain("provider: { '@id': 'https://wlasniewski.pl/#business' }");
    expect(city).not.toContain("'#business`,");
    expect(city).not.toContain("priceRange: '$'");
    expect(layout).toContain('{ "@type": "City", "name": "Bydgoszcz" }');
    expect(layout).toContain('{ "@type": "City", "name": "Świecie" }');
    expect(layout).toContain('{ "@type": "City", "name": "Lisewo" }');
});
