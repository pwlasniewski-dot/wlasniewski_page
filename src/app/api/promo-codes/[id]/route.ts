import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// PATCH: Update promo code (toggle active, etc.)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const authError = await requireAuth(request);
    if (authError) return authError;

    try {
        const { id } = await params;
        const body = await request.json();
        const promoId = Number(id);
        if (!Number.isInteger(promoId) || promoId <= 0) {
            return NextResponse.json({ success: false, message: 'Nieprawidłowy identyfikator' }, { status: 400 });
        }

        const data: { is_active?: boolean; show_in_gallery?: boolean; show_in_banner?: boolean } = {};
        if (typeof body.is_active === 'boolean') data.is_active = body.is_active;
        if (typeof body.show_in_gallery === 'boolean') data.show_in_gallery = body.show_in_gallery;
        if (typeof body.show_in_banner === 'boolean') data.show_in_banner = body.show_in_banner;
        if (Object.keys(data).length === 0) {
            return NextResponse.json({ success: false, message: 'Brak obsługiwanych zmian' }, { status: 400 });
        }

        const promoCode = await prisma.$transaction(async tx => {
            if (data.show_in_gallery === true) {
                await tx.promoCode.updateMany({
                    where: { show_in_gallery: true, id: { not: promoId } },
                    data: { show_in_gallery: false },
                });
            }
            if (data.show_in_banner === true) {
                await tx.promoCode.updateMany({
                    where: { show_in_banner: true, id: { not: promoId } },
                    data: { show_in_banner: false },
                });
            }
            return tx.promoCode.update({ where: { id: promoId }, data });
        });

        return NextResponse.json({ success: true, code: promoCode });
    } catch (error) {
        console.error('Error updating promo code:', error);
        return NextResponse.json(
            { success: false, message: 'Błąd aktualizacji kodu' },
            { status: 500 }
        );
    }
}

// DELETE: Remove promo code
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const authError = await requireAuth(request);
    if (authError) return authError;

    try {
        const { id } = await params;

        await prisma.promoCode.delete({
            where: { id: parseInt(id) },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting promo code:', error);
        return NextResponse.json(
            { success: false, message: 'Błąd usuwania kodu' },
            { status: 500 }
        );
    }
}
