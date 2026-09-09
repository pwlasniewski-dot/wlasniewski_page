import assert from 'node:assert/strict';
import test from 'node:test';
import { galleryLightboxSlides } from '../../src/lib/galleries/photo-lightbox-slides';

const photos = [
  { id: 12, thumbnail_url: 'https://example.com/thumb-12.webp', file_url: 'https://example.com/public-12.webp' },
  { id: 13, thumbnail_url: null, file_url: 'https://example.com/public-13.webp' },
];

test('standard and purchased premium display existing optimized previews without preloading JPG downloads', () => {
  for (const slides of [
    galleryLightboxSlides(photos, 'standard', []),
    galleryLightboxSlides(photos, 'premium', [12, 13]),
  ]) {
    assert.deepEqual(slides.map((slide) => slide.src), photos.map((photo) => photo.file_url));
    assert.ok(slides.every((slide) => !slide.previewOnly));
    assert.ok(slides.every((slide) => !slide.src.includes('/download/')));
  }
});

test('unpaid premium loads only its existing thumbnail, never an original or full public preview', () => {
  const slides = galleryLightboxSlides(photos, 'premium', []);
  assert.equal(slides[0].src, photos[0].thumbnail_url);
  assert.equal(slides[0].previewOnly, true);
  assert.equal(slides[1].previewUnavailable, true);
  assert.ok(slides[1].src.startsWith('data:image/'));
  assert.ok(slides.every((slide) => !slide.src.includes('/download/')));
  assert.ok(slides.every((slide) => !photos.some((photo) => slide.src === photo.file_url)));
});

test('purchase unlocks only the purchased photo and retains photo ordering', () => {
  const slides = galleryLightboxSlides(photos, 'premium', [13]);
  assert.equal(slides[0].src, photos[0].thumbnail_url);
  assert.equal(slides[1].src, photos[1].file_url);
  assert.equal(slides[1].previewUnavailable, false);
  assert.deepEqual(slides.map((slide) => slide.alt), ['Zdjęcie 12', 'Zdjęcie 13']);
});

test('missing entitled previews fall back to their thumbnail or a local placeholder, never JPG HQ', () => {
  const incompletePhotos = [
    { id: 14, file_url: null, thumbnail_url: 'https://example.com/thumb-14.webp' },
    { id: 15, thumbnail_url: null },
  ];
  for (const slides of [
    galleryLightboxSlides(incompletePhotos, 'standard', []),
    galleryLightboxSlides(incompletePhotos, 'premium', [14, 15]),
  ]) {
    assert.equal(slides[0].src, incompletePhotos[0].thumbnail_url);
    assert.equal(slides[0].previewUnavailable, false);
    assert.ok(slides[1].src.startsWith('data:image/'));
    assert.equal(slides[1].previewUnavailable, true);
    assert.ok(slides.every((slide) => !slide.src.includes('/download/')));
  }
});
