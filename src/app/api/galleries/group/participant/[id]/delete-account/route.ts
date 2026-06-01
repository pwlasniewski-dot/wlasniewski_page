// DELETE /api/galleries/group/participant/[id]/delete-account
// RODO: parent self-deletes their own account (all data + selections)

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyParentToken } from '@/lib/auth/parent-jwt';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const participantId = Number(id);

        if (!participantId || !Number.isFinite(participantId)) {
            return NextResponse.json({ error: 'Nieprawidłowe ID' }, { status: 400 });
        }

        // Verify parent JWT token from Authorization header
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
        }

        const payload = await verifyParentToken(token);
        if (!payload || payload.participant_id !== participantId) {
            return NextResponse.json({ error: 'Brak uprawnień do usunięcia tego konta' }, { status: 403 });
        }

        // Delete participant (cascade deletes selections via DB relations)
        await prisma.galleryParticipant.delete({
            where: { id: participantId },
        });

        return NextResponse.json({
            success: true,
            message: 'Twoje dane zostały usunięte zgodnie z RODO',
        });

    } catch (error) {
        console.error('RODO delete-account error:', error);
        return NextResponse.json({ error: 'Błąd usuwania danych' }, { status: 500 });
    }
}
