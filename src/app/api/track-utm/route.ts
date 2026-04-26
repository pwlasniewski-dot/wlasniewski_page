/**
 * API: Public UTM tracking.
 * Captures utm_source/medium/campaign from landing visits → AnalyticsEvent table.
 * Used by <UtmTracker /> client component fired on page mount.
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { utm_source, utm_medium, utm_campaign, page_url, referrer, session_id, user_id } = body;

        // Skip if no UTM at all (avoid noise)
        if (!utm_source && !utm_medium && !utm_campaign) {
            return NextResponse.json({ success: true, skipped: true });
        }

        await prisma.analyticsEvent.create({
            data: {
                event_type: 'utm_landing',
                page_url: page_url || null,
                user_id: user_id || randomUUID(),
                session_id: session_id || randomUUID(),
                referrer: referrer || null,
                utm_source: utm_source || null,
                utm_medium: utm_medium || null,
                utm_campaign: utm_campaign || null,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('UTM tracking error:', error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
