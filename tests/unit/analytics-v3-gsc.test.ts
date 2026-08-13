import assert from 'node:assert/strict';
import test from 'node:test';
import { configuredGscSites, gscIdentity, gscInclusiveRange, latestCompleteGscDate, normalizeGscRows } from '../../src/lib/analytics/gscCore.ts';

test('GSC site configuration enforces the domain allowlist', () => {
  assert.deepEqual(configuredGscSites({
    GSC_SITE_URL_WLASNIEWSKI: 'sc-domain:wlasniewski.pl',
    GSC_SITE_URL_AEROANALIZA: 'https://evil.example/',
  } as NodeJS.ProcessEnv), ['sc-domain:wlasniewski.pl']);
});

test('GSC identity keeps identical paths separate by property host', () => {
  assert.notEqual(gscIdentity('sc-domain:wlasniewski.pl', '/'), gscIdentity('sc-domain:aeroanaliza.pl', '/'));
});

test('GSC converts analytics end-exclusive ranges to clamped inclusive dates without overlap', () => {
  assert.deepEqual(gscInclusiveRange(new Date('2026-07-01T00:00:00Z'), new Date('2026-07-29T00:00:00Z'), '2026-07-27'), { startDate: '2026-07-01', endDate: '2026-07-27' });
  assert.deepEqual(gscInclusiveRange(new Date('2026-06-03T00:00:00Z'), new Date('2026-07-01T00:00:00Z'), '2026-07-27'), { startDate: '2026-06-03', endDate: '2026-06-30' });
});

test('GSC rows normalize page/date and numeric metrics', () => {
  const rows = normalizeGscRows('sc-domain:wlasniewski.pl', [{
    keys: ['https://wlasniewski.pl/fotograf-torun?x=1', '2026-08-08'], clicks: 3, impressions: 100, ctr: 0.03, position: 7.5,
  }]);
  assert.deepEqual(rows[0], { siteUrl: 'sc-domain:wlasniewski.pl', page: '/fotograf-torun', date: '2026-08-08', clicks: 3, impressions: 100, ctr: 0.03, position: 7.5 });
});

test('latest complete GSC date marks two newest days as incomplete', () => {
  assert.equal(latestCompleteGscDate(new Date('2026-08-12T12:00:00Z')), '2026-08-10');
});
