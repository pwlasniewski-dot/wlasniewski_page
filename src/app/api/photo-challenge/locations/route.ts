// API Route: GET /api/photo-challenge/locations
// Pobiera i zarządza lokalizacjami wyzwań

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth, requireAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
    try {
        const wantAll = new URL(request.url).searchParams.get('all') === '1';
        let includeInactive = false;
        if (wantAll) {
            const authError = await requireAuth(request);
            if (!authError) includeInactive = true;
        }
        const locations = await prisma.challengeLocation.findMany({
            where: includeInactive ? {} : { is_active: true },
            orderBy: { display_order: 'asc' },
        });

        return NextResponse.json({
            success: true,
            locations,
        });
    } catch (error) {
        console.error('Error fetching locations:', error);
        return NextResponse.json(
            { success: false, error: 'Nie udało się pobrać lokalizacji' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const body = await request.json();
            const { name, description, address, google_maps_url, image_url, is_active } = body;

            const location = await prisma.challengeLocation.create({
                data: {
                    name,
                    description,
                    address,
                    google_maps_url,
                    image_url,
                    is_active: is_active ?? true,
                }
            });

            return NextResponse.json({ success: true, location });
        } catch (error) {
            return NextResponse.json({ error: 'Failed to create location' }, { status: 500 });
        }
    });
}

export async function PUT(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const body = await request.json();
            const { id, name, description, address, google_maps_url, image_url, is_active } = body;

            const location = await prisma.challengeLocation.update({
                where: { id: Number(id) },
                data: {
                    name,
                    description,
                    address,
                    google_maps_url,
                    image_url,
                    is_active
                }
            });

            return NextResponse.json({ success: true, location });
        } catch (error) {
            return NextResponse.json({ error: 'Failed to update location' }, { status: 500 });
        }
    });
}

export async function DELETE(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const { searchParams } = new URL(request.url);
            const id = searchParams.get('id');

            if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

            await prisma.challengeLocation.delete({
                where: { id: Number(id) }
            });

            return NextResponse.json({ success: true });
        } catch (error) {
            return NextResponse.json({ error: 'Failed to delete location' }, { status: 500 });
        }
    });
}
