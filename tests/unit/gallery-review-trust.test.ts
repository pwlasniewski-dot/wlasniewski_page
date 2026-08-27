import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  formatGalleryDiscount,
  normalizeGoogleReviewUrl,
  resolveGalleryLoyaltyOffer,
} from '../../src/lib/marketing/gallery-trust.ts';

function source(relativePath: string) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8');
}

test('Google review link accepts only direct, HTTPS review URLs from the configured GBP domains', () => {
  assert.equal(
    normalizeGoogleReviewUrl('https://g.page/r/CfCcE7G30MsVEBM/review'),
    'https://g.page/r/CfCcE7G30MsVEBM/review',
  );
  assert.equal(
    normalizeGoogleReviewUrl('https://search.google.com/local/writereview?placeid=verified-id'),
    'https://search.google.com/local/writereview?placeid=verified-id',
  );

  assert.equal(normalizeGoogleReviewUrl('http://g.page/r/example/review'), null);
  assert.equal(normalizeGoogleReviewUrl('https://g.page/example'), null);
  assert.equal(normalizeGoogleReviewUrl('https://g.page.evil.example/r/example/review'), null);
  assert.equal(normalizeGoogleReviewUrl('https://g.page:444/r/example/review'), null);
  assert.equal(normalizeGoogleReviewUrl('https://search.google.com/local/writereview'), null);
  assert.equal(normalizeGoogleReviewUrl('https://example.com/review'), null);
});

test('gallery loyalty offer exists only for explicit, active and non-expired CMS configuration', () => {
  const now = new Date('2026-08-26T12:00:00.000Z');

  assert.equal(resolveGalleryLoyaltyOffer(undefined, now), null);
  assert.equal(resolveGalleryLoyaltyOffer({
    code: 'WRACAM15',
    discountValue: 15,
    discountType: 'percentage',
    validUntil: '2026-08-25',
  }, now), null);

  const offer = resolveGalleryLoyaltyOffer({
    code: ' klient15 ',
    discountValue: '15',
    discountType: 'percentage',
    validUntil: '2026-08-31',
  }, now);

  assert.deepEqual(offer, {
    code: 'KLIENT15',
    discountValue: 15,
    discountType: 'percentage',
    validUntil: '2026-08-31',
  });
  assert.equal(formatGalleryDiscount(offer!), '15%');
});

test('gallery loyalty rejects malformed conditions instead of inventing a fallback', () => {
  const now = new Date('2026-08-26T12:00:00.000Z');
  const base = {
    code: 'KLIENT15',
    discountValue: 15,
    discountType: 'percentage',
  };

  assert.equal(resolveGalleryLoyaltyOffer({ ...base, code: '' }, now), null);
  assert.equal(resolveGalleryLoyaltyOffer({ ...base, discountValue: 101 }, now), null);
  assert.equal(resolveGalleryLoyaltyOffer({ ...base, discountType: 'mystery' }, now), null);
  assert.equal(resolveGalleryLoyaltyOffer({ ...base, validUntil: 'not-a-date' }, now), null);
});

