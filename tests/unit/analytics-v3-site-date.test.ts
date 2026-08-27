import assert from 'node:assert/strict';
import test from 'node:test';
import { safeAnalyticsSiteHost, trustedSiteHostFromOrigin } from '../../src/lib/analytics/siteHost.ts';
import { previousEqualCalendarRange, warsawCalendarMonthRange, warsawDateKey, warsawDateRange } from '../../src/lib/analytics/dateRange.ts';
import { gscCalendarComparisonRanges, gscComparisonRanges } from '../../src/lib/analytics/gscCore.ts';

test('trusted site host separates B2C root, B2B root and legacy path-only event', () => {
  assert.equal(trustedSiteHostFromOrigin('https://wlasniewski.pl'), 'wlasniewski.pl');
  assert.equal(trustedSiteHostFromOrigin('https://aeroanaliza.pl'), 'aeroanaliza.pl');
  assert.equal(safeAnalyticsSiteHost(undefined), 'unknown');
});

test('dashboard Warsaw calendar composition sends exact inclusive day to GSC in summer and DST', () => {
  for (const date of ['2026-08-12', '2026-10-25']) {
    const analytics = warsawDateRange(date, date);
    const previous = previousEqualCalendarRange(date, date);
    assert.ok(analytics && previous);
    const gsc = gscCalendarComparisonRanges({ startDate: date, endDate: date }, previous, '2026-12-01');
    assert.deepEqual(gsc.current, { startDate: date, endDate: date });
  }
});

test('Warsaw date-only boundaries handle summer and DST without browser timezone', () => {
  const summer = warsawDateRange('2026-08-12', '2026-08-12');
  assert.equal(summer?.start.toISOString(), '2026-08-11T22:00:00.000Z');
  assert.equal(summer?.end.toISOString(), '2026-08-12T22:00:00.000Z');
  const dst = warsawDateRange('2026-10-25', '2026-10-25');
  assert.equal(dst?.start.toISOString(), '2026-10-24T22:00:00.000Z');
  assert.equal(dst?.end.toISOString(), '2026-10-25T23:00:00.000Z');
  assert.equal(warsawDateKey(new Date('2026-08-11T22:30:00Z')), '2026-08-12');
});

test('monthly sales target uses exact Warsaw calendar-month boundaries', () => {
  const summer = warsawCalendarMonthRange(new Date('2026-08-31T22:30:00.000Z'));
  assert.deepEqual({ start: summer.start.toISOString(), end: summer.end.toISOString(), month: summer.month }, {
    start: '2026-08-31T22:00:00.000Z',
    end: '2026-09-30T22:00:00.000Z',
    month: '2026-09',
  });
  const winter = warsawCalendarMonthRange(new Date('2026-11-15T12:00:00.000Z'));
  assert.equal(winter.start.toISOString(), '2026-10-31T23:00:00.000Z');
  assert.equal(winter.end.toISOString(), '2026-11-30T23:00:00.000Z');
});

test('GSC range after latest complete day is waiting and has no comparable previous range', () => {
  const result = gscComparisonRanges(new Date('2026-08-11T00:00:00Z'), new Date('2026-08-13T00:00:00Z'), new Date('2026-08-09T00:00:00Z'), new Date('2026-08-11T00:00:00Z'), '2026-08-10');
  assert.equal(result.status, 'waiting_for_complete_data');
  assert.equal(result.current, null);
  assert.equal(result.previous, null);
});
