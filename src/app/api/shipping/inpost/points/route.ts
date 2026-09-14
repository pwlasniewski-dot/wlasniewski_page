import { NextRequest, NextResponse } from 'next/server';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { fetchInpostPoints } from '@/lib/shipping/inpost-points';

// ShipX Points filters: https://dokumentacja-inpost.atlassian.net/wiki/spaces/PL/pages/18153470
// Public, bounded projection. Authorization stays in the server-side adapter.
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const query = (params.get('q') || '').trim();
  const page = Number(params.get('page') || 1);
  if (query.length < 2 || query.length > 80 || !/^[\p{L}\p{N} ._'-]+$/u.test(query) || !Number.isSafeInteger(page) || page < 1 || page > 100) {
    return NextResponse.json({ success: false, error: 'Wpisz miejscowość, kod pocztowy lub kod punktu (2–80 znaków).' }, { status: 400 });
  }
  const rate = rateLimit(`inpost-points:${getClientIp(request)}`, 40, 60_000);
  if (!rate.ok) return NextResponse.json({ success: false, error: 'Za dużo wyszukiwań. Spróbuj za chwilę.' }, { status: 429, headers: { 'Retry-After': '60' } });
  const upstream = new URL('https://api.inpost.pl/v1/points');
  upstream.searchParams.set('type', 'parcel_locker');
  upstream.searchParams.set('functions', 'parcel_collect');
  upstream.searchParams.set('per_page', '20');
  upstream.searchParams.set('page', String(page));
  if (/^\d{2}-\d{3}$/.test(query)) upstream.searchParams.set('post_code', query);
  else if (/^(?:POP-)?[a-z]{2,6}\d[a-z0-9_-]*$/i.test(query)) upstream.searchParams.set('name', query.toUpperCase());
  else upstream.searchParams.set('city', query);
  try {
    const data = await fetchInpostPoints(upstream.searchParams);
    const points = data.items.filter((point: Record<string, unknown>) => typeof point.name === 'string' && /^[A-Z0-9_-]{3,30}$/.test(point.name) && point.status === 'Operating' && Array.isArray(point.functions) && point.functions.includes('parcel_collect')).slice(0, 20).map((point: { name: string; address?: { line1?: string; line2?: string }; location_description?: string; opening_hours?: string }) => ({
      name: point.name,
      address: [point.address?.line1, point.address?.line2].filter(value => typeof value === 'string').join(', ').slice(0, 300),
      description: typeof point.location_description === 'string' ? point.location_description.slice(0, 300) : '',
      openingHours: typeof point.opening_hours === 'string' ? point.opening_hours.slice(0, 120) : '',
    }));
    return NextResponse.json({ success: true, points, page, hasMore: Number(data.total_pages) > page && page < 100 }, { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Nie udało się pobrać punktów InPost. Spróbuj ponownie za chwilę.' }, { status: 503 });
  }
}
