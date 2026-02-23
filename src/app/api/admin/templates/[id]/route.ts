import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';

export const dynamic = 'force-dynamic';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authError = await requireAuth(request);
        if (authError) return authError;

        const { id } = await params;
        const templateId = parseInt(id);

        if (isNaN(templateId)) {
            return NextResponse.json(
                { error: 'Nieprawidłowe ID szablonu' },
                { status: 400 }
            );
        }

        // Only allow deleting templates (is_template: true)
        const template = await prisma.offer.findFirst({
            where: { id: templateId, is_template: true }
        });

        if (!template) {
            return NextResponse.json(
                { error: 'Szablon nie znaleziony' },
                { status: 404 }
            );
        }

        await prisma.offer.delete({
            where: { id: templateId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting template:', error);
        return NextResponse.json(
            { error: 'Failed to delete template' },
            { status: 500 }
        );
    }
}
