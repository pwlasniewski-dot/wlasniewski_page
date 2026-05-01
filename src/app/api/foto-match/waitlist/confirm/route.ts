import { NextRequest, NextResponse } from 'next/server';
import { confirmWaitlistToken } from '@/lib/foto-match/confirm';

/**
 * GET /api/foto-match/waitlist/confirm?t=<token>
 *
 * Potwierdza zapis na waitlist Foto-Match (link z double opt-in maila).
 * Idempotent: kolejne kliknięcia na ten sam token zwracają 200 + status='already'.
 *
 * Logika dzielona z SSR page przez @/lib/foto-match/confirm — page nie robi
 * self-fetch (anti-pattern Next.js / Netlify Functions).
 */
export async function GET(request: NextRequest) {
    const token = request.nextUrl.searchParams.get('t');
    const result = await confirmWaitlistToken(token);

    if (result.ok) {
        return NextResponse.json({ success: true, status: result.status, email: result.email });
    }

    const statusMap: Record<string, number> = {
        INVALID_TOKEN: 400,
        TOKEN_NOT_FOUND: 404,
        TOKEN_EXPIRED: 410,
        DB_ERROR: 503,
    };
    return NextResponse.json(
        { success: false, error: result.error, message: result.message },
        { status: statusMap[result.error] || 500 },
    );
}
