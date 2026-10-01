const { assert, check, mount, reset, click, button, field, set } = require('./gallery-shop-dom.cjs');
const Simulator = require('../../src/components/admin/analytics/PodRevenueSimulator.tsx').default;
const { POD_SCENARIO_STORAGE_KEY, DEFAULT_POD_SCENARIO, encodePodScenario } = require('../../src/lib/analytics/pod-simulator.ts');
const result = () => document.querySelector('[data-testid="pod-monthly-profit"]')?.textContent.replace(/\s/g, '');

(async () => {
  await check('initial UI labels model versus facts, costs, work and device-only persistence', async () => {
    localStorage.clear(); await mount(Simulator);
    assert.ok(document.body.textContent.includes('SCENARIUSZ · NIE DANE SPRZEDAŻOWE'));
    assert.ok(document.body.textContent.includes('przed PIT i ZUS'));
    assert.ok(document.body.textContent.includes('Nie trafia na serwer'));
    assert.equal(result(), '307,40zł');
    assert.equal(localStorage.getItem(POD_SCENARIO_STORAGE_KEY), null);
  });
  await check('editing a Polish decimal changes calculated profit; empty input hides results and disables saving', async () => {
    await set(field('Średni koszyk z dostawą (zł)'), '249,50');
    assert.equal(result(), '792,20zł');
    await set(field('Wizyty w sklepie / miesiąc'), '');
    assert.equal(document.querySelector('[data-testid="pod-results"]'), null);
    assert.equal(button('Zapisz na urządzeniu').disabled, true);
    assert.equal(field('Wizyty w sklepie / miesiąc').getAttribute('aria-invalid'), 'true');
    await set(field('Wizyty w sklepie / miesiąc'), '1000');
    assert.equal(result(), '792,20zł');
  });
  await check('save, edit, read and remount preserve explicitly saved scenario only', async () => {
    await click(button('Zapisz na urządzeniu'));
    const saved = JSON.parse(localStorage.getItem(POD_SCENARIO_STORAGE_KEY));
    assert.equal(saved.scenario.averageOrderValue, 249.5);
    await set(field('Średni koszyk z dostawą (zł)'), '50');
    await click(button('Wczytaj zapis'));
    assert.equal(result(), '792,20zł');
    await reset(); await mount(Simulator);
    assert.equal(result(), '307,40zł');
    await click(button('Wczytaj zapis'));
    assert.equal(result(), '792,20zł');
  });
  await check('malformed local state does not overwrite active inputs; reset clears record and restores example', async () => {
    localStorage.setItem(POD_SCENARIO_STORAGE_KEY, '{broken');
    await click(button('Wczytaj zapis'));
    assert.equal(result(), '792,20zł');
    assert.ok(document.querySelector('[role="status"]').textContent.includes('nieprawidłowy'));
    await click(button('Resetuj przykład i zapis'));
    assert.equal(result(), '307,40zł');
    assert.equal(localStorage.getItem(POD_SCENARIO_STORAGE_KEY), null);
    await click(button('Wczytaj zapis'));
    assert.ok(document.querySelector('[role="status"]').textContent.includes('nie ma zapisanego'));
  });
  await check('non-positive margin and zero conversion explain unreachable goals without NaN/Infinity', async () => {
    await set(field('Dostawca i dostawa / zamówienie (zł)'), '400');
    assert.ok(document.querySelector('[role="alert"]').textContent.includes('Dodatkowe zamówienia nie poprawiają wyniku'));
    assert.ok(document.body.textContent.includes('Nieosiągalny przy tej marży'));
    await set(field('Konwersja wizyt na opłacone zamówienia (%)'), '0');
    assert.equal(result(), '-400,00zł');
    assert.ok(document.body.textContent.includes('Konwersja wynosi 0%'));
    assert.ok(!/NaN|Infinity/.test(document.body.textContent));
  });
  await check('net basis retains numbers and clearly requires manual conversion of comparable costs', async () => {
    await click(button('Resetuj przykład i zapis'));
    await set(field('Baza wszystkich kwot'), 'net');
    assert.equal(result(), '307,40zł');
    assert.ok(document.body.textContent.includes('Przełączenie nie przelicza ani nie zmienia liczb'));
    await click(button('Zapisz na urządzeniu'));
    assert.equal(JSON.parse(localStorage.getItem(POD_SCENARIO_STORAGE_KEY)).scenario.amountBasis, 'net');
  });
  await check('blocked storage reports real failure and does not claim a successful save/read/reset', async () => {
    const prototype = Object.getPrototypeOf(localStorage);
    const original = { getItem: prototype.getItem, setItem: prototype.setItem, removeItem: prototype.removeItem };
    for (const method of Object.keys(original)) prototype[method] = () => { throw new Error('Storage unavailable'); };
    try {
      await click(button('Zapisz na urządzeniu'));
      assert.ok(document.querySelector('[role="status"]').textContent.includes('Nie udało się zapisać'));
      await click(button('Wczytaj zapis'));
      assert.ok(document.querySelector('[role="status"]').textContent.includes('Nie udało się odczytać'));
      await click(button('Resetuj przykład i zapis'));
      assert.ok(document.querySelector('[role="status"]').textContent.includes('Nie udało się usunąć'));
      assert.equal(result(), '307,40zł');
    } finally { Object.assign(prototype, original); }
  });
  await check('three customer-independent admin edit/save/load cycles remain consistent', async () => {
    for (let cycle = 1; cycle <= 3; cycle++) {
      localStorage.setItem(POD_SCENARIO_STORAGE_KEY, encodePodScenario({ ...DEFAULT_POD_SCENARIO, monthlyVisits: cycle * 1000 }));
      await click(button('Wczytaj zapis'));
      assert.equal(field('Wizyty w sklepie / miesiąc').value, String(cycle * 1000));
      await set(field('Docelowy miesięczny wynik (zł)'), String(cycle * 5000));
      await click(button('Zapisz na urządzeniu'));
      assert.equal(JSON.parse(localStorage.getItem(POD_SCENARIO_STORAGE_KEY)).scenario.targetMonthlyProfit, cycle * 5000);
    }
  });
  await reset();
})().catch(error => { console.error(error); process.exitCode = 1; });
