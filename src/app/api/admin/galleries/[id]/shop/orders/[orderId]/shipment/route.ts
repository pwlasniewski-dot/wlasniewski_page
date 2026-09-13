import {NextRequest, NextResponse} from 'next/server';
import {withAuth} from '@/lib/auth/middleware';
import prisma from '@/lib/db/prisma';
import {shopError} from '@/lib/galleries/merchandise-server';
import {ShopValidationError} from '@/lib/galleries/merchandise';
import {createShipment, getShipment, cancelShipment, createDispatch, inpostConfiguration, shipmentPayload} from '@/lib/shipping/inpost';
import {shipmentOrder, storedShipment, shipmentKey, updateShipment, sameEnvironment, type ShipmentRecord} from '@/lib/shipping/gallery-shipment';
type Context = {params: Promise<{id: string; orderId: string}>};
const json = (data: unknown) => NextResponse.json(data, {headers: {'Cache-Control': 'private, no-store'}});
export async function GET(request: NextRequest, {params}: Context) {return withAuth(request, async () => {try {
 const {order} = await shipmentOrder(await params); const config = inpostConfiguration(); let {raw, shipment} = await storedShipment(order.id);
 if (request.nextUrl.searchParams.get('refresh') === '1' && shipment?.shipmentId && shipment.state !== 'cancelled') {sameEnvironment(shipment); const latest = await getShipment(shipment.shipmentId); shipment = await updateShipment(order.id, raw, {...shipment, status: latest.status, trackingNumber: latest.tracking_number});}
 return json({success: true, shipment, configuration: {ready: !config.missing.length, missing: config.missing, environment: config.environment, pickupReady: !!config.sender, senderSource: config.sender ? 'server' : 'organization'}});
 } catch (error) {return shopError(error);} });}
export async function POST(request: NextRequest, {params}: Context) {return withAuth(request, async () => {try {
 const {order, metadata} = await shipmentOrder(await params); const config = inpostConfiguration();
 if (config.missing.length) throw new ShopValidationError('Uzupełnij konfigurację InPost na serwerze.', 503);
 const body = await request.json().catch(() => null); if (body?.confirmCharge !== true) throw new ShopValidationError('Potwierdź zakup usługi przesyłki.');
 const reference = `gallery-${order.gallery_id}-order-${order.id}`; const payload = shipmentPayload(metadata.delivery, body.parcel, reference);
 const record: ShipmentRecord = {version: 1, environment: config.environment, organizationId: config.organizationId, reference, state: 'creating', updatedAt: new Date().toISOString()};
 const raw = JSON.stringify(record);
 // Unique Setting key persists before the external POST. Never delete/retry this reservation after a timeout.
 try {await prisma.setting.create({data: {setting_key: shipmentKey(order.id), setting_value: raw}});} catch (error) {if ((error as {code?: string}).code === 'P2002') throw new ShopValidationError('Nadanie dla tego zamówienia już rozpoczęto. Odśwież status zamiast nadawać ponownie.', 409); throw error;}
 try {const shipment = await createShipment(payload); if (!Number.isSafeInteger(shipment.id) || shipment.id < 1) throw Error('Missing shipment ID'); const saved = await updateShipment(order.id, raw, {...record, state: 'created', shipmentId: shipment.id, status: shipment.status, trackingNumber: shipment.tracking_number}); return json({success: true, shipment: saved});}
 catch {await updateShipment(order.id, raw, {...record, state: 'uncertain'}).catch(() => undefined); throw new ShopValidationError('Nie potwierdzono nadania. Sprawdź przesyłkę w ShipX według numeru referencyjnego. Powtórne nadanie jest zablokowane, aby uniknąć podwójnej opłaty.', 502);}
 } catch (error) {return shopError(error);} });}
export async function PATCH(request: NextRequest, {params}: Context) {return withAuth(request, async () => {try {
 const {order} = await shipmentOrder(await params); const {raw, shipment} = await storedShipment(order.id); const body = await request.json().catch(() => null);
 if (!shipment) throw new ShopValidationError('Najpierw utwórz przesyłkę.', 409); sameEnvironment(shipment);
 if (body?.action === 'reconcile') {
  if (shipment.shipmentId || !Number.isSafeInteger(body.shipmentId) || body.shipmentId < 1) throw new ShopValidationError('Podaj identyfikator nierozstrzygniętego nadania.');
  const found = await getShipment(body.shipmentId); if (found.reference !== shipment.reference) throw new ShopValidationError('Numer referencyjny przesyłki nie odpowiada temu zamówieniu.', 409);
  return json({success: true, shipment: await updateShipment(order.id, raw, {...shipment, state: 'created', shipmentId: found.id, status: found.status, trackingNumber: found.tracking_number})});
 }
 if (!shipment.shipmentId || shipment.state !== 'created') throw new ShopValidationError('Najpierw wyjaśnij status nadania.', 409);
 if (body?.action === 'cancel') {const current = await getShipment(shipment.shipmentId); if (!['created','offers_prepared'].includes(current.status)) throw new ShopValidationError('InPost pozwala anulować tylko przesyłkę przed zakupem etykiety.', 409); await cancelShipment(shipment.shipmentId); return json({success: true, shipment: await updateShipment(order.id, raw, {...shipment, state: 'cancelled', status: 'cancelled'})});}
 if (body?.action === 'pickup' && body.confirmCharge === true) {
  if (shipment.dispatch) throw new ShopValidationError('Odbiór już zamówiono lub wymaga sprawdzenia. Nie ponawiaj operacji.', 409);
  if (!inpostConfiguration().sender) throw new ShopValidationError('Uzupełnij adres odbioru w INPOST_SENDER_JSON.', 503);
  const current = await getShipment(shipment.shipmentId); if (current.status !== 'confirmed') throw new ShopValidationError('Odbiór kuriera wymaga potwierdzonej przesyłki.', 409);
  const locked = await updateShipment(order.id, raw, {...shipment, dispatch: {state: 'creating'}}); const lockRaw = JSON.stringify(locked);
  try {const dispatch = await createDispatch(shipment.shipmentId); if (!Number.isSafeInteger(dispatch.id)) throw Error(); return json({success: true, shipment: await updateShipment(order.id, lockRaw, {...locked, dispatch: {state: 'created', id: dispatch.id, status: dispatch.status}})});}
  catch {await updateShipment(order.id, lockRaw, {...locked, dispatch: {state: 'uncertain'}}).catch(() => undefined); throw new ShopValidationError('Nie potwierdzono odbioru kuriera. Sprawdź zlecenie w ShipX; ponowienie jest zablokowane.', 502);}
 }
 throw new ShopValidationError('Nieprawidłowa operacja przesyłki.');
 } catch (error) {return shopError(error);} });}
