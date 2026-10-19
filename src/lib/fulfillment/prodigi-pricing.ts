/** Browser-safe decimal calculator. PLN values are strings; results are integer grosze. */
export function decimalCents(value: string): bigint {
  if (!/^\d{1,9}(?:\.\d{1,2})?$/.test(value)) throw new RangeError('Podaj nieujemną kwotę z maksymalnie dwoma miejscami po przecinku.');
  const [whole, fraction = ''] = value.split('.');
  return BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, '0'));
}
export function formatCents(value: bigint): string {
  const sign = value < BigInt(0) ? '-' : ''; const amount = value < BigInt(0) ? -value : value;
  return `${sign}${amount / BigInt(100)}.${String(amount % BigInt(100)).padStart(2, '0')}`;
}
export function calculateProdigiPrice(input: { supplierTotal: string; customerShipping: string; copies: number; marginPercent: string; bankFeePercent?: string; bankFeeFixed?: string }) {
  if (!Number.isSafeInteger(input.copies) || input.copies < 1 || input.copies > 100) throw new RangeError('Ilość musi wynosić od 1 do 100.');
  const supplier = decimalCents(input.supplierTotal), shipping = decimalCents(input.customerShipping);
  const margin = decimalCents(input.marginPercent), fee = decimalCents(input.bankFeePercent || '0'), fixedFee = decimalCents(input.bankFeeFixed || '0');
  const denominator = BigInt(10000) - margin - fee;
  if (denominator <= BigInt(0)) throw new RangeError('Suma marży i procentowej prowizji musi być mniejsza niż 100%.');
  const numerator = (supplier + fixedFee) * BigInt(10000) - shipping * denominator;
  const divisor = denominator * BigInt(input.copies);
  const unitCents = numerator <= BigInt(0) ? BigInt(0) : (numerator + divisor - BigInt(1)) / divisor;
  const revenue = unitCents * BigInt(input.copies) + shipping;
  return { unitPrice: formatCents(unitCents), revenue: formatCents(revenue), supplierCost: formatCents(supplier), customerShipping: formatCents(shipping) };
}
