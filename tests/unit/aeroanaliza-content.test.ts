import assert from 'node:assert/strict';
import test from 'node:test';
import { AERO_PUBLIC_SLUGS, AERO_SITE, getAeroPageDefinition, mergeAeroPageSections } from '../../src/lib/aeroanaliza/content.ts';
import { aeroInquirySchema } from '../../src/lib/aeroanaliza/inquiry-schema.ts';
import { getSitemapAeroSlugs } from '../../src/lib/aeroanaliza/sitemap.ts';
import { validateAeroPageSections } from '../../src/lib/aeroanaliza/page-validation.ts';

test('Aero Analiza publishes a small allowlist of high-intent pages', () => {
    assert.deepEqual(AERO_PUBLIC_SLUGS, ['', 'termowizja', 'inspekcja-fotowoltaiki-dronem', 'inspekcja-dachu-dronem', 'monitoring', 'kujawsko-pomorskie']);
    assert.equal(new Set(AERO_PUBLIC_SLUGS).size, AERO_PUBLIC_SLUGS.length);
    assert.equal(AERO_PUBLIC_SLUGS.includes('start'), false);
    assert.equal(AERO_PUBLIC_SLUGS.includes('kontakt-'), false);
});

test('professional defaults are PageBuilder-editable and have one lead action', () => {
    for (const slug of AERO_PUBLIC_SLUGS) {
        const page = getAeroPageDefinition(slug)!;
        assert.ok(page.title.length >= 30, slug);
        assert.ok(page.description.length >= 100, slug);
        assert.equal(page.sections.some(section => section.data), false, `${slug}: sections must be flat for PageBuilder`);
        assert.equal(page.sections.filter(section => section.type === 'b2b_hero').length, 1, `${slug}: one hero/H1`);
        assert.equal(page.sections.filter(section => section.type === 'b2b_contact').length, 1, `${slug}: one RFQ`);
        assert.ok(page.sections.find(section => section.type === 'b2b_contact')?.defaultService, `${slug}: service preselection`);
    }
});

test('defaults do not contain unverified technical or response-time claims', () => {
    const text = AERO_PUBLIC_SLUGS.map(slug => JSON.stringify(getAeroPageDefinition(slug))).join('\n');
    for (const claim of ['FLIR_RADIOMETRIC_PRO', 'Standardy LUC', 'Licencjonowany operator UAVO', 'SLA 24h', 'ciągu 4 godzin', '100% zgodności']) {
        assert.equal(text.includes(claim), false, claim);
    }
    assert.equal(AERO_SITE.email, 'pwlasniewski@gmail.com');
});

test('legacy CMS contributes only the real thermal pair to safe defaults', () => {
    const page = getAeroPageDefinition('termowizja')!;
    const result = mergeAeroPageSections(page, [
        { id: 'unsafe', type: 'b2b_stats', b2b_stats: [{ id: 'x', value: '100%', label: 'Zgodność' }] },
        { id: 'pair', type: 'thermal_slider', image: '/rgb.webp', thermalImage: '/thermal.webp', title: 'Unsafe live scan' },
    ]);
    assert.equal(result.some(section => section.id === 'unsafe'), false);
    const pair = result.find(section => section.id === 'legacy-media-pair');
    assert.equal(pair?.type, 'thermal_hero');
    assert.equal(pair?.thermal_hero_slides?.[0]?.visualMedia, '/rgb.webp');
    assert.equal(pair?.thermal_hero_slides?.[0]?.thermalMedia, '/thermal.webp');
    assert.equal(pair?.thermal_hero_slides?.[0]?.title, 'Porównanie obrazu RGB i termicznego');
    assert.equal(pair?.thermal_hero_slides?.[0]?.alignmentStatus, 'side_by_side_only');
});

test('Aero inquiry contract requires decision-useful qualification fields', () => {
    const valid = aeroInquirySchema.parse({
        requestId: '7f51a6cb-2d3f-44df-b95f-3f5936a80890',
        name: 'Jan Kowalski', email: 'jan@example.com', serviceType: 'Termowizja dronem',
        location: 'Toruń', message: 'Chcę sprawdzić rozkład temperatury na dachu hali.',
    });
    assert.equal(valid.location, 'Toruń');
    assert.equal(aeroInquirySchema.safeParse({ requestId: 'not-a-uuid', name: 'J', email: 'zły', serviceType: '', location: '', message: 'krótko' }).success, false);
});

test('an explicitly unpublished CMS page is removed from the sitemap', () => {
    const slugs = getSitemapAeroSlugs([{ slug: 'termowizja', is_published: false, updated_at: new Date('2026-08-21') }]);
    assert.equal(slugs.includes('termowizja'), false);
    assert.equal(slugs.includes('monitoring'), true, 'missing CMS pages still use reviewed code fallback');
    assert.deepEqual(getSitemapAeroSlugs(null), AERO_PUBLIC_SLUGS, 'a database outage keeps the static fallback indexable');
});

test('published Aero CMS pages keep one H1, one RFQ and the safe module model', () => {
    assert.equal(validateAeroPageSections(getAeroPageDefinition('termowizja')!.sections).valid, true);
    const unsafe = getAeroPageDefinition('termowizja')!.sections.concat([
        { id: 'second-hero', type: 'b2b_hero', title: 'Drugi H1' },
        { id: 'photo-module', type: 'gallery', images: [] },
    ]);
    const result = validateAeroPageSections(unsafe);
    assert.equal(result.valid, false);
    if (!result.valid) assert.match(result.error, /dokładnie jeden|nie jest dozwolony/);
});

test('published Aero CMS rejects executable markup and external CTA targets', () => {
    const executable = structuredClone(getAeroPageDefinition('')!.sections);
    const textSection = executable.find(section => section.type === 'image_text')!;
    textSection.content = '<p onmouseover="alert(1)">Opis</p>';
    const executableResult = validateAeroPageSections(executable);
    assert.equal(executableResult.valid, false);
    if (!executableResult.valid) assert.match(executableResult.error, /niedozwolony kod/);

    const external = structuredClone(getAeroPageDefinition('termowizja')!.sections);
    external.find(section => section.type === 'b2b_hero')!.buttonLink = 'https://example.com/lead';
    const externalResult = validateAeroPageSections(external);
    assert.equal(externalResult.valid, false);
    if (!externalResult.valid) assert.match(externalResult.error, /bezpiecznej ścieżki Aero/);
});
