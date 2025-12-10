import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
    try {
        // FILTROWANIE IP ADMINA - wykluczamy localhost i sieci prywatne
        const forwarded = request.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';

        // Wykluczamy:
        // - localhost (127.0.0.1, ::1)
        // - sieci prywatne (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
        const isLocalOrPrivate = (
            ip === 'unknown' ||
            ip === '127.0.0.1' ||
            ip === '::1' ||
            ip.startsWith('192.168.') ||
            ip.startsWith('10.') ||
            /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
        );

        if (isLocalOrPrivate) {
            console.log('[Analytics] Skipping local/private IP:', ip);
            return NextResponse.json({ success: true, skipped: true });
        }

        const body = await request.json();
        const {
            event_type,
            page_url,
            user_id,
            session_id,
            referrer,
            utm_source,
            utm_medium,
            utm_campaign,
            metadata
        } = body;

        if (!event_type || !session_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const event = await prisma.analyticsEvent.create({
            data: {
                event_type,
                page_url,
                user_id: user_id || 'anonymous',
                session_id,
                referrer,
                utm_source,
                utm_medium,
                utm_campaign,
                metadata: metadata ? JSON.stringify(metadata) : null,
            },
        });

        return NextResponse.json({ success: true, id: event.id });
    } catch (error) {
        console.error('Analytics error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        // Simple stats for now
        const totalViews = await prisma.analyticsEvent.count({
            where: { event_type: 'page_view' }
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayViews = await prisma.analyticsEvent.count({
            where: {
                event_type: 'page_view',
                created_at: { gte: today }
            }
        });

        // Last 7 days chart data
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const dailyViews = await prisma.analyticsEvent.groupBy({
            by: ['created_at'],
            where: {
                event_type: 'page_view',
                created_at: { gte: sevenDaysAgo }
            },
            _count: {
                id: true
            }
        });

        // Group by day manually because SQLite doesn't support date truncation in groupBy easily via Prisma
        // Actually, fetching raw events might be easier for small scale, but let's try to be efficient.
        // For SQLite, Prisma groupBy on DateTime returns exact timestamps. We need to process in JS.

        const events = await prisma.analyticsEvent.findMany({
            where: {
                event_type: 'page_view',
                created_at: { gte: sevenDaysAgo }
            },
            select: { created_at: true }
        });

        const chartData = new Map<string, number>();
        // Init last 7 days with 0
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            chartData.set(d.toLocaleDateString('pl-PL'), 0);
        }

        events.forEach(e => {
            const dateStr = new Date(e.created_at).toLocaleDateString('pl-PL');
            chartData.set(dateStr, (chartData.get(dateStr) || 0) + 1);
        });

        const formattedChartData = Array.from(chartData.entries())
            .map(([date, count]) => ({ date, views: count }))
            .reverse();

        return NextResponse.json({
            success: true,
            stats: {
                totalViews,
                todayViews,
                chartData: formattedChartData
            }
        });

    } catch (error) {
        console.error('Analytics stats error:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
