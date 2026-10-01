/** A scenario calculator, never a source of observed sales or tax calculations. */
export const POD_SCENARIO_VERSION = 1;
export const POD_SCENARIO_STORAGE_KEY = 'wlasniewski.admin.pod-scenario.v1';

export const POD_FIELD_RULES = {
  monthlyVisits: { label: 'Wizyty w sklepie / miesiąc', max: 100_000_000, integer: true },
  conversionPercent: { label: 'Konwersja wizyt na opłacone zamówienia (%)', max: 100, integer: false },
  averageOrderValue: { label: 'Średni koszyk z dostawą (zł)', max: 1_000_000, integer: false },
  supplierAndShippingCost: { label: 'Dostawca i dostawa / zamówienie (zł)', max: 1_000_000, integer: false },
  paymentFeePercent: { label: 'Opłata płatnicza (%)', max: 100, integer: false },
  paymentFeeFixed: { label: 'Opłata płatnicza / zamówienie (zł)', max: 100_000, integer: false },
  claimsReservePercent: { label: 'Rezerwa reklamacji i zwrotów (% koszyka)', max: 100, integer: false },
  monthlyAdvertisingCost: { label: 'Reklama / miesiąc (zł)', max: 10_000_000, integer: false },
  monthlyFixedCost: { label: 'Pozostałe stałe koszty / miesiąc (zł)', max: 10_000_000, integer: false },
  minutesPerOrder: { label: 'Obsługa zamówienia (minuty)', max: 10_000, integer: false },
  hourlyWorkValue: { label: 'Wartość własnej pracy (zł / godz.)', max: 100_000, integer: false },
  startupCost: { label: 'Jednorazowy koszt uruchomienia (zł)', max: 100_000_000, integer: false },
  targetMonthlyProfit: { label: 'Docelowy miesięczny wynik (zł)', max: 10_000_000, integer: false },
  horizonMonths: { label: 'Horyzont inwestycji (miesiące)', max: 120, integer: true },
} as const;

export type PodNumericField = keyof typeof POD_FIELD_RULES;
export type PodScenario = Record<PodNumericField, number> & { amountBasis: 'cash' | 'net' };
export type PodDraft = Record<PodNumericField, string> & { amountBasis: PodScenario['amountBasis'] };

export const DEFAULT_POD_SCENARIO: Readonly<PodScenario> = Object.freeze({
  amountBasis: 'cash', monthlyVisits: 1_000, conversionPercent: 1, averageOrderValue: 199,
  supplierAndShippingCost: 110, paymentFeePercent: 2, paymentFeeFixed: 0.3,
  claimsReservePercent: 2, monthlyAdvertisingCost: 300, monthlyFixedCost: 100,
  minutesPerOrder: 10, hourlyWorkValue: 60, startupCost: 2_000,
  targetMonthlyProfit: 20_000, horizonMonths: 12,
});

export function podScenarioErrors(value: unknown): Partial<Record<keyof PodScenario, string>> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { amountBasis: 'Nieprawidłowy scenariusz.' };
  const candidate = value as Record<string, unknown>;
  const errors: Partial<Record<keyof PodScenario, string>> = {};
  if (candidate.amountBasis !== 'cash' && candidate.amountBasis !== 'net') errors.amountBasis = 'Wybierz bazę kwot.';
  for (const key of Object.keys(POD_FIELD_RULES) as PodNumericField[]) {
    const rule = POD_FIELD_RULES[key];
    const minimum = key === 'horizonMonths' ? 1 : 0;
    const number = candidate[key];
    if (typeof number !== 'number' || !Number.isFinite(number) || number < minimum || number > rule.max || (rule.integer && !Number.isInteger(number))) {
      errors[key] = `Wpisz ${rule.integer ? 'liczbę całkowitą' : 'liczbę'} od ${minimum} do ${rule.max.toLocaleString('pl-PL')}.`;
    }
  }
  return errors;
}

export function validatePodScenario(value: unknown): PodScenario {
  const errors = podScenarioErrors(value);
  if (Object.keys(errors).length) throw new Error(Object.values(errors).join(' '));
  const source = value as PodScenario;
  const scenario = { amountBasis: source.amountBasis } as PodScenario;
  for (const key of Object.keys(POD_FIELD_RULES) as PodNumericField[]) scenario[key] = source[key];
  return scenario;
}

export function podScenarioToDraft(scenario: PodScenario): PodDraft {
  const draft = { amountBasis: scenario.amountBasis } as PodDraft;
  for (const key of Object.keys(POD_FIELD_RULES) as PodNumericField[]) draft[key] = String(scenario[key]);
  return draft;
}

