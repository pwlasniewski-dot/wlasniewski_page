import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require('jsdom');
const mocks: Record<string, string> = {
  'next/navigation': `const query=new URLSearchParams(); export const usePathname=()=>'/rezerwacja'; export const useSearchParams=()=>query;`,
  '@/context/CartContext': `export const useCart=()=>({addItem:item=>window.__qaCart.push(item)});`,
  'framer-motion': `import React from 'react'; const cache={}; export const motion=new Proxy({}, {get:(_,tag)=>cache[tag] ||= React.forwardRef(function Motion({initial,animate,exit,transition,whileHover,whileTap,...props},ref){return React.createElement(tag,{...props,ref});})});`,
  '@/components/TestimonialsSection': `export default function Stub(){return null;}`,
  '@/components/PageRenderer': `export default function Stub(){return null;}`,
  '@/components/booking/BookingFunnelIntro': `export default function Stub(){return null;}`,
  'sonner': `export const Toaster=()=>null; export const toast=()=>{};`,
};
const bundle = build({
  stdin: { contents: `
    import React, {act} from 'react'; import {createRoot} from 'react-dom/client';
    import BookingPage from './src/app/rezerwacja/page'; import {AnalyticsTracker} from './src/hooks/useAnalytics';
    window.IS_REACT_ACT_ENVIRONMENT=true; window.__qaAct=act;
    window.__qaRoot=createRoot(document.getElementById('root'));
    window.__qaMount=()=>window.__qaRoot.render(<><AnalyticsTracker/><BookingPage/></>);
  `, loader: 'tsx', resolveDir: process.cwd() },
  bundle: true, write: false, platform: 'browser', format: 'iife', jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"development"', 'process.env.STRAPI_API_URL': '""', 'process.env.NEXT_PUBLIC_STRAPI_API_URL': '""' },
  plugins: [{ name: 'presentation-and-network-boundaries', setup(builder) {
    builder.onResolve({ filter: /.*/ }, args => args.path in mocks ? { path: args.path, namespace: 'qa-mock' } : undefined);
    builder.onLoad({ filter: /.*/, namespace: 'qa-mock' }, args => ({ contents: mocks[args.path], loader: 'tsx', resolveDir: process.cwd() }));
  } }],
}).then(result => result.outputFiles[0].text);

const promotion = { id: 7, packageId: 21, packageName: 'Rodzinna', serviceName: 'Sesja', label: 'Jesień', discountType: 'percentage', discountValue: 10,
  regularPrice: 60000, price: 54000, lowestPrice30d: 60000, referenceSource: 'AUTO_HISTORY', referencePeriod: 'THIRTY_DAYS',
  startsAt: '2026-01-01', endsAt: null, allowPromoCode: true, showOnHome: true, displayDiscountPercent: 10, legalText: 'Cena testowa' };
const services = [{ id: 2, name: 'Sesja', is_active: true, packages: [
  { id: 20, service_id: 2, name: 'Klasyczna', hours: 1, price: 60000, order: 1, is_active: true },
  { id: 21, service_id: 2, name: 'Rodzinna', hours: 1, price: 54000, order: 2, is_active: true, promotion },
] }];

