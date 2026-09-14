/** ShipX PL adapter. Secrets stay server-side. No automatic retries of billable requests. */
import { ShopValidationError, type ShopDelivery } from '@/lib/galleries/merchandise';
import { isShopQa } from '@/lib/shop-qa';
export type ShipXShipment = { id: number; status: string; tracking_number?: string | null; reference?: string };
export type ShipXDispatch = { id: number; status: string };
export type ParcelInput = { template?: 'small' | 'medium' | 'large'; length?: number; width?: number; height?: number; weight: number };
export type Sender = { company_name?: string; first_name?: string; last_name?: string; email: string; phone: string; address: { street: string; building_number: string; city: string; post_code: string; country_code: 'PL' } };
export function inpostConfiguration() {
 const environment = process.env.INPOST_ENVIRONMENT || 'sandbox';
 const missing: string[] = [];
 if (!['sandbox', 'production'].includes(environment)) missing.push('INPOST_ENVIRONMENT: sandbox lub production');
 if (!process.env.INPOST_API_TOKEN) missing.push('INPOST_API_TOKEN');
 if (!/^\d+$/.test(process.env.INPOST_ORGANIZATION_ID || '')) missing.push('INPOST_ORGANIZATION_ID');
 let sender: Sender | undefined;
 if (process.env.INPOST_SENDER_JSON) {
  try { const value = JSON.parse(process.env.INPOST_SENDER_JSON); if (!value?.email || !/^\d{9}$/.test(value.phone) || !value.address?.street || !value.address?.building_number || !value.address?.city || !/^\d{2}-\d{3}$/.test(value.address.post_code) || !(value.company_name || value.first_name && value.last_name)) throw Error(); sender = { company_name: value.company_name, first_name: value.first_name, last_name: value.last_name, email: value.email, phone: value.phone, address: {street: value.address.street, building_number: value.address.building_number, city: value.address.city, post_code: value.address.post_code, country_code: 'PL'} }; }
  catch { missing.push('Poprawny INPOST_SENDER_JSON'); }
 }
 const courierService = process.env.INPOST_COURIER_SERVICE || 'inpost_courier_c2c';
 if (!['inpost_courier_c2c', 'inpost_courier_standard'].includes(courierService)) missing.push('INPOST_COURIER_SERVICE: inpost_courier_c2c lub inpost_courier_standard');
 return { environment, missing, sender, courierService, organizationId: process.env.INPOST_ORGANIZATION_ID || '', base: environment === 'production' ? 'https://api-shipx-pl.easypack24.net/v1' : 'https://sandbox-api-shipx-pl.easypack24.net/v1' };
}
export async function shipX<T>(path: string, method = 'GET', body?: unknown, binary = false): Promise<T> {
 const config = inpostConfiguration();
 if (isShopQa() && config.environment === 'production' && method !== 'GET') throw new ShopValidationError('Testy sklepu wymagają testowego konta InPost. Nadanie produkcyjne jest zablokowane.',503);
 if (config.missing.length) throw new ShopValidationError('Uzupełnij konfigurację InPost w ustawieniach serwera.', 503);
 let response: Response;
 try { response = await fetch(`${config.base}${path}`, {method, headers: {Authorization: `Bearer ${process.env.INPOST_API_TOKEN}`, 'Content-Type': 'application/json'}, ...(body === undefined ? {} : {body: JSON.stringify(body)}), cache: 'no-store', signal: AbortSignal.timeout(20000), redirect: 'error'}); }
 catch { throw new ShopValidationError('Brak potwierdzenia InPost. Nie ponawiaj nadania — najpierw sprawdź przesyłkę.', 502); }
 if (!response.ok) throw new ShopValidationError(`InPost odrzucił operację (HTTP ${response.status}). Sprawdź dane, środki i uprawnienia konta w ShipX.`, 502);
 if (response.status === 204) return undefined as T;
 if (binary) { const data = await response.arrayBuffer(); if (new TextDecoder().decode(data.slice(0, 5)) !== '%PDF-') throw new ShopValidationError('InPost nie zwrócił poprawnej etykiety PDF.', 502); return data as T; }
 return await response.json() as T;
}
export function shipmentPayload(delivery: ShopDelivery, parcel: ParcelInput, reference: string) {
 if (!parcel || !Number.isFinite(parcel.weight) || parcel.weight < 0.01 || parcel.weight > 25) throw new ShopValidationError('Podaj wagę od 0,01 do 25 kg.');
 const phone = delivery.phone.replace(/\D/g, '').replace(/^48(?=\d{9}$)/, '');
 if (!/^\d{9}$/.test(phone)) throw new ShopValidationError('InPost wymaga polskiego numeru telefonu z 9 cyframi.');
 const names = delivery.recipientName.trim().split(/\s+/); if (names.length < 2) throw new ShopValidationError('Uzupełnij imię i nazwisko odbiorcy.');
 const config = inpostConfiguration();
 const receiver = { first_name: names[0], last_name: names.slice(1).join(' '), email: delivery.email, phone, ...(delivery.method === 'courier' ? {address: {line1: delivery.address?.street, city: delivery.address?.city, post_code: delivery.address?.postalCode, country_code: 'PL'}} : {}) };
 let parcels: unknown[];
 if (delivery.method === 'locker') { if (!['small','medium','large'].includes(parcel.template || '') || !delivery.pointCode) throw new ShopValidationError('Wybierz gabaryt i sprawdź kod Paczkomatu.'); parcels = [{template: parcel.template, weight: {amount: parcel.weight, unit: 'kg'}}]; }
 else { const dimensions = [parcel.length,parcel.width,parcel.height]; if (dimensions.some(v => !Number.isInteger(v) || v! < 1 || v! > 1200) || dimensions.reduce<number>((sum,v) => sum + v!, 0) > 2200 || !delivery.address?.street || !delivery.address?.city || !delivery.address?.postalCode) throw new ShopValidationError('Podaj adres i wymiary standardowej paczki w mm (maks. 1200 mm bok, 2200 mm suma).'); parcels = [{dimensions: {length: parcel.length, width: parcel.width, height: parcel.height, unit: 'mm'}, weight: {amount: parcel.weight, unit: 'kg'}, is_non_standard: false}]; }
 return {receiver, ...(config.sender ? {sender: config.sender} : {}), parcels, reference, service: delivery.method === 'locker' ? 'inpost_locker_standard' : config.courierService, custom_attributes: {sending_method: 'dispatch_order', ...(delivery.method === 'locker' ? {target_point: delivery.pointCode} : {})}};
}
export const createShipment = (payload: ReturnType<typeof shipmentPayload>) => shipX<ShipXShipment>(`/organizations/${inpostConfiguration().organizationId}/shipments`, 'POST', payload);
export const getShipment = (id: number) => shipX<ShipXShipment>(`/shipments/${id}`);
export const cancelShipment = (id: number) => shipX<void>(`/shipments/${id}`, 'DELETE');
export const getShipmentLabel = (id: number) => shipX<ArrayBuffer>(`/shipments/${id}/label?format=Pdf&type=normal`, 'GET', undefined, true);
export function createDispatch(id: number) {
 const config = inpostConfiguration(); const sender = config.sender;
 if (!sender) throw new ShopValidationError('Do zamówienia kuriera uzupełnij INPOST_SENDER_JSON: nazwę, telefon, e-mail i adres odbioru.', 503);
 return shipX<ShipXDispatch>(`/organizations/${config.organizationId}/dispatch_orders`, 'POST', {shipments: [id], name: sender.company_name || `${sender.first_name} ${sender.last_name}`, phone: sender.phone, email: sender.email, address: sender.address});
}
