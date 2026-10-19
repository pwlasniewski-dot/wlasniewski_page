/* Actual hook + tracker DOM regression tests; no network calls or client data. */
const Module = require('node:module');
const { randomUUID } = require('node:crypto');
const { assert, React, mount, reset, flush } = require('./gallery-shop-dom.cjs');
let pathname = '/karta-podarunkowa';
let searchParams = new URLSearchParams('utm_source=google&utm_medium=cpc');
let trackEvent;
let requests = [];
let observerRegistrations = 0;
let observerDisconnections = 0;
const originalLoad = Module._load;
Module._load = function (name, ...args) {
  if (name === 'next/navigation') return { usePathname: () => pathname, useSearchParams: () => searchParams };
  if (name === 'uuid') return { v4: randomUUID };
  return originalLoad.call(this, name, ...args);
};
const { AnalyticsTracker, useAnalytics } = require('../../src/hooks/useAnalytics.ts');
function App() { trackEvent = useAnalytics().trackEvent; return React.createElement(AnalyticsTracker); }
function record(url, init) {
  assert.equal(url, '/api/analytics/v2/track');
  requests.push({ init, event: JSON.parse(init.body).event });
}
global.fetch = async (url, init) => { record(url, init); return { ok: true, status: 200 }; };
global.PerformanceObserver = window.PerformanceObserver = class {
  constructor(callback) { this.callback = callback; }
  observe(options) {
    assert.deepEqual(options, { type: 'largest-contentful-paint', buffered: true });
    observerRegistrations++;
    queueMicrotask(() => this.callback({ getEntries: () => [{ startTime: 1234 }] }));
  }
  disconnect() { observerDisconnections++; }
};
(async () => {
  window.history.replaceState(null, '', '/karta-podarunkowa?utm_source=google&utm_medium=cpc');
  localStorage.clear();
  localStorage.setItem('cookie_consent', 'accepted');
  await mount(App, {});
  const stableCallback = trackEvent;
  for (let index = 0; index < 10; index++) {
    searchParams = new URLSearchParams(`shopProduct=50&shopCheckout=${index}`);
    window.history.replaceState(null, '', `/karta-podarunkowa?${searchParams}`);
    await mount(App, {});
    assert.equal(trackEvent, stableCallback, 'shop query changes must preserve callback identity');
  }
  assert.equal(observerRegistrations, 1);
  assert.equal(observerDisconnections, 0);
  assert.equal(requests.filter(r => r.event.event_type === 'v2_performance').length, 1);
  assert.equal(requests.filter(r => r.event.event_type === 'v2_page_view').length, 1);
  assert.equal(requests.filter(r => r.event.event_type === 'v2_session_start').length, 1);
  assert.ok(requests.every(r => r.event.utm_source === 'google' && r.event.utm_medium === 'cpc'), 'landing campaign survives shop queries');
  assert.ok(requests.every(r => r.init.keepalive === false));
  pathname = '/sesja-rodzinna';
  window.history.replaceState(null, '', pathname);
  await mount(App, {});
  assert.notEqual(trackEvent, stableCallback);
  assert.equal(observerRegistrations, 2, 'actual route change still creates a performance observer');
  assert.equal(observerDisconnections, 1);
  assert.equal(requests.filter(r => r.event.event_type === 'v2_page_view').length, 2);
  console.log('PASS actual React tracker: shop queries do not replay buffered LCP, route changes still track, landing attribution preserved');

  const outstanding = [];
  const releases = [];
  global.fetch = (url, init) => new Promise(resolve => {
    record(url, init);
    outstanding.push(init);
    releases.push(() => resolve({ ok: true, status: 200 }));
  });
  const burst = Array.from({ length: 140 }, () => trackEvent('click', { tag: 'button', analytics_id: 'button_button' }));
  await flush();
  assert.equal(outstanding.length, 140, 'measurements are retained');
  assert.ok(outstanding.every(init => init.keepalive === false), 'normal events do not consume shared keepalive quota');
  assert.ok(outstanding.reduce((bytes, init) => bytes + Buffer.byteLength(init.body), 0) > 65_536, 'regression scenario exceeds old in-flight keepalive budget');
  releases.forEach(resolve => resolve());
  await Promise.all(burst);
  global.fetch = async (url, init) => { record(url, init); return { ok: true, status: 200 }; };
  console.log('PASS burst above 64 KiB retains every normal event without using navigation keepalive budget');

  let beacons = [];
  Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: (url, body) => { beacons.push({ url, body }); return true; } });
  let before = requests.length;
  await trackEvent('page_exit', { active: true }, true);
  assert.equal(requests.length, before, 'accepted beacon must not duplicate with fetch');
  assert.equal(beacons.length, 1);
  assert.equal(beacons[0].url, '/api/analytics/v2/track');
  assert.equal(beacons[0].body.type, 'application/json');
  const acceptedPayload = JSON.parse(await beacons[0].body.text()).event;
  assert.equal(acceptedPayload.event_type, 'v2_page_exit');
  assert.equal(acceptedPayload.metadata.active, true);
  Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: () => false });
  await trackEvent('visibility_hidden', { active: false }, true);
  assert.equal(requests.length, before + 1, 'refused beacon must fall back rather than lose event');
  assert.equal(requests.at(-1).init.keepalive, true);
  assert.equal(requests.at(-1).event.event_type, 'v2_visibility_hidden');
  Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: undefined });
  await trackEvent('page_exit', { active: false }, true);
  assert.equal(requests.at(-1).init.keepalive, true);
  console.log('PASS accepted beacon is not duplicated; refused and unavailable beacons fall back with teardown keepalive');

  const originalError = console.error;
  const errors = [];
  console.error = (...args) => errors.push(args);
  try {
    global.fetch = async () => { throw new TypeError('Failed to fetch'); };
    await assert.doesNotReject(trackEvent('click', { tag: 'button', analytics_id: 'button_button' }));
    assert.equal(errors.length, 1);
    assert.equal(errors[0][0], '[Analytics V2] Failed to track event', 'transport failure remains diagnosable');
    assert.equal(errors[0][1].message, 'Failed to fetch');
  } finally { console.error = originalError; }
  global.fetch = async (url, init) => { record(url, init); return { ok: true, status: 200 }; };
  before = requests.length;
  await trackEvent('click', { tag: 'button', analytics_id: 'button_button' });
  assert.equal(requests.length, before + 1, 'transport recovers after a rejected request');
  localStorage.setItem('cookie_consent', 'rejected');
  await trackEvent('click');
  assert.equal(requests.length, before + 1, 'consent gates remain enforced');
  await reset();
  console.log('PASS network rejection stays logged and contained, recovery works, consent remains enforced');
})().catch(error => { console.error(error); process.exitCode = 1; });