export function podDraftToScenario(draft: PodDraft): PodScenario {
  const scenario = { amountBasis: draft.amountBasis } as PodScenario;
  for (const key of Object.keys(POD_FIELD_RULES) as PodNumericField[]) {
    const raw = draft[key]?.trim();
    // An empty control must show an error, not silently become zero.
    scenario[key] = raw && /^\d+(?:[.,]\d+)?$/.test(raw) ? Number(raw.replace(',', '.')) : Number.NaN;
  }
  return scenario;
}

export function calculatePodScenario(input: PodScenario) {
  const s = validatePodScenario(input);
  const expectedOrders = s.monthlyVisits * s.conversionPercent / 100;
  const paymentFeePerOrder = s.averageOrderValue * s.paymentFeePercent / 100 + s.paymentFeeFixed;
  const claimsReservePerOrder = s.averageOrderValue * s.claimsReservePercent / 100;
  const workCostPerOrder = s.minutesPerOrder / 60 * s.hourlyWorkValue;
  const cashContributionPerOrder = s.averageOrderValue - s.supplierAndShippingCost - paymentFeePerOrder - claimsReservePerOrder;
  const contributionPerOrder = cashContributionPerOrder - workCostPerOrder;
  const monthlyOverheads = s.monthlyAdvertisingCost + s.monthlyFixedCost;
  const monthlyRevenue = expectedOrders * s.averageOrderValue;
  const monthlyWorkHours = expectedOrders * s.minutesPerOrder / 60;
  const monthlyWorkCost = expectedOrders * workCostPerOrder;
  const monthlyCashSurplus = expectedOrders * cashContributionPerOrder - monthlyOverheads;
  const monthlyProfit = expectedOrders * contributionPerOrder - monthlyOverheads;
  const ordersForProfit = (profit: number) => {
    const requiredContribution = monthlyOverheads + profit;
    if (requiredContribution === 0) return 0;
    return contributionPerOrder > 0 ? Math.ceil(requiredContribution / contributionPerOrder) : null;
  };
  const visitsForOrders = (orders: number | null) => orders === 0 ? 0 : orders !== null && s.conversionPercent > 0 ? Math.ceil(orders / (s.conversionPercent / 100)) : null;
  const breakEvenOrders = ordersForProfit(0);
  const targetOrders = ordersForProfit(s.targetMonthlyProfit);
  const periodProfitAfterInvestment = monthlyProfit * s.horizonMonths - s.startupCost;
  return {
    expectedOrders, paymentFeePerOrder, claimsReservePerOrder, workCostPerOrder,
    cashContributionPerOrder, contributionPerOrder, monthlyOverheads, monthlyRevenue,
    monthlyWorkHours, monthlyWorkCost, monthlyCashSurplus, monthlyProfit,
    monthlySupplierCost: expectedOrders * s.supplierAndShippingCost,
    monthlyPaymentFees: expectedOrders * paymentFeePerOrder,
    monthlyClaimsReserve: expectedOrders * claimsReservePerOrder,
    advertisingPerOrder: expectedOrders > 0 ? s.monthlyAdvertisingCost / expectedOrders : null,
    breakEvenOrders, breakEvenVisits: visitsForOrders(breakEvenOrders),
    targetOrders, targetVisits: visitsForOrders(targetOrders),
    targetWorkHours: targetOrders === null ? null : targetOrders * s.minutesPerOrder / 60,
    paybackMonths: monthlyProfit > 0 ? s.startupCost / monthlyProfit : null,
    periodProfitAfterInvestment,
    roiPercent: s.startupCost > 0 ? periodProfitAfterInvestment / s.startupCost * 100 : null,
  };
}

export function encodePodScenario(scenario: PodScenario, savedAt = new Date().toISOString()): string {
  if (!Number.isFinite(Date.parse(savedAt))) throw new Error('Nieprawidłowa data zapisu.');
  return JSON.stringify({ version: POD_SCENARIO_VERSION, savedAt, scenario: validatePodScenario(scenario) });
}

export function decodePodScenario(raw: string | null): { scenario: PodScenario; savedAt: string } | null {
  if (!raw) return null;
  try {
    const stored: unknown = JSON.parse(raw);
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return null;
    const envelope = stored as Record<string, unknown>;
    if (envelope.version !== POD_SCENARIO_VERSION || typeof envelope.savedAt !== 'string' || !Number.isFinite(Date.parse(envelope.savedAt))) return null;
    return { scenario: validatePodScenario(envelope.scenario), savedAt: envelope.savedAt };
  } catch { return null; }
}