test('gallery UI separates loyalty from reviews and contains no hard-coded review or promo fallback', () => {
  const component = source('src/components/galleries/PostGalleryUpsell.tsx');
  const individualGallery = source('src/app/galeria/[accessCode]/page.tsx');
  const groupGallery = source('src/app/galeria/grupowa/page.tsx');
  const publicSettings = source('src/app/api/settings/public/route.ts');
  const checkout = source('src/app/api/basket/checkout/route.ts');
  const promoAdminApi = source('src/app/api/promo-codes/[id]/route.ts');
  const promoBar = source('src/components/PromocodeBar.tsx');
  const challengePage = source('src/app/foto-wyzwanie/page.tsx');
  const cityProof = source('src/lib/city-proof.ts');
  const bookingApi = source('src/app/api/bookings/route.ts');
  const manualReviewApi = source('src/app/api/admin/local-seo/send-review-request/route.ts');
  const settingsApi = source('src/app/api/settings/route.ts');
  const settingsAdmin = source('src/app/admin/settings/page.tsx');
  const bannersAdmin = source('src/app/admin/banners/page.tsx');
  const socioAdmin = source('src/app/admin/socio/page.tsx');
  const schema = source('prisma/schema.prisma');
  const funnelConfig = source('src/lib/marketing/photo-funnel.ts');
  const expiredPromotionPage = source('src/app/promocja-maj-2026/page.tsx');
  const marketingAdmin = source('src/app/admin/marketing/page.tsx');

  assert.match(funnelConfig, /Nie zależy od wystawienia opinii ani od jej oceny/);
  assert.match(component, /Opinia jest całkowicie dobrowolna i nie wpływa na żaden rabat ani korzyść/);
  assert.match(component, /galleryReviewEnabled && googleReviewUrl && \(/);
  assert.doesNotMatch(component, /Opinia\s*=\s*rabat|Wystaw 5|30 dni|KOMUNIA15|WRACAM(?:10|15)/);
  assert.doesNotMatch(component, /NEXT_PUBLIC_GOOGLE_REVIEW_URL|placeid=ChIJ/);
  assert.doesNotMatch(individualGallery, /discountCode=/);
  assert.doesNotMatch(groupGallery, /discountCode=/);

  assert.match(publicSettings, /getSetting\('gbp_review_link'\)/);
  assert.match(publicSettings, /gbp_review_link:\s*normalizeGoogleReviewUrl\(reviewLink\)/);
  assert.doesNotMatch(publicSettings, /google_place_id|writereview\?placeid=/);

  assert.match(schema, /show_in_gallery\s+Boolean\s+@default\(false\)/);
  assert.match(schema, /show_in_banner\s+Boolean\s+@default\(false\)/);
  assert.match(publicSettings, /prisma\.promoCode\.findMany/);
  assert.match(publicSettings, /show_in_gallery:\s*true/);
  assert.match(publicSettings, /show_in_banner:\s*true/);
  assert.match(publicSettings, /code\.max_usage === null \|\| code\.usage_count < code\.max_usage/);
  assert.match(publicSettings, /gallery_loyalty_offer:/);
  assert.doesNotMatch(publicSettings, /getSetting\('promo_code'\)|settings\.promo_code_discount/);
  assert.match(checkout, /prisma\.promoCode\.findFirst/);
  assert.match(checkout, /code:\s*\{ equals: promoCode, mode: 'insensitive' \}/);
  assert.match(checkout, /promo-code:\$\{appliedPromoCode\.toUpperCase\(\)\}/);
  assert.match(checkout, /usage_count:\s*\{ increment: 1 \}/);
  assert.match(promoAdminApi, /updateMany/);
  assert.match(promoAdminApi, /show_in_gallery:\s*false/);
  assert.doesNotMatch(promoBar, /discount\s*=\s*20|discountType\s*=\s*'percentage'/);
  assert.doesNotMatch(challengePage, /WYZWANIE20|<PromocodeBar/);
  assert.doesNotMatch(cityProof, /g\.page\/r\/wlasniewski-fotografia/);
  assert.match(cityProof, /normalizeGoogleBusinessProfileUrl/);
  assert.match(cityProof, /setting_key: 'gbp_profile_url'/);
  assert.doesNotMatch(bookingApi, /google_place_id|writereview\?placeid=/);
  assert.doesNotMatch(manualReviewApi, /google_place_id|writereview\?placeid=/);
  assert.match(expiredPromotionPage, /permanentRedirect\('\/rezerwacja'\)/);
  assert.doesNotMatch(expiredPromotionPage, /MAJ-ALBUM-GRATIS|LimitedAvailability|4 wolne soboty/);
  assert.doesNotMatch(marketingAdmin, /promocja-maj-2026|MAJ-ALBUM-GRATIS/);
  assert.match(settingsApi, /retiredPromotionFields/);
  for (const adminSource of [settingsAdmin, bannersAdmin, socioAdmin]) {
    assert.match(adminSource, /\/admin\/promo-codes/);
    assert.doesNotMatch(adminSource, /Włącz rabat dla wszystkich|Włącz zniżkę po wpisaniu kodu/);
  }
});
