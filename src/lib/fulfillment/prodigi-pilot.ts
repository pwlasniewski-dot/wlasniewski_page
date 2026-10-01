// Documented simple one-area examples. Eligibility for diagnostics is not approval for sale.
export const PRODIGI_PILOT_SKUS = ['GLOBAL-CAN-10X10', 'GLOBAL-FAP-10X10'] as const;
export function isProdigiPilotSku(sku: string) { return PRODIGI_PILOT_SKUS.some(value => value === sku.toUpperCase()); }
