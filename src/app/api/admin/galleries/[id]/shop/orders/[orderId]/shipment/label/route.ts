import {NextRequest, NextResponse} from 'next/server';
import {withAuth} from '@/lib/auth/middleware';
import {shopError} from '@/lib/galleries/merchandise-server';
import {ShopValidationError} from '@/lib/galleries/merchandise';
import {shipmentOrder, storedShipment, sameEnvironment} from '@/lib/shipping/gallery-shipment';
import {getShipmentLabel} from '@/lib/shipping/inpost';
export async function GET(request: NextRequest, {params}: {params: Promise<{id: string; orderId: string}>}) {return withAuth(request, async () => {try {
 const {order} = await shipmentOrder(await params); const {shipment} = await storedShipment(order.id);
 if (!shipment?.shipmentId || shipment.state !== 'created') throw new ShopValidationError('Brak potwierdzonej przesyłki.', 409); sameEnvironment(shipment);
 const label = await getShipmentLabel(shipment.shipmentId);
 return new NextResponse(label, {headers: {'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="inpost-${order.id}.pdf"`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff'}});
 } catch (error) {return shopError(error);} });}
