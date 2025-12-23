// API Route: PUT/DELETE /api/admin/effects/[id]
// Update or delete a visual effect

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async () => {
        try {
            const { id } = await params;
            const body = await request.json();

            const effect = await prisma.pageEffect.update({
                where: { id: Number(id) },
                data: {
                    effect_type: body.effect_type,
                    is_enabled: body.is_enabled,
                    config: body.config ? JSON.stringify(body.config) : null,
                    photos_source: body.photos_source,
                    manual_photos: body.manual_photos ? JSON.stringify(body.manual_photos) : null,
                }
            });

            return NextResponse.json({
                success: true,
                effect
            });
        } catch (error) {
            console.error('Error updating effect:', error);
            return NextResponse.json(
                { success: false, error: 'Nie udało się zaktualizować efektu' },
                { status: 500 }
            );
        }
    });
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async () => {
        try {
            const { id } = await params;

            await prisma.pageEffect.delete({
                where: { id: Number(id) }
            });

            return NextResponse.json({
                success: true,
                message: 'Efekt usunięty'
            });
        } catch (error) {
            console.error('Error deleting effect:', error);
            return NextResponse.json(
                { success: false, error: 'Nie udało się usunąć efektu' },
                { status: 500 }
            );
        }
    });
}
