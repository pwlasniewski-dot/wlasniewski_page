import assert from 'node:assert/strict';
import test from 'node:test';
import { cityDefinition, cityLocalLink, parseCitySections, appendCityStarter, validateCitySections } from '../../src/lib/cityLanding';

test('unknown city keys and URL normalization cannot select inherited data or a foreign CTA', () => {
    for (const slug of ['constructor', '__proto__', 'toString', 'fotograf-unknown']) assert.equal(cityDefinition(slug), null);
    for (const href of ['//foreign.test', '/\\foreign.test', '/\nforeign.test', 'javascript:alert(1)']) assert.equal(cityLocalLink(href), '/rezerwacja');
    assert.equal(cityLocalLink('/slub?city=Lisewo#szybki-kontakt'), '/slub?city=Lisewo#szybki-kontakt');
});

test('empty/hidden CMS remains deliberate while unavailable storage uses starter copy without commercial promises', () => {
    assert.deepEqual(parseCitySections('[]', 'fotograf-chelmno'), []);
    const nested = parseCitySections(JSON.stringify([{ id: 'n', type: 'narrative_text', content: '', data: { content: '<p>Stored nested content</p>' } }]), 'fotograf-chelmno');
    assert.equal(nested[0].content, '<p>Stored nested content</p>');
    const hidden = [{ id: 'legacy-gallery', type: 'gallery', enabled: false, images: ['/saved.webp'], futureField: 'preserve' }];
    assert.deepEqual(parseCitySections(JSON.stringify(hidden), 'fotograf-chelmno'), hidden);
    for (const value of [null, '{bad']) {
        const copy = JSON.stringify(parseCitySections(value, 'fotograf-chelmno'));
        assert.ok(copy.includes('Rynek')); assert.doesNotMatch(copy, /20 zdjęć|10 dni|dojazd wliczony/);
    }
    const appended = appendCityStarter(hidden as any, 'fotograf-chelmno');
    assert.deepEqual(appended[0], hidden[0]);
});

test('city writes reject malformed FAQ, service filters and cross-origin canonical settings', () => {
    for (const sections of ['broken', '[null]', JSON.stringify([{ id: 'f', type: 'faq', faqItems: [{ question: 'Q', answer: 20 }] }]),
        JSON.stringify([{ id: 'p', type: 'public_packages', serviceNames: ['Not an existing service'] }]),
        JSON.stringify([{ id: 's', type: 'city_seo', canonicalPath: '/\\external.test' }])]) assert.equal(validateCitySections(sections).valid, false);
    assert.equal(validateCitySections('[]').valid, true);
    assert.equal(validateCitySections(JSON.stringify([{ id: 'p', type: 'public_packages', serviceNames: ['Sesja', 'Przyjęcie', 'Urodziny', 'Ślub'] }])).valid, true);
});
