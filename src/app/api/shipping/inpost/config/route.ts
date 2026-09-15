import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { inpostWidgetToken } from '@/lib/shipping/inpost-widget';

export const dynamic = 'force-dynamic';
export async function GET() {
  // This is the Geowidget PUBLIC token, restricted to the storefront domain in
  // InPost Manager. Never substitute a ShipX or shipment API token here.
  const saved = await prisma.setting.findUnique({ where: { setting_key: 'inpost_geowidget_token' } }).catch(() => null);
  const token = saved?.setting_value?.trim() || inpostWidgetToken();
  return NextResponse.json({ token }, { headers: { 'Cache-Control': 'public, max-age=300' } });
}
