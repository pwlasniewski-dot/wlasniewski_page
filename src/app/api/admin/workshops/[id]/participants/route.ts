import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { generatePin, hashPin, pickRandomAvatar, buildLogin } from '@/lib/workshops/auth';

// POST /api/admin/workshops/[id]/participants
// body: { count: number, prefix?: string }
// Tworzy N kont (login + PIN + emoji-avatar). PIN zapisujemy jawnie do pola pin_plain_temp,
// zeby admin mogl raz wydrukowac karty. Endpoint /clear-pins kasuje plain.
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    return withAuth(request, async (req) => {
        const { id } = await ctx.params;
        const wid = parseInt(id, 10);
        if (!wid) return NextResponse.json({ error: 'Bad id' }, { status: 400 });
        const body = await req.json().catch(() => ({}));
        const count = Math.min(Math.max(parseInt(body?.count, 10) || 0, 1), 50);
        const workshop = await prisma.workshop.findUnique({ where: { id: wid } });
        if (!workshop) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // Znajdz najwyzszy index istniejacy
        const existing = await prisma.workshopParticipant.findMany({
            where: { workshop_id: wid },
            select: { login: true },
        });
        let maxIdx = 0;
        const re = new RegExp(`^${workshop.slug}-(\\d+)$`);
        for (const p of existing) {
            const m = p.login.match(re);
            if (m) maxIdx = Math.max(maxIdx, parseInt(m[1], 10));
        }

        const created: { id: number; login: string; pin: string; avatar: string }[] = [];
        for (let i = 0; i < count; i++) {
            const idx = maxIdx + i + 1;
            const login = buildLogin(workshop.slug, idx);
            const pin = generatePin(6);
            const pinHash = await hashPin(pin);
            const avatar = pickRandomAvatar(idx);
            const row = await prisma.workshopParticipant.create({
                data: {
                    workshop_id: wid,
                    login,
                    pin_hash: pinHash,
                    pin_plain_temp: pin,
                    avatar,
                },
            });
            created.push({ id: row.id, login, pin, avatar });
        }
        return NextResponse.json({ created }, { status: 201 });
    });
}

// GET /api/admin/workshops/[id]/participants — lista z PIN-ami plain (do wydruku)
export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    return withAuth(request, async () => {
        const { id } = await ctx.params;
        const wid = parseInt(id, 10);
        if (!wid) return NextResponse.json({ error: 'Bad id' }, { status: 400 });
        const items = await prisma.workshopParticipant.findMany({
            where: { workshop_id: wid },
            orderBy: { id: 'asc' },
            select: {
                id: true, login: true, display_name: true, avatar: true,
                pin_plain_temp: true, active: true, last_login: true, created_at: true,
            },
        });
        return NextResponse.json({ items });
    });
}

// DELETE /api/admin/workshops/[id]/participants?ids=1,2,3
export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    return withAuth(request, async (req) => {
        const { id } = await ctx.params;
        const wid = parseInt(id, 10);
        if (!wid) return NextResponse.json({ error: 'Bad id' }, { status: 400 });
        const url = new URL(req.url);
        const idsStr = url.searchParams.get('ids');
        if (!idsStr) return NextResponse.json({ error: 'Brak ids' }, { status: 400 });
        const ids = idsStr.split(',').map(s => parseInt(s, 10)).filter(Boolean);
        await prisma.workshopParticipant.deleteMany({ where: { workshop_id: wid, id: { in: ids } } });
        return NextResponse.json({ ok: true, deleted: ids.length });
    });
}
