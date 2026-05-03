import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// GET /api/workshops/[slug] — publiczne dane warsztatu (do landing page)
export async function GET(_request: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
    const { slug } = await ctx.params;
    const w = await prisma.workshop.findUnique({
        where: { slug },
        select: {
            id: true, slug: true, title: true, location: true, description: true,
            schedule: true, status: true, starts_at: true, ends_at: true,
            _count: { select: { participants: true } },
        },
    });
    if (!w || w.status === 'draft' || w.status === 'archived') {
        return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });
    }
    return NextResponse.json({ workshop: w });
}

// POST /api/workshops/[slug] — publiczny zapis (lead)
// body: { recipient_email, recipient_name?, participant_name?, recipient_phone?, custom_message? }
export async function POST(request: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
    const { slug } = await ctx.params;
    const w = await prisma.workshop.findUnique({ where: { slug }, select: { id: true, status: true, title: true } });
    if (!w || w.status === 'draft' || w.status === 'archived') {
        return NextResponse.json({ error: 'Warsztat niedostępny' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const { recipient_email, recipient_name, participant_name, recipient_phone, custom_message } = body || {};
    if (!recipient_email || !/^.+@.+\..+$/.test(recipient_email)) {
        return NextResponse.json({ error: 'Podaj poprawny adres e-mail' }, { status: 400 });
    }

    // Anty-spam: max 3 zgloszenia z tego samego maila w 24h
    const since = new Date(Date.now() - 24 * 3600 * 1000);
    const recent = await prisma.workshopOffer.count({
        where: { recipient_email, sent_at: { gte: since } },
    });
    if (recent >= 3) {
        return NextResponse.json({ error: 'Zbyt wiele zgłoszeń. Spróbuj jutro lub napisz na e-mail.' }, { status: 429 });
    }

    const lead = await prisma.workshopOffer.create({
        data: {
            workshop_id: w.id,
            recipient_email,
            recipient_name: recipient_name || null,
            recipient_phone: recipient_phone || null,
            participant_name: participant_name || null,
            custom_message: custom_message || null,
            status: 'sent',
            source: 'public',
        },
    });
    return NextResponse.json({ ok: true, lead_id: lead.id });
}
