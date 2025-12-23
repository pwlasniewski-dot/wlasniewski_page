import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

// GET all packages
export async function GET(request: NextRequest) {
    try {
        const packages = await prisma.challengePackage.findMany({
            where: { is_active: true }, // Only show active packages to public
            orderBy: { display_order: 'asc' }
        });
        return NextResponse.json({ success: true, packages });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 });
    }
}

// POST create package
export async function POST(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const body = await request.json();
            const { name, base_price, challenge_price, description, included_items } = body;

            const pkg = await prisma.challengePackage.create({
                data: {
                    name,
                    base_price: Number(base_price),
                    challenge_price: Number(challenge_price),
                    discount_percentage: Math.round(((Number(base_price) - Number(challenge_price)) / Number(base_price)) * 100),
                    description,
                    included_items: included_items || '[]',
                    is_active: true
                }
            });

            return NextResponse.json({ success: true, package: pkg });
        } catch (error) {
            return NextResponse.json({ error: 'Failed to create package' }, { status: 500 });
        }
    });
}

// PUT update package
export async function PUT(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const body = await request.json();
            const { id, name, base_price, challenge_price, description, included_items, is_active } = body;

            const pkg = await prisma.challengePackage.update({
                where: { id: Number(id) },
                data: {
                    name,
                    base_price: Number(base_price),
                    challenge_price: Number(challenge_price),
                    discount_percentage: Math.round(((Number(base_price) - Number(challenge_price)) / Number(base_price)) * 100),
                    description,
                    included_items,
                    is_active
                }
            });

            return NextResponse.json({ success: true, package: pkg });
        } catch (error) {
            return NextResponse.json({ error: 'Failed to update package' }, { status: 500 });
        }
    });
}

// DELETE package
export async function DELETE(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const { searchParams } = new URL(request.url);
            const id = searchParams.get('id');

            if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

            await prisma.challengePackage.delete({
                where: { id: Number(id) }
            });

            return NextResponse.json({ success: true });
        } catch (error) {
            return NextResponse.json({ error: 'Failed to delete package' }, { status: 500 });
        }
    });
}
