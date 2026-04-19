import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';

export const dynamic = 'force-dynamic';

export async function PUT(
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

        const existing = await prisma.offer.findFirst({
            where: { id: templateId, is_template: true }
        });

        if (!existing) {
            return NextResponse.json(
                { error: 'Szablon nie znaleziony' },
                { status: 404 }
            );
        }

        const body = await request.json();
        const { title, type, category, template_data } = body;

        const updated = await prisma.offer.update({
            where: { id: templateId },
            data: {
                ...(title && { title }),
                ...(type && { type }),
                ...(category && { category }),
                ...(template_data && { template_data }),
            }
        });

        return NextResponse.json({ success: true, template: updated });
    } catch (error) {
        console.error('Error updating template:', error);
        return NextResponse.json(
            { error: 'Failed to update template' },
            { status: 500 }
        );
    }
}

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
