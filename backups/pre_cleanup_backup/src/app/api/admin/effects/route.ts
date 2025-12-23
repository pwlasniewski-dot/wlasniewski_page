// API Route: GET /api/admin/effects
// List all visual effects

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
    return withAuth(request, async () => {
        try {
            const effects = await prisma.pageEffect.findMany({
                orderBy: [
                    { page_slug: 'asc' },
                    { order_index: 'asc' }
                ]
            });

            return NextResponse.json({
                success: true,
                effects
            });
        } catch (error) {
            console.error('Error fetching effects:', error);
            return NextResponse.json(
                { success: false, error: 'Nie udało się pobrać efektów' },
                { status: 500 }
            );
        }
    });
}

// POST - Create new effect
export async function POST(request: NextRequest) {
    return withAuth(request, async () => {
        try {
            const body = await request.json();
            const {
                page_slug,
                section_name,
                effect_type,
                is_enabled,
                config,
                photos_source,
                manual_photos
            } = body;

            const effect = await prisma.pageEffect.create({
                data: {
                    page_slug,
                    section_name,
                    effect_type: effect_type || 'carousel',
                    is_enabled: is_enabled || false,
                    config: config ? JSON.stringify(config) : null,
                    photos_source: photos_source || 'portfolio',
                    manual_photos: manual_photos ? JSON.stringify(manual_photos) : null,
                }
            });

            return NextResponse.json({
                success: true,
                effect
            });
        } catch (error) {
            console.error('Error creating effect:', error);
            return NextResponse.json(
                { success: false, error: 'Nie udało się utworzyć efektu' },
                { status: 500 }
            );
        }
    });
}
