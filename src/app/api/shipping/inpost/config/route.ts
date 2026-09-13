import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function GET() {
  // This is the Geowidget PUBLIC token, restricted to the storefront domain in
  // InPost Manager. Never substitute a ShipX or shipment API token here.
  const token = process.env.INPOST_GEOWIDGET_TOKEN?.trim() || null;
  return NextResponse.json({ token }, { headers: { 'Cache-Control': 'public, max-age=300' } });
}
