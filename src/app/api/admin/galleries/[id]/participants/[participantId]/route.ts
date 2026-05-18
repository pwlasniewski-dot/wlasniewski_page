// API Route: /api/admin/galleries/[id]/participants/[participantId]
// Update or delete a specific participant

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

// PATCH: Update participant
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; participantId: string }> }
) {
    return withAuth(request, async () => {
        try {
            const { participantId } = await params;
            const { name, max_selections, notes } = await request.json();

            const participant = await prisma.galleryParticipant.update({
                where: { id: Number(participantId) },
                data: {
                    ...(name !== undefined && { name }),
                    ...(max_selections !== undefined && { max_selections }),
                    ...(notes !== undefined && { notes }),
                }
            });

            return NextResponse.json({
                success: true,
                message: 'Uczestnik zaktualizowany',
                participant,
            });

        } catch (error) {
            console.error('Error updating participant:', error);
            return NextResponse.json(
                { error: 'Błąd aktualizacji uczestnika' },
                { status: 500 }
            );
        }
    });
}

// DELETE: Remove participant
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; participantId: string }> }
) {
    return withAuth(request, async () => {
        try {
            const { participantId } = await params;

            await prisma.galleryParticipant.delete({
                where: { id: Number(participantId) }
            });

            return NextResponse.json({
                success: true,
                message: 'Uczestnik usunięty',
            });

        } catch (error) {
            console.error('Error deleting participant:', error);
            return NextResponse.json(
                { error: 'Błąd usuwania uczestnika' },
                { status: 500 }
            );
        }
    });
}
