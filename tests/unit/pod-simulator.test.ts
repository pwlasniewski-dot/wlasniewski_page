import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePodScenario, decodePodScenario, DEFAULT_POD_SCENARIO, encodePodScenario,
  POD_FIELD_RULES, POD_SCENARIO_VERSION, podDraftToScenario, podScenarioErrors,
  podScenarioToDraft, validatePodScenario, type PodNumericField, type PodScenario,
} from '../../src/lib/analytics/pod-simulator';

const base = (changes: Partial<PodScenario> = {}): PodScenario => ({ ...DEFAULT_POD_SCENARIO, ...changes });
const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 0.000001, `${actual} != ${expected}`);

test('scenario separates revenue, cash surplus and work-adjusted profit; advertising is deducted once', () => {
  const result = calculatePodScenario(base());
  assert.equal(result.expectedOrders, 10);
  assert.equal(result.monthlyRevenue, 1990);
  assert.equal(result.monthlySupplierCost, 1100);
  close(result.monthlyPaymentFees, 42.8);
  close(result.monthlyClaimsReserve, 39.8);
  close(result.monthlyWorkCost, 100);
  close(result.monthlyCashSurplus, 407.4);
  close(result.monthlyProfit, 307.4);
  close(result.contributionPerOrder, 70.74);
  close(result.advertisingPerOrder!, 30);
  close(result.monthlyRevenue - result.monthlySupplierCost - result.monthlyPaymentFees - result.monthlyClaimsReserve - result.monthlyWorkCost - 300 - 100, result.monthlyProfit);
});

test('break-even and target round to enough complete orders, including ongoing work costs', () => {
  const result = calculatePodScenario(base());
  assert.equal(result.breakEvenOrders, 6);
  assert.equal(result.breakEvenVisits, 600);
  assert.equal(result.targetOrders, 289);
  assert.equal(result.targetVisits, 28900);
  close(result.targetWorkHours!, 289 / 6);
  const target = calculatePodScenario(base({ monthlyVisits: result.targetVisits! }));
  assert.ok(target.monthlyProfit >= DEFAULT_POD_SCENARIO.targetMonthlyProfit);
  const below = calculatePodScenario(base({ monthlyVisits: result.targetVisits! - 100 }));
  assert.ok(below.monthlyProfit < DEFAULT_POD_SCENARIO.targetMonthlyProfit);
});

test('ROI subtracts initial investment and uses explicit horizon; payback uses positive monthly profit', () => {
  const result = calculatePodScenario(base());
  close(result.periodProfitAfterInvestment, 1688.8);
  close(result.roiPercent!, 84.44);
  close(result.paybackMonths!, 2000 / 307.4);
  const singleMonth = calculatePodScenario(base({ horizonMonths: 1 }));
  close(singleMonth.periodProfitAfterInvestment, -1692.6);
  close(singleMonth.roiPercent!, -84.63);
});

test('no traffic or zero conversion retains monthly overhead, never invents CAC or payback', () => {
  for (const changes of [{ monthlyVisits: 0 }, { conversionPercent: 0 }]) {
    const result = calculatePodScenario(base(changes));
    assert.equal(result.expectedOrders, 0);
    assert.equal(result.monthlyProfit, -400);
    assert.equal(result.advertisingPerOrder, null);
    assert.equal(result.paybackMonths, null);
    assert.equal(result.roiPercent, -340);
  }
  const zeroConversion = calculatePodScenario(base({ conversionPercent: 0 }));
  assert.equal(zeroConversion.targetVisits, null);
  assert.equal(zeroConversion.breakEvenVisits, null);
});

test('zero and negative margin cannot fund positive fixed costs or target', () => {
  for (const averageOrderValue of [0, 50, 110]) {
    const result = calculatePodScenario(base({ averageOrderValue, paymentFeePercent: 0, paymentFeeFixed: 0, claimsReservePercent: 0, minutesPerOrder: 0 }));
    assert.ok(result.contributionPerOrder <= 0);
    assert.equal(result.breakEvenOrders, null);
    assert.equal(result.targetOrders, null);
    assert.equal(result.targetVisits, null);
    assert.equal(result.paybackMonths, null);
  }
});

