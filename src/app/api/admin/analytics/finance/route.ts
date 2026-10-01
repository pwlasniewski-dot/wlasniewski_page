import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/middleware';
import { getFinanceSummary } from '@/lib/analytics/finance';
import { parseFinanceDateRange } from '@/lib/analytics/finance-core';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const headers = { 'Cache-Control': 'private, no-store, max-age=0', Vary: 'Cookie, Authorization' };

export async function GET(request: NextRequest) {
    const denied = await requireAdminAuth(request);
    if (denied) { Object.entries(headers).forEach(([key, value]) => denied.headers.set(key, value)); return denied; }
    let range: ReturnType<typeof parseFinanceDateRange>;
    try { range = parseFinanceDateRange(request.nextUrl.searchParams); }
    catch (error) {
        return NextResponse.json({ success: false, data: null, message: error instanceof Error ? error.message : 'Nieprawidłowy zakres dat.' }, { status: 400, headers });
    }
    try {
        const data = await getFinanceSummary(range.start, range.end);
        return NextResponse.json({ success: true, data, range: { startDate: range.startDate, endDate: range.endDate, timeZone: range.timeZone }, generatedAt: new Date().toISOString() }, { headers });
    } catch {
        console.error('[Finance actuals] Source unavailable; no amounts returned.');
        return NextResponse.json({ success: false, data: null, message: 'Nie udało się odczytać zapisów finansowych. Brak danych nie oznacza zerowych wpłat.' }, { status: 503, headers });
    }
}
