import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

// GET /api/admin/workshops/[id]
export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    return withAuth(request, async () => {
        const { id } = await ctx.params;
        const wid = parseInt(id, 10);
        if (!wid) return NextResponse.json({ error: 'Bad id' }, { status: 400 });
        const w = await prisma.workshop.findUnique({
            where: { id: wid },
            include: {
                participants: {
                    orderBy: { id: 'asc' },
                    select: {
                        id: true, login: true, display_name: true, avatar: true,
                        active: true, last_login: true, created_at: true,
                        pin_plain_temp: true, // admin musi widzieć PIN do wydruku kart logowania
                    },
                },
                _count: { select: { uploads: true } },
            },
        });
        if (!w) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ workshop: w });
    });
}

// PATCH /api/admin/workshops/[id]
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    return withAuth(request, async (req) => {
        const { id } = await ctx.params;
        const wid = parseInt(id, 10);
        if (!wid) return NextResponse.json({ error: 'Bad id' }, { status: 400 });
        const body = await req.json();
        const updateData: any = {};
        for (const k of ['title', 'location', 'description', 'status'] as const) {
            if (body[k] !== undefined) updateData[k] = body[k];
        }
        if (body.schedule !== undefined) updateData.schedule = body.schedule;
        if (body.materials !== undefined) updateData.materials = body.materials;
        if (body.starts_at !== undefined) updateData.starts_at = body.starts_at ? new Date(body.starts_at) : null;
        if (body.ends_at !== undefined) updateData.ends_at = body.ends_at ? new Date(body.ends_at) : null;
        const updated = await prisma.workshop.update({ where: { id: wid }, data: updateData });
        return NextResponse.json({ workshop: updated });
    });
}

// DELETE /api/admin/workshops/[id]
export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    return withAuth(request, async () => {
        const { id } = await ctx.params;
        const wid = parseInt(id, 10);
        if (!wid) return NextResponse.json({ error: 'Bad id' }, { status: 400 });
        await prisma.workshop.delete({ where: { id: wid } });
        return NextResponse.json({ ok: true });
    });
}
