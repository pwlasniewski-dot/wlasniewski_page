import prisma from '@/lib/db/prisma';
import { readShopMetadata, ShopValidationError } from '@/lib/galleries/merchandise';
import { inpostConfiguration } from './inpost';
export type ShipmentRecord = { version: 1; environment: string; organizationId: string; reference: string; state: 'creating' | 'created' | 'uncertain' | 'cancelled'; shipmentId?: number; status?: string; trackingNumber?: string | null; updatedAt: string; dispatch?: {state: 'creating' | 'created' | 'uncertain'; id?: number; status?: string} };
export const shipmentKey = (orderId: number) => `gallery_shipment_${orderId}`;
export async function shipmentOrder(params: {id: string; orderId: string}) {
 const galleryId = Number(params.id), orderId = Number(params.orderId);
 if (!Number.isSafeInteger(galleryId) || galleryId < 1 || !Number.isSafeInteger(orderId) || orderId < 1) throw new ShopValidationError('Nieprawidłowe zamówienie.');
 const order = await prisma.photoOrder.findFirst({where: {id: orderId, gallery_id: galleryId}}); const metadata = readShopMetadata(order?.product_ids);
 if (!order || !metadata) throw new ShopValidationError('Nie znaleziono zamówienia.', 404);
 if (order.payment_status !== 'paid') throw new ShopValidationError('Nadanie jest dostępne dla opłaconego zamówienia.', 409);
 if (metadata.delivery.method === 'pickup') throw new ShopValidationError('Odbiór osobisty nie wymaga przesyłki InPost.', 409);
 return {order, metadata};
}
export async function storedShipment(orderId: number) {
 const row = await prisma.setting.findUnique({where: {setting_key: shipmentKey(orderId)}});
 if (!row) return {raw: null, shipment: null};
 let shipment: ShipmentRecord;
 try { shipment = JSON.parse(row.setting_value || ''); if (shipment.version !== 1 || !shipment.reference) throw Error(); } catch { throw new ShopValidationError('Zapis nadania wymaga sprawdzenia. Nowe nadanie zablokowane.', 409); }
 return {raw: row.setting_value, shipment};
}
export function sameEnvironment(shipment: ShipmentRecord) {
 const config = inpostConfiguration();
 if (shipment.environment !== config.environment || shipment.organizationId !== config.organizationId) throw new ShopValidationError('Ta przesyłka pochodzi z innego środowiska lub konta InPost. Przywróć właściwą konfigurację.', 409);
}
export async function updateShipment(orderId: number, raw: string | null, shipment: ShipmentRecord) {
 const next = {...shipment, updatedAt: new Date().toISOString()};
 const updated = await prisma.setting.updateMany({where: {setting_key: shipmentKey(orderId), setting_value: raw}, data: {setting_value: JSON.stringify(next)}});
 if (updated.count !== 1) throw new ShopValidationError('Stan przesyłki zmienił się. Odśwież widok.', 409);
 return next;
}
