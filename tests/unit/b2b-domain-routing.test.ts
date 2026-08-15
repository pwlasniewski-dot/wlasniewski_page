import assert from 'node:assert/strict';
import test from 'node:test';
import { b2bPublicPath, isB2bCmsPage, LEGACY_B2B_REDIRECTS } from '../../src/lib/sites/b2b-routing.ts';

test('recognizes technical CMS pages as B2B even without a b2b slug prefix', () => {
    assert.equal(isB2bCmsPage({ slug: 'termowizja', page_type: 'regular' }), true);
    assert.equal(isB2bCmsPage({ slug: 'monitoring', page_type: 'regular' }), true);
    assert.equal(isB2bCmsPage({ slug: 'sesja-rodzinna', page_type: 'regular' }), false);
});

test('page_type b2b remains authoritative for custom service slugs', () => {
    assert.equal(isB2bCmsPage({ slug: 'niestandardowa-usluga', page_type: 'b2b' }), true);
});

test('builds one canonical Aeroanaliza path', () => {
    assert.equal(b2bPublicPath('b2b/termowizja'), '/termowizja');
    assert.equal(b2bPublicPath('termowizja'), '/termowizja');
    assert.equal(LEGACY_B2B_REDIRECTS['/termowizja'], 'https://aeroanaliza.pl/termowizja');
});
