import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluatePageCompleteness, portfolioPath, prioritizeDirectorActions, STATIC_PAGE_REGISTRY } from '../../src/lib/analytics/pageRegistry.ts';

test('completeness reports exact blockers and does not score unknown gates', () => {
  const result = evaluatePageCompleteness({
    host: 'wlasniewski.pl', path: '/test', title: 'Test', kind: 'cms', published: true,
    metaTitle: 'Tytuł', metaDescription: null, content: 'krótka treść', mediaCount: 0, hasCta: false,
  }, { analyticsObserved: true, gscObserved: false, firstAnalyticsAt: new Date('2026-08-01T10:00:00Z') });
  assert.equal(result.stage, 'visited_not_visible');
  assert.equal(result.firstSeenSource, 'analytics');
  assert.ok(result.blockers.includes('Brak meta description'));
  assert.ok(result.blockers.includes('Brak przypisanych mediów'));
  assert.ok(result.blockers.includes('Brak CTA prowadzącego dalej'));
  assert.ok(result.dataBlockers.includes('Brak danych GSC w analizowanym okresie'));
});

test('static code-managed fields are unknown rather than fabricated failures', () => {
  const result = evaluatePageCompleteness({ host: 'wlasniewski.pl', path: '/', title: 'Home', kind: 'static', published: true, hasCta: true }, { analyticsObserved: false, gscObserved: false });
  assert.equal(result.gates.find(gate => gate.key === 'meta')?.state, 'unknown');
  assert.equal(result.gates.find(gate => gate.key === 'content')?.state, 'unknown');
  assert.ok(!result.blockers.some(blocker => blocker.includes('meta title')));
});

test('technical completeness does not change with selected-period traffic', () => {
  const page = { host: 'wlasniewski.pl' as const, path: '/x', title: 'X', kind: 'cms' as const, published: true, metaTitle: 'T', metaDescription: 'D', content: 'słowo '.repeat(130), mediaCount: 1, hasCta: true };
  const empty = evaluatePageCompleteness(page, { analyticsObserved: false, gscObserved: false });
  const observed = evaluatePageCompleteness(page, { analyticsObserved: true, gscObserved: true });
  assert.equal(empty.completeness, observed.completeness);
  assert.equal(empty.stage, 'published_unseen');
  assert.equal(observed.stage, 'established');
});

test('growing stage requires positive trend', () => {
  const page = { host: 'wlasniewski.pl' as const, path: '/x', title: 'X', kind: 'cms' as const, published: true, metaTitle: 'T', metaDescription: 'D', content: 'słowo '.repeat(130), mediaCount: 1, hasCta: true };
  assert.equal(evaluatePageCompleteness(page, { analyticsObserved: true, gscObserved: true, trendPositive: false }).stage, 'established');
  assert.equal(evaluatePageCompleteness(page, { analyticsObserved: true, gscObserved: true, trendPositive: true }).stage, 'growing');
});

test('portfolio URL includes category and slug', () => {
  assert.equal(portfolioPath('śluby', 'ania-i-piotr'), '/portfolio/%C5%9Bluby/ania-i-piotr');
});

test('drone offer and its booking step are visible in Analytics V3 page registry', () => {
  const paths = STATIC_PAGE_REGISTRY.filter(page => page.host === 'wlasniewski.pl').map(page => page.path);
  assert.ok(paths.includes('/fotografia-z-drona'));
  assert.ok(paths.includes('/rezerwacja/dron'));
});

test('director actions return at most three in priority order', () => {
  const result = prioritizeDirectorActions([
    { priority: 20, kind: 'b', title: 'B', evidence: '', recommendation: '' },
    { priority: 100, kind: 'a', title: 'A', evidence: '', recommendation: '' },
    { priority: 40, kind: 'c', title: 'C', evidence: '', recommendation: '' },
    { priority: 10, kind: 'd', title: 'D', evidence: '', recommendation: '' },
  ]);
  assert.deepEqual(result.map(item => item.title), ['A', 'C', 'B']);
});

test('historical GSC observation can establish an earlier honest first seen date', () => {
  const result = evaluatePageCompleteness({ host: 'wlasniewski.pl', path: '/x', title: 'X', kind: 'static', published: true }, {
    analyticsObserved: true, gscObserved: true,
    firstAnalyticsAt: new Date('2026-08-01T00:00:00Z'), firstGscAt: '2025-07-15',
  });
  assert.equal(result.firstSeenAt, '2025-07-15T00:00:00.000Z');
  assert.equal(result.firstSeenSource, 'gsc');
  assert.match(result.firstSeenNote, /nie data publikacji/);
});

test('technical errors outrank diagnostics and growth actions', () => {
  const result = prioritizeDirectorActions([
    { priority: 80, kind: 'growth', title: 'Growth', evidence: '', recommendation: '' },
    { priority: 120, kind: 'diagnostic', title: 'Diagnostic', evidence: '', recommendation: '' },
    { priority: 140, kind: 'error', title: 'Error', evidence: '', recommendation: '' },
  ]);
  assert.deepEqual(result.map(item => item.title), ['Error', 'Diagnostic', 'Growth']);
});
