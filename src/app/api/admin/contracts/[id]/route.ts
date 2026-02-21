import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

// DELETE /api/admin/contracts/[id]
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async (req) => {
        try {
            const params = await context.params;
            const contractId = parseInt(params.id);

            const contract = await prisma.contract.findUnique({
                where: { id: contractId }
            });

            if (!contract) {
                return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
            }

            // Allow admin to delete signed contracts if needed
            // (Removed restriction per user request)

            await prisma.contract.delete({
                where: { id: contractId }
            });

            return NextResponse.json({ success: true, message: 'Umowa została pomyślnie usunięta.' });
        } catch (error) {
            console.error('Delete contract error:', error);
            return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
        }
    });
}
