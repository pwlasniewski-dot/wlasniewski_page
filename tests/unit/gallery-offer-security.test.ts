import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';
import { calculateAcceptedOfferTotal, canonicalizeAcceptedOfferSelection } from '../../src/lib/offers/calculateAcceptedOfferTotal';
import { authorizeIndividualGallery } from '../../src/lib/galleries/individual-access';
import { generateToken } from '../../src/lib/auth/jwt';
import { ownedS3Key } from '../../src/lib/storage/s3';
import { youtubeNoCookieEmbedUrl, youtubeVideoId } from '../../src/lib/video/youtube';
import { galleryTermsFromAcceptedOffer } from '../../src/lib/galleries/offerTerms';

test('offer total is calculated from server-side prices and global optional indexes', () => {
  const offer = {
    category: 'rodzinna',
    template_data: { footerPrices: ['Pakiet', '900 zł', '1500 zł'] },
    sections: [
      { items: [{ price: 100, quantity: 1, is_optional: true }] },
      { items: [
        { price: 250, quantity: 2, is_optional: true },
        { price: 50, quantity: 1, is_optional: false },
      ] },
    ],
    selected_addons: [{ final_price: 75 }],
  };

  const total = calculateAcceptedOfferTotal(offer, {
    selectedPackage: { index: 1 },
    selectedOptionalItems: [100],
    totalPrice: 0,
  });

  assert.equal(total, 1525);
});

test('offer total ignores forged package indexes, quantities and optional item ids', () => {
  const offer = {
    category: 'rodzinna',
    template_data: { footerPrices: ['Pakiet', '900 zł'] },
    sections: [{ items: [{ price: 100, quantity: 1, is_optional: true }] }],
    selected_addons: [],
  };

  assert.equal(calculateAcceptedOfferTotal(offer, {
    selectedPackage: { index: 999 },
    selectedOptionalItems: [999, -1, 'x'],
    totalPrice: 1,
  }), 0);
});

test('standalone PDF offer uses its persisted server price', () => {
  assert.equal(calculateAcceptedOfferTotal({
    template_data: null,
    sections: [],
    selected_addons: [],
    total_price: 1200,
  }, { totalPrice: 1 }), 1200);
});

test('regular offer cannot omit a package or switch itself into split mode', () => {
  const offer = {
    category: 'rodzinna',
    template_data: { footerPrices: ['Pakiet', '900 zł'] },
    sections: [{ items: [{ price: 100, quantity: 1, is_optional: false }] }],
    selected_addons: [],
  };

  assert.equal(calculateAcceptedOfferTotal(offer, {}), 0);
  assert.equal(calculateAcceptedOfferTotal(offer, { splitPackageCounts: { 1: 1 } }), 0);
});

test('communion offer accepts only a valid, non-empty split selection', () => {
  const offer = {
    category: 'Komunia',
    template_data: { footerPrices: ['Pakiet', '100 zł', '200 zł'] },
    sections: [],
    selected_addons: [],
  };

  assert.equal(calculateAcceptedOfferTotal(offer, { splitPackageCounts: { 1: 2, 2: 1 } }), 400);
  assert.equal(calculateAcceptedOfferTotal(offer, { selectedPackage: { index: 1 } }), 0);
  assert.equal(calculateAcceptedOfferTotal(offer, { splitPackageCounts: { 0: 10 } }), 0);
});

test('accepted package name and price are canonicalized from server offer data', () => {
  const result = canonicalizeAcceptedOfferSelection({
    category: 'rodzinna',
    template_data: { pricingHeaders: ['Element', 'Prawdziwy pakiet'], footerPrices: ['Cena', '900 zł'] },
    sections: [], selected_addons: [],
  }, {
    selectedPackage: { index: 1, name: 'Fałszywa nazwa', price: '1 zł' }, totalPrice: 1,
  });
  assert.deepEqual(result.selection.selectedPackage, { index: 1, name: 'Prawdziwy pakiet', price: '900 zł' });
  assert.equal(result.total, 900);
});

test('gallery snapshot inherits the included photo count and extra price', () => {
  const terms = galleryTermsFromAcceptedOffer({
    id: 7, status: 'accepted', total_price: 1490,
    client_selection: { selectedPackage: { index: 1, name: 'Start', price: '1490 zł' } },
    template_data: {
      pricingRows: [{ values: ['Liczba finalnych zdjęć', '35', '55'] }],
      extraPhotoPrice: 25,
    },
  });
  assert.equal(terms.includedPhotoCount, 35);
  assert.equal(terms.extraPhotoPriceGrosz, 2500);
});

test('YouTube links are normalized to privacy-enhanced embeds', () => {
  assert.equal(youtubeVideoId('https://youtu.be/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(
    youtubeNoCookieEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&utm_source=test'),
    'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0',
  );
  assert.equal(youtubeVideoId('https://example.com/dQw4w9WgXcQ'), null);
});

test('private S3 reader accepts only the configured bucket host or an object key', () => {
  process.env.S3_BUCKET = 'foto-test';
  process.env.S3_REGION = 'eu-central-1';

  assert.equal(ownedS3Key('private/gallery/photo.jpg'), 'private/gallery/photo.jpg');
  assert.equal(
    ownedS3Key('https://foto-test.s3.eu-central-1.amazonaws.com/private/gallery/photo.jpg'),
    'private/gallery/photo.jpg',
  );
  assert.throws(
    () => ownedS3Key('https://127.0.0.1/internal'),
    /outside the configured private S3 bucket/,
  );
  assert.throws(
    () => ownedS3Key('https://foto-test.s3.eu-central-1.amazonaws.com.evil.test/private/photo.jpg'),
    /outside the configured private S3 bucket/,
  );
});

test('individual gallery guard accepts only its owner, privileged user or share password', async () => {
  process.env.JWT_SECRET = 'test-secret-at-least-32-characters-long';
  const gallery = {
    id: 42,
    access_code: 'safe-code',
    gallery_mode: 'INDIVIDUAL',
    client_id: 7,
    client_email: 'owner@example.com',
    group_password: 'share-secret',
  };

  const ownerToken = await generateToken({ id: 7, email: 'owner@example.com', role: 'CLIENT' });
  const ownerRequest = new NextRequest('https://example.com/api/galleries/safe-code', {
    headers: { authorization: `Bearer ${ownerToken}` },
  });
  assert.equal((await authorizeIndividualGallery(ownerRequest, gallery)).reason, 'owner');

  const passwordRequest = new NextRequest('https://example.com/api/galleries/safe-code', {
    headers: { 'x-gallery-password': 'share-secret' },
  });
  assert.equal((await authorizeIndividualGallery(passwordRequest, gallery)).reason, 'share-password');

  const deniedRequest = new NextRequest('https://example.com/api/galleries/safe-code', {
    headers: { 'x-gallery-password': 'wrong' },
  });
  assert.equal((await authorizeIndividualGallery(deniedRequest, gallery)).allowed, false);

  assert.equal((await authorizeIndividualGallery(deniedRequest, {
    ...gallery,
    gallery_mode: 'GROUP',
  })).reason, 'group-gallery');
});
