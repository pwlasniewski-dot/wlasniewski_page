import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// PATCH: Update promo code (toggle active, etc.)
export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();

        const promoCode = await prisma.promoCode.update({
            where: { id: parseInt(id) },
            data: body,
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
export async function DELETE(request: Request, { params }: RouteParams) {
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
