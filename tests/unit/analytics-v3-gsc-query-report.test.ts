import assert from 'node:assert/strict';
import test from 'node:test';
import { buildGscQueryReport } from '../../src/lib/analytics/gscQueryReport.ts';

test('query report compares periods and marks one query shown for multiple pages as a signal', () => {
  const current = [
    { siteUrl: 'sc-domain:wlasniewski.pl', query: 'fotograf toruń', page: '/', clicks: 1, impressions: 20, ctr: 0.05, position: 9 },
    { siteUrl: 'sc-domain:wlasniewski.pl', query: 'fotograf toruń', page: '/fotograf-torun', clicks: 3, impressions: 60, ctr: 0.05, position: 6 },
  ];
  const previous = [
    { siteUrl: 'sc-domain:wlasniewski.pl', query: 'fotograf toruń', page: '/fotograf-torun', clicks: 1, impressions: 30, ctr: 0.033, position: 8 },
  ];
  const report = buildGscQueryReport(current, previous);

  assert.equal(report.length, 2);
  assert.equal(report[0].page, '/fotograf-torun');
  assert.equal(report[0].impressionsPct, 100);
  assert.equal(report[0].multiplePagesSignal, true);
  assert.deepEqual(report[0].competingPages, ['/', '/fotograf-torun']);
});

test('query report keeps identical query paths separate between domains', () => {
  const report = buildGscQueryReport([
    { siteUrl: 'sc-domain:wlasniewski.pl', query: 'fotograf', page: '/', clicks: 1, impressions: 10, ctr: 0.1, position: 4 },
    { siteUrl: 'sc-domain:aeroanaliza.pl', query: 'fotograf', page: '/', clicks: 0, impressions: 2, ctr: 0, position: 20 },
  ], []);
  assert.deepEqual(report.map(row => row.host), ['wlasniewski.pl', 'aeroanaliza.pl']);
  assert.equal(report.every(row => row.multiplePagesSignal === false), true);
});

test('query report does not silently truncate unless a caller requests a limit', () => {
  const rows = Array.from({ length: 501 }, (_, index) => ({
    siteUrl: 'sc-domain:wlasniewski.pl', query: `fraza ${index}`, page: '/', clicks: 0, impressions: 501 - index, ctr: 0, position: 10,
  }));
  assert.equal(buildGscQueryReport(rows, []).length, 501);
  assert.equal(buildGscQueryReport(rows, [], 500).length, 500);
});
