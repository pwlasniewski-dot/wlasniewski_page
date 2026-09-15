import type { ShopMetadata, PricedShopLine } from './merchandise';

export const orderMoney = (amount: number) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(amount / 100);
export const orderPhotoIds = (metadata: ShopMetadata) => [...new Set(metadata.lines.flatMap(line => line.kind === 'print' ? [line.photoId] : line.photoIds))];
export const orderAccountPath = (id: number) => `/konto?tab=orders&order=${id}`;
export function safeOrderImage(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null; } catch { return null; }
}
export function orderLineDetails(line: PricedShopLine) {
  return line.kind === 'print'
    ? [line.format?.label, line.format?.paper, `Zdjęcie #${line.photoId}`, 'Całe zdjęcie — bez przycinania'].filter(Boolean).join(' · ')
    : `${line.photoIds.length} zdjęć · okładka #${line.coverPhotoId}`;
}
export const paymentLabel = (status: string) => ({paid:'Opłacone',pending:'Oczekujemy na potwierdzenie płatności',initializing:'Przygotowanie płatności',failed_init:'Płatność wymaga sprawdzenia',cancelled:'Płatność anulowana',rejected:'Płatność odrzucona'}[status] || 'Płatność wymaga sprawdzenia');
export const fulfillmentLabel = (status: string) => ({new:'Przyjęte do realizacji',ordered:'Zamówione w laboratorium',received:'Odebrane z laboratorium',packed:'Przygotowane do wysyłki / odbioru',shipped:'Wysłane',collected:'Odebrane osobiście'}[status] || status);
export function orderDeliveryLabel(metadata: ShopMetadata) {
  const d = metadata.delivery;
  return d.method === 'pickup' ? `Odbiór osobisty. ${d.instructions || ''}` : d.method === 'locker' ? `InPost Paczkomat ${d.pointCode || ''}` : `Kurier · ${d.address?.street || ''}, ${d.address?.postalCode || ''} ${d.address?.city || ''}`;
}
