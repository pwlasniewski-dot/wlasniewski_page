/**
 * GET /api/foto-match/settings/public
 * Public endpoint — zwraca jedynie czy program jest globalnie włączony.
 * Używany przez /konto (CTA) i /foto-match/onboarding (gating wizardu).
 */
import { NextResponse } from 'next/server';
import { isFotoMatchEnabled } from '@/lib/foto-match/settings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    const enabled = await isFotoMatchEnabled();
    return NextResponse.json({ enabled });
}
