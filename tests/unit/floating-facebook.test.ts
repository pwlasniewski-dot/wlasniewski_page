import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_FLOATING_FACEBOOK, hideFloatingContact, readFloatingFacebook, validFacebookUrl, validFloatingFacebookConfig } from '../../src/lib/floating-facebook';

test('defaults use the verified photography page; old footer configurations still work', () => {
    assert.equal(readFloatingFacebook({ facebook_url: 'legacy' }).url, DEFAULT_FLOATING_FACEBOOK.floating_facebook_url);
    assert.equal(readFloatingFacebook(null).enabled, true);
    assert.ok(validFloatingFacebookConfig({ brand_name: 'Existing footer' }));
});

test('CMS roundtrip preserves visibility, destination and label without dropping existing footer', () => {
    const saved = JSON.stringify({ brand_name: 'Fotograf', sections: { oferta: { enabled: true } }, ...DEFAULT_FLOATING_FACEBOOK, floating_facebook_enabled: false, floating_facebook_label: 'Moje zdjęcia', floating_facebook_url: 'https://www.facebook.com/example/' });
    const read = JSON.parse(saved);
    assert.ok(validFloatingFacebookConfig(read));
    assert.equal(read.brand_name, 'Fotograf');
    assert.deepEqual(readFloatingFacebook(read), { enabled: false, label: 'Moje zdjęcia', url: 'https://www.facebook.com/example/' });
});

test('unsafe URLs and malformed CMS controls fail validation', () => {
    for (const url of ['javascript:alert(1)', 'http://facebook.com/a', 'https://facebook.com.evil.test/a', 'https://evil.test', 'https://x@facebook.com/a', 'https://facebook.com:8443/a', '']) {
        assert.equal(validFacebookUrl(url), false, url);
        assert.equal(readFloatingFacebook({ floating_facebook_url: url }).url, '');
        assert.equal(validFloatingFacebookConfig({ floating_facebook_url: url }), false);
    }
    assert.equal(validFloatingFacebookConfig({ floating_facebook_enabled: 'false' }), false);
    assert.equal(validFloatingFacebookConfig({ floating_facebook_label: 'a'.repeat(33) }), false);
});

test('no floating contact on private, transaction and separate B2B routes', () => {
    for (const path of ['/admin', '/admin/footer', '/galeria/token', '/galerie/a', '/strefa-klienta/dashboard', '/konto', '/checkout', '/koszyk', '/rezerwacja', '/rezerwacja/a', '/b2b/kontakt', '/foto-match', '/foto-wyzwanie/create', null]) {
        assert.equal(hideFloatingContact(path), true, String(path));
    }
    for (const path of ['/', '/portfolio', '/sesja-rodzinna', '/fotograf-wabrzezno', '/blog/test']) {
        assert.equal(hideFloatingContact(path), false, path);
    }
});
