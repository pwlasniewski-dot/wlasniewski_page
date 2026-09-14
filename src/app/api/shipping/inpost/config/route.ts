import { NextResponse } from 'next/server';
import { inpostWidgetToken } from '@/lib/shipping/inpost-widget';

export const dynamic = 'force-dynamic';
export async function GET() {
  // This is the Geowidget PUBLIC token, restricted to the storefront domain in
  // InPost Manager. Never substitute a ShipX or shipment API token here.
  const token = inpostWidgetToken();
  return NextResponse.json({ token }, { headers: { 'Cache-Control': 'public, max-age=300' } });
}
