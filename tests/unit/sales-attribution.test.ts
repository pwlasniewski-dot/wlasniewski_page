import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isPhotoInquirySource,
  safeSalesCampaign,
  safeSalesLandingPage,
  safeSalesSessionId,
  salesAttributionFromPayload,
} from '../../src/lib/analytics/salesAttribution.ts';

const sessionId = '550e8400-e29b-41d4-a716-446655440000';

test('accepts only UUID analytics sessions and safe campaign values', () => {
  assert.equal(safeSalesSessionId(sessionId), sessionId);
  assert.equal(safeSalesSessionId('not-a-session'), null);
  assert.equal(safeSalesCampaign('google_search-2026.08'), 'google_search-2026.08');
  assert.equal(safeSalesCampaign('google search<script>'), null);
});

test('keeps local public landing paths and rejects third-party or admin URLs', () => {
  assert.equal(safeSalesLandingPage('/fotograf-torun?utm_source=google'), '/fotograf-torun');
  assert.equal(safeSalesLandingPage('https://wlasniewski.pl/sesja-rodzinna#kontakt'), '/sesja-rodzinna');
  assert.equal(safeSalesLandingPage('https://example.com/sesja-rodzinna'), null);
  assert.equal(safeSalesLandingPage('//example.com/sesja-rodzinna'), null);
  assert.equal(safeSalesLandingPage('/admin/analytics'), null);
  assert.equal(safeSalesLandingPage('/galeria/private-access-code'), null);
  assert.equal(safeSalesLandingPage('/strefa-klienta'), null);
  assert.equal(safeSalesLandingPage('/z/private-token'), null);
});

test('normalizes a complete canonical sales attribution payload', () => {
  assert.deepEqual(salesAttributionFromPayload({
    analytics_session_id: sessionId,
    landing_page: '/fotograf-wabrzezno?utm_campaign=family',
    utm_source: 'google',
    utm_medium: 'cpc',
    utm_campaign: 'family_wabrzezno',
  }), {
    analytics_session_id: sessionId,
    landing_page: '/fotograf-wabrzezno',
    utm_source: 'google',
    utm_medium: 'cpc',
    utm_campaign: 'family_wabrzezno',
  });
});

test('recognizes only photography inquiry sources', () => {
  assert.equal(isPhotoInquirySource('website-contact'), true);
  assert.equal(isPhotoInquirySource('website'), true);
  assert.equal(isPhotoInquirySource('landing-torun'), true);
  assert.equal(isPhotoInquirySource('promo_maj2026'), true);
  assert.equal(isPhotoInquirySource('photo:family'), true);
  assert.equal(isPhotoInquirySource('aeroanaliza:termowizja'), false);
  assert.equal(isPhotoInquirySource('b2b-contact'), false);
});