test('zero costs and zero target have zero break-even, while free startup makes ROI undefined', () => {
  const result = calculatePodScenario(base({ monthlyAdvertisingCost: 0, monthlyFixedCost: 0, startupCost: 0, targetMonthlyProfit: 0 }));
  assert.equal(result.breakEvenOrders, 0);
  assert.equal(result.breakEvenVisits, 0);
  assert.equal(result.targetOrders, 0);
  assert.equal(result.roiPercent, null);
  assert.equal(result.paybackMonths, 0);
  const zeroResult = calculatePodScenario(base({ monthlyVisits: 0, monthlyAdvertisingCost: 0, monthlyFixedCost: 0, startupCost: 0 }));
  assert.equal(zeroResult.monthlyProfit, 0);
  assert.equal(zeroResult.paybackMonths, null);
});

test('100% conversion is valid and percentages may reveal an unprofitable offer', () => {
  const result = calculatePodScenario(base({ conversionPercent: 100, paymentFeePercent: 100, claimsReservePercent: 100 }));
  assert.equal(result.expectedOrders, 1000);
  assert.ok(result.monthlyProfit < 0);
  assert.equal(result.targetOrders, null);
});

test('fractional expected orders remain visible; only target thresholds are rounded', () => {
  const result = calculatePodScenario(base({ monthlyVisits: 50, conversionPercent: 1 }));
  assert.equal(result.expectedOrders, 0.5);
  close(result.monthlyRevenue, 99.5);
  close(result.monthlyProfit, -364.63);
});

test('reject every nonfinite/negative numeric field, fractions in count fields and invalid percentages', () => {
  for (const field of Object.keys(POD_FIELD_RULES) as PodNumericField[]) {
    for (const invalid of [NaN, Infinity, -Infinity, -1, undefined, null, '10']) {
      assert.throws(() => calculatePodScenario({ ...base(), [field]: invalid } as PodScenario), field);
    }
    assert.throws(() => calculatePodScenario(base({ [field]: POD_FIELD_RULES[field].max + 1 })), field);
  }
  assert.throws(() => calculatePodScenario(base({ monthlyVisits: 1.5 })));
  assert.throws(() => calculatePodScenario(base({ horizonMonths: 1.5 })));
  assert.throws(() => calculatePodScenario(base({ horizonMonths: 0 })));
  assert.throws(() => validatePodScenario(null));
  assert.throws(() => validatePodScenario([]));
});

test('cash versus net is explicit and does not secretly convert entered prices or operator fees', () => {
  const cash = calculatePodScenario(base({ amountBasis: 'cash' }));
  const net = calculatePodScenario(base({ amountBasis: 'net' }));
  assert.deepEqual(cash, net);
  assert.throws(() => validatePodScenario({ ...base(), amountBasis: 'gross' }));
});

test('Polish decimal inputs parse, but blank controls and malformed numbers remain errors', () => {
  const draft = podScenarioToDraft(base());
  draft.paymentFeePercent = '2,5';
  close(podDraftToScenario(draft).paymentFeePercent, 2.5);
  for (const invalid of ['', ' ', 'abc', 'Infinity', '1e10', '0x10', '-1', '1,2,3']) {
    const candidate = podDraftToScenario({ ...draft, monthlyVisits: invalid });
    assert.ok(podScenarioErrors(candidate).monthlyVisits, invalid);
  }
});

test('local persisted scenario round-trips through schema/version validation and strips unknown keys', () => {
  const scenario = base({ monthlyVisits: 1234, amountBasis: 'net' });
  const encoded = encodePodScenario({ ...scenario, unexpected: 'not persisted' } as PodScenario, '2026-09-24T10:00:00.000Z');
  assert.deepEqual(decodePodScenario(encoded), { scenario, savedAt: '2026-09-24T10:00:00.000Z' });
  assert.equal(encoded.includes('unexpected'), false);
  assert.throws(() => encodePodScenario(base(), 'invalid'));
});

test('corrupt, unversioned, future-version and invalid local data never feed the calculator', () => {
  const envelope = { version: POD_SCENARIO_VERSION, scenario: base(), savedAt: '2026-09-24T10:00:00.000Z' };
  for (const raw of [null, '', 'not JSON', 'null', '[]', '{}', JSON.stringify(base()), JSON.stringify({ ...envelope, version: 999 }), JSON.stringify({ ...envelope, savedAt: 'invalid' }), JSON.stringify({ ...envelope, scenario: { ...base(), conversionPercent: 101 } }), JSON.stringify({ ...envelope, scenario: { ...base(), averageOrderValue: null } })]) {
    assert.equal(decodePodScenario(raw), null, String(raw));
  }
});
