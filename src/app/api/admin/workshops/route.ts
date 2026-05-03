import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

// GET /api/admin/workshops — lista warsztatów
export async function GET(request: NextRequest) {
    return withAuth(request, async () => {
        const items = await prisma.workshop.findMany({
            orderBy: { created_at: 'desc' },
            include: {
                _count: { select: { participants: true, uploads: true } },
            },
        });
        return NextResponse.json({ items });
    });
}

// POST /api/admin/workshops — utworz warsztat
export async function POST(request: NextRequest) {
    return withAuth(request, async (req) => {
        const body = await req.json();
        const { slug, title, location, description, schedule, materials, starts_at, ends_at, status } = body || {};
        if (!slug || !title) {
            return NextResponse.json({ error: 'slug i title sa wymagane' }, { status: 400 });
        }
        const safeSlug = String(slug).toLowerCase().replace(/[^a-z0-9-]+/g, '-').slice(0, 80);
        try {
            const created = await prisma.workshop.create({
                data: {
                    slug: safeSlug,
                    title,
                    location: location ?? null,
                    description: description ?? null,
                    schedule: schedule ?? [],
                    materials: materials ?? [],
                    status: status ?? 'draft',
                    starts_at: starts_at ? new Date(starts_at) : null,
                    ends_at: ends_at ? new Date(ends_at) : null,
                    host_user_id: (req as any).user?.id ?? null,
                },
            });
            return NextResponse.json({ workshop: created }, { status: 201 });
        } catch (e: any) {
            if (e?.code === 'P2002') {
                return NextResponse.json({ error: 'Slug juz istnieje' }, { status: 409 });
            }
            console.error('[POST /api/admin/workshops]', e);
            return NextResponse.json({ error: 'Internal' }, { status: 500 });
        }
    });
}
