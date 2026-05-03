import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyPin, generateParticipantToken } from '@/lib/workshops/auth';

// POST /api/workshops/[slug]/login  body: { login, pin }
// Zwraca JWT uczestnika (typ "workshop_participant").
export async function POST(request: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
    try {
        const { slug } = await ctx.params;
        const { login, pin } = await request.json();
        if (!login || !pin) return NextResponse.json({ error: 'Brak loginu lub PIN-u' }, { status: 400 });
        const workshop = await prisma.workshop.findUnique({ where: { slug } });
        if (!workshop) return NextResponse.json({ error: 'Warsztat nie istnieje' }, { status: 404 });
        const participant = await prisma.workshopParticipant.findUnique({
            where: { workshop_id_login: { workshop_id: workshop.id, login: String(login).trim() } },
        });
        if (!participant || !participant.active) {
            return NextResponse.json({ error: 'Nieprawidlowy login lub PIN' }, { status: 401 });
        }
        const ok = await verifyPin(String(pin).trim(), participant.pin_hash);
        if (!ok) return NextResponse.json({ error: 'Nieprawidlowy login lub PIN' }, { status: 401 });
        await prisma.workshopParticipant.update({
            where: { id: participant.id },
            data: { last_login: new Date() },
        });
        const token = await generateParticipantToken({
            pid: participant.id, wid: workshop.id, login: participant.login,
        });
        return NextResponse.json({
            token,
            participant: {
                id: participant.id,
                login: participant.login,
                display_name: participant.display_name,
                avatar: participant.avatar,
            },
            workshop: {
                id: workshop.id,
                slug: workshop.slug,
                title: workshop.title,
            },
        });
    } catch (e) {
        console.error('[POST workshops/login]', e);
        return NextResponse.json({ error: 'Internal' }, { status: 500 });
    }
}
