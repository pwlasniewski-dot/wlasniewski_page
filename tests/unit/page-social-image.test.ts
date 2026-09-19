import assert from 'node:assert/strict';
import test from 'node:test';
import { resolvePageSocialImage } from '../../src/lib/seo/page-social-image.ts';

test('social preview prefers the CMS hero image', () => {
    assert.equal(resolvePageSocialImage({
        hero_image: 'https://cdn.example.com/wedding-hero.jpg',
        sections: JSON.stringify([{ type: 'hero', image: 'https://cdn.example.com/other.jpg' }]),
    }), 'https://cdn.example.com/wedding-hero.jpg');
});

test('legacy page uses the first CMS visual when no hero is configured', () => {
    assert.equal(resolvePageSocialImage({
        hero_image: '',
        sections: JSON.stringify([
            { type: 'rich_text', content: 'Opis' },
            { type: 'hero_slider', slides: [{ image: 'https://cdn.example.com/wedding.jpg' }] },
        ]),
    }), 'https://cdn.example.com/wedding.jpg');
});

test('invalid CMS sections do not leak a generic preview image', () => {
    assert.equal(resolvePageSocialImage({ hero_image: '', sections: '{broken' }), null);
});