async function harness(options: { consent?: string; excluded?: boolean } = {}) {
  const errors: string[] = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (error: Error) => errors.push(error.message));
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: 'https://wlasniewski.pl/rezerwacja', runScripts: 'dangerously', virtualConsole: vc,
  });
  const win = dom.window as any;
  win.MessageChannel = class { port1: { onmessage: (() => void) | null } = { onmessage: null }; port2 = { postMessage: () => setTimeout(() => this.port1.onmessage?.(), 0) }; };
  win.alert = () => {};
  win.__qaCart = [];
  win.localStorage.setItem('cookie_consent', options.consent ?? 'accepted');
  if (options.excluded) win.localStorage.setItem('analytics_exclude', 'true');
  const events: Array<{ event_type: string; metadata: Record<string, any> }> = [];
  let codeResult: 'success' | 'gift' | 'invalid' | 'network' = 'invalid';
  const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
  win.fetch = async (url: string, init: RequestInit = {}) => {
    if (url === '/api/analytics/v2/track') {
      events.push(JSON.parse(String(init.body)).event);
      return json({ ok: true });
    }
    if (url === '/api/service-types') return json({ serviceTypes: services });
    if (url === '/api/booking/drone-catalog') return json({ packages: [], areas: [], booking: { goalLabel: 'Cel', goalOptions: [] } });
    if (url === '/api/settings/public') return json({ settings: {} });
    if (url.startsWith('/api/pages?')) return json({ success: false });
    if (url.startsWith('/api/bookings?')) return json({ availability: {}, minBookingDate: '2020-01-01' });
    if (url.startsWith('/api/availability?')) return json({ slots: [{ start: '18:00', end: '19:00', endDayOffset: 0, available: true }] });
    if (url === '/api/promo-codes/check') {
      if (codeResult === 'network') throw new Error('fixture offline');
      if (codeResult === 'gift') return json({ success: true, giftCard: { amount: 10 } });
      if (codeResult === 'success') return json({ success: true, discount: { code: 'SECRET-PROMO', value: 5, type: 'percentage' } });
      return json({ success: false });
    }
    throw new Error(`Unexpected API boundary ${url}`);
  };
  win.eval(await bundle);
  const flush = async (action: () => void = () => {}) => {
    await win.__qaAct(async () => { action(); await new Promise(resolve => setImmediate(resolve)); });
  };
  const element = (selector: string) => {
    const found = win.document.querySelector(selector);
    assert.ok(found, `Missing control: ${selector}`);
    return found as any;
  };
  const click = async (selector: string) => flush(() => element(selector).click());
  const fill = async (field: string, value: string, blur = true) => {
    const input = element(`[data-booking-field="${field}"]`);
    await flush(() => {
      input.focus();
      const prototype = input.tagName === 'TEXTAREA' ? win.HTMLTextAreaElement.prototype : win.HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(input, value);
      input.dispatchEvent(new win.Event('input', { bubbles: true }));
    });
    if (blur) await flush(() => input.blur());
  };
  const chooseSlot = async () => {
    await click('[data-analytics="service_select"]');
    await click('[data-analytics="package_select"]');
    await click('button[aria-label="Następny miesiąc"]');
    const date = new Date();
    date.setMonth(date.getMonth() + 1, 15);
    const dateISO = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-15`;
    await click(`button[title="${dateISO}"]`);
    await flush(() => {
      const select = element('#booking-start-time');
      select.value = '18:00';
      select.dispatchEvent(new win.Event('change', { bubbles: true }));
    });
    return dateISO;
  };
  await flush(() => win.__qaMount());
  return { win, events, errors, flush, element, click, fill, chooseSlot,
    setCodeResult: (value: typeof codeResult) => { codeResult = value; },
    close: async () => { await flush(() => win.__qaRoot.unmount()); dom.window.close(); },
  };
}

test('real booking page and tracker record choices, validation, promotion and cart without field contents', async () => {
  const qa = await harness();
  try {
    const date = await qa.chooseSlot();
    await qa.click('[data-analytics="add_to_cart"]');
    assert.equal(qa.win.__qaCart.length, 0, 'invalid booking never enters cart');
    assert.ok(qa.events.some(event => event.event_type === 'v2_booking_validation_failed'));
    assert.ok(qa.events.some(event => event.event_type === 'v2_booking_field_state' && event.metadata.field === 'name' && event.metadata.state === 'invalid'));
    const beforeTyping = qa.events.filter(event => event.event_type === 'v2_booking_field_state').length;
    await qa.fill('name', 'PRIVATE-NAME', false);
    assert.equal(qa.events.filter(event => event.event_type === 'v2_booking_field_state').length, beforeTyping, 'no per-keystroke snapshots');
    await qa.flush(() => qa.element('[data-booking-field="name"]').blur());
    await qa.fill('name', 'PRIVATE-EDIT');
    assert.equal(qa.events.filter(event => event.event_type === 'v2_booking_field_state' && event.metadata.field === 'name' && event.metadata.state === 'filled').length, 1, 'filled -> filled is deduplicated');
    await qa.fill('email', 'PRIVATE-INVALID-EMAIL');
    await qa.fill('email', 'private@example.test');
    await qa.fill('phone', '530788694');
    await qa.fill('notes', 'PRIVATE-NOTES');
    await qa.click('[data-booking-field="rodo"]');
    await qa.fill('promo_code', 'SECRET-PROMO');
    await qa.click('[data-analytics="promo_apply"]');
    assert.ok(qa.events.some(event => event.event_type === 'v2_booking_code_result' && event.metadata.reason_code === 'invalid_code'));
    qa.setCodeResult('success');
    await qa.click('[data-analytics="promo_apply"]');
    await qa.click('[data-analytics="promo_remove"]');
    assert.ok(qa.events.some(event => event.event_type === 'v2_booking_field_state' && event.metadata.field === 'promo_code' && event.metadata.state === 'empty'));
    await qa.fill('promo_code', 'SECRET-PROMO');
    assert.equal(qa.events.filter(event => event.event_type === 'v2_booking_field_state' && event.metadata.field === 'promo_code' && event.metadata.state === 'filled').length, 2, 'clear resets the field-state deduplication');
    await qa.click('[data-analytics="promo_apply"]');
    qa.setCodeResult('gift');
    await qa.fill('gift_card_code', 'SECRET-GIFT');
    await qa.click('[data-analytics="gift_card_apply"]');
    await qa.click('[data-analytics="gift_card_remove"]');
    assert.ok(qa.events.some(event => event.event_type === 'v2_booking_field_state' && event.metadata.field === 'gift_card_code' && event.metadata.state === 'empty'));
    await qa.fill('gift_card_code', 'SECRET-GIFT');
    assert.equal(qa.events.filter(event => event.event_type === 'v2_booking_field_state' && event.metadata.field === 'gift_card_code' && event.metadata.state === 'filled').length, 2);
    await qa.click('[data-analytics="add_to_cart"]');
    assert.equal(qa.win.__qaCart.length, 1);
    assert.equal(qa.win.__qaCart[0].metadata.email, 'private@example.test', 'business payload still contains required booking contact');
    const added = qa.events.find(event => event.event_type === 'v2_booking_added_to_cart');
    assert.equal(added?.metadata.booking_date, date);
    assert.equal(added?.metadata.booking_time, '18:00');
    assert.equal(added?.metadata.package_name, 'Klasyczna');
    assert.ok(qa.events.some(event => event.event_type === 'v2_click' && event.metadata.analytics_id === 'add_to_cart'));
    assert.ok(qa.events.some(event => event.event_type === 'v2_booking_field_state' && event.metadata.field === 'rodo' && event.metadata.state === 'checked'));
    await qa.click('[data-analytics="package_select"]:last-child');
    assert.ok(qa.events.some(event => event.event_type === 'v2_promotion_package_selected' && event.metadata.promotion_id === 7 && event.metadata.package_name === 'Rodzinna'));
    assert.doesNotMatch(JSON.stringify(qa.events), /PRIVATE-|private@example|530788694|SECRET-PROMO|SECRET-GIFT/);
    assert.deepEqual(qa.errors, []);
  } finally { await qa.close(); }
});

test('tracker never creates analytics identity or sends events without consent or with exclusion', async () => {
  for (const options of [{ consent: 'rejected' }, { excluded: true }]) {
    const qa = await harness(options);
    try {
      await qa.chooseSlot();
      await qa.fill('name', 'PRIVATE-NAME');
      await qa.click('[data-analytics="add_to_cart"]');
      assert.equal(qa.events.length, 0);
      assert.equal(qa.win.localStorage.getItem('analytics_v2_user_id'), null);
      assert.equal(qa.win.localStorage.getItem('analytics_v2_session'), null);
    } finally { await qa.close(); }
  }
});

test('consent withdrawal stops installed listeners and arbitrary button labels never enter analytics', async () => {
  const qa = await harness();
  try {
    await qa.chooseSlot();
    await qa.flush(() => {
      const button = qa.win.document.createElement('button');
      button.type = 'button';
      button.id = 'PRIVATE-ID'; button.setAttribute('aria-label', 'private@example.test'); button.textContent = 'PRIVATE-TEXT';
      qa.win.document.body.append(button); button.click(); button.remove();
    });
    assert.doesNotMatch(JSON.stringify(qa.events), /PRIVATE-ID|PRIVATE-TEXT|private@example/);
    const count = qa.events.length;
    await qa.flush(() => {
      qa.win.localStorage.setItem('cookie_consent', 'rejected');
      qa.win.dispatchEvent(new qa.win.Event('cookie-consent-changed'));
    });
    await qa.fill('email', 'private@example.test');
    await qa.click('[data-analytics="add_to_cart"]');
    assert.equal(qa.events.length, count);
  } finally { await qa.close(); }
});
