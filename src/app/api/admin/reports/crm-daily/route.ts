import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { buildCrmDailySnapshot } from '@/lib/crm/daily-report';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    return withAuth(request, async () => {
        const end = new Date();
        const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
        const snapshot = await buildCrmDailySnapshot(start, end);
        return NextResponse.json({ success: true, period: { start, end }, snapshot });
    });
}
