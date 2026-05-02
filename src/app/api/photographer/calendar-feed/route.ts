/**
 * GET /api/photographer/calendar-feed
 * Zwraca zalogowanemu fotografowi link do jego prywatnego ICS feed
 * (do subskrypcji w Google Calendar / Apple Calendar / Outlook).
 */
import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { getPhotographerAuth, unauthorized } from '@/lib/auth/photographer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const auth = await getPhotographerAuth(request);
    if (!auth) return unauthorized();

    const userId = auth.id;
    const secret = createHash('sha256')
        .update(`${process.env.JWT_SECRET || ''}:ics:${userId}`)
        .digest('hex')
        .slice(0, 16);

    const token = `ph_${userId}_${secret}`;
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://wlasniewski.pl';
    const feedUrl = `${base}/api/bookings/ics?token=${token}`;
    const googleSubscribeUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(feedUrl.replace(/^https?:\/\//, 'webcal://'))}`;

    return NextResponse.json({
        feed_url: feedUrl,
        webcal_url: feedUrl.replace(/^https?:\/\//, 'webcal://'),
        google_subscribe_url: googleSubscribeUrl,
        instructions: {
            google: 'Otw\u00f3rz Google Calendar \u2192 \"Inne kalendarze\" (\u002b) \u2192 \"Zasubskrybuj kalendarz\" \u2192 wklej feed_url',
            apple: 'Apple Calendar \u2192 Plik \u2192 Nowa subskrypcja kalendarza \u2192 wklej webcal_url',
            outlook: 'Outlook \u2192 Dodaj kalendarz \u2192 \"Z internetu\" \u2192 wklej feed_url',
        },
    });
}
