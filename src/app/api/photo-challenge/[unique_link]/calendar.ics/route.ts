import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { deriveShortCode } from '@/lib/photo-challenge/short-code';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * RFC 5545 .ics generator for photo-challenge sessions.
 * Public, but only emits an event when the challenge is accepted and has a date.
 */

function pad(n: number): string { return n.toString().padStart(2, '0'); }

function toIcsDate(date: Date): string {
    return (
        date.getUTCFullYear().toString() +
        pad(date.getUTCMonth() + 1) +
        pad(date.getUTCDate()) +
        'T' +
        pad(date.getUTCHours()) +
        pad(date.getUTCMinutes()) +
        pad(date.getUTCSeconds()) +
        'Z'
    );
}

function escapeIcs(value: string): string {
    return value
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
}

function fold(line: string): string {
    // RFC 5545: lines should not exceed 75 octets — fold with CRLF + space
    if (line.length <= 75) return line;
    const out: string[] = [];
    let i = 0;
    while (i < line.length) {
        out.push((i === 0 ? '' : ' ') + line.slice(i, i + 73));
        i += 73;
    }
    return out.join('\r\n');
}

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ unique_link: string }> }
) {
    const { unique_link } = await params;

    const challenge = await prisma.photoChallenge.findUnique({
        where: { unique_link },
        include: { package: true, location: true },
    });

    if (!challenge) {
        return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    if (challenge.status !== 'accepted' && challenge.status !== 'completed') {
        return NextResponse.json({ success: false, error: 'Brak potwierdzonego terminu.' }, { status: 403 });
    }

    const booking = await prisma.booking.findFirst({ where: { challenge_id: challenge.id } });

    const sessionDate = booking?.date || challenge.session_date;
    if (!sessionDate) {
        return NextResponse.json({ success: false, error: 'Termin nieustalony.' }, { status: 422 });
    }

    // Build start/end times. start_time format expected "HH:MM".
    const dateOnly = new Date(sessionDate);
    const [sh = 12, sm = 0] = (booking?.start_time || '12:00').split(':').map(n => parseInt(n, 10));
    const [eh = sh + 1, em = sm] = (booking?.end_time || `${sh + 1}:${pad(sm)}`).split(':').map(n => parseInt(n, 10));

    // Treat the booking date+time as Europe/Warsaw local. Convert to UTC for DTSTART.
    // Simplest approach: build local Date then take .toISOString — but JS uses server TZ, which may not match.
    // We assume Netlify functions run UTC. We'll create a Date in UTC offset from Warsaw (+1 winter / +2 summer).
    // Approximate: use `Date.UTC` with +1 hour shift; for full DST correctness we'd need a tz lib.
    // For voucher invite this is acceptable; user can adjust in calendar.
    const yyyy = dateOnly.getUTCFullYear();
    const mm = dateOnly.getUTCMonth();
    const dd = dateOnly.getUTCDate();

    // Best-effort DST: Poland is CET/CEST. Last Sunday of March → CEST (+02), last Sunday of October → CET (+01).
    const isDst = (() => {
        const lastSundayOfMarch = new Date(Date.UTC(yyyy, 2, 31));
        lastSundayOfMarch.setUTCDate(31 - lastSundayOfMarch.getUTCDay());
        const lastSundayOfOctober = new Date(Date.UTC(yyyy, 9, 31));
        lastSundayOfOctober.setUTCDate(31 - lastSundayOfOctober.getUTCDay());
        const local = new Date(Date.UTC(yyyy, mm, dd));
        return local >= lastSundayOfMarch && local < lastSundayOfOctober;
    })();
    const offsetHours = isDst ? 2 : 1;

    const startUtc = new Date(Date.UTC(yyyy, mm, dd, sh - offsetHours, sm, 0));
    const endUtc = new Date(Date.UTC(yyyy, mm, dd, eh - offsetHours, em, 0));

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wlasniewski.pl';
    const inviteUrl = `${baseUrl}/foto-wyzwanie/invite/${challenge.unique_link}`;
    const shortCode = deriveShortCode(challenge.unique_link);

    const summary = `Sesja Foto-Wyzwanie · ${challenge.package?.name || ''}`.trim();
    const locationStr = challenge.location?.address
        ? `${challenge.location.name} — ${challenge.location.address}`
        : (challenge.location?.name || challenge.custom_location || 'Lokalizacja do uzgodnienia');
    const description =
        `Sesja zaproszeniowa od ${challenge.inviter_name} dla ${challenge.invitee_name}.\n` +
        `Pakiet: ${challenge.package?.name || ''}\n` +
        `Kod weryfikacyjny: ${shortCode}\n` +
        `Szczegóły: ${inviteUrl}\n` +
        `Kontakt: Przemysław Wlasniewski, +48 660 470 200`;

    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Wlasniewski Studio//Foto Wyzwanie//PL',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:foto-wyzwanie-${challenge.id}-${challenge.unique_link.slice(0, 12)}@wlasniewski.pl`,
        `DTSTAMP:${toIcsDate(new Date())}`,
        `DTSTART:${toIcsDate(startUtc)}`,
        `DTEND:${toIcsDate(endUtc)}`,
        fold(`SUMMARY:${escapeIcs(summary)}`),
        fold(`LOCATION:${escapeIcs(locationStr)}`),
        fold(`DESCRIPTION:${escapeIcs(description)}`),
        fold(`URL:${inviteUrl}`),
        'STATUS:CONFIRMED',
        'BEGIN:VALARM',
        'TRIGGER:-P1D',
        'ACTION:DISPLAY',
        'DESCRIPTION:Przypomnienie: jutro sesja Foto-Wyzwanie',
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR',
    ];

    const ics = lines.join('\r\n');

    return new NextResponse(ics, {
        status: 200,
        headers: {
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': `attachment; filename="foto-wyzwanie-${shortCode}.ics"`,
            'Cache-Control': 'private, no-store',
        },
    });
}
