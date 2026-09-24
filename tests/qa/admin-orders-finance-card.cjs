const { assert, mount, reset, field, set, check } = require('./gallery-shop-dom.cjs');
const Module = require('node:module');
const original = Module._load;
const router = { push() {}, replace() {} };
Module._load = function(name, ...args) {
  if (name === 'next/navigation') return { useRouter: () => router };
  return original.call(this, name, ...args);
};
const Orders = require('../../src/app/admin/bookings/orders/page.tsx').default;
const row = (id, amount, currency, status, galleryId) => ({ id: `GL-${id}`, rawId: id, type: 'gallery_photo', galleryId, galleryName: `Galeria ${galleryId}`, customerName: 'QA', customerEmail: 'qa@example.test', createdAt: '2026-09-24', amount, currency, status });
(async () => {
  let calls = [];
  const rows = [row(1, 10000, 'PLN', 'paid', 26), row(2, 20000, 'PLN', 'completed', 27), row(3, 99999, 'EUR', 'paid', 26), row(4, 30000, 'PLN', 'pending', 26), row(5, 40000, 'PLN', 'refunded', 26)];
  global.fetch = async (url, init = {}) => { calls.push({ url, method: init.method || 'GET' }); return Response.json({ success: true, orders: rows }); };
  await check('orders finance card sums paid/completed PLN only, explains scope and links to actuals', async () => {
    window.history.replaceState({}, '', '/admin/bookings/orders'); await mount(Orders);
    const card = document.querySelector('[data-testid="paid-order-value-pln"]');
    assert.match(card.textContent, /Wartość opłaconych zamówień · PLN/);
    assert.match(card.textContent, /300.00 PLN/); assert.doesNotMatch(card.textContent, /1299.99|Przychód opłacony/);
    assert.match(card.textContent, /2 zamówień w PLN/); assert.match(card.textContent, /walutach: 1/);
    assert.match(card.textContent, /bez zastosowania filtrów/); assert.match(card.textContent, /bez rozliczenia zwrotów/);
    assert.ok(card.querySelector('a[href="/admin/analytics?view=sales"]'));
  });
  await check('filtering orders does not silently change the explicitly all-loaded PLN value; no mutation is sent', async () => {
    await set(field('Galeria'), '26'); await set(field('Status płatności'), 'paid');
    assert.equal(document.querySelectorAll('tbody tr').length, 2);
    assert.match(document.querySelector('[data-testid="paid-order-value-pln"]').textContent, /300.00 PLN/);
    assert.ok(calls.every(call => call.method === 'GET'));
  });
  await reset();
})().catch(error => { console.error(error); process.exitCode = 1; });
