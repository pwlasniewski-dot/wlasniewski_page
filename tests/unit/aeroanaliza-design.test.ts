import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('Aero public pages use the independent light renderer', () => {
    for (const path of ['src/app/b2b/page.tsx', 'src/app/b2b/[slug]/page.tsx']) {
        const source = read(path);
        assert.match(source, /AeroPageRenderer/);
        assert.doesNotMatch(source, /import PageRenderer from/);
        assert.doesNotMatch(source, /bg-\[#07100f\]/);
    }
});

test('Aero renderer covers every CMS module allowed on the sales site', () => {
    const source = read('src/components/aero/AeroPageRenderer.tsx');
    for (const moduleType of ['b2b_hero', 'features', 'image_text', 'b2b_process', 'b2b_cases', 'b2b_contact', 'thermal_hero', 'thermal_slider']) {
        assert.match(source, new RegExp(`case '${moduleType}'`));
    }
    assert.match(source, /bg-\[#f4f8fb\]/);
    assert.match(source, /id="wycena"/);
});

test('Aero shell, contact form and thermal comparison no longer default to black UI', () => {
    assert.match(read('src/components/AppShell.tsx'), /className="aero-site/);
    assert.match(read('src/components/aero/AeroHeader.tsx'), /bg-white\/95/);
    assert.match(read('src/components/B2BContactForm.tsx'), /bg-\[#f8fafc\]/);
    assert.match(read('src/components/ThermalHeroSlider.tsx'), /bg-\[#eef4f8\]/);
});
